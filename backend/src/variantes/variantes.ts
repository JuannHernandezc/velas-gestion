import { BadRequestException } from '@nestjs/common';

export const componenteInclude = {
  moldeMateriaPrima: true,
  recetaMaterias: { include: { materiaPrima: true } },
  variantes: { include: { esencia: true }, orderBy: { id: 'asc' as const } },
};
export const catalogoInclude = {
  ensambles: { include: { componenteBase: { include: componenteInclude } } },
  ensamblesMateriaPrima: { include: { materiaPrima: true } },
  variantes: { include: { selecciones: { include: { componenteVariante: { include: { esencia: true } } } } }, orderBy: { id: 'asc' as const } },
};

export function recetaParaEsencia(comp: any, esencia: any) {
  const aromas = comp.recetaMaterias.filter((r: any) => r.materiaPrima.tipo === 'ESENCIA');
  if (aromas.length !== 1) throw new BadRequestException('La receta debe tener exactamente una esencia de referencia para usar variantes');
  if (esencia.tipo !== 'ESENCIA' || esencia.unidadMedida !== aromas[0].materiaPrima.unidadMedida) {
    throw new BadRequestException('La esencia debe usar la misma unidad de medida que la esencia de referencia');
  }
  return comp.recetaMaterias.map((r: any) => ({
    materiaPrima: r.materiaPrima.tipo === 'ESENCIA' ? esencia : r.materiaPrima,
    cantidadNecesaria: r.cantidadNecesaria,
  }));
}
export function costoReceta(receta: any[]) {
  return receta.reduce((sum, r) => sum + r.cantidadNecesaria * r.materiaPrima.costoUnitario, 0);
}
export function presentarComponente(comp: any) {
  return { ...comp,
    costoProduccion: costoReceta(comp.recetaMaterias),
    stockDisponible: comp.variantes.length ? comp.variantes.reduce((s: number, v: any) => s + v.stockDisponible, 0) : comp.stockDisponible,
    variantes: comp.variantes.map((v: any) => ({ ...v, costoProduccion: costoReceta(recetaParaEsencia(comp, v.esencia)) })),
  };
}
export function presentarCatalogo(prod: any) {
  const ensambles = prod.ensambles.map((e: any) => ({ ...e, componenteBase: presentarComponente(e.componenteBase) }));
  const variantes = prod.variantes.map((v: any) => {
    let costoProduccion = prod.ensamblesMateriaPrima.reduce((s: number, m: any) => s + m.cantidadNecesaria * m.materiaPrima.costoUnitario, 0);
    let stockDisponible = Infinity;
    const descripcion: string[] = [];
    for (const e of ensambles) {
      const selected = v.selecciones.find((s: any) => s.componenteVariante.componenteBaseId === e.componenteBaseId);
      const comp = e.componenteBase;
      const variant = selected && comp.variantes.find((x: any) => x.id === selected.componenteVarianteId);
      const source = comp.variantes.length ? variant : comp;
      costoProduccion += (source?.costoProduccion || 0) * e.cantidadNecesaria;
      stockDisponible = Math.min(stockDisponible, Math.floor((source?.stockDisponible || 0) / e.cantidadNecesaria));
      descripcion.push(`${comp.nombre} · ${variant?.esencia.nombre || 'Sin variante'}`);
    }
    for (const m of prod.ensamblesMateriaPrima) stockDisponible = Math.min(stockDisponible, Math.floor(m.materiaPrima.stockActual / m.cantidadNecesaria));
    return { ...v, costoProduccion, stockDisponible: Number.isFinite(stockDisponible) ? stockDisponible : 0, descripcion: descripcion.join(' / ') };
  });
  return { ...prod, ensambles, variantes };
}
// Mantener los costos fuera de todas las respuestas del rol operativo, incluso anidados.
export function sinCostos(value: any): any {
  if (Array.isArray(value)) return value.map(sinCostos);
  if (!value || typeof value !== 'object' || value instanceof Date) return value;
  return Object.fromEntries(Object.entries(value).filter(([k]) => !['costoProduccion', 'costoUnitario', 'costoTotal', 'rentabilidad'].includes(k)).map(([k, v]) => [k, sinCostos(v)]));
}

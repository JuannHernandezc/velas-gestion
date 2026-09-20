/** Normaliza texto para búsquedas sin distinguir tildes, mayúsculas ni símbolos. */
export function normalizarBusqueda(valor: string | null | undefined): string {
  return (valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');
}

export function coincideBusqueda(valor: string | null | undefined, busqueda: string): boolean {
  const termino = normalizarBusqueda(busqueda);
  return !termino || normalizarBusqueda(valor).includes(termino);
}

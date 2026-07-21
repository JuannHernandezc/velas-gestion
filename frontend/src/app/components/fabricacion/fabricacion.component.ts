import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-fabricacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-stone-800 tracking-tight">Módulo de Fabricación y Catálogo</h2>
          <p class="text-sm text-stone-500">Diseño de componentes base, recetas de producción y catálogo de productos.</p>
        </div>
      </div>

      <!-- Tab Buttons -->
      <div class="border-b border-stone-200 flex gap-4">
        <button 
          (click)="activeTab = 'componentes'"
          [class.border-brand-primary]="activeTab === 'componentes'"
          [class.text-brand-primary]="activeTab === 'componentes'"
          [class.border-transparent]="activeTab !== 'componentes'"
          [class.text-stone-500]="activeTab !== 'componentes'"
          class="pb-3 border-b-2 font-semibold text-sm px-1 cursor-pointer transition-all"
        >
          Componentes Base (Piezas)
        </button>
        <button 
          (click)="activeTab = 'catalogo'"
          [class.border-brand-primary]="activeTab === 'catalogo'"
          [class.text-brand-primary]="activeTab === 'catalogo'"
          [class.border-transparent]="activeTab !== 'catalogo'"
          [class.text-stone-500]="activeTab !== 'catalogo'"
          class="pb-3 border-b-2 font-semibold text-sm px-1 cursor-pointer transition-all"
        >
          Catálogo de Ventas
        </button>
      </div>

      <!-- Tab 1: Componentes Base -->
      <div *ngIf="activeTab === 'componentes'" class="space-y-6 animate-fade-in">
        <div class="flex justify-between items-center">
          <h3 class="text-base font-bold text-stone-800 uppercase tracking-wider">Componentes Registrados</h3>
          <button 
            *ngIf="isAdmin"
            (click)="openCompModal()"
            class="bg-stone-900 text-stone-200 border border-stone-800 text-xs font-semibold px-3.5 py-2 rounded-lg hover:bg-stone-800 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <i class="fa-solid fa-plus"></i>
            <span>Nuevo Componente</span>
          </button>
        </div>

        <!-- Grid of Component Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngIf="componentes.length === 0" class="col-span-full bg-white border border-stone-200 rounded-xl p-12 text-center text-stone-400">
            <i class="fa-solid fa-cubes text-4xl mb-3 block text-stone-300"></i>
            No hay componentes base registrados.
          </div>

          <div 
            *ngFor="let comp of componentes" 
            class="bg-white border border-stone-200 rounded-xl p-5 shadow-sm hover:border-brand-primary/30 transition-all flex flex-col justify-between"
          >
            <div>
              <div class="flex justify-between items-start gap-2">
                <div>
                  <h4 class="font-bold text-stone-800 text-sm tracking-tight">{{ comp.nombre }}</h4>
                  <div *ngIf="comp.pesoAgua" class="text-[10px] text-brand-dark font-medium flex items-center gap-1 mt-0.5" title="Cálculos basados en el molde">
                    <i class="fa-solid fa-calculator text-[9px]"></i>
                    <span>Molde: {{ comp.pesoAgua }}g agua | {{ formatTipoVela(comp.tipoVela) }} ({{ comp.porcentajeEsencia }}%)</span>
                  </div>
                </div>
                <div class="flex gap-1" *ngIf="isAdmin">
                  <button (click)="openCompModal(comp)" class="p-1 text-stone-400 hover:text-brand-primary transition-colors cursor-pointer" title="Editar"><i class="fa-solid fa-pen text-xs"></i></button>
                  <button (click)="deleteComp(comp.id)" class="p-1 text-stone-400 hover:text-red-500 transition-colors cursor-pointer" title="Eliminar"><i class="fa-solid fa-trash text-xs"></i></button>
                </div>
              </div>
              <p class="text-[10px] text-stone-400 uppercase tracking-widest font-semibold mt-1">Receta de Producción</p>

              <!-- Recipe Materials List -->
              <ul class="mt-3 space-y-1.5 text-xs text-stone-600">
                <li *ngFor="let rm of comp.recetaMaterias" class="flex justify-between items-center bg-stone-50 border border-stone-100 p-1.5 rounded">
                  <span class="font-medium">{{ rm.materiaPrima?.nombre }}</span>
                  <span class="text-stone-400">{{ rm.cantidadNecesaria }} {{ formatUnidadMedida(rm.materiaPrima?.unidadMedida, rm.cantidadNecesaria) }}</span>
                </li>
              </ul>
            </div>

            <div class="mt-5 pt-4 border-t border-stone-100 flex justify-between items-center text-xs">
              <div>
                <p class="text-stone-400 font-medium">Stock disponible:</p>
                <p class="font-bold text-stone-700 mt-0.5">{{ comp.stockDisponible | number }} {{ formatUnidadMedida('UNIDAD', comp.stockDisponible) }}</p>
              </div>
              <div class="text-right" *ngIf="isAdmin">
                <p class="text-stone-400 font-medium">Costo estimado:</p>
                <p class="font-bold text-emerald-600 mt-0.5">{{ comp.costoProduccion | currency:'COP':'symbol-narrow':'1.0-0' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 2: Catálogo de Productos -->
      <div *ngIf="activeTab === 'catalogo'" class="space-y-6 animate-fade-in">
        <div class="flex justify-between items-center">
          <h3 class="text-base font-bold text-stone-800 uppercase tracking-wider">Productos Disponibles</h3>
          <button 
            *ngIf="isAdmin"
            (click)="openProdModal()"
            class="bg-stone-900 text-stone-200 border border-stone-800 text-xs font-semibold px-3.5 py-2 rounded-lg hover:bg-stone-800 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <i class="fa-solid fa-plus"></i>
            <span>Nuevo Producto</span>
          </button>
        </div>

        <!-- Grid of Catalog Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div *ngIf="catalogo.length === 0" class="col-span-full bg-white border border-stone-200 rounded-xl p-12 text-center text-stone-400">
            <i class="fa-solid fa-image text-4xl mb-3 block text-stone-300"></i>
            No hay productos registrados en el catálogo.
          </div>

          <div 
            *ngFor="let prod of catalogo" 
            class="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-brand-primary/20 transition-all"
          >
            <!-- Card Image -->
            <div class="h-44 bg-stone-100 relative overflow-hidden flex items-center justify-center">
              <img 
                *ngIf="prod.imagenUrl" 
                [src]="prod.imagenUrl" 
                alt="Imagen de vela" 
                class="w-full h-full object-cover"
              />
              <div *ngIf="!prod.imagenUrl" class="text-stone-300 flex flex-col items-center gap-2">
                <i class="fa-regular fa-image text-4xl"></i>
                <span class="text-[10px] uppercase font-semibold tracking-wider">Sin Imagen</span>
              </div>
              <div class="absolute top-2 right-2 flex gap-1" *ngIf="isAdmin">
                <button (click)="openProdModal(prod)" class="w-7 h-7 bg-white/95 text-stone-600 hover:text-brand-primary rounded-full shadow-md flex items-center justify-center transition-colors cursor-pointer"><i class="fa-solid fa-pen text-xs"></i></button>
                <button (click)="deleteProd(prod.id)" class="w-7 h-7 bg-white/95 text-stone-600 hover:text-red-500 rounded-full shadow-md flex items-center justify-center transition-colors cursor-pointer"><i class="fa-solid fa-trash text-xs"></i></button>
              </div>
            </div>

            <!-- Card Info -->
            <div class="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h4 class="font-bold text-stone-800 text-sm tracking-tight line-clamp-1">{{ prod.nombre }}</h4>
                <div class="flex justify-between items-center mt-2.5">
                  <span class="text-xs text-stone-500 font-medium">Precio Venta:</span>
                  <span class="text-sm font-bold text-stone-800">{{ prod.precioVenta | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                </div>
              </div>

              <div class="mt-4 pt-3.5 border-t border-stone-100">
                <div class="flex justify-between items-center text-[10px]">
                  <span class="text-stone-400 font-semibold uppercase tracking-wider">Composición:</span>
                  <span 
                    [class.bg-amber-50]="prod.requiereEnsamble"
                    [class.text-amber-700]="prod.requiereEnsamble"
                    [class.bg-stone-100]="!prod.requiereEnsamble"
                    [class.text-stone-500]="!prod.requiereEnsamble"
                    class="px-2 py-0.5 rounded font-bold uppercase tracking-wider"
                  >
                    {{ prod.requiereEnsamble ? 'Ensamblado' : 'Sencillo' }}
                  </span>
                </div>
                
                <!-- Display Assembly Component formulas -->
                <div *ngIf="prod.requiereEnsamble" class="mt-2.5 space-y-1">
                  <div *ngFor="let ens of prod.ensambles" class="flex justify-between text-[11px] text-stone-600">
                    <span class="truncate pr-2">• {{ ens.componenteBase?.nombre }}</span>
                    <span class="shrink-0 font-medium text-stone-400">{{ ens.cantidadNecesaria }} UND</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal 1: Componente Base (Admin Only) -->
      <div *ngIf="isCompModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm">
        <div class="w-full max-w-lg bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden animate-zoom-in flex flex-col max-h-[90vh]">
          <div class="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
            <h3 class="font-bold text-stone-800">{{ editingComp?.id ? 'Editar Componente Base' : 'Nuevo Componente Base' }}</h3>
            <button (click)="closeCompModal()" class="text-stone-400 hover:text-stone-600 cursor-pointer"><i class="fa-solid fa-xmark text-lg"></i></button>
          </div>

          <form (ngSubmit)="saveComp()" class="p-6 space-y-4 overflow-y-auto flex-1">
            <div>
              <label for="compNombre" class="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Nombre de la pieza</label>
              <input type="text" id="compNombre" name="compNombre" [(ngModel)]="compForm.nombre" required placeholder="Ej. Base de Oso de Cera Neutra" class="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-sm text-stone-800 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors" />
            </div>

            <div>
              <label for="compStock" class="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Stock Inicial Disponible</label>
              <input type="number" id="compStock" name="compStock" [(ngModel)]="compForm.stockDisponible" required min="0" class="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-sm text-stone-800 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors" />
            </div>

            <!-- Mold Assistant Panel -->
            <div class="border border-stone-200 rounded-xl p-4 bg-stone-50 space-y-3">
              <div class="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="useMold" 
                  name="useMold" 
                  [(ngModel)]="useMold" 
                  (change)="onUseMoldChange()"
                  class="rounded border-stone-300 text-brand-primary focus:ring-brand-primary cursor-pointer animate-pulse" 
                />
                <label for="useMold" class="text-xs font-bold text-stone-700 uppercase tracking-wider cursor-pointer select-none">
                  Calcular Receta usando un Molde
                </label>
              </div>

              <!-- Mold fields if checked -->
              <div *ngIf="useMold" class="space-y-3 border-t border-stone-200/60 pt-3 animate-fade-in">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label for="pesoAgua" class="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Peso del Agua (g)</label>
                    <input 
                      type="number" 
                      id="pesoAgua" 
                      name="pesoAgua" 
                      [(ngModel)]="moldParams.pesoAgua" 
                      (input)="calculateRecipeFromMold()"
                      required 
                      min="1" 
                      class="w-full bg-white border border-stone-200 rounded-lg py-1.5 px-3 text-xs text-stone-800 focus:outline-none focus:border-brand-primary transition-colors" 
                    />
                  </div>
                  <div>
                    <label for="tipoVela" class="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Tipo de Vela</label>
                    <select 
                      id="tipoVela" 
                      name="tipoVela" 
                      [(ngModel)]="moldParams.tipoVela" 
                      (change)="calculateRecipeFromMold()"
                      required 
                      class="w-full bg-white border border-stone-200 rounded-lg py-1.5 px-3 text-xs text-stone-800 focus:outline-none focus:border-brand-primary transition-colors"
                    >
                      <option value="DECORATIVA">Decorativa</option>
                      <option value="AROMATICA">Aromática</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label for="porcentajeEsencia" class="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                    Porcentaje de Esencia: <b class="text-brand-dark">{{ moldParams.porcentajeEsencia }}%</b>
                  </label>
                  <div class="flex items-center gap-3">
                    <input 
                      type="range" 
                      id="porcentajeEsencia" 
                      name="porcentajeEsencia" 
                      [(ngModel)]="moldParams.porcentajeEsencia" 
                      (input)="calculateRecipeFromMold()"
                      min="1" 
                      max="20" 
                      class="flex-1 accent-brand-primary h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer" 
                    />
                    <span class="text-xs font-bold text-stone-500 w-8 text-right">{{ moldParams.porcentajeEsencia }}%</span>
                  </div>
                </div>

                <!-- Insumo mapping selectors -->
                <div class="border-t border-stone-200/60 pt-3 space-y-2">
                  <p class="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Asociar Insumos del Inventario</p>
                  
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label class="block text-[9px] font-semibold text-stone-400 uppercase mb-1">Cera</label>
                      <select 
                        name="moldCera" 
                        [(ngModel)]="moldParams.ceraId" 
                        (change)="calculateRecipeFromMold()"
                        required 
                        class="w-full bg-white border border-stone-200 rounded-lg py-1 px-2 text-[10px] text-stone-700 focus:outline-none focus:border-brand-primary"
                      >
                        <option [value]="0" disabled>Seleccionar</option>
                        <option *ngFor="let m of getMateriasByType('CERA')" [value]="m.id">{{ m.nombre }}</option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-[9px] font-semibold text-stone-400 uppercase mb-1">Esencia</label>
                      <select 
                        name="moldEsencia" 
                        [(ngModel)]="moldParams.esenciaId" 
                        (change)="calculateRecipeFromMold()"
                        required 
                        class="w-full bg-white border border-stone-200 rounded-lg py-1 px-2 text-[10px] text-stone-700 focus:outline-none focus:border-brand-primary"
                      >
                        <option [value]="0" disabled>Seleccionar</option>
                        <option *ngFor="let m of getMateriasByType('ESENCIA')" [value]="m.id">{{ m.nombre }}</option>
                      </select>
                    </div>

                    <div *ngIf="moldParams.tipoVela === 'DECORATIVA'">
                      <label class="block text-[9px] font-semibold text-stone-400 uppercase mb-1">Aditivo</label>
                      <select 
                        name="moldAditivo" 
                        [(ngModel)]="moldParams.aditivoId" 
                        (change)="calculateRecipeFromMold()"
                        required 
                        class="w-full bg-white border border-stone-200 rounded-lg py-1 px-2 text-[10px] text-stone-700 focus:outline-none focus:border-brand-primary"
                      >
                        <option [value]="0" disabled>Seleccionar</option>
                        <option *ngFor="let m of getMateriasByType('ADITIVO')" [value]="m.id">{{ m.nombre }}</option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-[9px] font-semibold text-stone-400 uppercase mb-1">Pabilo / Mecha</label>
                      <select 
                        name="moldPabilo" 
                        [(ngModel)]="moldParams.pabiloId" 
                        (change)="calculateRecipeFromMold()"
                        class="w-full bg-white border border-stone-200 rounded-lg py-1 px-2 text-[10px] text-stone-700 focus:outline-none focus:border-brand-primary"
                      >
                        <option [value]="0">Ninguno / Sin pabilo</option>
                        <option *ngFor="let m of getMateriasByType('PABILO')" [value]="m.id">{{ m.nombre }} ({{ m.unidadMedida }})</option>
                      </select>
                    </div>
                  </div>

                  <!-- Pabilo configuration details -->
                  <div *ngIf="moldParams.pabiloId > 0" class="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label class="block text-[9px] font-semibold text-stone-400 uppercase mb-1">Número de Pabilos</label>
                      <input 
                        type="number" 
                        name="cantidadPabilos" 
                        [(ngModel)]="moldParams.cantidadPabilos" 
                        (input)="calculateRecipeFromMold()"
                        min="1" 
                        class="w-full bg-white border border-stone-200 rounded-lg py-1 px-2 text-[10px] text-stone-700 focus:outline-none focus:border-brand-primary font-bold"
                      />
                    </div>
                    <div>
                      <label class="block text-[9px] font-semibold text-stone-400 uppercase mb-1">Largo por Pabilo (cm)</label>
                      <input 
                        type="number" 
                        name="largoPabiloCm" 
                        [(ngModel)]="moldParams.largoPabiloCm" 
                        (input)="calculateRecipeFromMold()"
                        min="1" 
                        placeholder="Ej. 10"
                        class="w-full bg-white border border-stone-200 rounded-lg py-1 px-2 text-[10px] text-stone-700 focus:outline-none focus:border-brand-primary font-bold"
                      />
                    </div>
                  </div>
                </div>

                <!-- Info panel for calculated values with clean tabular layout -->
                <div class="bg-stone-50 border border-stone-200/80 rounded-xl p-3.5 text-xs text-stone-700 space-y-2.5 shadow-sm">
                  <!-- Top: Cera Inicial -->
                  <div class="flex justify-between items-center text-stone-500 font-medium pb-2 border-b border-stone-200/80">
                    <span>Cera Inicial (90% densidad):</span>
                    <span class="font-mono font-bold text-stone-800">{{ moldCalculations.ceraInicial | number:'1.0-1' }}g</span>
                  </div>

                  <!-- Middle: Insumos calculados con cantidades y costos -->
                  <div class="space-y-1.5 py-0.5">
                    <div class="flex justify-between items-center text-amber-900">
                      <span>Esencia ({{ moldParams.porcentajeEsencia }}%):</span>
                      <div class="font-mono flex items-center gap-3">
                        <span class="text-stone-500">{{ moldCalculations.esencia | number:'1.0-1' }}g</span>
                        <span class="font-bold text-amber-900 w-20 text-right">{{ moldCalculations.costoEsencia | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                      </div>
                    </div>

                    <div *ngIf="moldParams.tipoVela === 'DECORATIVA'" class="flex justify-between items-center text-amber-800">
                      <span>Aditivo (3%):</span>
                      <div class="font-mono flex items-center gap-3">
                        <span class="text-stone-500">{{ moldCalculations.aditivo | number:'1.0-1' }}g</span>
                        <span class="font-bold text-amber-800 w-20 text-right">{{ moldCalculations.costoAditivo | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                      </div>
                    </div>

                    <div *ngIf="moldParams.pabiloId > 0" class="flex justify-between items-center text-emerald-800">
                      <span>Pabilo ({{ moldParams.cantidadPabilos }}x mecha de {{ moldParams.largoPabiloCm }}cm):</span>
                      <div class="font-mono flex items-center gap-3">
                        <span class="text-stone-500">{{ moldCalculations.pabiloTotal | number:'1.0-1' }} {{ moldCalculations.pabiloUnidad }}</span>
                        <span class="font-bold text-emerald-900 w-20 text-right">{{ moldCalculations.costoPabilo | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                      </div>
                    </div>

                    <div class="flex justify-between items-center text-stone-850 font-semibold pt-0.5">
                      <span>Cera Final Requerida:</span>
                      <div class="font-mono flex items-center gap-3">
                        <span class="text-stone-700 font-bold">{{ moldCalculations.ceraFinal | number:'1.0-1' }}g</span>
                        <span class="font-bold text-stone-900 w-20 text-right">{{ moldCalculations.costoCera | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Bottom: Costo Total -->
                  <div class="border-t border-stone-200/80 pt-2">
                    <div class="flex justify-between items-center font-extrabold text-xs text-stone-900">
                      <span class="uppercase tracking-wider text-[10px] text-stone-500 font-bold">COSTO TOTAL ESTIMADO:</span>
                      <span class="font-mono text-sm text-brand-dark font-black">{{ moldCalculations.costoTotalMold | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recipe design -->
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  {{ useMold ? 'Ingredientes Generados' : 'Fórmula (Materias Primas)' }}
                </label>
                <button 
                  *ngIf="!useMold"
                  type="button" 
                  (click)="addRecipeRow()" 
                  class="text-brand-primary text-xs hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <i class="fa-solid fa-plus text-[10px]"></i>
                  <span>Agregar fila</span>
                </button>
              </div>

              <!-- Recipe rows -->
              <div class="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                <div *ngIf="compForm.receta.length === 0" class="text-xs text-stone-400 py-2 italic text-center">
                  {{ useMold ? 'Completa los campos del molde e insumos arriba para generar la receta' : 'No hay materias primas asignadas a este componente' }}
                </div>
                <div *ngFor="let row of compForm.receta; let i = index" class="flex gap-2 items-center animate-fade-in">
                  <select 
                    name="mat_{{i}}" 
                    [(ngModel)]="row.materiaPrimaId" 
                    required 
                    [disabled]="useMold"
                    class="flex-1 bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs text-stone-800 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors disabled:opacity-85 disabled:cursor-not-allowed"
                  >
                    <option [value]="0" disabled selected>Selecciona materia prima</option>
                    <option *ngFor="let m of materias" [value]="m.id">{{ m.nombre }} ({{ m.unidadMedida }})</option>
                  </select>
                  <input 
                    type="number" 
                    name="qty_{{i}}" 
                    [(ngModel)]="row.cantidadNecesaria" 
                    required 
                    [readonly]="useMold"
                    min="0.0001" 
                    placeholder="Cant." 
                    class="w-24 bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs text-stone-800 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors readonly:bg-stone-100 disabled:opacity-85 disabled:cursor-not-allowed" 
                  />
                  <button 
                    *ngIf="!useMold"
                    type="button" 
                    (click)="removeRecipeRow(i)" 
                    class="p-2 text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <i class="fa-solid fa-trash-can text-sm"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Reference suggested selling prices -->
            <div *ngIf="getRecipeCost() > 0" class="bg-brand-primary/5 border border-brand-primary/10 rounded-xl p-3 space-y-2 text-xs">
              <div class="flex justify-between items-center border-b border-brand-primary/10 pb-1.5 font-bold text-brand-dark">
                <span>Costo Estimado de Producción:</span>
                <span class="text-sm font-extrabold text-stone-800">{{ getRecipeCost() | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
              </div>
              <p class="text-[10px] text-stone-500 font-medium uppercase tracking-wider mb-1">Precios de Venta Sugeridos:</p>
              <div class="grid grid-cols-3 gap-2 text-center">
                <div class="bg-white border border-stone-200/60 rounded-lg p-2">
                  <span class="text-[10px] text-stone-400 block font-semibold uppercase">200% (x2)</span>
                  <span class="font-bold text-stone-700 text-xs">{{ getRecipeCost() * 2 | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                </div>
                <div class="bg-white border border-stone-200/60 rounded-lg p-2">
                  <span class="text-[10px] text-stone-400 block font-semibold uppercase">300% (x3)</span>
                  <span class="font-bold text-stone-700 text-xs">{{ getRecipeCost() * 3 | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                </div>
                <div class="bg-white border border-stone-200/60 rounded-lg p-2">
                  <span class="text-[10px] text-stone-400 block font-semibold uppercase">400% (x4)</span>
                  <span class="font-bold text-stone-700 text-xs">{{ getRecipeCost() * 4 | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                </div>
              </div>
            </div>

            <!-- Footer buttons inside form -->
            <div class="pt-4 border-t border-stone-100 flex justify-end gap-2 shrink-0">
              <button type="button" (click)="closeCompModal()" class="border border-stone-200 text-stone-600 px-4 py-2 rounded-lg text-sm hover:bg-stone-50 transition-colors cursor-pointer">Cancelar</button>
              <button type="submit" class="bg-gradient-to-r from-brand-primary to-brand-light text-stone-950 font-semibold px-4 py-2 rounded-lg text-sm transition-all cursor-pointer">Guardar Componente</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal 2: Catálogo de Producto (Admin Only) -->
      <div *ngIf="isProdModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm">
        <div class="w-full max-w-lg bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden animate-zoom-in flex flex-col max-h-[90vh]">
          <div class="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
            <h3 class="font-bold text-stone-800">{{ editingProd?.id ? 'Editar Producto del Catálogo' : 'Nuevo Producto del Catálogo' }}</h3>
            <button (click)="closeProdModal()" class="text-stone-400 hover:text-stone-600 cursor-pointer"><i class="fa-solid fa-xmark text-lg"></i></button>
          </div>

          <form (ngSubmit)="saveProd()" class="p-6 space-y-4 overflow-y-auto flex-1">
            <div>
              <label for="prodNombre" class="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Nombre del Producto</label>
              <input type="text" id="prodNombre" name="prodNombre" [(ngModel)]="prodForm.nombre" required placeholder="Ej. Vela Aromática Sencilla" class="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-sm text-stone-800 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="prodPrecio" class="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Precio de Venta ($)</label>
                <input type="number" id="prodPrecio" name="prodPrecio" [(ngModel)]="prodForm.precioVenta" required min="0" placeholder="Ej. 15000" class="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-sm text-stone-800 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors" />
              </div>
              <div>
                <label for="prodImg" class="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">URL de Imagen</label>
                <input type="text" id="prodImg" name="prodImg" [(ngModel)]="prodForm.imagenUrl" placeholder="http://..." class="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-sm text-stone-800 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors" />
              </div>
            </div>

            <!-- Suggested Pricing Calculator for Catalog Product -->
            <div *ngIf="getProductCost() > 0" class="bg-brand-primary/5 border border-brand-primary/10 rounded-xl p-3.5 space-y-2 text-xs">
              <div class="flex justify-between items-center border-b border-brand-primary/15 pb-2 font-bold text-brand-dark">
                <span>Costo Total del Ensamble:</span>
                <span class="text-sm font-extrabold text-stone-800">{{ getProductCost() | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
              </div>
              <p class="text-[10px] text-stone-500 font-semibold uppercase tracking-wider">Toca una sugerencia para auto-completar el precio de venta:</p>
              <div class="grid grid-cols-3 gap-2.5">
                <button 
                  type="button"
                  (click)="applySuggestedPrice(getProductCost() * 2)"
                  class="bg-white border border-stone-200/80 hover:border-brand-primary hover:bg-brand-primary/5 rounded-lg p-2 text-center transition-all cursor-pointer group shadow-sm"
                >
                  <span class="text-[9px] text-stone-400 group-hover:text-brand-dark block font-bold uppercase">200% (x2)</span>
                  <span class="font-extrabold text-stone-700 group-hover:text-stone-900 text-xs block mt-0.5">{{ getProductCost() * 2 | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                </button>
                <button 
                  type="button"
                  (click)="applySuggestedPrice(getProductCost() * 3)"
                  class="bg-white border border-stone-200/80 hover:border-brand-primary hover:bg-brand-primary/5 rounded-lg p-2 text-center transition-all cursor-pointer group shadow-sm"
                >
                  <span class="text-[9px] text-stone-400 group-hover:text-brand-dark block font-bold uppercase">300% (x3)</span>
                  <span class="font-extrabold text-stone-700 group-hover:text-stone-900 text-xs block mt-0.5">{{ getProductCost() * 3 | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                </button>
                <button 
                  type="button"
                  (click)="applySuggestedPrice(getProductCost() * 4)"
                  class="bg-white border border-stone-200/80 hover:border-brand-primary hover:bg-brand-primary/5 rounded-lg p-2 text-center transition-all cursor-pointer group shadow-sm"
                >
                  <span class="text-[9px] text-stone-400 group-hover:text-brand-dark block font-bold uppercase">400% (x4)</span>
                  <span class="font-extrabold text-stone-700 group-hover:text-stone-900 text-xs block mt-0.5">{{ getProductCost() * 4 | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                </button>
              </div>
            </div>

            <div class="flex items-center gap-2 py-2">
              <input type="checkbox" id="prodReq" name="prodReq" [(ngModel)]="prodForm.requiereEnsamble" class="rounded border-stone-300 text-brand-primary focus:ring-brand-primary" />
              <label for="prodReq" class="text-xs font-semibold text-stone-600 uppercase tracking-wider">Requiere ensamblar componentes base</label>
            </div>

            <!-- Assemblies design if requiereEnsamble is checked -->
            <div *ngIf="prodForm.requiereEnsamble" class="space-y-2">
              <div class="flex justify-between items-center">
                <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wider">Fórmula de Ensamble (Componentes Base)</label>
                <button type="button" (click)="addEnsambleRow()" class="text-brand-primary text-xs hover:underline flex items-center gap-1 cursor-pointer font-semibold">
                  <i class="fa-solid fa-plus text-[10px]"></i>
                  <span>Agregar fila</span>
                </button>
              </div>

              <!-- Ensamble rows -->
              <div class="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                <div *ngFor="let row of prodForm.ensambles; let i = index" class="flex gap-2 items-center">
                  <select 
                    name="comp_{{i}}" 
                    [(ngModel)]="row.componenteBaseId" 
                    required 
                    class="flex-1 bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs text-stone-800 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors"
                  >
                    <option [value]="0" disabled selected>Selecciona componente base</option>
                    <option *ngFor="let c of componentes" [value]="c.id">{{ c.nombre }} (Stock: {{ c.stockDisponible }})</option>
                  </select>
                  <input 
                    type="number" 
                    name="compQty_{{i}}" 
                    [(ngModel)]="row.cantidadNecesaria" 
                    required 
                    min="1" 
                    placeholder="Cant." 
                    class="w-24 bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs text-stone-800 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors" 
                  />
                  <button type="button" (click)="removeEnsambleRow(i)" class="p-2 text-stone-400 hover:text-red-500 transition-colors cursor-pointer"><i class="fa-solid fa-trash-can text-sm"></i></button>
                </div>
              </div>
            </div>

            <!-- Footer buttons -->
            <div class="pt-4 border-t border-stone-100 flex justify-end gap-2 shrink-0">
              <button type="button" (click)="closeProdModal()" class="border border-stone-200 text-stone-600 px-4 py-2 rounded-lg text-sm hover:bg-stone-50 transition-colors cursor-pointer">Cancelar</button>
              <button type="submit" class="bg-gradient-to-r from-brand-primary to-brand-light text-stone-950 font-semibold px-4 py-2 rounded-lg text-sm transition-all cursor-pointer">Guardar Producto</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out forwards;
    }
    .animate-zoom-in {
      animation: zoomIn 0.2s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes zoomIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class FabricacionComponent implements OnInit {
  activeTab = 'componentes';
  componentes: any[] = [];
  catalogo: any[] = [];
  materias: any[] = [];
  isAdmin = false;

  // Component Modal Data
  isCompModalOpen = false;
  editingComp: any = null;
  compForm = {
    nombre: '',
    stockDisponible: 0,
    receta: [] as { materiaPrimaId: number; cantidadNecesaria: number }[]
  };

  // Mold assistant variables
  useMold = false;
  moldParams = {
    pesoAgua: 100,
    tipoVela: 'DECORATIVA',
    porcentajeEsencia: 10,
    ceraId: 0,
    esenciaId: 0,
    aditivoId: 0,
    pabiloId: 0,
    cantidadPabilos: 1,
    largoPabiloCm: 10
  };
  moldCalculations = {
    ceraInicial: 0,
    esencia: 0,
    aditivo: 0,
    ceraFinal: 0,
    pabiloTotal: 0,
    pabiloUnidad: 'cm',
    costoCera: 0,
    costoEsencia: 0,
    costoAditivo: 0,
    costoPabilo: 0,
    costoTotalMold: 0
  };

  // Product Modal Data
  isProdModalOpen = false;
  editingProd: any = null;
  prodForm = {
    nombre: '',
    precioVenta: 0,
    requiereEnsamble: false,
    imagenUrl: '',
    ensambles: [] as { componenteBaseId: number; cantidadNecesaria: number }[]
  };

  constructor(private http: HttpClient, private authService: AuthService) {
    this.isAdmin = this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.http.get<any[]>('http://localhost:3000/api/componente-base').subscribe(res => this.componentes = res);
    this.http.get<any[]>('http://localhost:3000/api/catalogo').subscribe(res => this.catalogo = res);
    
    // Admin only fetches raw materials for formulas
    if (this.isAdmin) {
      this.http.get<any[]>('http://localhost:3000/api/materia-prima').subscribe(res => this.materias = res);
    }
  }

  // Component modal handling
  openCompModal(comp: any = null): void {
    if (comp) {
      this.editingComp = comp;
      // Extract recipe items
      const recipeRows = comp.recetaMaterias.map((rm: any) => ({
        materiaPrimaId: rm.materiaPrimaId,
        cantidadNecesaria: rm.cantidadNecesaria
      }));
      this.compForm = {
        nombre: comp.nombre,
        stockDisponible: comp.stockDisponible,
        receta: recipeRows
      };

      if (comp.pesoAgua) {
        this.useMold = true;
        this.moldParams = {
          pesoAgua: comp.pesoAgua,
          tipoVela: comp.tipoVela,
          porcentajeEsencia: comp.porcentajeEsencia,
          ceraId: 0,
          esenciaId: 0,
          aditivoId: 0,
          pabiloId: 0,
          cantidadPabilos: 1,
          largoPabiloCm: 10
        };
        // Pre-select from recipe by explicit type
        comp.recetaMaterias.forEach((rm: any) => {
          if (rm.materiaPrima.tipo === 'CERA') {
            this.moldParams.ceraId = rm.materiaPrimaId;
          } else if (rm.materiaPrima.tipo === 'ESENCIA') {
            this.moldParams.esenciaId = rm.materiaPrimaId;
          } else if (rm.materiaPrima.tipo === 'ADITIVO') {
            this.moldParams.aditivoId = rm.materiaPrimaId;
          } else if (rm.materiaPrima.tipo === 'PABILO') {
            this.moldParams.pabiloId = rm.materiaPrimaId;
            if (rm.materiaPrima.unidadMedida === 'CM') {
              this.moldParams.largoPabiloCm = rm.cantidadNecesaria;
              this.moldParams.cantidadPabilos = 1;
            } else if (rm.materiaPrima.unidadMedida === 'UNIDAD') {
              this.moldParams.cantidadPabilos = rm.cantidadNecesaria;
            }
          }
        });
        this.calculateRecipeFromMold();
      } else {
        this.useMold = false;
        this.autoDetectMoldInsumos();
      }
    } else {
      this.editingComp = null;
      this.useMold = false;
      this.compForm = {
        nombre: '',
        stockDisponible: 0,
        receta: []
      };
      this.moldParams = {
        pesoAgua: 100,
        tipoVela: 'DECORATIVA',
        porcentajeEsencia: 10,
        ceraId: 0,
        esenciaId: 0,
        aditivoId: 0,
        pabiloId: 0,
        cantidadPabilos: 1,
        largoPabiloCm: 10
      };
      this.autoDetectMoldInsumos();
    }
    this.isCompModalOpen = true;
  }

  closeCompModal(): void {
    this.isCompModalOpen = false;
    this.editingComp = null;
  }

  addRecipeRow(): void {
    this.compForm.receta.push({ materiaPrimaId: 0, cantidadNecesaria: 0 });
  }

  removeRecipeRow(index: number): void {
    this.compForm.receta.splice(index, 1);
  }

  saveComp(): void {
    // Validate recipe and cast to number types
    const validRecipe = this.compForm.receta
      .filter(r => Number(r.materiaPrimaId) > 0 && Number(r.cantidadNecesaria) > 0)
      .map(r => ({
        materiaPrimaId: Number(r.materiaPrimaId),
        cantidadNecesaria: Number(r.cantidadNecesaria)
      }));
    const payload = {
      nombre: this.compForm.nombre,
      stockDisponible: this.compForm.stockDisponible,
      receta: validRecipe,
      pesoAgua: this.useMold ? this.moldParams.pesoAgua : null,
      tipoVela: this.useMold ? this.moldParams.tipoVela : null,
      porcentajeEsencia: this.useMold ? this.moldParams.porcentajeEsencia : null
    };

    const url = 'http://localhost:3000/api/componente-base';
    if (this.editingComp && this.editingComp.id) {
      this.http.put(`${url}/${this.editingComp.id}`, payload).subscribe({
        next: () => {
          this.loadData();
          this.closeCompModal();
        },
        error: (err) => alert(err.error?.message || 'Error al guardar')
      });
    } else {
      this.http.post(url, payload).subscribe({
        next: () => {
          this.loadData();
          this.closeCompModal();
        },
        error: (err) => alert(err.error?.message || 'Error al crear')
      });
    }
  }

  deleteComp(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este componente base? Su eliminación afectará las recetas vinculadas.')) {
      this.http.delete(`http://localhost:3000/api/componente-base/${id}`).subscribe({
        next: () => this.loadData(),
        error: (err) => alert(err.error?.message || 'Error al eliminar')
      });
    }
  }

  // Mold helpers
  onUseMoldChange(): void {
    if (this.useMold) {
      this.calculateRecipeFromMold();
    } else {
      this.compForm.receta = [];
    }
  }

  autoDetectMoldInsumos(): void {
    if (!this.materias) return;
    const ceraItem = this.materias.find(m => m.tipo === 'CERA');
    const esenciaItem = this.materias.find(m => m.tipo === 'ESENCIA');
    const aditivoItem = this.materias.find(m => m.tipo === 'ADITIVO');
    const pabiloItem = this.materias.find(m => m.tipo === 'PABILO');

    this.moldParams.ceraId = ceraItem ? ceraItem.id : 0;
    this.moldParams.esenciaId = esenciaItem ? esenciaItem.id : 0;
    this.moldParams.aditivoId = aditivoItem ? aditivoItem.id : 0;
    this.moldParams.pabiloId = pabiloItem ? pabiloItem.id : 0;

    this.calculateRecipeFromMold();
  }

  getMateriasByType(tipo: string): any[] {
    if (!this.materias) return [];
    return this.materias.filter(m => m.tipo === tipo);
  }

  calculateRecipeFromMold(): void {
    if (!this.useMold) return;
    const pesoAgua = this.moldParams.pesoAgua || 0;
    const ceraInicial = pesoAgua * 0.9;
    const pctEsencia = (this.moldParams.porcentajeEsencia || 0) / 100;
    const esencia = ceraInicial * pctEsencia;

    let aditivo = 0;
    let ceraFinal = 0;

    if (this.moldParams.tipoVela === 'DECORATIVA') {
      aditivo = ceraInicial * 0.03;
      ceraFinal = ceraInicial - esencia - aditivo;
    } else {
      ceraFinal = ceraInicial - esencia;
    }

    // Pabilo calculation
    let pabiloTotal = 0;
    let pabiloUnidad = 'cm';
    const pabiloMat = this.materias.find(m => Number(m.id) === Number(this.moldParams.pabiloId));
    if (pabiloMat) {
      const cantPabs = Number(this.moldParams.cantidadPabilos) || 1;
      const largoCm = Number(this.moldParams.largoPabiloCm) || 0;

      if (pabiloMat.unidadMedida === 'METROS') {
        pabiloTotal = (cantPabs * (largoCm > 0 ? largoCm : 1)) / 100;
        pabiloUnidad = 'm';
      } else if (largoCm > 0) {
        pabiloTotal = cantPabs * largoCm;
        pabiloUnidad = 'cm';
      } else {
        pabiloTotal = cantPabs;
        pabiloUnidad = 'unid';
      }
    }

    // Individual costs calculation
    const ceraMat = this.materias.find(m => Number(m.id) === Number(this.moldParams.ceraId));
    const esenciaMat = this.materias.find(m => Number(m.id) === Number(this.moldParams.esenciaId));
    const aditivoMat = this.materias.find(m => Number(m.id) === Number(this.moldParams.aditivoId));

    const costoCera = ceraMat ? (ceraMat.costoUnitario || 0) * ceraFinal : 0;
    const costoEsencia = esenciaMat ? (esenciaMat.costoUnitario || 0) * esencia : 0;
    const costoAditivo = aditivoMat ? (aditivoMat.costoUnitario || 0) * aditivo : 0;
    const costoPabilo = pabiloMat ? (pabiloMat.costoUnitario || 0) * pabiloTotal : 0;
    const costoTotalMold = costoCera + costoEsencia + costoAditivo + costoPabilo;

    this.moldCalculations = {
      ceraInicial,
      esencia,
      aditivo,
      ceraFinal,
      pabiloTotal,
      pabiloUnidad,
      costoCera,
      costoEsencia,
      costoAditivo,
      costoPabilo,
      costoTotalMold
    };

    // Rebuild receta list
    const newRecipe = [];
    if (this.moldParams.ceraId > 0 && ceraFinal > 0) {
      newRecipe.push({ materiaPrimaId: Number(this.moldParams.ceraId), cantidadNecesaria: Number(ceraFinal.toFixed(2)) });
    }
    if (this.moldParams.esenciaId > 0 && esencia > 0) {
      newRecipe.push({ materiaPrimaId: Number(this.moldParams.esenciaId), cantidadNecesaria: Number(esencia.toFixed(2)) });
    }
    if (this.moldParams.tipoVela === 'DECORATIVA' && this.moldParams.aditivoId > 0 && aditivo > 0) {
      newRecipe.push({ materiaPrimaId: Number(this.moldParams.aditivoId), cantidadNecesaria: Number(aditivo.toFixed(2)) });
    }
    if (this.moldParams.pabiloId > 0 && pabiloTotal > 0) {
      newRecipe.push({ materiaPrimaId: Number(this.moldParams.pabiloId), cantidadNecesaria: Number(pabiloTotal.toFixed(2)) });
    }

    this.compForm.receta = newRecipe;
  }

  formatTipoVela(tipo: string): string {
    if (!tipo) return '';
    return tipo === 'DECORATIVA' ? 'Decorativa' : 'Aromática';
  }

  // Product modal handling
  openProdModal(prod: any = null): void {
    if (prod) {
      this.editingProd = prod;
      const ensRows = prod.ensambles.map((e: any) => ({
        componenteBaseId: e.componenteBaseId,
        cantidadNecesaria: e.cantidadNecesaria
      }));
      this.prodForm = {
        nombre: prod.nombre,
        precioVenta: prod.precioVenta,
        requiereEnsamble: prod.requiereEnsamble,
        imagenUrl: prod.imagenUrl || '',
        ensambles: ensRows
      };
    } else {
      this.editingProd = null;
      this.prodForm = {
        nombre: '',
        precioVenta: 0,
        requiereEnsamble: false,
        imagenUrl: '',
        ensambles: []
      };
    }
    this.isProdModalOpen = true;
  }

  closeProdModal(): void {
    this.isProdModalOpen = false;
    this.editingProd = null;
  }

  addEnsambleRow(): void {
    this.prodForm.ensambles.push({ componenteBaseId: 0, cantidadNecesaria: 1 });
  }

  removeEnsambleRow(index: number): void {
    this.prodForm.ensambles.splice(index, 1);
  }

  saveProd(): void {
    const validEns = this.prodForm.ensambles
      .filter(e => Number(e.componenteBaseId) > 0 && Number(e.cantidadNecesaria) > 0)
      .map(e => ({
        componenteBaseId: Number(e.componenteBaseId),
        cantidadNecesaria: Number(e.cantidadNecesaria)
      }));
    const payload = {
      ...this.prodForm,
      ensambles: this.prodForm.requiereEnsamble ? validEns : []
    };

    const url = 'http://localhost:3000/api/catalogo';
    if (this.editingProd && this.editingProd.id) {
      this.http.put(`${url}/${this.editingProd.id}`, payload).subscribe({
        next: () => {
          this.loadData();
          this.closeProdModal();
        },
        error: (err) => alert(err.error?.message || 'Error al guardar')
      });
    } else {
      this.http.post(url, payload).subscribe({
        next: () => {
          this.loadData();
          this.closeProdModal();
        },
        error: (err) => alert(err.error?.message || 'Error al crear')
      });
    }
  }
  deleteProd(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este producto del catálogo?')) {
      this.http.delete(`http://localhost:3000/api/catalogo/${id}`).subscribe({
        next: () => this.loadData(),
        error: (err) => alert(err.error?.message || 'Error al eliminar')
      });
    }
  }

  formatUnidadMedida(unidad: string, cantidad: number): string {
    if (!unidad) return '';
    const um = unidad.toLowerCase();
    if (um === 'unidad') {
      return cantidad === 1 ? 'unidad' : 'unidades';
    }
    if (um === 'molde') {
      return cantidad === 1 ? 'molde' : 'moldes';
    }
    return um;
  }

  getRecipeCost(): number {
    if (!this.compForm || !this.compForm.receta) return 0;
    let cost = 0;
    this.compForm.receta.forEach(row => {
      const mat = this.materias.find(m => m.id === Number(row.materiaPrimaId));
      if (mat) {
        cost += mat.costoUnitario * (row.cantidadNecesaria || 0);
      }
    });
    return cost;
  }

  getProductCost(): number {
    if (!this.prodForm) return 0;
    if (this.prodForm.requiereEnsamble && this.prodForm.ensambles) {
      let cost = 0;
      this.prodForm.ensambles.forEach(row => {
        const comp = this.componentes.find(c => c.id === Number(row.componenteBaseId));
        if (comp) {
          cost += comp.costoProduccion * (row.cantidadNecesaria || 0);
        }
      });
      return cost;
    }
    return 0;
  }

  applySuggestedPrice(price: number): void {
    this.prodForm.precioVenta = Math.round(price);
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { coincideBusqueda, normalizarBusqueda } from '../../utils/search.utils';
import { SearchableSelectComponent, SearchableSelectOption } from '../shared/searchable-select.component';

@Component({
  selector: 'app-fabricacion',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
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

        <div class="relative w-full sm:max-w-md">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400">
            <i class="fa-solid fa-magnifying-glass text-xs"></i>
          </span>
          <input
            type="search"
            [(ngModel)]="componentSearchQuery"
            placeholder="Buscar componente por nombre..."
            class="w-full bg-white border border-stone-200 rounded-lg py-2 pl-9 pr-4 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-primary transition-colors"
          />
        </div>

        <!-- Component cards, grouped by the inventory mold when selected. -->
        <div class="space-y-6">
          <div *ngIf="filteredComponentes.length === 0" class="col-span-full bg-white border border-stone-200 rounded-xl p-12 text-center text-stone-400">
            <i class="fa-solid fa-cubes text-4xl mb-3 block text-stone-300"></i>
            {{ componentes.length === 0 ? 'No hay componentes base registrados.' : 'No se encontraron componentes con esa búsqueda.' }}
          </div>

          <section *ngFor="let grupo of componentesAgrupados" class="space-y-3">
            <div *ngIf="grupo.molde" class="flex items-center gap-3 px-1">
              <div class="h-px flex-1 bg-stone-200"></div>
              <span class="text-xs font-bold text-stone-600 uppercase tracking-wider"><i class="fa-solid fa-shapes text-brand-primary mr-1"></i>Molde: {{ grupo.molde.nombre }}</span>
              <span class="text-[10px] font-semibold text-stone-400">{{ grupo.componentes.length }} configuraciones</span>
              <div class="h-px flex-1 bg-stone-200"></div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            *ngFor="let comp of grupo.componentes"
            class="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden hover:border-brand-primary/30 transition-all flex flex-col justify-between"
          >
            <div class="h-36 bg-stone-100 relative overflow-hidden flex items-center justify-center">
              <img *ngIf="comp.imagenUrl" [src]="comp.imagenUrl" [alt]="comp.nombre" class="w-full h-full object-cover" />
              <div *ngIf="!comp.imagenUrl" class="text-stone-300 flex flex-col items-center gap-1">
                <i class="fa-regular fa-image text-3xl"></i>
                <span class="text-[10px] uppercase font-semibold tracking-wider">Sin Imagen</span>
              </div>
            </div>
            <div class="p-5">
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
              <p class="text-[10px] text-stone-400 uppercase tracking-widest font-semibold mt-1">Receta compartida · esencia de referencia</p>
              <div class="mt-3 space-y-2 text-xs">
                <ng-container *ngIf="esenciaPredeterminada(comp) as esencia">
                  <div class="bg-amber-50 rounded-lg p-2">
                    <b>{{ esencia.nombre }}</b> · <span class="font-semibold text-amber-800">Predeterminada</span> · {{ stockEsenciaPredeterminada(comp, esencia.id) }} unidades
                  </div>
                  <ng-container *ngFor="let v of comp.variantes">
                    <div *ngIf="v.esenciaId !== esencia.id" class="bg-stone-50 border border-stone-100 rounded-lg p-2">
                      <b>{{ v.esencia.nombre }}</b> · {{ v.stockDisponible }} unidades
                      <span *ngIf="isAdmin" class="block">Costo: {{ v.costoProduccion | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                    </div>
                  </ng-container>
                </ng-container>
                <button *ngIf="isAdmin" (click)="openAromas(comp)" class="text-amber-800 border border-amber-200 rounded-lg px-3 py-2">Esencias y fabricación</button>
              </div>

              <!-- Recipe Materials List -->
              <ul class="mt-3 space-y-1.5 text-xs text-stone-600">
                <li *ngFor="let rm of comp.recetaMaterias" class="flex justify-between items-center bg-stone-50 border border-stone-100 p-1.5 rounded">
                  <span class="font-medium">{{ rm.materiaPrima?.nombre }}</span>
                  <span class="text-stone-400">{{ rm.cantidadNecesaria }} {{ formatUnidadMedida(rm.materiaPrima?.unidadMedida, rm.cantidadNecesaria) }}</span>
                </li>
              </ul>
            </div>

            <div class="mx-5 mb-5 pt-4 border-t border-stone-100 flex justify-between items-center text-xs">
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
          </section>
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

        <div class="relative w-full sm:max-w-md">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400">
            <i class="fa-solid fa-magnifying-glass text-xs"></i>
          </span>
          <input
            type="search"
            [(ngModel)]="catalogSearchQuery"
            placeholder="Buscar producto por nombre..."
            class="w-full bg-white border border-stone-200 rounded-lg py-2 pl-9 pr-4 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-primary transition-colors"
          />
        </div>

        <!-- Grid of Catalog Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div *ngIf="filteredCatalogo.length === 0" class="col-span-full bg-white border border-stone-200 rounded-xl p-12 text-center text-stone-400">
            <i class="fa-solid fa-image text-4xl mb-3 block text-stone-300"></i>
            {{ catalogo.length === 0 ? 'No hay productos registrados en el catálogo.' : 'No se encontraron productos con esa búsqueda.' }}
          </div>

          <div 
            *ngFor="let prod of filteredCatalogo"
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
                <div *ngFor="let v of prod.variantes" class="mt-2 p-2 bg-amber-50 rounded-lg text-xs">
                  <b>{{ v.nombre }}</b><p>{{ v.descripcion }}</p>
                  <p>{{ v.precioVenta | currency:'COP':'symbol-narrow':'1.0-0' }} · {{ v.stockDisponible }} disponibles</p>
                  <p *ngIf="isAdmin">Costo: {{ v.costoProduccion | currency:'COP':'symbol-narrow':'1.0-0' }}</p>
                  <button *ngIf="isAdmin" (click)="openCatalogVariant(prod, v)" class="underline mt-1">Editar variante</button>
                </div>
                <button *ngIf="isAdmin && hasAromas(prod)" (click)="openCatalogVariant(prod)" class="text-xs text-amber-800 underline mt-3">Agregar variante y precio</button>
                <div class="flex justify-between items-center mt-2.5">
                  <span class="text-xs text-stone-500 font-medium">{{ prod.variantes?.length ? 'Precio de referencia:' : 'Precio Venta:' }}</span>
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
                  <div *ngFor="let ensMateria of prod.ensamblesMateriaPrima" class="flex justify-between text-[11px] text-stone-600">
                    <span class="truncate pr-2">• {{ ensMateria.materiaPrima?.nombre }}</span>
                    <span class="shrink-0 font-medium text-stone-400">{{ ensMateria.cantidadNecesaria }} {{ ensMateria.materiaPrima?.unidadMedida }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      <div *ngIf="aromaComp" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60">
        <div class="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
          <h3 class="font-bold">Esencias y fabricación · {{ aromaComp.nombre }}</h3>
          <p class="text-xs text-stone-500">Cada esencia usa la misma receta y tiene su propio stock. Fabricar descuenta las materias primas.</p>
          <div class="space-y-2 border-b pb-4">
            <p class="text-sm font-semibold text-stone-700">Esencias configuradas</p>
            <div *ngFor="let v of aromaComp.variantes" class="flex items-center justify-between gap-3 rounded-lg border border-stone-200 p-2 text-sm">
              <span><b>{{ v.esencia.nombre }}</b><span *ngIf="esEsenciaPredeterminada(v)" class="ml-1 text-xs font-semibold text-amber-800">· Predeterminada</span><span class="text-stone-500"> · {{ v.stockDisponible }} unidades</span></span>
              <button *ngIf="!esEsenciaPredeterminada(v)" type="button" (click)="removeAroma(v)" [disabled]="variantBusy || v.stockDisponible > 0" class="text-red-600 disabled:text-stone-300" [title]="v.stockDisponible > 0 ? 'No se puede eliminar con stock disponible' : 'Eliminar esencia'"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
          <form (ngSubmit)="addAroma()" class="space-y-2 border-b pb-4">
            <label for="newAroma" class="text-sm">Agregar esencia compatible con la receta</label>
            <app-searchable-select id="newAroma" name="newAroma" [(ngModel)]="newAromaId" [options]="aromaOptions(availableAromas())" placeholder="Buscar esencia" ariaLabel="Buscar esencia compatible" required></app-searchable-select>
            <button [disabled]="variantBusy || !newAromaId" class="bg-amber-100 rounded-lg p-2 text-sm disabled:opacity-50">Agregar esencia</button>
          </form>
          <form (ngSubmit)="fabricarAroma()" class="space-y-3">
            <label for="productionAroma" class="text-sm">Esencia a fabricar</label>
            <app-searchable-select id="productionAroma" name="productionAroma" [(ngModel)]="productionVariantId" [options]="varianteEsenciaOptions(aromaComp.variantes)" placeholder="Buscar esencia" ariaLabel="Buscar esencia a fabricar" required></app-searchable-select>
            <label for="productionQty" class="block text-sm">Unidades a fabricar</label>
            <input id="productionQty" name="productionQty" type="number" min="1" step="1" required [(ngModel)]="productionQty" class="w-full border rounded-lg p-2" />
            <button [disabled]="variantBusy || !productionVariantId" class="bg-stone-900 text-white rounded-lg p-2 disabled:opacity-50">Fabricar y actualizar stock</button>
          </form>
          <p *ngIf="variantMessage" role="status" class="text-sm text-amber-900">{{ variantMessage }}</p>
          <button (click)="aromaComp = null" [disabled]="variantBusy" class="border rounded-lg px-4 py-2">Cerrar</button>
        </div>
      </div>
      <div *ngIf="variantProd" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60">
        <form (ngSubmit)="saveCatalogVariant()" class="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
          <h3 class="font-bold">Variante de venta · {{ variantProd.nombre }}</h3>
          <label class="block text-sm">Nombre de la variante
            <input name="variantName" [(ngModel)]="catalogVariantForm.nombre" required class="w-full border rounded-lg p-2 mt-1" placeholder="Ej. Lavanda" />
          </label>
          <div *ngFor="let ens of aromaEnsambles(variantProd)">
            <label class="text-sm">{{ ens.componenteBase.nombre }} · esencia
              <app-searchable-select name="selection_{{ens.componenteBaseId}}" [(ngModel)]="catalogSelections[ens.componenteBaseId]" [options]="varianteEsenciaOptions(ens.componenteBase.variantes)" placeholder="Buscar esencia" ariaLabel="Buscar esencia" required class="mt-1"></app-searchable-select>
            </label>
          </div>
          <p class="text-sm">Costo estimado: <b>{{ catalogVariantCost() | currency:'COP':'symbol-narrow':'1.0-0' }}</b></p>
          <label class="block text-sm">Precio de venta para esta combinación
            <input name="variantPrice" type="number" min="0" required [(ngModel)]="catalogVariantForm.precioVenta" class="w-full border rounded-lg p-2 mt-1" />
          </label>
          <p *ngIf="variantMessage" role="alert" class="text-sm text-amber-900">{{ variantMessage }}</p>
          <div class="flex gap-2">
            <button type="button" (click)="variantProd = null" [disabled]="variantBusy" class="border rounded-lg p-2">Cancelar</button>
            <button [disabled]="variantBusy" class="bg-stone-900 text-white rounded-lg p-2 disabled:opacity-50">Guardar variante</button>
          </div>
        </form>
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
              <label for="compMolde" class="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Molde</label>
              <app-searchable-select id="compMolde" name="compMolde" [(ngModel)]="compForm.moldeMateriaPrimaId" [options]="moldeOptions" placeholder="Buscar molde" ariaLabel="Buscar molde"></app-searchable-select>
              <p class="mt-1 text-[10px] text-stone-400">Los componentes con el mismo molde se agrupan sin alterar sus recetas ni costos.</p>
            </div>

            <div>
              <label for="compImg" class="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">URL de Imagen</label>
              <input type="text" id="compImg" name="compImg" [(ngModel)]="compForm.imagenUrl" placeholder="http://..." class="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-sm text-stone-800 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors" />
            </div>

            <div>
              <label for="compStock" class="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Stock Inicial Disponible</label>
              <input type="number" id="compStock" name="compStock" [(ngModel)]="compForm.stockDisponible" [readonly]="editingComp?.variantes?.length > 0" required min="0" class="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-sm text-stone-800 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors" />
            </div>

            <label class="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700 cursor-pointer">
              <input type="checkbox" name="crearGrupo" [(ngModel)]="crearGrupo" class="accent-brand-primary" />
              <span><b>Crear configuraciones del molde</b><br><span class="text-xs text-stone-500">Genera solo las combinaciones que selecciones. Si editas una pieza, esta se conserva intacta.</span></span>
            </label>

            <div *ngIf="crearGrupo" class="space-y-3 rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-4">
              <p class="text-xs font-bold text-brand-dark uppercase tracking-wider">Materiales para las configuraciones</p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label class="text-xs text-stone-600">Cera APF
                  <app-searchable-select name="grupoCeraApf" [(ngModel)]="grupoForm.ceraApfId" [options]="materiaOptions('CERA')" placeholder="Buscar cera" ariaLabel="Buscar cera APF" class="mt-1"></app-searchable-select>
                </label>
                <label class="text-xs text-stone-600">Cera de molde
                  <app-searchable-select name="grupoCeraMolde" [(ngModel)]="grupoForm.ceraMoldeId" [options]="materiaOptions('CERA')" placeholder="Buscar cera" ariaLabel="Buscar cera de molde" class="mt-1"></app-searchable-select>
                </label>
                <label class="text-xs text-stone-600">Pábilo
                  <app-searchable-select name="grupoPabilo" [(ngModel)]="grupoForm.pabiloId" [options]="materiaOptions('PABILO')" placeholder="Buscar pábilo" ariaLabel="Buscar pábilo" class="mt-1"></app-searchable-select>
                </label>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <label *ngFor="let opcion of opcionesGrupo" class="flex items-center gap-2 bg-white border border-stone-200 rounded-lg p-2 cursor-pointer">
                  <input type="checkbox" [name]="opcion.clave" [(ngModel)]="grupoForm[opcion.clave]" class="accent-brand-primary" />
                  {{ opcion.etiqueta }}
                </label>
              </div>
              <p class="text-[10px] text-stone-500">La esencia elegida en el formulario se usa como esencia predeterminada inicial. Las configuraciones APF incluyen Vybar al 3%; las de cera de molde no incluyen aditivo.</p>
            </div>

            <!-- Mold Assistant Panel -->
            <div class="border border-stone-200 rounded-xl p-4 bg-stone-50 space-y-3">
              <div class="flex items-center gap-2 text-xs font-bold text-stone-700 uppercase tracking-wider pb-2 border-b border-stone-200/60">
                <i class="fa-solid fa-calculator text-brand-dark text-sm"></i>
                <span>Formulación del Molde e Insumos</span>
              </div>

              <!-- Mold fields -->
              <div class="space-y-3 pt-1">
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
                      <option value="AROMATICA">Aromatizante</option>
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
                      <app-searchable-select name="moldCera" [(ngModel)]="moldParams.ceraId" (ngModelChange)="calculateRecipeFromMold()" [options]="materiaOptions('CERA')" placeholder="Buscar cera" ariaLabel="Buscar cera" required></app-searchable-select>
                    </div>

                    <div>
                      <label class="block text-[9px] font-semibold text-stone-400 uppercase mb-1">Esencia</label>
                      <app-searchable-select name="moldEsencia" [(ngModel)]="moldParams.esenciaId" (ngModelChange)="calculateRecipeFromMold()" [options]="materiaOptions('ESENCIA')" placeholder="Buscar esencia" ariaLabel="Buscar esencia" required></app-searchable-select>
                    </div>

                    <div *ngIf="moldParams.tipoVela === 'DECORATIVA'">
                      <label class="block text-[9px] font-semibold text-stone-400 uppercase mb-1">Aditivo</label>
                      <app-searchable-select name="moldAditivo" [(ngModel)]="moldParams.aditivoId" (ngModelChange)="calculateRecipeFromMold()" [options]="aditivoOptions" placeholder="Buscar aditivo" ariaLabel="Buscar aditivo"></app-searchable-select>
                    </div>

                    <div *ngIf="moldParams.tipoVela === 'AROMATICA'">
                      <label class="block text-[9px] font-semibold text-stone-400 uppercase mb-1">Envase / Frasco</label>
                      <app-searchable-select name="moldEnvase" [(ngModel)]="moldParams.envaseId" (ngModelChange)="calculateRecipeFromMold()" [options]="envaseOptions" placeholder="Buscar envase" ariaLabel="Buscar envase"></app-searchable-select>
                    </div>

                    <div>
                      <label class="block text-[9px] font-semibold text-stone-400 uppercase mb-1">Pabilo / Mecha</label>
                      <app-searchable-select name="moldPabilo" [(ngModel)]="moldParams.pabiloId" (ngModelChange)="calculateRecipeFromMold()" [options]="pabiloOptions" placeholder="Buscar pábilo" ariaLabel="Buscar pábilo"></app-searchable-select>
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

                    <div *ngIf="moldParams.tipoVela === 'DECORATIVA' && moldParams.aditivoId > 0 && moldCalculations.aditivo > 0" class="flex justify-between items-center text-amber-800">
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

                    <div *ngIf="moldParams.tipoVela === 'AROMATICA' && moldParams.envaseId > 0" class="flex justify-between items-center text-cyan-800">
                      <span>Envase / Frasco:</span>
                      <div class="font-mono flex items-center gap-3">
                        <span class="text-stone-500">1 unid</span>
                        <span class="font-bold text-cyan-900 w-20 text-right">{{ moldCalculations.costoEnvase | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
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
              <label for="prodReq" class="text-xs font-semibold text-stone-600 uppercase tracking-wider">Requiere ensamblaje</label>
            </div>

            <!-- Assemblies design if requiereEnsamble is checked -->
            <div *ngIf="prodForm.requiereEnsamble" class="space-y-2">
              <div class="flex justify-between items-center">
                <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wider">Componentes Base</label>
                <button type="button" (click)="addEnsambleRow()" class="text-brand-primary text-xs hover:underline flex items-center gap-1 cursor-pointer font-semibold">
                  <i class="fa-solid fa-plus text-[10px]"></i>
                  <span>Agregar fila</span>
                </button>
              </div>

              <!-- Ensamble rows -->
              <div class="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                <div *ngFor="let row of prodForm.ensambles; let i = index" class="flex gap-2 items-center">
                  <app-searchable-select
                    name="comp_{{i}}" 
                    [(ngModel)]="row.componenteBaseId" 
                    [options]="componenteOptions"
                    placeholder="Buscar componente base"
                    ariaLabel="Buscar componente base"
                    required 
                    class="flex-1"
                  />
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

              <div class="flex justify-between items-center pt-2 border-t border-stone-100">
                <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wider">Insumos Directos</label>
                <button type="button" (click)="addMateriaPrimaEnsambleRow()" class="text-brand-primary text-xs hover:underline flex items-center gap-1 cursor-pointer font-semibold">
                  <i class="fa-solid fa-plus text-[10px]"></i>
                  <span>Agregar fila</span>
                </button>
              </div>

              <p *ngIf="prodForm.materiasPrimas.length === 0" class="text-[10px] text-stone-400">
                Agrega aquí decoración, empaques u otros materiales usados solamente en el producto final.
              </p>
              <div class="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                <div *ngFor="let row of prodForm.materiasPrimas; let i = index" class="flex gap-2 items-center">
                  <app-searchable-select
                    name="materia_{{i}}"
                    [(ngModel)]="row.materiaPrimaId"
                    [options]="materiaOptions()"
                    placeholder="Buscar materia prima"
                    ariaLabel="Buscar materia prima"
                    required
                    class="flex-1"
                  />
                  <input
                    type="number"
                    name="materiaQty_{{i}}"
                    [(ngModel)]="row.cantidadNecesaria"
                    required
                    min="0.0001"
                    step="any"
                    placeholder="Cant."
                    class="w-24 bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs text-stone-800 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors"
                  />
                  <button type="button" (click)="removeMateriaPrimaEnsambleRow(i)" class="p-2 text-stone-400 hover:text-red-500 transition-colors cursor-pointer"><i class="fa-solid fa-trash-can text-sm"></i></button>
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
      to { opacity: 1; transform: none; }
    }
  `]
})
export class FabricacionComponent implements OnInit {
  aromaComp: any = null;
  variantProd: any = null;
  newAromaId = 0;
  productionVariantId = 0;
  productionQty = 1;
  variantBusy = false;
  variantMessage = '';
  catalogVariantForm: { id?: number; nombre: string; precioVenta: number } = { nombre: '', precioVenta: 0 };
  catalogSelections: Record<number, number> = {};

  openAromas(comp: any): void {
    this.aromaComp = comp;
    this.newAromaId = 0;
    this.productionVariantId = comp.variantes?.[0]?.id || 0;
    this.productionQty = 1;
    this.variantMessage = '';
  }
  availableAromas(): any[] {
    const reference = this.aromaComp?.recetaMaterias.find((r: any) => r.materiaPrima.tipo === 'ESENCIA');
    return this.materias.filter(m => m.tipo === 'ESENCIA' && m.unidadMedida === reference?.materiaPrima.unidadMedida && !this.aromaComp.variantes.some((v: any) => v.esenciaId === m.id));
  }
  esEsenciaPredeterminada(variante: any): boolean {
    const referencia = this.aromaComp?.recetaMaterias?.find((r: any) => r.materiaPrima.tipo === 'ESENCIA');
    return variante.esenciaId === referencia?.materiaPrimaId;
  }
  refreshAromas(message: string): void {
    this.http.get<any>(`http://localhost:3000/api/componente-base/${this.aromaComp.id}`).subscribe({
      next: comp => { this.aromaComp = comp; this.variantBusy = false; this.variantMessage = message; this.loadData(); },
      error: () => { this.variantBusy = false; this.variantMessage = 'Operación completada. Cierra y vuelve a abrir para actualizar los datos.'; }
    });
  }
  addAroma(): void {
    if (this.variantBusy || !this.newAromaId) return;
    this.variantBusy = true;
    this.http.post(`http://localhost:3000/api/componente-base/${this.aromaComp.id}/variantes`, { esenciaId: Number(this.newAromaId) }).subscribe({
      next: () => { this.newAromaId = 0; this.refreshAromas('Esencia agregada con stock cero.'); },
      error: err => { this.variantBusy = false; this.variantMessage = err.error?.message || 'No se pudo agregar la esencia'; }
    });
  }
  removeAroma(variante: any): void {
    if (this.variantBusy || this.esEsenciaPredeterminada(variante) || variante.stockDisponible > 0) return;
    if (!confirm(`¿Eliminar la esencia ${variante.esencia.nombre} de este componente?`)) return;
    this.variantBusy = true;
    this.http.delete(`http://localhost:3000/api/componente-base/${this.aromaComp.id}/variantes/${variante.id}`).subscribe({
      next: () => this.refreshAromas('Esencia eliminada.'),
      error: err => { this.variantBusy = false; this.variantMessage = err.error?.message || 'No se pudo eliminar la esencia'; }
    });
  }
  fabricarAroma(): void {
    if (this.variantBusy || !this.productionVariantId || !Number.isInteger(this.productionQty) || this.productionQty < 1) return;
    this.variantBusy = true;
    this.http.post(`http://localhost:3000/api/componente-base/${this.aromaComp.id}/fabricar`, { varianteId: Number(this.productionVariantId), cantidad: this.productionQty }).subscribe({
      next: () => this.refreshAromas('Fabricación registrada y materias primas descontadas.'),
      error: err => { this.variantBusy = false; this.variantMessage = err.error?.message || 'No se pudo fabricar'; }
    });
  }
  aromaEnsambles(prod: any): any[] {
    return (prod?.ensambles || []).filter((e: any) => e.componenteBase.variantes?.length);
  }
  hasAromas(prod: any): boolean { return prod.requiereEnsamble && this.aromaEnsambles(prod).length > 0; }
  openCatalogVariant(prod: any, variant: any = null): void {
    this.variantProd = prod;
    this.variantMessage = '';
    this.catalogVariantForm = { id: variant?.id, nombre: variant?.nombre || '', precioVenta: variant?.precioVenta ?? prod.precioVenta };
    this.catalogSelections = {};
    for (const e of this.aromaEnsambles(prod)) {
      this.catalogSelections[e.componenteBaseId] = variant?.selecciones.find((s: any) => s.componenteVariante.componenteBaseId === e.componenteBaseId)?.componenteVarianteId || 0;
    }
  }
  catalogVariantCost(): number {
    if (!this.variantProd) return 0;
    let total = 0;
    for (const e of this.variantProd.ensambles) {
      const v = e.componenteBase.variantes.find((v: any) => v.id === Number(this.catalogSelections[e.componenteBaseId]));
      total += (v?.costoProduccion ?? (e.componenteBase.variantes.length ? 0 : e.componenteBase.costoProduccion)) * e.cantidadNecesaria;
    }
    for (const m of this.variantProd.ensamblesMateriaPrima || []) total += m.materiaPrima.costoUnitario * m.cantidadNecesaria;
    return total;
  }
  saveCatalogVariant(): void {
    if (this.variantBusy) return;
    const ids = this.aromaEnsambles(this.variantProd).map(e => Number(this.catalogSelections[e.componenteBaseId]));
    if (ids.some(id => !id)) { this.variantMessage = 'Selecciona una esencia para cada componente.'; return; }
    this.variantBusy = true;
    this.http.post(`http://localhost:3000/api/catalogo/${this.variantProd.id}/variantes`, { ...this.catalogVariantForm, componenteVarianteIds: ids }).subscribe({
      next: () => { this.variantBusy = false; this.variantProd = null; this.loadData(); },
      error: err => { this.variantBusy = false; this.variantMessage = err.error?.message || 'No se pudo guardar'; }
    });
  }

  activeTab = 'componentes';
  componentes: any[] = [];
  catalogo: any[] = [];
  materias: any[] = [];
  componentSearchQuery = '';
  catalogSearchQuery = '';
  isAdmin = false;

  // Component Modal Data
  isCompModalOpen = false;
  editingComp: any = null;
  compForm = {
    nombre: '',
    moldeMateriaPrimaId: null as number | null,
    imagenUrl: '',
    stockDisponible: 0,
    receta: [] as { materiaPrimaId: number; cantidadNecesaria: number }[]
  };
  crearGrupo = false;
  grupoForm: any = {
    ceraApfId: 0,
    ceraMoldeId: 0,
    pabiloId: 0,
    apfConPabilo: false,
    apfSinPabilo: false,
    moldeConPabilo: false,
    moldeSinPabilo: false,
  };
  opcionesGrupo = [
    { clave: 'apfConPabilo', etiqueta: 'Cera APF · con pábilo', cera: 'apf', pabilo: true },
    { clave: 'apfSinPabilo', etiqueta: 'Cera APF · sin pábilo', cera: 'apf', pabilo: false },
    { clave: 'moldeConPabilo', etiqueta: 'Cera de molde · con pábilo', cera: 'molde', pabilo: true },
    { clave: 'moldeSinPabilo', etiqueta: 'Cera de molde · sin pábilo', cera: 'molde', pabilo: false },
  ];

  // Mold assistant variables
  useMold = false;
  moldParams = {
    pesoAgua: 100,
    tipoVela: 'DECORATIVA',
    porcentajeEsencia: 10,
    ceraId: 0,
    esenciaId: 0,
    aditivoId: 0,
    envaseId: 0,
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
    costoEnvase: 0,
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
    ensambles: [] as { componenteBaseId: number; cantidadNecesaria: number }[],
    materiasPrimas: [] as { materiaPrimaId: number; cantidadNecesaria: number }[]
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

  get filteredComponentes(): any[] {
    return this.componentesAgrupados.flatMap(grupo => grupo.componentes);
  }

  get componentesAgrupados(): { molde: any | null; componentes: any[] }[] {
    const grupos = new Map<string, { molde: any | null; componentes: any[] }>();
    for (const comp of this.componentes) {
      const nombreMolde = comp.moldeMateriaPrima?.nombre;
      if (!coincideBusqueda(comp.nombre, this.componentSearchQuery) && !coincideBusqueda(nombreMolde, this.componentSearchQuery)) continue;
      const clave = comp.moldeMateriaPrimaId ? `molde-${comp.moldeMateriaPrimaId}` : 'sin-molde';
      if (!grupos.has(clave)) grupos.set(clave, { molde: comp.moldeMateriaPrima || null, componentes: [] });
      grupos.get(clave)!.componentes.push(comp);
    }
    return Array.from(grupos.values()).sort((a, b) => Number(Boolean(a.molde)) - Number(Boolean(b.molde)));
  }

  get filteredCatalogo(): any[] {
    return this.filterByName(this.catalogo, this.catalogSearchQuery);
  }

  private filterByName(items: any[], query: string): any[] {
    return items.filter(item => coincideBusqueda(item.nombre, query));
  }

  esenciaPredeterminada(comp: any): any | null {
    return comp.recetaMaterias?.find((rm: any) => rm.materiaPrima?.tipo === 'ESENCIA')?.materiaPrima || null;
  }

  stockEsenciaPredeterminada(comp: any, esenciaId: number): number {
    return comp.variantes?.find((v: any) => v.esenciaId === esenciaId)?.stockDisponible || 0;
  }

  // Component modal handling
  openCompModal(comp: any = null): void {
    this.reiniciarGrupo();
    if (comp) {
      this.editingComp = comp;
      // Extract recipe items
      const recipeRows = comp.recetaMaterias.map((rm: any) => ({
        materiaPrimaId: rm.materiaPrimaId,
        cantidadNecesaria: rm.cantidadNecesaria
      }));
      this.compForm = {
        nombre: comp.nombre,
        moldeMateriaPrimaId: comp.moldeMateriaPrimaId ?? null,
        imagenUrl: comp.imagenUrl || '',
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
          envaseId: 0,
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
          } else if (rm.materiaPrima.tipo === 'ENVASE') {
            this.moldParams.envaseId = rm.materiaPrimaId;
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
      this.useMold = true;
      this.compForm = {
        nombre: '',
        moldeMateriaPrimaId: null,
        imagenUrl: '',
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
        envaseId: 0,
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

  private reiniciarGrupo(): void {
    this.crearGrupo = false;
    this.grupoForm = { ceraApfId: 0, ceraMoldeId: 0, pabiloId: 0, apfConPabilo: false, apfSinPabilo: false, moldeConPabilo: false, moldeSinPabilo: false };
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
      moldeMateriaPrimaId: this.compForm.moldeMateriaPrimaId,
      imagenUrl: this.compForm.imagenUrl,
      stockDisponible: this.compForm.stockDisponible,
      receta: validRecipe,
      pesoAgua: this.useMold ? this.moldParams.pesoAgua : null,
      tipoVela: this.useMold ? this.moldParams.tipoVela : null,
      porcentajeEsencia: this.useMold ? this.moldParams.porcentajeEsencia : null
    };

    if (this.crearGrupo) {
      this.crearConfiguraciones(payload);
      return;
    }

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

  private crearConfiguraciones(base: any): void {
    const seleccionadas = this.opcionesGrupo.filter(opcion => this.grupoForm[opcion.clave]);
    if (!seleccionadas.length) { alert('Selecciona al menos una configuración.'); return; }
    if (!base.moldeMateriaPrimaId) { alert('Selecciona un molde para agrupar las configuraciones.'); return; }
    if (!this.useMold || !this.moldParams.esenciaId) { alert('Completa la formulación del molde y selecciona una esencia predeterminada.'); return; }
    const requiereVybar = seleccionadas.some(opcion => opcion.cera === 'apf');
    const vybar = requiereVybar ? this.obtenerVybar() : null;
    if (requiereVybar && !vybar) { alert('Registra una materia prima de tipo ADITIVO con "Vybar" en el nombre para crear configuraciones con cera APF.'); return; }
    const componentes = seleccionadas.map(opcion => {
      const ceraId = opcion.cera === 'apf' ? Number(this.grupoForm.ceraApfId) : Number(this.grupoForm.ceraMoldeId);
      const pabiloId = opcion.pabilo ? Number(this.grupoForm.pabiloId) : 0;
      if (!ceraId || (opcion.pabilo && !pabiloId)) return null;
      const vybarId = opcion.cera === 'apf' ? Number(vybar!.id) : 0;
      return {
        ...base,
        nombre: `${base.nombre} · ${opcion.etiqueta}`,
        tipoCera: opcion.cera === 'apf' ? 'APF' : 'MOLDE',
        receta: this.recetaParaConfiguracion(ceraId, pabiloId, vybarId),
      };
    });
    if (componentes.some(c => !c)) { alert('Selecciona las ceras requeridas y el pábilo para las combinaciones marcadas.'); return; }
    this.http.post('http://localhost:3000/api/componente-base/grupo', { componentes }).subscribe({
      next: () => { this.loadData(); this.reiniciarGrupo(); this.closeCompModal(); },
      error: err => alert(err.error?.message || 'No se pudieron crear todas las configuraciones.')
    });
  }

  private obtenerVybar(): any | undefined {
    return this.getMateriasByType('ADITIVO').find(m => normalizarBusqueda(m.nombre).includes('vybar'));
  }

  private recetaParaConfiguracion(ceraId: number, pabiloId: number, vybarId: number): { materiaPrimaId: number; cantidadNecesaria: number }[] {
    const ceraInicial = (Number(this.moldParams.pesoAgua) || 0) * 0.9;
    const esencia = ceraInicial * ((Number(this.moldParams.porcentajeEsencia) || 0) / 100);
    const usaAditivo = vybarId > 0;
    const aditivo = usaAditivo ? ceraInicial * 0.03 : 0;
    const receta = [
      { materiaPrimaId: ceraId, cantidadNecesaria: Number((ceraInicial - esencia - aditivo).toFixed(2)) },
      { materiaPrimaId: Number(this.moldParams.esenciaId), cantidadNecesaria: Number(esencia.toFixed(2)) },
    ];
    if (usaAditivo) receta.push({ materiaPrimaId: vybarId, cantidadNecesaria: Number(aditivo.toFixed(2)) });
    if (this.moldParams.tipoVela === 'AROMATICA' && Number(this.moldParams.envaseId) > 0) receta.push({ materiaPrimaId: Number(this.moldParams.envaseId), cantidadNecesaria: 1 });
    if (pabiloId > 0) {
      const pabilo = this.materias.find(m => Number(m.id) === pabiloId);
      const cantidad = pabilo?.unidadMedida === 'METROS' ? (Number(this.moldParams.cantidadPabilos) * Number(this.moldParams.largoPabiloCm)) / 100 : Number(this.moldParams.cantidadPabilos) * Number(this.moldParams.largoPabiloCm);
      receta.push({ materiaPrimaId: pabiloId, cantidadNecesaria: Number(cantidad.toFixed(2)) });
    }
    return receta;
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
    const envaseItem = this.materias.find(m => m.tipo === 'ENVASE');

    this.moldParams.ceraId = ceraItem ? ceraItem.id : 0;
    this.moldParams.esenciaId = esenciaItem ? esenciaItem.id : 0;
    this.moldParams.aditivoId = aditivoItem ? aditivoItem.id : 0;
    this.moldParams.pabiloId = pabiloItem ? pabiloItem.id : 0;
    this.moldParams.envaseId = envaseItem ? envaseItem.id : 0;

    this.calculateRecipeFromMold();
  }

  getMateriasByType(tipo: string): any[] {
    if (!this.materias) return [];
    return this.materias.filter(m => m.tipo === tipo);
  }

  materiaOptions(tipo?: string): SearchableSelectOption[] {
    const materias = tipo ? this.getMateriasByType(tipo) : this.materias || [];
    return materias.map(materia => ({
      value: materia.id,
      label: `${materia.nombre} (${materia.stockActual} ${materia.unidadMedida})`,
    }));
  }

  aromaOptions(materias: any[]): SearchableSelectOption[] {
    return materias.map(materia => ({ value: materia.id, label: `${materia.nombre} (${materia.unidadMedida})` }));
  }

  varianteEsenciaOptions(variantes: any[] | undefined): SearchableSelectOption[] {
    return (variantes || []).map(variante => ({
      value: variante.id,
      label: `${variante.esencia.nombre} · Stock: ${variante.stockDisponible}`,
    }));
  }

  get componenteOptions(): SearchableSelectOption[] {
    return this.componentes.map(componente => ({
      value: componente.id,
      label: `${componente.nombre} (Stock: ${componente.stockDisponible})`,
    }));
  }

  get moldeOptions(): SearchableSelectOption[] {
    return [
      { value: null, label: 'Sin molde / componente independiente' },
      ...this.materiaOptions('MOLDE'),
    ];
  }

  get aditivoOptions(): SearchableSelectOption[] {
    return [{ value: 0, label: 'Ninguno / Sin aditivo' }, ...this.materiaOptions('ADITIVO')];
  }

  get envaseOptions(): SearchableSelectOption[] {
    return [{ value: 0, label: 'Sin envase / Ninguno' }, ...this.materiaOptions('ENVASE')];
  }

  get pabiloOptions(): SearchableSelectOption[] {
    return [{ value: 0, label: 'Ninguno / Sin pábilo' }, ...this.materiaOptions('PABILO')];
  }

  calculateRecipeFromMold(): void {
    if (!this.useMold) return;
    const pesoAgua = this.moldParams.pesoAgua || 0;
    const ceraInicial = pesoAgua * 0.9;
    const pctEsencia = (this.moldParams.porcentajeEsencia || 0) / 100;
    const esencia = ceraInicial * pctEsencia;

    let aditivo = 0;
    let ceraFinal = 0;

    const hasAditivo = this.moldParams.tipoVela === 'DECORATIVA' && Number(this.moldParams.aditivoId) > 0;
    if (hasAditivo) {
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
    const envaseMat = this.materias.find(m => Number(m.id) === Number(this.moldParams.envaseId));

    const costoCera = ceraMat ? (ceraMat.costoUnitario || 0) * ceraFinal : 0;
    const costoEsencia = esenciaMat ? (esenciaMat.costoUnitario || 0) * esencia : 0;
    const costoAditivo = (hasAditivo && aditivoMat) ? (aditivoMat.costoUnitario || 0) * aditivo : 0;
    const costoPabilo = pabiloMat ? (pabiloMat.costoUnitario || 0) * pabiloTotal : 0;
    const costoEnvase = (this.moldParams.tipoVela === 'AROMATICA' && envaseMat) ? (envaseMat.costoUnitario || 0) * 1 : 0;
    const costoTotalMold = costoCera + costoEsencia + costoAditivo + costoPabilo + costoEnvase;

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
      costoEnvase,
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
    if (hasAditivo && this.moldParams.aditivoId > 0 && aditivo > 0) {
      newRecipe.push({ materiaPrimaId: Number(this.moldParams.aditivoId), cantidadNecesaria: Number(aditivo.toFixed(2)) });
    }
    if (this.moldParams.tipoVela === 'AROMATICA' && this.moldParams.envaseId > 0) {
      newRecipe.push({ materiaPrimaId: Number(this.moldParams.envaseId), cantidadNecesaria: 1 });
    }
    if (this.moldParams.pabiloId > 0 && pabiloTotal > 0) {
      newRecipe.push({ materiaPrimaId: Number(this.moldParams.pabiloId), cantidadNecesaria: Number(pabiloTotal.toFixed(2)) });
    }

    this.compForm.receta = newRecipe;
  }

  formatTipoVela(tipo: string): string {
    if (!tipo) return '';
    return tipo === 'DECORATIVA' ? 'Decorativa' : 'Aromatizante';
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
        ensambles: ensRows,
        materiasPrimas: (prod.ensamblesMateriaPrima || []).map((e: any) => ({
          materiaPrimaId: e.materiaPrimaId,
          cantidadNecesaria: e.cantidadNecesaria
        }))
      };
    } else {
      this.editingProd = null;
      this.prodForm = {
        nombre: '',
        precioVenta: 0,
        requiereEnsamble: false,
        imagenUrl: '',
        ensambles: [],
        materiasPrimas: []
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

  addMateriaPrimaEnsambleRow(): void {
    this.prodForm.materiasPrimas.push({ materiaPrimaId: 0, cantidadNecesaria: 1 });
  }

  removeMateriaPrimaEnsambleRow(index: number): void {
    this.prodForm.materiasPrimas.splice(index, 1);
  }

  saveProd(): void {
    const validEns = this.prodForm.ensambles
      .filter(e => Number(e.componenteBaseId) > 0 && Number(e.cantidadNecesaria) > 0)
      .map(e => ({
        componenteBaseId: Number(e.componenteBaseId),
        cantidadNecesaria: Number(e.cantidadNecesaria)
      }));
    const validMateriasPrimas = this.prodForm.materiasPrimas
      .filter(m => Number(m.materiaPrimaId) > 0 && Number(m.cantidadNecesaria) > 0)
      .map(m => ({
        materiaPrimaId: Number(m.materiaPrimaId),
        cantidadNecesaria: Number(m.cantidadNecesaria)
      }));
    const payload = {
      ...this.prodForm,
      ensambles: this.prodForm.requiereEnsamble ? validEns : [],
      materiasPrimas: this.prodForm.requiereEnsamble ? validMateriasPrimas : []
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
      this.prodForm.materiasPrimas.forEach(row => {
        const materiaPrima = this.materias.find(m => m.id === Number(row.materiaPrimaId));
        if (materiaPrima) {
          cost += materiaPrima.costoUnitario * (row.cantidadNecesaria || 0);
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

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-materia-prima',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-stone-800 tracking-tight">Inventario de Materias Primas</h2>
          <p class="text-sm text-stone-500">Gestión de insumos base para la fabricación de velas.</p>
        </div>
        <button 
          *ngIf="isAdmin"
          (click)="openModal()"
          class="bg-gradient-to-r from-brand-primary to-brand-light text-stone-950 font-semibold px-4 py-2.5 rounded-lg hover:shadow-md hover:shadow-brand-primary/10 transition-all flex items-center gap-2 cursor-pointer text-sm"
        >
          <i class="fa-solid fa-plus text-xs"></i>
          <span>Registrar Materia Prima</span>
        </button>
      </div>

      <!-- Search & Filters -->
      <div class="bg-white border border-stone-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div class="relative w-full sm:max-w-md">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400">
            <i class="fa-solid fa-magnifying-glass text-xs"></i>
          </span>
          <input 
            type="text" 
            [(ngModel)]="searchQuery"
            placeholder="Buscar por nombre..."
            class="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 pl-9 pr-4 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors"
          />
        </div>
         <!-- Tipo Filters -->
         <div class="flex flex-wrap gap-2 w-full sm:w-auto">
          <button 
            *ngFor="let tab of filterTabs"
            (click)="selectedTypeFilter = tab.value"
            [ngClass]="selectedTypeFilter === tab.value ? 'bg-brand-primary text-stone-950 border-brand-primary/20' : 'bg-stone-50 text-stone-600 border-stone-200'"
            class="border text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            {{ tab.label }}
          </button>
        </div>

         <div class="flex items-center gap-2 text-xs text-stone-500">
           <span>Mostrando: <b>{{ filteredItems.length }}</b></span>
         </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="min-h-[200px] flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-4 border-brand-primary border-t-transparent"></div>
      </div>

      <!-- Main Table -->
      <div *ngIf="!loading" class="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="bg-stone-50 text-stone-400 font-semibold border-b border-stone-200 uppercase tracking-wider text-xs">
                <th class="px-6 py-4">ID</th>
                <th class="px-6 py-4">Nombre</th>
                <th class="px-6 py-4">Tipo</th>
                <th class="px-6 py-4">Unidad de Medida</th>
                <th class="px-6 py-4" *ngIf="isAdmin">Costo Unitario</th>
                <th class="px-6 py-4">Stock Actual</th>
                <th class="px-6 py-4 text-right" *ngIf="isAdmin">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="filteredItems.length === 0">
                <td [attr.colspan]="isAdmin ? 7 : 5" class="px-6 py-12 text-center text-stone-400">
                  <i class="fa-solid fa-box-open text-3xl mb-2 block"></i>
                  No se encontraron materias primas
                </td>
              </tr>
              <tr *ngFor="let item of filteredItems" class="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                <td class="px-6 py-4 font-mono text-stone-400 text-xs">{{ formatId(item.id) }}</td>
                <td class="px-6 py-4 font-semibold text-stone-800">{{ item.nombre }}</td>
                <td class="px-6 py-4">
                  <span [ngClass]="getTipoBadgeClass(item.tipo)" class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border">
                    {{ formatTipo(item.tipo) }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span class="bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-xs font-semibold">
                    {{ item.unidadMedida }}
                  </span>
                </td>
                <td class="px-6 py-4 font-medium text-stone-700" *ngIf="isAdmin">
                  {{ item.costoUnitario | currency:'COP':'symbol-narrow':'1.0-2' }}
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <span 
                      [class.text-red-600]="isStockLow(item)" 
                      [class.font-bold]="isStockLow(item)"
                      class="text-stone-800"
                    >
                      {{ item.stockActual | number }} {{ formatUnidadMedida(item.unidadMedida, item.stockActual) }}
                    </span>
                    <span 
                      *ngIf="isStockLow(item)"
                      class="bg-red-50 text-red-700 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full animate-pulse"
                      title="Stock mínimo configurado: {{ item.stockMinimo | number }}"
                    >
                      Bajo (Mín. {{ item.stockMinimo | number }})
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 text-right" *ngIf="isAdmin">
                  <div class="flex justify-end gap-2">
                    <button 
                      (click)="openModal(item)"
                      class="p-1.5 text-stone-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <i class="fa-solid fa-pen text-sm"></i>
                    </button>
                    <button 
                      (click)="deleteItem(item.id)"
                      class="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <i class="fa-solid fa-trash text-sm"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Modal (Admin Only) -->
      <div 
        *ngIf="isModalOpen" 
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm"
      >
        <div class="w-full max-w-md bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden animate-zoom-in">
          <!-- Modal Header -->
          <div class="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
            <h3 class="font-bold text-stone-800">{{ editingItem?.id ? 'Editar Materia Prima' : 'Registrar Materia Prima' }}</h3>
            <button (click)="closeModal()" class="text-stone-400 hover:text-stone-600 cursor-pointer">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <!-- Modal Body / Form -->
          <form (ngSubmit)="saveItem()" #itemForm="ngForm" class="p-6 space-y-4">
            <div>
              <label for="nombre" class="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Nombre del Insumo</label>
              <input 
                type="text" 
                id="nombre" 
                name="nombre"
                [(ngModel)]="formModel.nombre"
                required
                placeholder="Ej. Cera de Soya Premium"
                class="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors"
              />
            </div>
             <div>
               <label for="tipo" class="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Tipo de Insumo</label>
               <select 
                 id="tipo" 
                 name="tipo" 
                 [(ngModel)]="formModel.tipo" 
                 (change)="onTipoChange()"
                 required 
                 class="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-sm text-stone-800 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors"
               >
                  <option value="CERA">CERA (Ceras base)</option>
                  <option value="ESENCIA">ESENCIA (Aromas y fragancias)</option>
                  <option value="ADITIVO">ADITIVO (Estearina, endurecedores, etc.)</option>
                  <option value="PABILO">PABILO (Mechas de algodón/madera)</option>
                  <option value="ENVASE">ENVASE (Envases de vidrio, latas, frascos)</option>
                  <option value="MOLDE">MOLDE (Moldes de silicona/metal)</option>
                  <option value="DECORACION">DECORACIÓN (Flores, pigmentos, purpurina)</option>
                  <option value="INSUMO_GENERAL">INSUMO GENERAL (Cajas, empaques, etc.)</option>
               </select>
             </div>

             <div class="grid grid-cols-3 gap-3">
               <div>
                 <label for="unidadMedida" class="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Unidad Medida</label>
                 <select 
                   id="unidadMedida" 
                   name="unidadMedida"
                   [(ngModel)]="formModel.unidadMedida"
                   required
                   class="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-2.5 text-xs text-stone-800 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors"
                 >
                   <option value="GR">GR (Gramos)</option>
                   <option value="ML">ML (Mililitros)</option>
                   <option value="CM">CM (Centímetros)</option>
                   <option value="UNIDAD">UNIDAD (Piezas)</option>
                   <option value="MOLDE">MOLDE (Moldes)</option>
                   <option value="DECORACION">DECORACION</option>
                 </select>
               </div>

               <div>
                 <label for="stockActual" class="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Stock Inicial</label>
                 <input 
                   type="number" 
                   id="stockActual" 
                   name="stockActual"
                   [(ngModel)]="formModel.stockActual"
                   required
                   min="0"
                   placeholder="0.0"
                   class="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-2.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors"
                 />
               </div>

               <div>
                 <label for="stockMinimo" class="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Stock Mínimo</label>
                 <input 
                   type="number" 
                   id="stockMinimo" 
                   name="stockMinimo"
                   [(ngModel)]="formModel.stockMinimo"
                   required
                   min="0"
                   placeholder="10"
                   class="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-2.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors"
                 />
               </div>
             </div>

             <div>
               <label for="costoTotal" class="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Costo Total de la Compra ($)</label>
               <input 
                 type="number" 
                 id="costoTotal" 
                 name="costoTotal"
                 [(ngModel)]="formModel.costoTotal"
                 required
                 min="0"
                 placeholder="Ej. 750"
                 class="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors"
               />
               <p class="text-[10px] text-stone-400 mt-1">Ingresa el valor total pagado por este lote.</p>
             </div>

             <!-- Costo unitario informativo -->
             <div class="bg-stone-50 border border-stone-200/60 rounded-lg p-3 text-xs flex justify-between items-center">
               <span class="text-stone-500 font-medium font-sans">Costo Unitario Calculado:</span>
               <span class="font-bold text-stone-700">
                 {{ getCalculatedUnitCost() | currency:'COP':'symbol-narrow':'1.0-4' }} / {{ formModel.unidadMedida }}
               </span>
             </div>

            <!-- Modal Footer -->
            <div class="pt-4 border-t border-stone-100 flex justify-end gap-2">
              <button 
                type="button" 
                (click)="closeModal()"
                class="border border-stone-200 text-stone-600 px-4 py-2 rounded-lg hover:bg-stone-50 transition-colors text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                [disabled]="!itemForm.form.valid"
                class="bg-gradient-to-r from-brand-primary to-brand-light text-stone-950 font-semibold px-4 py-2 rounded-lg hover:shadow-md hover:shadow-brand-primary/10 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {{ editingItem?.id ? 'Guardar Cambios' : 'Registrar Insumo' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-zoom-in {
      animation: zoomIn 0.2s ease-out forwards;
    }
    @keyframes zoomIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class MateriaPrimaComponent implements OnInit {
  items: any[] = [];
  searchQuery = '';
  loading = true;
  isAdmin = false;

  // Filter control
  selectedTypeFilter = 'TODOS';
  filterTabs = [
    { label: 'Todos', value: 'TODOS' },
    { label: 'Ceras', value: 'CERA' },
    { label: 'Esencias', value: 'ESENCIA' },
    { label: 'Aditivos', value: 'ADITIVO' },
    { label: 'Pabilos', value: 'PABILO' },
    { label: 'Envases', value: 'ENVASE' },
    { label: 'Moldes', value: 'MOLDE' },
    { label: 'Decoración', value: 'DECORACION' },
    { label: 'Otros', value: 'INSUMO_GENERAL' }
  ];

  // Modal control
  isModalOpen = false;
  editingItem: any = null;
  formModel = {
    nombre: '',
    tipo: 'INSUMO_GENERAL',
    unidadMedida: 'GR',
    costoTotal: 0,
    stockActual: 0,
    stockMinimo: 10
  };

  constructor(private http: HttpClient, private authService: AuthService) {
    this.isAdmin = this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.loading = true;
    this.http.get<any[]>('http://localhost:3000/api/materia-prima').subscribe({
      next: (res) => {
        this.items = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  get filteredItems(): any[] {
    let list = this.items;
    if (this.selectedTypeFilter !== 'TODOS') {
      list = list.filter(item => item.tipo === this.selectedTypeFilter);
    }
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      list = list.filter(item => item.nombre.toLowerCase().includes(query));
    }
    return list;
  }

  isStockLow(item: any): boolean {
    return item.stockActual < item.stockMinimo;
  }

  openModal(item: any = null): void {
    if (item) {
      this.editingItem = item;
      this.formModel = {
        nombre: item.nombre,
        tipo: item.tipo,
        unidadMedida: item.unidadMedida,
        costoTotal: item.costoUnitario * item.stockActual,
        stockActual: item.stockActual,
        stockMinimo: item.stockMinimo
      };
    } else {
      this.editingItem = null;
      this.formModel = {
        nombre: '',
        tipo: 'INSUMO_GENERAL',
        unidadMedida: 'UNIDAD',
        costoTotal: 0,
        stockActual: 0,
        stockMinimo: 10
      };
    }
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingItem = null;
  }

  saveItem(): void {
    const url = 'http://localhost:3000/api/materia-prima';
    const calculatedUnitCost = this.getCalculatedUnitCost();
    const payload = {
      nombre: this.formModel.nombre,
      tipo: this.formModel.tipo,
      unidadMedida: this.formModel.unidadMedida,
      stockActual: this.formModel.stockActual,
      costoUnitario: calculatedUnitCost,
      stockMinimo: this.formModel.stockMinimo
    };

    if (this.editingItem && this.editingItem.id) {
      // Update
      this.http.put(`${url}/${this.editingItem.id}`, payload).subscribe({
        next: () => {
          this.loadItems();
          this.closeModal();
        },
        error: (err) => {
          alert(err.error?.message || 'Error al actualizar');
        }
      });
    } else {
      // Create
      this.http.post(url, payload).subscribe({
        next: () => {
          this.loadItems();
          this.closeModal();
        },
        error: (err) => {
          alert(err.error?.message || 'Error al guardar');
        }
      });
    }
  }

  onTipoChange(): void {
    const tipo = this.formModel.tipo;
    if (tipo === 'CERA') {
      this.formModel.unidadMedida = 'GR';
      this.formModel.stockMinimo = 2000;
    } else if (tipo === 'ESENCIA') {
      this.formModel.unidadMedida = 'ML';
      this.formModel.stockMinimo = 200;
    } else if (tipo === 'ADITIVO') {
      this.formModel.unidadMedida = 'GR';
      this.formModel.stockMinimo = 200;
    } else if (tipo === 'PABILO') {
      this.formModel.unidadMedida = 'CM';
      this.formModel.stockMinimo = 50;
    } else if (tipo === 'ENVASE') {
      this.formModel.unidadMedida = 'UNIDAD';
      this.formModel.stockMinimo = 10;
    } else if (tipo === 'MOLDE') {
      this.formModel.unidadMedida = 'UNIDAD';
      this.formModel.stockMinimo = 2;
    } else if (tipo === 'DECORACION') {
      this.formModel.unidadMedida = 'UNIDAD';
      this.formModel.stockMinimo = 10;
    } else if (tipo === 'INSUMO_GENERAL') {
      this.formModel.unidadMedida = 'UNIDAD';
      this.formModel.stockMinimo = 10;
    }
  }

  getTipoBadgeClass(tipo: string): string {
    switch (tipo) {
      case 'CERA': return 'bg-amber-50 text-amber-800 border-amber-200\/60';
      case 'ESENCIA': return 'bg-purple-50 text-purple-800 border-purple-200\/60';
      case 'ADITIVO': return 'bg-sky-50 text-sky-800 border-sky-200\/60';
      case 'PABILO': return 'bg-orange-50 text-orange-800 border-orange-200\/60';
      case 'ENVASE': return 'bg-cyan-50 text-cyan-800 border-cyan-200\/60';
      case 'MOLDE': return 'bg-emerald-50 text-emerald-800 border-emerald-200\/60';
      case 'DECORACION': return 'bg-rose-50 text-rose-800 border-rose-200\/60';
      default: return 'bg-stone-50 text-stone-600 border-stone-200\/60';
    }
  }

  formatTipo(tipo: string): string {
    switch (tipo) {
      case 'CERA': return 'Cera';
      case 'ESENCIA': return 'Esencia';
      case 'ADITIVO': return 'Aditivo';
      case 'PABILO': return 'Pabilo';
      case 'ENVASE': return 'Envase';
      case 'MOLDE': return 'Molde';
      case 'DECORACION': return 'Decoración';
      default: return 'Insumo Gral';
    }
  }

  getCalculatedUnitCost(): number {
    const total = this.formModel.costoTotal || 0;
    const qty = this.formModel.stockActual || 0;
    if (qty <= 0) return 0;
    return total / qty;
  }

  deleteItem(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta materia prima?')) {
      this.http.delete(`http://localhost:3000/api/materia-prima/${id}`).subscribe({
        next: () => {
          this.loadItems();
        },
        error: (err) => {
          alert(err.error?.message || 'Error al eliminar');
        }
      });
    }
  }

  formatId(id: number): string {
    if (!id) return '';
    return 'MP-' + String(id).padStart(3, '0');
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
}

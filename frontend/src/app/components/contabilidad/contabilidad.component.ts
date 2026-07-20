import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-contabilidad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-stone-800 tracking-tight">Módulo de Contabilidad</h2>
          <p class="text-sm text-stone-500">Registro de facturas, control de egresos y balance de caja.</p>
        </div>
        <button 
          (click)="openModal()"
          class="bg-gradient-to-r from-brand-primary to-brand-light text-stone-950 font-semibold px-4 py-2.5 rounded-lg hover:shadow-md hover:shadow-brand-primary/10 transition-all flex items-center gap-2 cursor-pointer text-sm"
        >
          <i class="fa-solid fa-file-invoice-dollar text-xs"></i>
          <span>Registrar Factura de Compra</span>
        </button>
      </div>

      <!-- Financial Summary Dashboard Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Card 1: Ingresos -->
        <div class="bg-white border border-stone-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">Total Ingresos (Ventas)</span>
            <span class="text-2xl font-bold text-stone-800">{{ totalIngresos | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
            <span class="text-[10px] text-emerald-600 font-semibold block flex items-center gap-1">
              <i class="fa-solid fa-arrow-trend-up"></i>
              {{ countPedidosEntregados }} pedidos entregados
            </span>
          </div>
          <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <i class="fa-solid fa-circle-arrow-down text-lg"></i>
          </div>
        </div>

        <!-- Card 2: Egresos -->
        <div class="bg-white border border-stone-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">Total Egresos (Compras)</span>
            <span class="text-2xl font-bold text-stone-800">{{ totalEgresos | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
            <span class="text-[10px] text-amber-700 font-semibold block flex items-center gap-1">
              <i class="fa-solid fa-receipt"></i>
              {{ facturas.length }} facturas registradas
            </span>
          </div>
          <div class="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <i class="fa-solid fa-circle-arrow-up text-lg"></i>
          </div>
        </div>

        <!-- Card 3: Balance Neto -->
        <div class="bg-white border border-stone-200 rounded-xl p-5 shadow-sm flex items-center justify-between"
             [ngClass]="{'border-l-4 border-l-emerald-500': balanceNeto >= 0, 'border-l-4 border-l-red-500': balanceNeto < 0}">
          <div class="space-y-1">
            <span class="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">Saldo Neto en Caja</span>
            <span class="text-2xl font-bold" [ngClass]="{'text-emerald-700': balanceNeto >= 0, 'text-red-700': balanceNeto < 0}">
              {{ balanceNeto | currency:'COP':'symbol-narrow':'1.0-0' }}
            </span>
            <span class="text-[10px] font-semibold block" [ngClass]="{'text-emerald-600': balanceNeto >= 0, 'text-red-500': balanceNeto < 0}">
              {{ balanceNeto >= 0 ? 'Flujo de caja positivo' : 'Caja en saldo negativo' }}
            </span>
          </div>
          <div class="w-12 h-12 rounded-xl flex items-center justify-center"
               [ngClass]="{'bg-emerald-50 text-emerald-600': balanceNeto >= 0, 'bg-red-50 text-red-500': balanceNeto < 0}">
            <i class="fa-solid fa-wallet text-lg"></i>
          </div>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="bg-white border border-stone-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <!-- Search bar -->
        <div class="relative w-full md:max-w-xs">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400">
            <i class="fa-solid fa-magnifying-glass text-xs"></i>
          </span>
          <input 
            type="text" 
            [(ngModel)]="searchQuery"
            placeholder="Buscar por proveedor o comprador..."
            class="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 pl-9 pr-4 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors"
          />
        </div>

        <!-- Category Filters -->
        <div class="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            *ngFor="let tab of filterTabs"
            (click)="selectedCategoryFilter = tab.value"
            [ngClass]="selectedCategoryFilter === tab.value ? 'bg-brand-primary text-stone-950 border-brand-primary/20 shadow-sm' : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'"
            class="border text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Main Table -->
      <div class="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="bg-stone-50 text-stone-400 font-semibold border-b border-stone-200 uppercase tracking-wider text-xs">
                <th class="px-6 py-4">ID</th>
                <th class="px-6 py-4">Factura/Ref</th>
                <th class="px-6 py-4">Proveedor</th>
                <th class="px-6 py-4">Categoría</th>
                <th class="px-6 py-4">Comprador</th>
                <th class="px-6 py-4">Fecha</th>
                <th class="px-6 py-4">Descripción</th>
                <th class="px-6 py-4">Monto Total</th>
                <th class="px-6 py-4 text-right" *ngIf="isAdmin">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="filteredFacturas.length === 0">
                <td [attr.colspan]="isAdmin ? 9 : 8" class="px-6 py-12 text-center text-stone-400">
                  <i class="fa-solid fa-file-excel text-3xl mb-2 block"></i>
                  No se encontraron facturas de compra.
                </td>
              </tr>
              <tr *ngFor="let f of filteredFacturas" class="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                <td class="px-6 py-4 font-mono text-stone-400 text-xs">{{ formatId(f.id) }}</td>
                <td class="px-6 py-4 font-mono text-stone-600 font-semibold text-xs">
                  {{ f.numeroFactura || 'N/A' }}
                </td>
                <td class="px-6 py-4 font-semibold text-stone-850">{{ f.proveedor }}</td>
                <td class="px-6 py-4">
                  <span [ngClass]="getCategoryBadgeClass(f.categoria)" class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border">
                    {{ formatCategory(f.categoria) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-stone-600 font-medium">
                  <span class="inline-flex items-center gap-1">
                    <i class="fa-solid fa-circle-user text-[11px] text-stone-400"></i>
                    {{ f.comprador }}
                  </span>
                </td>
                <td class="px-6 py-4 text-stone-500 font-mono text-xs">
                  {{ f.fecha | date:'dd/MM/yyyy' }}
                </td>
                <td class="px-6 py-4 text-stone-500 max-w-[200px] truncate" [title]="f.descripcion || ''">
                  {{ f.descripcion || '-' }}
                </td>
                <td class="px-6 py-4 font-bold text-stone-800">
                  {{ f.montoTotal | currency:'COP':'symbol-narrow':'1.0-0' }}
                </td>
                <td class="px-6 py-4 text-right" *ngIf="isAdmin">
                  <button 
                    (click)="deleteFactura(f.id)" 
                    class="p-1.5 text-stone-400 hover:text-red-500 transition-colors cursor-pointer rounded-lg hover:bg-red-50"
                    title="Eliminar Factura"
                  >
                    <i class="fa-solid fa-trash-can text-sm"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      </div>

      <!-- Modal: Register New Invoice -->
      <div *ngIf="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm">
        <div class="w-full max-w-md bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden animate-zoom-in flex flex-col max-h-[90vh]">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-stone-150 flex justify-between items-center bg-stone-50 shrink-0">
            <h3 class="font-bold text-stone-850 text-base">Registrar Factura de Compra</h3>
            <button (click)="closeModal()" class="text-stone-400 hover:text-stone-600 cursor-pointer"><i class="fa-solid fa-xmark text-lg"></i></button>
          </div>

          <!-- Form Body -->
          <form (ngSubmit)="saveFactura()" class="p-6 space-y-4 overflow-y-auto flex-1">
            <!-- Proveedor -->
            <div>
              <label class="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Proveedor <span class="text-red-500">*</span></label>
              <input 
                type="text" 
                name="proveedor" 
                [(ngModel)]="factForm.proveedor"
                required
                placeholder="Ej. Distribuidora de Ceras"
                class="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary focus:bg-white transition-colors"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <!-- Nro Factura -->
              <div>
                <label class="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Nro Factura / Ref</label>
                <input 
                  type="text" 
                  name="numeroFactura" 
                  [(ngModel)]="factForm.numeroFactura"
                  placeholder="Ej. FAC-998"
                  class="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary focus:bg-white transition-colors"
                />
              </div>

              <!-- Fecha -->
              <div>
                <label class="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Fecha <span class="text-red-500">*</span></label>
                <input 
                  type="date" 
                  name="fecha" 
                  [(ngModel)]="factForm.fecha"
                  required
                  class="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <!-- Monto -->
              <div>
                <label class="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Monto Total ($) <span class="text-red-500">*</span></label>
                <input 
                  type="number" 
                  name="montoTotal" 
                  [(ngModel)]="factForm.montoTotal"
                  required
                  min="0"
                  placeholder="Ej. 120000"
                  class="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary focus:bg-white transition-colors font-semibold"
                />
              </div>

              <!-- Categoría -->
              <div>
                <label class="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Categoría <span class="text-red-500">*</span></label>
                <select 
                  name="categoria" 
                  [(ngModel)]="factForm.categoria"
                  required
                  class="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary focus:bg-white transition-colors cursor-pointer"
                >
                  <option *ngFor="let cat of categories" [value]="cat.value">{{ cat.label }}</option>
                </select>
              </div>
            </div>

            <!-- Comprador -->
            <div>
              <label class="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Comprado por (Responsable) <span class="text-red-500">*</span></label>
              <input 
                type="text" 
                name="comprador" 
                [(ngModel)]="factForm.comprador"
                required
                placeholder="Nombre de quien compró"
                class="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary focus:bg-white transition-colors"
              />
            </div>

            <!-- Descripción -->
            <div>
              <label class="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Descripción / Detalles</label>
              <textarea 
                name="descripcion" 
                [(ngModel)]="factForm.descripcion"
                rows="2"
                placeholder="Detalle de los insumos o productos comprados..."
                class="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary focus:bg-white transition-colors resize-none"
              ></textarea>
            </div>

            <!-- Buttons -->
            <div class="pt-4 border-t border-stone-100 flex justify-end gap-2 shrink-0">
              <button 
                type="button" 
                (click)="closeModal()" 
                class="border border-stone-200 text-stone-600 px-4 py-2 rounded-lg text-sm hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                [disabled]="!factForm.proveedor || !factForm.montoTotal || !factForm.categoria || !factForm.comprador || !factForm.fecha"
                class="bg-gradient-to-r from-brand-primary to-brand-light text-stone-950 font-semibold px-4 py-2 rounded-lg text-sm transition-all cursor-pointer disabled:opacity-50"
              >
                Guardar Factura
              </button>
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
export class ContabilidadComponent implements OnInit {
  facturas: any[] = [];
  pedidos: any[] = [];
  isAdmin = false;

  // Search and Category filtering
  searchQuery = '';
  selectedCategoryFilter = 'ALL';

  // Summary Metrics
  totalIngresos = 0;
  totalEgresos = 0;
  balanceNeto = 0;
  countPedidosEntregados = 0;

  // Modal
  isModalOpen = false;
  factForm = {
    proveedor: '',
    numeroFactura: '',
    fecha: '',
    montoTotal: null as number | null,
    categoria: 'MATERIA_PRIMA',
    comprador: '',
    descripcion: ''
  };

  // Categories list
  categories = [
    { value: 'MATERIA_PRIMA', label: 'Materias Primas' },
    { value: 'ENVASES_EMPAQUES', label: 'Envases y Empaques' },
    { value: 'HERRAMIENTAS_MOLDES', label: 'Herramientas y Moldes' },
    { value: 'SERVICIOS', label: 'Servicios y Alquiler' },
    { value: 'PUBLICIDAD', label: 'Publicidad y Marketing' },
    { value: 'OTROS', label: 'Otros' }
  ];

  // Category filter tabs
  filterTabs = [
    { value: 'ALL', label: 'Todos' },
    { value: 'MATERIA_PRIMA', label: 'Materias Primas' },
    { value: 'ENVASES_EMPAQUES', label: 'Envases/Empaques' },
    { value: 'HERRAMIENTAS_MOLDES', label: 'Moldes/Herramientas' },
    { value: 'SERVICIOS', label: 'Servicios' },
    { value: 'PUBLICIDAD', label: 'Publicidad' },
    { value: 'OTROS', label: 'Otros' }
  ];

  constructor(private http: HttpClient, private authService: AuthService) {
    this.isAdmin = this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    // Retrieve Invoices
    this.http.get<any[]>('http://localhost:3000/api/facturas').subscribe({
      next: (res) => {
        this.facturas = res;
        this.calculateMetrics();
      },
      error: () => alert('Error al cargar facturas de compra')
    });

    // Retrieve Pedidos to calculate total income from delivered orders
    this.http.get<any[]>('http://localhost:3000/api/pedido').subscribe({
      next: (res) => {
        this.pedidos = res;
        this.calculateMetrics();
      },
      error: () => alert('Error al cargar pedidos de ventas')
    });
  }

  calculateMetrics(): void {
    // 1. Egresos: Sum of all invoices
    this.totalEgresos = this.facturas.reduce((sum, f) => sum + (f.montoTotal || 0), 0);

    // 2. Ingresos: Sum of all final orders (ENTREGADO)
    const deliveredPedidos = this.pedidos.filter(p => p.estado.toUpperCase() === 'ENTREGADO');
    this.countPedidosEntregados = deliveredPedidos.length;
    this.totalIngresos = deliveredPedidos.reduce((sum, p) => sum + (p.total || 0), 0);

    // 3. Balance: Ingresos - Egresos
    this.balanceNeto = this.totalIngresos - this.totalEgresos;
  }

  get filteredFacturas(): any[] {
    return this.facturas.filter(f => {
      // Category filter
      if (this.selectedCategoryFilter !== 'ALL' && f.categoria !== this.selectedCategoryFilter) {
        return false;
      }
      // Search term
      if (this.searchQuery.trim() !== '') {
        const query = this.searchQuery.toLowerCase();
        const provMatch = f.proveedor?.toLowerCase().includes(query);
        const buyerMatch = f.comprador?.toLowerCase().includes(query);
        const descMatch = f.descripcion?.toLowerCase().includes(query);
        const refMatch = f.numeroFactura?.toLowerCase().includes(query);
        return provMatch || buyerMatch || descMatch || refMatch;
      }
      return true;
    });
  }

  openModal(): void {
    const today = new Date().toISOString().substring(0, 10); // YYYY-MM-DD
    const currentUser = this.authService.getUser();
    const activeBuyerName = currentUser ? (currentUser.nombre || currentUser.username) : '';

    this.factForm = {
      proveedor: '',
      numeroFactura: '',
      fecha: today,
      montoTotal: null,
      categoria: 'MATERIA_PRIMA',
      comprador: activeBuyerName,
      descripcion: ''
    };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveFactura(): void {
    if (!this.factForm.proveedor || !this.factForm.montoTotal || !this.factForm.categoria || !this.factForm.comprador || !this.factForm.fecha) {
      return;
    }

    const payload = {
      ...this.factForm,
      montoTotal: Number(this.factForm.montoTotal)
    };

    this.http.post('http://localhost:3000/api/facturas', payload).subscribe({
      next: () => {
        this.loadData();
        this.closeModal();
      },
      error: (err) => alert(err.error?.message || 'Error al guardar la factura de compra')
    });
  }

  deleteFactura(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta factura? Esta acción es irreversible.')) {
      this.http.delete(`http://localhost:3000/api/facturas/${id}`).subscribe({
        next: () => this.loadData(),
        error: (err) => alert(err.error?.message || 'Error al eliminar la factura')
      });
    }
  }

  formatId(id: number): string {
    if (!id) return '';
    return 'FC-' + String(id).padStart(3, '0');
  }

  formatCategory(cat: string): string {
    const found = this.categories.find(c => c.value === cat);
    return found ? found.label : cat;
  }

  getCategoryBadgeClass(cat: string): string {
    switch (cat) {
      case 'MATERIA_PRIMA':
        return 'bg-emerald-50 text-emerald-700 border-emerald-250/30';
      case 'ENVASES_EMPAQUES':
        return 'bg-blue-50 text-blue-700 border-blue-250/30';
      case 'HERRAMIENTAS_MOLDES':
        return 'bg-amber-50 text-amber-700 border-amber-250/30';
      case 'SERVICIOS':
        return 'bg-purple-50 text-purple-700 border-purple-250/30';
      case 'PUBLICIDAD':
        return 'bg-indigo-50 text-indigo-700 border-indigo-250/30';
      default:
        return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  }
}

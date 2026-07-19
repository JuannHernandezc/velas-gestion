import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <!-- Title & User Greeting -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-stone-800 tracking-tight">Panel de Control</h2>
          <p class="text-sm text-stone-500">Resumen y estado actual del negocio de velas.</p>
        </div>
        <div class="bg-white border border-stone-200 shadow-sm rounded-lg px-4 py-2 text-stone-600 text-xs flex items-center gap-2">
          <i class="fa-regular fa-calendar-days text-brand-primary text-sm"></i>
          <span class="font-medium">{{ currentDate | date:'fullDate':'':'es' }}</span>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="min-h-[300px] flex items-center justify-center">
        <div class="flex flex-col items-center gap-3">
          <div class="animate-spin rounded-full h-10 w-10 border-4 border-brand-primary border-t-transparent"></div>
          <span class="text-sm text-stone-500 font-medium">Cargando métricas...</span>
        </div>
      </div>

      <!-- Main Dashboard Grid -->
      <div *ngIf="!loading" class="space-y-6 animate-fade-in">
        <!-- Stat Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <!-- Card 1: Total Sales (ADMIN Only) -->
          <div *ngIf="isAdmin" class="bg-white border border-stone-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
            <div class="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 text-stone-900 text-7xl">
              <i class="fa-solid fa-coins"></i>
            </div>
            <p class="text-xs font-semibold text-stone-400 uppercase tracking-wider">Ingresos Totales</p>
            <h3 class="text-2xl font-bold text-stone-800 mt-2">{{ metrics?.totalVentas | currency:'COP':'symbol-narrow':'1.0-0' }}</h3>
            <div class="flex items-center gap-1.5 mt-2 text-[11px] text-stone-500">
              <span class="text-emerald-600 font-medium">
                <i class="fa-solid fa-arrow-trend-up"></i> Acumulado
              </span>
              <span>desde el inicio</span>
            </div>
          </div>

          <!-- Card 2: Profitability (ADMIN Only) -->
          <div *ngIf="isAdmin" class="bg-white border border-stone-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
            <div class="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 text-stone-900 text-7xl">
              <i class="fa-solid fa-chart-line"></i>
            </div>
            <p class="text-xs font-semibold text-stone-400 uppercase tracking-wider font-sans">Rentabilidad</p>
            <h3 class="text-2xl font-bold text-stone-800 mt-2">{{ metrics?.totalRentabilidad | currency:'COP':'symbol-narrow':'1.0-0' }}</h3>
            <div class="flex items-center gap-1.5 mt-2 text-[11px]">
              <span class="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold border border-emerald-100">
                Margen: {{ metrics?.margenRentabilidad | number:'1.0-1' }}%
              </span>
            </div>
          </div>

          <!-- Card 3: Total Orders -->
          <div class="bg-white border border-stone-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
            <div class="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 text-stone-900 text-7xl">
              <i class="fa-solid fa-cart-shopping"></i>
            </div>
            <p class="text-xs font-semibold text-stone-400 uppercase tracking-wider">Pedidos Totales</p>
            <h3 class="text-2xl font-bold text-stone-800 mt-2">{{ metrics?.pedidosRealizados }}</h3>
            <div class="flex items-center gap-1.5 mt-2 text-[11px] text-stone-500">
              <span class="text-brand-primary font-medium">
                <i class="fa-solid fa-receipt"></i> Registrados
              </span>
              <span>en todos los canales</span>
            </div>
          </div>

          <!-- Card 4: Low Stock Alerts -->
          <div 
            [ngClass]="metrics?.alertasStockBajo > 0 ? 'border-red-200 bg-red-50/20' : 'border-stone-200 bg-white'"
            class="rounded-xl p-5 shadow-sm relative overflow-hidden border"
          >
            <div class="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 text-stone-900 text-7xl">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <p class="text-xs font-semibold text-stone-400 uppercase tracking-wider">Stock Bajo</p>
            <h3 class="text-2xl font-bold mt-2" [class.text-red-600]="metrics?.alertasStockBajo > 0" [class.text-stone-800]="metrics?.alertasStockBajo === 0">
              {{ metrics?.alertasStockBajo }}
            </h3>
            <div class="flex items-center gap-1.5 mt-2 text-[11px] text-stone-500">
              <span 
                [class.text-red-600]="metrics?.alertasStockBajo > 0"
                [class.animate-pulse]="metrics?.alertasStockBajo > 0"
                class="font-medium"
              >
                <i class="fa-solid fa-circle-exclamation"></i>
                {{ metrics?.alertasStockBajo > 0 ? 'Requiere atención' : 'Inventario al día' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Middle Grid: Alerts & Last Orders -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Column: Stock Alerts Details (1/3 size) -->
          <div class="bg-white border border-stone-200 rounded-xl shadow-sm p-5 flex flex-col">
            <h4 class="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-3 flex items-center gap-2">
              <i class="fa-solid fa-circle-exclamation text-amber-500"></i>
              <span>Alertas de Inventario</span>
            </h4>
            
            <div class="flex-1 mt-4 overflow-y-auto max-h-[300px] space-y-3">
              <div *ngIf="metrics?.alertasStockBajo === 0" class="text-center py-8 text-stone-400 text-sm">
                <i class="fa-regular fa-circle-check text-emerald-500 text-3xl mb-2 block"></i>
                Todo el stock está por encima del mínimo.
              </div>

              <!-- Materia Prima Alert items -->
              <div *ngFor="let m of metrics?.alertasDetalle?.materiasPrimas" class="flex justify-between items-center bg-stone-50 border border-stone-100 p-2.5 rounded-lg">
                <div>
                  <p class="text-xs font-semibold text-stone-700">{{ m.nombre }}</p>
                  <span class="text-[10px] text-stone-400 uppercase font-medium">Materia Prima</span>
                </div>
                <div class="text-right">
                  <p class="text-xs font-bold text-red-600">{{ m.stockActual | number }} {{ formatUnidadMedida(m.unidadMedida, m.stockActual) }}</p>
                  <span class="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded-full font-medium">Bajo</span>
                </div>
              </div>

              <!-- Component Base Alert items -->
              <div *ngFor="let c of metrics?.alertasDetalle?.componentesBases" class="flex justify-between items-center bg-stone-50 border border-stone-100 p-2.5 rounded-lg">
                <div>
                  <p class="text-xs font-semibold text-stone-700">{{ c.nombre }}</p>
                  <span class="text-[10px] text-stone-400 uppercase font-medium">Componente Base</span>
                </div>
                <div class="text-right">
                  <p class="text-xs font-bold text-red-600">{{ c.stockDisponible | number }} UND</p>
                  <span class="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded-full font-medium">Bajo</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Column: Last 5 Orders (2/3 size) -->
          <div class="lg:col-span-2 bg-white border border-stone-200 rounded-xl shadow-sm p-5 flex flex-col">
            <h4 class="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-3 flex items-center justify-between">
              <span class="flex items-center gap-2">
                <i class="fa-solid fa-clock-rotate-left text-brand-primary"></i>
                Últimos Pedidos
              </span>
              <span class="text-xs font-normal text-stone-400">Recientes</span>
            </h4>

            <div class="flex-1 mt-4 overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="text-stone-400 font-semibold border-b border-stone-100 uppercase tracking-wider">
                    <th class="pb-3">Cliente</th>
                    <th class="pb-3">Canal</th>
                    <th class="pb-3" *ngIf="isAdmin">Total</th>
                    <th class="pb-3">Estado</th>
                    <th class="pb-3 text-right">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngIf="metrics?.ultimosPedidos?.length === 0">
                    <td colspan="5" class="py-8 text-center text-stone-400">No hay pedidos registrados</td>
                  </tr>
                  <tr *ngFor="let ped of metrics?.ultimosPedidos" class="border-b border-stone-100/50 hover:bg-stone-50/50 transition-colors">
                    <td class="py-3.5 font-semibold text-stone-800">{{ ped.cliente }}</td>
                    <td class="py-3.5">
                      <span class="inline-flex items-center gap-1">
                        <i [class]="getChannelIcon(ped.canal)" class="text-[10px]"></i>
                        <span class="capitalize text-stone-600">{{ ped.canal | lowercase }}</span>
                      </span>
                    </td>
                    <td class="py-3.5 font-medium text-stone-700" *ngIf="isAdmin">
                      {{ ped.total | currency:'COP':'symbol-narrow':'1.0-0' }}
                    </td>
                    <td class="py-3.5">
                      <span 
                        [class.bg-amber-50]="ped.estado === 'POR_FABRICAR'"
                        [class.text-amber-700]="ped.estado === 'POR_FABRICAR'"
                        [class.border-amber-100]="ped.estado === 'POR_FABRICAR'"
                        [class.bg-blue-50]="ped.estado === 'EN_EMPAQUE'"
                        [class.text-blue-700]="ped.estado === 'EN_EMPAQUE'"
                        [class.border-blue-100]="ped.estado === 'EN_EMPAQUE'"
                        [class.bg-emerald-50]="ped.estado === 'ENTREGADO'"
                        [class.text-emerald-700]="ped.estado === 'ENTREGADO'"
                        [class.border-emerald-100]="ped.estado === 'ENTREGADO'"
                        class="inline-block px-2.5 py-0.5 border rounded-full text-[10px] font-semibold uppercase tracking-wider"
                      >
                        {{ formatEstado(ped.estado) }}
                      </span>
                    </td>
                    <td class="py-3.5 text-right text-stone-400">{{ ped.fecha | date:'shortDate' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Lower Grid: Breakdown Charts -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Sales By Channel -->
          <div class="bg-white border border-stone-200 rounded-xl shadow-sm p-5">
            <h4 class="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-3 flex items-center gap-2">
              <i class="fa-solid fa-share-nodes text-brand-primary"></i>
              Ventas por Canal de Adquisición
            </h4>
            
            <div class="mt-6 space-y-4">
              <div *ngIf="metrics?.ventasPorCanal?.length === 0" class="text-center py-8 text-stone-400 text-sm">
                Sin datos de ventas
              </div>
              <div *ngFor="let item of metrics?.ventasPorCanal" class="space-y-1.5">
                <div class="flex justify-between text-xs font-medium text-stone-600">
                  <span class="flex items-center gap-1.5">
                    <i [class]="getChannelIcon(item.canal)"></i>
                    <span class="capitalize">{{ item.canal | lowercase }}</span>
                  </span>
                  <span class="text-stone-400">
                    {{ item.cantidadPedidos }} pedidos 
                    <span *ngIf="isAdmin">({{ item.montoTotal | currency:'COP':'symbol-narrow':'1.0-0' }})</span>
                  </span>
                </div>
                <div class="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                  <div 
                    [style.width.%]="getPercentage(item.montoTotal, metrics.totalVentas)"
                    [class]="getChannelBarColor(item.canal)"
                    class="h-full rounded-full transition-all duration-500"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Orders by Status -->
          <div class="bg-white border border-stone-200 rounded-xl shadow-sm p-5">
            <h4 class="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-3 flex items-center gap-2">
              <i class="fa-solid fa-list-check text-brand-primary"></i>
              Pedidos por Estado Logístico
            </h4>

            <div class="mt-6 grid grid-cols-3 gap-4 text-center">
              <div class="bg-stone-50 border border-stone-100 p-4 rounded-xl">
                <p class="text-amber-600 text-lg font-bold">{{ getStatusCount('POR_FABRICAR') }}</p>
                <p class="text-[10px] font-semibold text-stone-400 uppercase mt-1">Por Fabricar</p>
              </div>
              <div class="bg-stone-50 border border-stone-100 p-4 rounded-xl">
                <p class="text-blue-600 text-lg font-bold">{{ getStatusCount('EN_EMPAQUE') }}</p>
                <p class="text-[10px] font-semibold text-stone-400 uppercase mt-1">En Empaque</p>
              </div>
              <div class="bg-stone-50 border border-stone-100 p-4 rounded-xl">
                <p class="text-emerald-600 text-lg font-bold">{{ getStatusCount('ENTREGADO') }}</p>
                <p class="text-[10px] font-semibold text-stone-400 uppercase mt-1">Entregados</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.4s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class DashboardComponent implements OnInit {
  metrics: any;
  loading = true;
  isAdmin = false;
  currentDate = new Date();

  constructor(private http: HttpClient, private authService: AuthService) {
    this.isAdmin = this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.loadMetrics();
  }

  loadMetrics(): void {
    this.loading = true;
    this.http.get<any>('http://localhost:3000/api/pedido/dashboard').subscribe({
      next: (res) => {
        this.metrics = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getPercentage(value: number, total: number): number {
    if (!total) return 0;
    return (value / total) * 100;
  }

  getChannelIcon(channel: string): string {
    switch (channel.toUpperCase()) {
      case 'WHATSAPP':
        return 'fa-brands fa-whatsapp text-emerald-500';
      case 'INSTAGRAM':
        return 'fa-brands fa-instagram text-pink-500';
      case 'TIKTOK':
        return 'fa-brands fa-tiktok text-stone-800';
      default:
        return 'fa-solid fa-globe text-blue-500';
    }
  }

  getChannelBarColor(channel: string): string {
    switch (channel.toUpperCase()) {
      case 'WHATSAPP':
        return 'bg-emerald-500';
      case 'INSTAGRAM':
        return 'bg-gradient-to-r from-pink-500 to-purple-500';
      case 'TIKTOK':
        return 'bg-stone-900';
      default:
        return 'bg-blue-500';
    }
  }

  getStatusCount(status: string): number {
    if (!this.metrics || !this.metrics.pedidosPorEstado) return 0;
    const match = this.metrics.pedidosPorEstado.find((item: any) => item.estado.toUpperCase() === status.toUpperCase());
    return match ? match.cantidad : 0;
  }

  formatEstado(estado: string): string {
    if (!estado) return '';
    return estado.replace(/_/g, ' ');
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

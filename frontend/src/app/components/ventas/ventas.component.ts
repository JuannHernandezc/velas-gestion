import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-stone-800 tracking-tight">Módulo de Ventas y Logística</h2>
          <p class="text-sm text-stone-500">Registro de pedidos, cotizaciones automáticas y flujo de fabricación.</p>
        </div>
        <button 
          (click)="openSaleModal()"
          class="bg-gradient-to-r from-brand-primary to-brand-light text-stone-950 font-semibold px-4 py-2.5 rounded-lg hover:shadow-md hover:shadow-brand-primary/10 transition-all flex items-center gap-2 cursor-pointer text-sm"
        >
          <i class="fa-solid fa-cart-plus text-xs"></i>
          <span>Registrar Nueva Venta</span>
        </button>
      </div>

      <!-- View Toggle Buttons -->
      <div class="bg-stone-200/60 p-1 rounded-xl flex gap-1 self-start w-fit">
        <button 
          (click)="viewMode = 'kanban'"
          [class.bg-white]="viewMode === 'kanban'"
          [class.text-stone-850]="viewMode === 'kanban'"
          [class.shadow-sm]="viewMode === 'kanban'"
          [class.text-stone-500]="viewMode !== 'kanban'"
          class="px-4 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer"
        >
          Tablero Kanban
        </button>
        <button 
          (click)="viewMode = 'historial'"
          [class.bg-white]="viewMode === 'historial'"
          [class.text-stone-850]="viewMode === 'historial'"
          [class.shadow-sm]="viewMode === 'historial'"
          [class.text-stone-500]="viewMode !== 'historial'"
          class="px-4 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer"
        >
          Historial de Pedidos
        </button>
      </div>

      <!-- Tab 1: Kanban Board -->
      <div *ngIf="viewMode === 'kanban'" class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
        <!-- Column 1: Por Fabricar -->
        <div class="bg-stone-100/80 border border-stone-200/60 rounded-xl p-4 flex flex-col min-h-[500px]">
          <div class="flex justify-between items-center pb-3 border-b border-stone-200">
            <span class="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <i class="fa-solid fa-fire text-xs animate-pulse"></i>
              Por Fabricar
            </span>
            <span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {{ getPedidosByEstado('POR_FABRICAR').length }}
            </span>
          </div>
          <div class="flex-1 mt-4 space-y-3 overflow-y-auto max-h-[600px] pr-1">
            <div *ngFor="let ped of getPedidosByEstado('POR_FABRICAR')" class="bg-white border border-stone-200 rounded-xl p-4 shadow-sm hover:border-amber-300 transition-all space-y-3 relative group">
              <div class="flex justify-between items-start gap-1">
                <div>
                  <span class="text-stone-400 font-mono text-[10px]">{{ formatId(ped.id) }}</span>
                  <h4 class="font-bold text-stone-800 text-sm tracking-tight leading-snug">{{ ped.cliente }}</h4>
                </div>
                <button *ngIf="isAdmin" (click)="deletePedido(ped.id)" class="text-stone-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer p-0.5"><i class="fa-solid fa-trash-can text-xs"></i></button>
              </div>
              <div class="flex justify-between items-center text-xs">
                <span class="inline-flex items-center gap-1 text-stone-500">
                  <i [class]="getChannelIcon(ped.canal)"></i>
                  <span class="capitalize text-[11px]">{{ ped.canal | lowercase }}</span>
                </span>
                <span class="font-semibold text-stone-700" *ngIf="isAdmin">
                  {{ ped.total | currency:'COP':'symbol-narrow':'1.0-0' }}
                </span>
              </div>
              
              <!-- State update trigger -->
              <button 
                (click)="updateEstado(ped.id, 'EN_EMPAQUE')"
                class="w-full bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold py-1.5 rounded-lg text-[11px] transition-colors flex items-center justify-center gap-1 border border-amber-100 cursor-pointer"
              >
                <span>Preparar e Iniciar Empaque</span>
                <i class="fa-solid fa-arrow-right text-[9px]"></i>
              </button>
            </div>
            <div *ngIf="getPedidosByEstado('POR_FABRICAR').length === 0" class="text-center py-12 text-stone-400 text-xs">
              <i class="fa-regular fa-square-check text-stone-300 text-2xl mb-1.5 block"></i> Sin pedidos en espera
            </div>
          </div>
        </div>

        <!-- Column 2: En Empaque -->
        <div class="bg-stone-100/80 border border-stone-200/60 rounded-xl p-4 flex flex-col min-h-[500px]">
          <div class="flex justify-between items-center pb-3 border-b border-stone-200">
            <span class="text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
              <i class="fa-solid fa-box text-xs"></i>
              En Empaque
            </span>
            <span class="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {{ getPedidosByEstado('EN_EMPAQUE').length }}
            </span>
          </div>
          <div class="flex-1 mt-4 space-y-3 overflow-y-auto max-h-[600px] pr-1">
            <div *ngFor="let ped of getPedidosByEstado('EN_EMPAQUE')" class="bg-white border border-stone-200 rounded-xl p-4 shadow-sm hover:border-blue-300 transition-all space-y-3 relative group">
              <div class="flex justify-between items-start gap-1">
                <div>
                  <span class="text-stone-400 font-mono text-[10px]">{{ formatId(ped.id) }}</span>
                  <h4 class="font-bold text-stone-800 text-sm tracking-tight leading-snug">{{ ped.cliente }}</h4>
                </div>
                <button *ngIf="isAdmin" (click)="deletePedido(ped.id)" class="text-stone-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer p-0.5"><i class="fa-solid fa-trash-can text-xs"></i></button>
              </div>
              <div class="flex justify-between items-center text-xs">
                <span class="inline-flex items-center gap-1 text-stone-500">
                  <i [class]="getChannelIcon(ped.canal)"></i>
                  <span class="capitalize text-[11px]">{{ ped.canal | lowercase }}</span>
                </span>
                <span class="font-semibold text-stone-700" *ngIf="isAdmin">
                  {{ ped.total | currency:'COP':'symbol-narrow':'1.0-0' }}
                </span>
              </div>

              <!-- State update actions -->
              <div class="flex gap-2">
                <button 
                  (click)="updateEstado(ped.id, 'POR_FABRICAR')"
                  class="flex-1 bg-stone-50 hover:bg-stone-100 text-stone-600 font-semibold py-1.5 rounded-lg text-[10px] border border-stone-200 transition-colors cursor-pointer"
                >
                  <i class="fa-solid fa-arrow-left text-[9px]"></i> Regresar
                </button>
                <button 
                  (click)="updateEstado(ped.id, 'ENTREGADO')"
                  class="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold py-1.5 rounded-lg text-[10px] border border-blue-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Entregado</span>
                  <i class="fa-solid fa-circle-check text-[10px]"></i>
                </button>
              </div>
            </div>
            <div *ngIf="getPedidosByEstado('EN_EMPAQUE').length === 0" class="text-center py-12 text-stone-400 text-xs">
              <i class="fa-solid fa-box-open text-stone-300 text-2xl mb-1.5 block"></i> Ningún pedido en empaque
            </div>
          </div>
        </div>

        <!-- Column 3: Entregado -->
        <div class="bg-stone-100/80 border border-stone-200/60 rounded-xl p-4 flex flex-col min-h-[500px]">
          <div class="flex justify-between items-center pb-3 border-b border-stone-200">
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <i class="fa-solid fa-circle-check text-xs"></i>
              Entregado
            </span>
            <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {{ getPedidosByEstado('ENTREGADO').length }}
            </span>
          </div>
          <div class="flex-1 mt-4 space-y-3 overflow-y-auto max-h-[600px] pr-1">
            <div *ngFor="let ped of getPedidosByEstado('ENTREGADO')" class="bg-white border border-stone-200 rounded-xl p-4 shadow-sm hover:border-emerald-300 transition-all space-y-3 relative group">
              <div class="flex justify-between items-start gap-1">
                <div>
                  <span class="text-stone-400 font-mono text-[10px]">{{ formatId(ped.id) }}</span>
                  <h4 class="font-bold text-stone-800 text-sm tracking-tight leading-snug">{{ ped.cliente }}</h4>
                </div>
                <button *ngIf="isAdmin" (click)="deletePedido(ped.id)" class="text-stone-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer p-0.5"><i class="fa-solid fa-trash-can text-xs"></i></button>
              </div>
              <div class="flex justify-between items-center text-xs">
                <span class="inline-flex items-center gap-1 text-stone-500">
                  <i [class]="getChannelIcon(ped.canal)"></i>
                  <span class="capitalize text-[11px]">{{ ped.canal | lowercase }}</span>
                </span>
                <span class="font-semibold text-stone-700" *ngIf="isAdmin">
                  {{ ped.total | currency:'COP':'symbol-narrow':'1.0-0' }}
                </span>
              </div>
              <button 
                (click)="updateEstado(ped.id, 'EN_EMPAQUE')"
                class="w-full bg-stone-50 hover:bg-stone-100 text-stone-600 font-semibold py-1.5 rounded-lg text-[10px] border border-stone-200 transition-colors cursor-pointer"
              >
                <i class="fa-solid fa-arrow-left text-[9px]"></i> Deshacer entrega
              </button>
            </div>
            <div *ngIf="getPedidosByEstado('ENTREGADO').length === 0" class="text-center py-12 text-stone-400 text-xs">
              <i class="fa-solid fa-truck-ramp-box text-stone-300 text-2xl mb-1.5 block"></i> No hay entregados hoy
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 2: Orders History Table -->
      <div *ngIf="viewMode === 'historial'" class="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden animate-fade-in">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="bg-stone-50 text-stone-400 font-semibold border-b border-stone-200 uppercase tracking-wider text-xs">
                <th class="px-6 py-4">ID</th>
                <th class="px-6 py-4">Cliente</th>
                <th class="px-6 py-4">Canal</th>
                <th class="px-6 py-4" *ngIf="isAdmin">Total</th>
                <th class="px-6 py-4" *ngIf="isAdmin">Rentabilidad</th>
                <th class="px-6 py-4">Estado</th>
                <th class="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="pedidos.length === 0">
                <td [attr.colspan]="isAdmin ? 7 : 5" class="px-6 py-12 text-center text-stone-400">
                  <i class="fa-solid fa-box-open text-3xl mb-2 block"></i> No hay pedidos registrados
                </td>
              </tr>
              <tr *ngFor="let ped of pedidos" class="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                <td class="px-6 py-4 font-mono text-stone-400 text-xs">{{ formatId(ped.id) }}</td>
                <td class="px-6 py-4 font-semibold text-stone-850">{{ ped.cliente }}</td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center gap-1.5">
                    <i [class]="getChannelIcon(ped.canal)" class="text-xs"></i>
                    <span class="capitalize text-stone-600">{{ ped.canal | lowercase }}</span>
                  </span>
                </td>
                <td class="px-6 py-4 font-medium text-stone-700" *ngIf="isAdmin">
                  {{ ped.total | currency:'COP':'symbol-narrow':'1.0-0' }}
                </td>
                <td class="px-6 py-4" *ngIf="isAdmin">
                  <div class="text-xs">
                    <p class="font-bold text-emerald-600">{{ ped.rentabilidad | currency:'COP':'symbol-narrow':'1.0-0' }}</p>
                    <p class="text-[10px] text-stone-400">M: {{ (ped.rentabilidad / ped.total) * 100 | number:'1.0-1' }}%</p>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span 
                    [class.bg-amber-50]="ped.estado === 'POR_FABRICAR'"
                    [class.text-amber-700]="ped.estado === 'POR_FABRICAR'"
                    [class.bg-blue-50]="ped.estado === 'EN_EMPAQUE'"
                    [class.text-blue-700]="ped.estado === 'EN_EMPAQUE'"
                    [class.bg-emerald-50]="ped.estado === 'ENTREGADO'"
                    [class.text-emerald-700]="ped.estado === 'ENTREGADO'"
                    class="inline-block px-2.5 py-0.5 border rounded-full text-[10px] font-semibold uppercase tracking-wider"
                  >
                    {{ formatEstado(ped.estado) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end gap-2">
                    <button 
                      (click)="viewDetails(ped)"
                      class="p-1.5 text-stone-400 hover:text-brand-primary rounded-lg transition-colors cursor-pointer"
                      title="Ver Detalles"
                    >
                      <i class="fa-solid fa-eye text-sm"></i>
                    </button>
                    <button 
                      *ngIf="isAdmin"
                      (click)="deletePedido(ped.id)"
                      class="p-1.5 text-stone-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <i class="fa-solid fa-trash-can text-sm"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal 1: Register New Sale / Order -->
      <div *ngIf="isSaleModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm">
        <div class="w-full max-w-xl bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden animate-zoom-in flex flex-col max-h-[90vh]">
          <!-- Modal Header -->
          <div class="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
            <h3 class="font-bold text-stone-800">Registrar Venta</h3>
            <button (click)="closeSaleModal()" class="text-stone-400 hover:text-stone-600 cursor-pointer"><i class="fa-solid fa-xmark text-lg"></i></button>
          </div>

          <!-- Modal Body / Form -->
          <form (ngSubmit)="saveSale()" class="p-6 space-y-4 overflow-y-auto flex-1">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="saleCliente" class="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Nombre del Cliente</label>
                <input type="text" id="saleCliente" name="saleCliente" [(ngModel)]="saleForm.cliente" required placeholder="Ej. Ana Martinez" class="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-sm text-stone-800 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors" />
              </div>
              <div>
                <label for="saleCanal" class="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Canal de Ventas</label>
                <select id="saleCanal" name="saleCanal" [(ngModel)]="saleForm.canal" required class="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-sm text-stone-800 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors">
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="TIKTOK">TikTok</option>
                  <option value="OTRO">Otro Canal</option>
                </select>
              </div>
            </div>

            <!-- Items section -->
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wider">Productos Vendidos</label>
                <button type="button" (click)="addSaleItemRow()" class="text-brand-primary text-xs hover:underline flex items-center gap-1 cursor-pointer font-semibold">
                  <i class="fa-solid fa-plus text-[10px]"></i>
                  <span>Agregar Producto</span>
                </button>
              </div>

              <!-- Item rows -->
              <div class="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                <div *ngFor="let item of saleForm.detalles; let i = index" class="flex gap-2 items-center">
                  <select 
                    name="prod_{{i}}" 
                    [(ngModel)]="item.catalogoProductoId" 
                    (change)="onProductChange()"
                    required 
                    class="flex-1 bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs text-stone-800 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors"
                  >
                    <option [value]="0" disabled selected>Selecciona producto</option>
                    <option *ngFor="let p of catalog" [value]="p.id">{{ p.nombre }} ({{ p.precioVenta | currency:'COP':'symbol-narrow':'1.0-0' }})</option>
                  </select>
                  <input 
                    type="number" 
                    name="qty_{{i}}" 
                    [(ngModel)]="item.cantidad" 
                    (input)="onProductChange()"
                    required 
                    min="1" 
                    placeholder="Cant." 
                    class="w-20 bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs text-stone-800 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors" 
                  />
                  <button type="button" (click)="removeSaleItemRow(i)" class="p-2 text-stone-400 hover:text-red-500 transition-colors cursor-pointer"><i class="fa-solid fa-trash-can text-sm"></i></button>
                </div>
              </div>
            </div>

            <!-- Auto Profitability Quotation (Visible to Admin Only) -->
            <div *ngIf="isAdmin" class="bg-stone-50 border border-stone-200 rounded-xl p-4 mt-4 space-y-2.5">
              <h4 class="text-xs font-bold text-stone-700 uppercase tracking-wider">Cotizador de Rentabilidad Automático</h4>
              
              <div class="grid grid-cols-3 gap-4 text-center">
                <div class="bg-white border border-stone-100 p-2.5 rounded-lg shadow-sm">
                  <p class="text-[10px] font-semibold text-stone-450 uppercase">Precio Total</p>
                  <p class="text-sm font-bold text-stone-800 mt-0.5">{{ quotation.total | currency:'COP':'symbol-narrow':'1.0-0' }}</p>
                </div>
                <div class="bg-white border border-stone-100 p-2.5 rounded-lg shadow-sm">
                  <p class="text-[10px] font-semibold text-stone-450 uppercase">Costo Producción</p>
                  <p class="text-sm font-bold text-stone-800 mt-0.5">{{ quotation.costoTotal | currency:'COP':'symbol-narrow':'1.0-0' }}</p>
                </div>
                <div class="bg-white border border-stone-100 p-2.5 rounded-lg shadow-sm">
                  <p class="text-[10px] font-semibold text-stone-450 uppercase">Ganancia Neta</p>
                  <p class="text-sm font-bold text-emerald-600 mt-0.5">{{ quotation.rentabilidad | currency:'COP':'symbol-narrow':'1.0-0' }}</p>
                </div>
              </div>

              <div class="flex justify-between items-center text-xs px-1.5 pt-1.5 border-t border-stone-200/50">
                <span class="text-stone-500 font-medium">Margen Esperado:</span>
                <span 
                  [class.text-red-600]="quotation.margen < 20"
                  [class.text-amber-600]="quotation.margen >= 20 && quotation.margen < 45"
                  [class.text-emerald-600]="quotation.margen >= 45"
                  class="font-bold text-sm"
                >
                  {{ quotation.margen | number:'1.0-1' }}%
                </span>
              </div>
            </div>

            <!-- Footer buttons -->
            <div class="pt-4 border-t border-stone-100 flex justify-end gap-2 shrink-0">
              <button type="button" (click)="closeSaleModal()" class="border border-stone-200 text-stone-600 px-4 py-2 rounded-lg text-sm hover:bg-stone-50 transition-colors cursor-pointer">Cancelar</button>
              <button type="submit" class="bg-gradient-to-r from-brand-primary to-brand-light text-stone-950 font-semibold px-4 py-2 rounded-lg text-sm transition-all cursor-pointer">Registrar Venta</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal 2: View Order Details -->
      <div *ngIf="isDetailsModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm">
        <div class="w-full max-w-md bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden animate-zoom-in">
          <div class="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
            <h3 class="font-bold text-stone-800">Detalles del Pedido {{ formatId(selectedPed?.id) }}</h3>
            <button (click)="closeDetailsModal()" class="text-stone-400 hover:text-stone-600 cursor-pointer"><i class="fa-solid fa-xmark text-lg"></i></button>
          </div>

          <div class="p-6 space-y-5">
            <!-- Client & Meta Info -->
            <div class="space-y-1 bg-stone-50 border border-stone-150 p-4 rounded-xl text-xs">
              <p class="flex justify-between"><span class="text-stone-400 font-medium">Cliente:</span> <span class="font-bold text-stone-800">{{ selectedPed?.cliente }}</span></p>
              <p class="flex justify-between"><span class="text-stone-400 font-medium">Fecha:</span> <span class="text-stone-600">{{ selectedPed?.fecha | date:'mediumDate' }}</span></p>
              <p class="flex justify-between"><span class="text-stone-400 font-medium">Canal de Ventas:</span> <span class="capitalize text-stone-600">{{ selectedPed?.canal | lowercase }}</span></p>
              <p class="flex justify-between items-center"><span class="text-stone-400 font-medium">Estado:</span> 
                <span class="bg-stone-200/80 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-stone-600">
                  {{ formatEstado(selectedPed?.estado) }}
                </span>
              </p>
            </div>

            <!-- Items sold -->
            <div class="space-y-2">
              <h4 class="text-xs font-bold text-stone-500 uppercase tracking-wider">Artículos del Pedido</h4>
              <ul class="space-y-2 text-xs">
                <li *ngFor="let det of selectedPed?.detalles" class="flex justify-between items-center bg-stone-50 border border-stone-100 p-2.5 rounded-lg">
                  <div>
                    <p class="font-bold text-stone-750">{{ det.catalogoProducto?.nombre }}</p>
                    <p class="text-[10px] text-stone-400">Cantidad: {{ det.cantidad }} x {{ det.precioUnitario | currency:'COP':'symbol-narrow':'1.0-0' }}</p>
                  </div>
                  <span class="font-semibold text-stone-700">
                    {{ det.cantidad * det.precioUnitario | currency:'COP':'symbol-narrow':'1.0-0' }}
                  </span>
                </li>
              </ul>
            </div>

            <!-- Financial totals (visible to Admin only) -->
            <div *ngIf="isAdmin" class="border-t border-stone-100 pt-4 text-xs space-y-1.5 font-medium">
              <p class="flex justify-between"><span class="text-stone-400">Costo total de producción:</span> <span class="text-stone-700 font-semibold">{{ selectedPed?.costoTotal | currency:'COP':'symbol-narrow':'1.0-0' }}</span></p>
              <p class="flex justify-between text-sm"><span class="text-stone-800 font-bold">Ingreso Neto:</span> <span class="text-stone-900 font-bold">{{ selectedPed?.total | currency:'COP':'symbol-narrow':'1.0-0' }}</span></p>
              <p class="flex justify-between text-emerald-700 font-semibold pt-1 border-t border-dashed border-stone-150"><span class="font-bold">Ganancia Neta (Rentabilidad):</span> <span class="font-bold">{{ selectedPed?.rentabilidad | currency:'COP':'symbol-narrow':'1.0-0' }}</span></p>
            </div>
          </div>
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
export class VentasComponent implements OnInit {
  viewMode = 'kanban';
  pedidos: any[] = [];
  catalog: any[] = [];
  isAdmin = false;

  // New Sale modal Form
  isSaleModalOpen = false;
  saleForm = {
    cliente: '',
    canal: 'WHATSAPP',
    detalles: [] as { catalogoProductoId: number; cantidad: number }[]
  };

  // Quotation metrics
  quotation = {
    total: 0,
    costoTotal: 0,
    rentabilidad: 0,
    margen: 0
  };

  // Details Modal
  isDetailsModalOpen = false;
  selectedPed: any = null;

  constructor(private http: HttpClient, private authService: AuthService) {
    this.isAdmin = this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.http.get<any[]>('http://localhost:3000/api/pedido').subscribe(res => this.pedidos = res);
    this.http.get<any[]>('http://localhost:3000/api/catalogo').subscribe(res => this.catalog = res);
  }

  getPedidosByEstado(estado: string): any[] {
    return this.pedidos.filter(p => p.estado.toUpperCase() === estado.toUpperCase());
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

  formatEstado(estado: string): string {
    if (!estado) return '';
    return estado.replace(/_/g, ' ');
  }

  updateEstado(id: number, nuevoEstado: string): void {
    this.http.put(`http://localhost:3000/api/pedido/${id}/estado`, { estado: nuevoEstado }).subscribe({
      next: () => this.loadData(),
      error: (err) => alert(err.error?.message || 'Error al actualizar estado')
    });
  }

  deletePedido(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este pedido? Se restaurarán los stocks de componentes.')) {
      this.http.delete(`http://localhost:3000/api/pedido/${id}`).subscribe({
        next: () => this.loadData(),
        error: (err) => alert(err.error?.message || 'Error al eliminar')
      });
    }
  }

  // Sale Modal handling
  openSaleModal(): void {
    this.saleForm = {
      cliente: '',
      canal: 'WHATSAPP',
      detalles: []
    };
    this.quotation = { total: 0, costoTotal: 0, rentabilidad: 0, margen: 0 };
    this.addSaleItemRow();
    this.isSaleModalOpen = true;
  }

  closeSaleModal(): void {
    this.isSaleModalOpen = false;
  }

  addSaleItemRow(): void {
    this.saleForm.detalles.push({ catalogoProductoId: 0, cantidad: 1 });
    this.onProductChange();
  }

  removeSaleItemRow(index: number): void {
    this.saleForm.detalles.splice(index, 1);
    this.onProductChange();
  }

  // Automatically calculate expected profitability on product / quantity change
  onProductChange(): void {
    if (!this.isAdmin) return;

    let total = 0;
    let costoTotal = 0;

    for (const item of this.saleForm.detalles) {
      if (item.catalogoProductoId > 0 && item.cantidad > 0) {
        const prod = this.catalog.find(p => p.id === Number(item.catalogoProductoId));
        if (prod) {
          total += prod.precioVenta * item.cantidad;
          
          // Calculate cost based on assemblies
          let prodCost = 0;
          if (prod.requiereEnsamble && prod.ensambles) {
            for (const ens of prod.ensambles) {
              prodCost += (ens.componenteBase?.costoProduccion || 0) * ens.cantidadNecesaria;
            }
          }
          costoTotal += prodCost * item.cantidad;
        }
      }
    }

    const rentabilidad = total - costoTotal;
    const margen = total > 0 ? (rentabilidad / total) * 100 : 0;

    this.quotation = { total, costoTotal, rentabilidad, margen };
  }

  saveSale(): void {
    const validItems = this.saleForm.detalles.filter(d => d.catalogoProductoId > 0 && d.cantidad > 0);
    if (validItems.length === 0) {
      alert('Debes agregar al menos un producto válido.');
      return;
    }

    const payload = {
      cliente: this.saleForm.cliente,
      canal: this.saleForm.canal,
      detalles: validItems.map(item => ({
        catalogoProductoId: Number(item.catalogoProductoId),
        cantidad: Number(item.cantidad)
      }))
    };

    this.http.post('http://localhost:3000/api/pedido', payload).subscribe({
      next: () => {
        this.loadData();
        this.closeSaleModal();
      },
      error: (err) => {
        alert(err.error?.message || 'Error al guardar la venta. Verifica el stock disponible.');
      }
    });
  }

  // Details Modal
  viewDetails(ped: any): void {
    this.selectedPed = ped;
    this.isDetailsModalOpen = true;
  }

  closeDetailsModal(): void {
    this.isDetailsModalOpen = false;
    this.selectedPed = null;
  }

  formatId(id: number): string {
    if (!id) return '';
    return 'PE-' + String(id).padStart(3, '0');
  }
}

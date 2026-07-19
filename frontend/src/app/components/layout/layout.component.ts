import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex bg-stone-50 text-stone-900 font-sans">
      <!-- Sidebar Navigation -->
      <aside 
        [class.translate-x-0]="isSidebarOpen" 
        [class.-translate-x-full]="!isSidebarOpen"
        class="fixed inset-y-0 left-0 z-30 w-64 bg-stone-900 border-r border-stone-800 text-stone-300 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col justify-between"
      >
        <div>
          <!-- Sidebar Header / Logo -->
          <div class="h-16 flex items-center gap-3 px-6 border-b border-stone-800">
            <div class="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center">
              <i class="fa-solid fa-fire text-stone-950 text-sm"></i>
            </div>
            <div>
              <h1 class="font-bold text-brand-primary tracking-wide text-lg">AuraSolar</h1>
              <p class="text-[10px] text-stone-500 uppercase tracking-widest leading-none">Velas Premium</p>
            </div>
          </div>

          <!-- User Quick Info -->
          <div class="px-6 py-4 border-b border-stone-800/40 bg-stone-950/20">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center border border-brand-primary/20 text-brand-primary">
                <i class="fa-solid fa-user-tie text-lg"></i>
              </div>
              <div class="overflow-hidden">
                <p class="font-medium text-stone-200 truncate text-sm">{{ user?.nombre }}</p>
                <span 
                  [ngClass]="user?.rol === 'ADMIN' ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' : 'bg-stone-800 text-stone-400 border-stone-700'"
                  class="inline-block text-[9px] uppercase tracking-wider font-semibold border rounded-full px-2 py-0.5 mt-0.5"
                >
                  {{ user?.rol === 'ADMIN' ? 'Administrador' : 'Operativo' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Nav Menu -->
          <nav class="mt-6 px-4 space-y-1">
            <a 
              routerLink="/dashboard" 
              routerLinkActive="bg-brand-primary/10 text-brand-primary border-l-2 border-brand-primary" 
              class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 transition-colors"
            >
              <i class="fa-solid fa-chart-pie w-5 text-center"></i>
              <span>Dashboard</span>
            </a>

            <a 
              routerLink="/inventario" 
              routerLinkActive="bg-brand-primary/10 text-brand-primary border-l-2 border-brand-primary" 
              class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 transition-colors"
            >
              <i class="fa-solid fa-boxes-stacked w-5 text-center"></i>
              <span>Materia Prima</span>
            </a>

            <a 
              routerLink="/fabricacion" 
              routerLinkActive="bg-brand-primary/10 text-brand-primary border-l-2 border-brand-primary" 
              class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 transition-colors"
            >
              <i class="fa-solid fa-hammer w-5 text-center"></i>
              <span>Fabricación</span>
            </a>

            <a 
              routerLink="/ventas" 
              routerLinkActive="bg-brand-primary/10 text-brand-primary border-l-2 border-brand-primary" 
              class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 transition-colors"
            >
              <i class="fa-solid fa-cart-shopping w-5 text-center"></i>
              <span>Ventas e Historial</span>
            </a>
          </nav>
        </div>

        <!-- Logout Bottom Button -->
        <div class="p-4 border-t border-stone-800">
          <button 
            (click)="logout()" 
            class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors cursor-pointer"
          >
            <i class="fa-solid fa-right-from-bracket w-5 text-center"></i>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <!-- Sidebar Backdrop on Mobile -->
      <div 
        *ngIf="isSidebarOpen" 
        (click)="isSidebarOpen = false" 
        class="fixed inset-0 z-20 bg-stone-950/60 backdrop-blur-sm md:hidden"
      ></div>

      <!-- Main Panel Context -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Header -->
        <header class="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-6 z-10 shrink-0">
          <div class="flex items-center gap-4">
            <button 
              (click)="isSidebarOpen = !isSidebarOpen" 
              class="text-stone-500 hover:text-stone-700 md:hidden focus:outline-none cursor-pointer"
            >
              <i class="fa-solid fa-bars text-xl"></i>
            </button>
            <h2 class="text-lg font-semibold text-stone-800 uppercase tracking-wide hidden sm:block">
              Gestión Integral de Velas
            </h2>
          </div>
          
          <div class="flex items-center gap-4">
            <div class="text-right text-xs text-stone-500 hidden md:block">
              <span class="font-medium text-stone-700">AuraSolar v1.0</span>
              <span class="mx-2">•</span>
              <span>Conectado</span>
            </div>
            <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
        </header>

        <!-- Main Body Scroll Context -->
        <main class="flex-1 overflow-y-auto p-6">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: []
})
export class LayoutComponent {
  isSidebarOpen = false;
  user: any;

  constructor(private authService: AuthService) {
    this.user = this.authService.getUser();
  }

  logout(): void {
    this.authService.logout();
  }
}

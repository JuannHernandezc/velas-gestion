import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-stone-900 relative overflow-hidden px-4">
      <!-- Glow background blobs -->
      <div class="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-primary opacity-10 blur-3xl animate-pulse"></div>
      <div class="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-brand-light opacity-10 blur-3xl animate-pulse"></div>

      <div class="w-full max-w-md bg-stone-900/60 backdrop-blur-md border border-stone-800 rounded-2xl shadow-2xl p-8 relative z-10">
        <!-- Logo -->
        <div class="flex flex-col items-center mb-8">
          <div class="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-dark to-brand-primary flex items-center justify-center mb-3 shadow-lg relative">
            <i class="fa-solid fa-fire text-stone-950 text-2xl animate-bounce"></i>
            <div class="absolute inset-0 rounded-full border border-brand-light/30 animate-ping"></div>
          </div>
          <h2 class="text-3xl font-semibold text-brand-primary tracking-wide">AuraSolar</h2>
          <p class="text-stone-400 text-sm mt-1">Gestión de Velas Artesanales</p>
        </div>

        <!-- Error Alert -->
        <div *ngIf="errorMsg" class="mb-5 bg-red-950/40 border border-red-500/30 text-red-300 rounded-lg p-3 text-sm flex items-center gap-2">
          <i class="fa-solid fa-circle-exclamation text-red-500"></i>
          <span>{{ errorMsg }}</span>
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="space-y-5">
          <div>
            <label for="username" class="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">Usuario</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-500">
                <i class="fa-solid fa-user"></i>
              </span>
              <input 
                type="text" 
                id="username" 
                name="username" 
                [(ngModel)]="credentials.username" 
                required 
                placeholder="Ingresa tu usuario"
                class="w-full bg-stone-950/50 border border-stone-800 rounded-lg py-2.5 pl-10 pr-4 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors text-sm"
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">Contraseña</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-500">
                <i class="fa-solid fa-lock"></i>
              </span>
              <input 
                type="password" 
                id="password" 
                name="password" 
                [(ngModel)]="credentials.password" 
                required 
                placeholder="Ingresa tu contraseña"
                class="w-full bg-stone-950/50 border border-stone-800 rounded-lg py-2.5 pl-10 pr-4 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors text-sm"
              />
            </div>
          </div>

          <button 
            type="submit" 
            [disabled]="loading || !loginForm.form.valid"
            class="w-full bg-gradient-to-r from-brand-primary to-brand-light text-stone-950 font-medium py-2.5 rounded-lg hover:from-brand-light hover:to-brand-primary transition-all duration-300 shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span *ngIf="loading" class="animate-spin inline-block w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full"></span>
            <span>{{ loading ? 'Iniciando sesión...' : 'Ingresar al sistema' }}</span>
            <i *ngIf="!loading" class="fa-solid fa-arrow-right text-xs"></i>
          </button>
        </form>

        <!-- Credentials Helper Info for User -->
        <div *ngIf="isLocal" class="mt-8 pt-6 border-t border-stone-800/60 text-center">
          <p class="text-stone-500 text-xs">Cuentas de prueba:</p>
          <div class="flex justify-center gap-4 mt-2 text-stone-400 text-xs">
            <div>
              <span class="text-brand-primary font-semibold">Admin:</span> admin / admin123
            </div>
            <div>
              <span class="text-brand-primary font-semibold">Operativo:</span> operative / operative123
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent {
  credentials = { username: '', password: '' };
  errorMsg = '';
  loading = false;
  isLocal = false;

  constructor(private authService: AuthService, private router: Router) {
    this.isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  onSubmit(): void {
    if (!this.credentials.username || !this.credentials.password) return;
    
    this.loading = true;
    this.errorMsg = '';
    
    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Error de conexión con el servidor';
      }
    });
  }
}

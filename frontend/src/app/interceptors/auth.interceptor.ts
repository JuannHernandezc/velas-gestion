import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Cambia esta URL por la que te asigne Railway para tu backend:
const PRODUCTION_BACKEND_URL = 'https://velas-gestion-backend-production.up.railway.app';


export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // Detectamos si la aplicación corre en local o en producción
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  let targetUrl = req.url;

  // Si estamos en producción, reescribimos automáticamente las peticiones locales
  if (!isLocal && targetUrl.includes('http://localhost:3000')) {
    targetUrl = targetUrl.replace('http://localhost:3000', PRODUCTION_BACKEND_URL);
  }

  const headers: any = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cloned = req.clone({
    url: targetUrl,
    setHeaders: headers
  });

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      // Un 401 en una petición protegida indica que la sesión dejó de ser válida.
      // La respuesta de login debe conservarse para poder mostrar sus credenciales inválidas.
      if (error.status === 401 && !targetUrl.includes('/auth/login')) {
        authService.clearSession();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};

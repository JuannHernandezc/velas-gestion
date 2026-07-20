import { HttpInterceptorFn } from '@angular/common/http';

// Cambia esta URL por la que te asigne Railway para tu backend:
const PRODUCTION_BACKEND_URL = 'velas-gestion-backend-production.up.railway.app';


export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

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

  return next(cloned);
};

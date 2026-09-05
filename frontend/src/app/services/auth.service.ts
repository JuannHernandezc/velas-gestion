import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.restoreSession();
  }

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(res => {
        if (res && res.access_token) {
          localStorage.setItem('token', res.access_token);
          localStorage.setItem('user', JSON.stringify(res.user));
          this.currentUserSubject.next(res.user);
        }
      })
    );
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const hasValidSession = !!token && !!this.currentUserSubject.value && !this.isTokenExpired(token);

    if (!hasValidSession) {
      this.clearSession();
    }

    return hasValidSession;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  getUser(): any {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user && user.rol === 'ADMIN';
  }

  isOperative(): boolean {
    const user = this.getUser();
    return user && user.rol === 'OPERATIVO';
  }

  private restoreSession(): void {
    const token = this.getToken();
    const savedUser = localStorage.getItem('user');

    if (!token || !savedUser || this.isTokenExpired(token)) {
      this.clearSession();
      return;
    }

    try {
      this.currentUserSubject.next(JSON.parse(savedUser));
    } catch {
      // Evita que un dato corrupto en localStorage deje la aplicación en blanco.
      this.clearSession();
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }
}

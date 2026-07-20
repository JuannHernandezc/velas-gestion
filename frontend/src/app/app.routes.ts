import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { LayoutComponent } from './components/layout/layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MateriaPrimaComponent } from './components/materia-prima/materia-prima.component';
import { FabricacionComponent } from './components/fabricacion/fabricacion.component';
import { VentasComponent } from './components/ventas/ventas.component';
import { ContabilidadComponent } from './components/contabilidad/contabilidad.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'inventario', component: MateriaPrimaComponent },
      { path: 'fabricacion', component: FabricacionComponent },
      { path: 'ventas', component: VentasComponent },
      { path: 'contabilidad', component: ContabilidadComponent },
    ]
  },
  { path: '**', redirectTo: '' }
];

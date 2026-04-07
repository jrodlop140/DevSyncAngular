import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './guards/auth.guard';
import { ProjectFormComponent } from './pages/project-form/project-form.component';
import { ProjectsComponent } from './pages/projects/projects.component';
import { ProjectDetailComponent } from './pages/project-detail/project-detail.component';
import { RequestsComponent } from './pages/requests/requests.component';

/**
 * Configuración principal de rutas de la aplicación.
 */
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'projects', component: ProjectsComponent, canActivate: [authGuard] },
  { path: 'projects/new', component: ProjectFormComponent, canActivate: [authGuard] },
  { path: 'projects/edit/:id', component: ProjectFormComponent, canActivate: [authGuard] },
  { path: 'projects/:id', component: ProjectDetailComponent, canActivate: [authGuard] },
  { path: 'requests', component: RequestsComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login', pathMatch: 'full' }
];
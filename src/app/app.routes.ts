import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './guards/auth.guard';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProjectDetailComponent } from './pages/project-detail/project-detail.component';
import { ProjectFormComponent } from './pages/project-form/project-form.component';
import { ProjectsComponent } from './pages/projects/projects.component';
import { RequestsComponent } from './pages/requests/requests.component';
import { TasksComponent } from './pages/tasks/tasks.component';
import { TaskFormComponent } from './pages/task-form/task-form.component';

/**
 * Configuración principal de rutas de la aplicación.
 */
export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'projects', component: ProjectsComponent },
      { path: 'projects/new', component: ProjectFormComponent },
      { path: 'projects/edit/:id', component: ProjectFormComponent },
      { path: 'projects/:id', component: ProjectDetailComponent },
      { path: 'requests', component: RequestsComponent },
      { path: 'tasks', component: TasksComponent },
      { path: 'tasks/new', component: TaskFormComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: 'login', pathMatch: 'full' }
];
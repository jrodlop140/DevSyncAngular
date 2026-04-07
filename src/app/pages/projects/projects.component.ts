import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project.model';

/**
 * Página de proyectos.
 * Muestra los proyectos creados por el usuario autenticado.
 */
@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css'
})
export class ProjectsComponent implements OnInit, OnDestroy {

  private authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private router = inject(Router);

  projects: Project[] = [];
  loading: boolean = true;
  errorMessage: string = '';

  private subscription?: Subscription;

  /**
   * Inicializa la carga de proyectos del usuario autenticado.
   */
  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      this.loading = false;
      this.errorMessage = 'No hay usuario autenticado.';
      return;
    }

    this.subscription = this.projectService
      .getProjectsByCreator(currentUser.uid)
      .subscribe({
        next: (projects) => {
          this.projects = projects;
          this.loading = false;
        },
        error: () => {
          this.errorMessage = 'No se pudieron cargar los proyectos.';
          this.loading = false;
        }
      });
  }

  /**
   * Libera la suscripción al destruir el componente.
   */
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /**
   * Obtiene el número de participantes de un proyecto.
   * @param project proyecto a consultar
   * @return número de participantes
   */
  getParticipantCount(project: Project): number {
    return Object.keys(project.participants || {}).length;
  }

  /**
   * Navega al formulario de creación de proyecto.
   * @return promesa de navegación
   */
  async goToCreateProject(): Promise<void> {
    await this.router.navigateByUrl('/projects/new');
  }

  /**
   * Navega al formulario de edición del proyecto.
   * @param projectId identificador del proyecto
   * @return promesa de navegación
   */
  async goToEditProject(projectId: string): Promise<void> {
    await this.router.navigateByUrl(`/projects/edit/${projectId}`);
  }

  /**
   * Elimina un proyecto si el usuario confirma la operación.
   * @param projectId identificador del proyecto
   * @return promesa de ejecución
   */
  async deleteProject(projectId: string): Promise<void> {
    const confirmed = window.confirm('¿Seguro que deseas eliminar este proyecto?');

    if (!confirmed) {
      return;
    }

    try {
      await this.projectService.deleteProject(projectId);
    } catch {
      this.errorMessage = 'No se pudo eliminar el proyecto.';
    }
  }
}
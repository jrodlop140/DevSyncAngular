import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { UserService } from '../../services/user.service';
import { Project } from '../../models/project.model';

/**
 * Página de detalle de proyecto.
 * Muestra la información completa de un proyecto concreto.
 */
@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.css'
})
export class ProjectDetailComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private userService = inject(UserService);

  project: Project | null = null;
  loading: boolean = true;
  errorMessage: string = '';

  creatorName: string = '';
  participantNames: string[] = [];

  /**
   * Inicializa la carga del proyecto a partir del parámetro id.
   */
  ngOnInit(): void {
    this.route.paramMap.subscribe(async (params) => {
      const projectId = params.get('id');

      if (!projectId) {
        this.loading = false;
        this.errorMessage = 'No project has been specified.';
        return;
      }

      try {
        this.loading = true;
        this.errorMessage = '';

        const project = await this.projectService.getProjectById(projectId);

        if (!project) {
          this.errorMessage = 'Project not found.';
          this.loading = false;
          return;
        }

        this.project = project;

        await this.loadCreatorName();
        await this.loadParticipantNames();
      } catch {
        this.errorMessage = 'Could not load the project.';
      } finally {
        this.loading = false;
      }
    });
  }

  /**
   * Carga el nombre del creador del proyecto.
   * @return promesa de ejecución
   */
  async loadCreatorName(): Promise<void> {
    if (!this.project?.creator) {
      this.creatorName = 'Unknown';
      return;
    }

    const creator = await this.userService.getUserById(this.project.creator);
    this.creatorName = creator?.name || this.project.creator;
  }

  /**
   * Carga los nombres de los participantes del proyecto.
   * @return promesa de ejecución
   */
  async loadParticipantNames(): Promise<void> {
    const participantIds = Object.keys(this.project?.participants || {});
    const names: string[] = [];

    for (const participantId of participantIds) {
      const user = await this.userService.getUserById(participantId);
      names.push(user?.name || participantId);
    }

    this.participantNames = names;
  }

  /**
   * Obtiene el número de participantes del proyecto.
   * @return número de participantes
   */
  getParticipantCount(): number {
    return Object.keys(this.project?.participants || {}).length;
  }

  /**
   * Formatea un timestamp en una fecha legible.
   * @param timestamp fecha en milisegundos
   * @return fecha formateada
   */
  formatDate(timestamp: number): string {
    if (!timestamp) {
      return '';
    }

    return new Date(timestamp).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Vuelve al listado de proyectos.
   * @return promesa de navegación
   */
  async goBack(): Promise<void> {
    await this.router.navigateByUrl('/projects');
  }
}
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';
import { RequestService } from '../../services/request.service';
import { UserService } from '../../services/user.service';
import { Project } from '../../models/project.model';
import { Request } from '../../models/request.model';
import { RequestState } from '../../enums/request-state.enum';

/**
 * Página de solicitudes.
 * Muestra las solicitudes de los proyectos creados por el usuario autenticado.
 */
@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './requests.component.html',
  styleUrl: './requests.component.css'
})
export class RequestsComponent implements OnInit, OnDestroy {

  private authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private requestService = inject(RequestService);
  private userService = inject(UserService);

  requests: Request[] = [];
  loading: boolean = true;
  errorMessage: string = '';

  projectNames: Record<string, string> = {};
  userNames: Record<string, string> = {};
  userEmails: Record<string, string> = {};
  userSkills: Record<string, string[]> = {};
  userPhotos: Record<string, string> = {};

  private requestsSubscription?: Subscription;
  private projectsSubscription?: Subscription;

  /**
   * Inicializa la carga de solicitudes.
   */
  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      this.loading = false;
      this.errorMessage = 'No authenticated user.';
      return;
    }

    this.projectsSubscription = this.projectService
      .getProjectsByCreator(currentUser.uid)
      .subscribe({
        next: async (projects) => {
          const myProjectIds = projects.map(project => project.id);

          this.projectNames = {};
          for (const project of projects) {
            this.projectNames[project.id] = project.name;
          }

          this.loadRequests(myProjectIds);
        },
        error: () => {
          this.loading = false;
          this.errorMessage = 'Could not load the projects.';
        }
      });
  }

  /**
   * Carga las solicitudes de los proyectos indicados.
   * @param projectIds identificadores de proyectos del usuario
   */
  loadRequests(projectIds: string[]): void {
    this.requestsSubscription = this.requestService
      .getAllRequests()
      .subscribe({
        next: async (requests) => {
          this.requests = requests
            .filter(request => projectIds.includes(request.projectId))
            .sort((a, b) => b.createdAt - a.createdAt);

          await this.loadUserNames();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.errorMessage = 'Could not load the requests.';
        }
      });
  }

  /**
   * Carga los nombres de los usuarios solicitantes.
   * @return promesa de ejecución
   */
  async loadUserNames(): Promise<void> {
    const ids = [...new Set(this.requests.map(request => request.developerId))];

    for (const id of ids) {
      if (!this.userNames[id]) {
        const user = await this.userService.getUserById(id);
        this.userNames[id] = user?.name || id;
        this.userEmails[id] = user?.email || '';
        this.userSkills[id] = Array.isArray(user?.skills) ? user.skills : [];
        this.userPhotos[id] = user?.photo || '';
      }
    }
  }

  /**
   * Devuelve el nombre del proyecto asociado a una solicitud.
   * @param projectId identificador del proyecto
   * @return nombre del proyecto
   */
  getProjectName(projectId: string): string {
    return this.projectNames[projectId] || projectId;
  }

  /**
   * Devuelve el nombre del usuario solicitante.
   * @param userId identificador del usuario
   * @return nombre del usuario
   */
  getUserName(userId: string): string {
    return this.userNames[userId] || userId;
  }

  /**
   * Devuelve el email del usuario solicitante.
   * @param userId identificador del usuario
   * @returns  email del usuario
   */
  getUserEmail(userId: string): string {
  return this.userEmails[userId] || '';
}

/**
 * Devuelve las habilidades del usuario solicitante.
 * @param userId identificador del usuario
 * @returns  habilidades del usuario
 */
getUserSkills(userId: string): string[] {
  return this.userSkills[userId] || [];
}

/**
 * Devuelve la foto del usuario solicitante.
 * @param userId identificador del usuario
 * @returns  foto del usuario
 */
getUserPhoto(userId: string): string {
  return this.userPhotos[userId] || '';
}

  /**
   * Formatea una fecha en timestamp.
   * @param timestamp fecha en milisegundos
   * @return fecha legible
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
   * Acepta una solicitud y añade al usuario al proyecto.
   * @param request solicitud a aceptar
   * @return promesa de ejecución
   */
  async acceptRequest(request: Request): Promise<void> {
    try {
      await this.requestService.updateRequestState(request.id, RequestState.ACCEPTED);
      await this.projectService.addParticipantToProject(request.projectId, request.developerId);
    } catch {
      this.errorMessage = 'Could not accept the request.';
    }
  }

  /**
   * Rechaza una solicitud.
   * @param request solicitud a rechazar
   * @return promesa de ejecución
   */
  async rejectRequest(request: Request): Promise<void> {
    try {
      await this.requestService.updateRequestState(request.id, RequestState.REJECTED);
    } catch {
      this.errorMessage = 'Could not reject the request.';
    }
  }

  /**
   * Indica si la solicitud está pendiente.
   * @param request solicitud a comprobar
   * @return true si está pendiente
   */
  isPending(request: Request): boolean {
    return request.state === RequestState.PENDING;
  }

  /**
   * Libera recursos al destruir el componente.
   */
  ngOnDestroy(): void {
    this.requestsSubscription?.unsubscribe();
    this.projectsSubscription?.unsubscribe();
  }
}
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';
import { RequestService } from '../../services/request.service';
import { TaskService } from '../../services/task.service';
import { Request } from '../../models/request.model';
import { Task } from '../../models/task.model';
import { RequestState } from '../../enums/request-state.enum';
import { TaskStatus } from '../../enums/task-status.enum';

/**
 * Componente encargado de mostrar el dashboard principal del panel.
 *
 * Este dashboard resume la información más importante relacionada con:
 * - proyectos creados por el usuario autenticado
 * - solicitudes de acceso a esos proyectos
 * - tareas asociadas a esos proyectos
 *
 * Su objetivo es ofrecer una visión rápida del estado general del panel.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {

  /**
   * Servicio de autenticación.
   * Permite obtener el usuario autenticado actual.
   */
  private authService = inject(AuthService);

  /**
   * Servicio de proyectos.
   * Se utiliza para cargar los proyectos creados por el usuario.
   */
  private projectService = inject(ProjectService);

  /**
   * Servicio de solicitudes.
   * Se utiliza para cargar las solicitudes relacionadas con los proyectos del usuario.
   */
  private requestService = inject(RequestService);

  /**
   * Servicio de tareas.
   * Se utiliza para cargar las tareas relacionadas con los proyectos del usuario.
   */
  private taskService = inject(TaskService);

  /**
   * Indica si el dashboard está cargando información.
   */
  loading: boolean = true;

  /**
   * Mensaje de error mostrado en la interfaz.
   */
  errorMessage: string = '';

  /**
   * Indica si la parte de solicitudes ya ha terminado de cargarse.
   */
  requestsLoaded: boolean = false;

  /**
   * Indica si la parte de tareas ya ha terminado de cargarse.
   */
  tasksLoaded: boolean = false;

  /**
   * Número total de proyectos creados por el usuario autenticado.
   */
  totalProjects: number = 0;

  /**
   * Número total de solicitudes relacionadas con los proyectos del usuario.
   */
  totalRequests: number = 0;

  /**
   * Número de solicitudes pendientes.
   */
  pendingRequests: number = 0;

  /**
   * Número de solicitudes aceptadas.
   */
  acceptedRequests: number = 0;

  /**
   * Número de solicitudes rechazadas.
   */
  rejectedRequests: number = 0;

  /**
   * Número total de tareas asociadas a los proyectos del usuario.
   */
  totalTasks: number = 0;

  /**
   * Número de tareas pendientes.
   */
  pendingTasks: number = 0;

  /**
   * Número de tareas en progreso.
   */
  inProgressTasks: number = 0;

  /**
   * Número de tareas completadas.
   */
  doneTasks: number = 0;

  /**
   * Suscripción al stream de proyectos.
   */
  private projectsSubscription?: Subscription;

  /**
   * Suscripción al stream de solicitudes.
   */
  private requestsSubscription?: Subscription;

  /**
   * Suscripción al stream de tareas.
   */
  private tasksSubscription?: Subscription;

  /**
   * Inicializa la carga del dashboard.
   *
   * Flujo:
   * 1. Obtiene el usuario autenticado.
   * 2. Recupera sus proyectos.
   * 3. Calcula métricas de proyectos.
   * 4. Filtra solicitudes de esos proyectos.
   * 5. Filtra tareas de esos proyectos.
   * 6. Calcula estadísticas finales.
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
        next: (projects) => {
          const projectIds = projects.map(project => project.id);

          this.totalProjects = projects.length;

          /**
           * Reiniciamos flags de carga cada vez que cambie el listado
           * de proyectos del usuario.
           */
          this.requestsLoaded = false;
          this.tasksLoaded = false;
          this.loading = true;

          this.loadRequestStats(projectIds);
          this.loadTaskStats(projectIds);
        },
        error: () => {
          this.loading = false;
          this.errorMessage = 'Could not load los proyectos.';
        }
      });
  }

  /**
   * Carga y calcula las estadísticas de solicitudes.
   *
   * @param projectIds lista de ids de proyectos creados por el usuario
   */
  loadRequestStats(projectIds: string[]): void {
    this.requestsSubscription = this.requestService
      .getAllRequests()
      .subscribe({
        next: (requests) => {
          const filteredRequests = requests.filter(request =>
            projectIds.includes(request.projectId)
          );

          this.calculateRequestStats(filteredRequests);

          /**
           * Marcamos la sección de solicitudes como cargada
           * y comprobamos si ya puede finalizar la carga global.
           */
          this.requestsLoaded = true;
          this.checkIfLoadingFinished();
        },
        error: () => {
          this.errorMessage = 'Could not load las solicitudes.';
          this.loading = false;
        }
      });
  }

  /**
   * Carga y calcula las estadísticas de tareas.
   *
   * @param projectIds lista de ids de proyectos creados por el usuario
   */
  loadTaskStats(projectIds: string[]): void {
    this.tasksSubscription = this.taskService
      .getAllTasks()
      .subscribe({
        next: (tasks) => {
          const filteredTasks = tasks.filter(task =>
            projectIds.includes(task.projectId)
          );

          this.calculateTaskStats(filteredTasks);

          /**
           * Marcamos la sección de tareas como cargada
           * y comprobamos si ya puede finalizar la carga global.
           */
          this.tasksLoaded = true;
          this.checkIfLoadingFinished();
        },
        error: () => {
          this.errorMessage = 'Could not load las tareas.';
          this.loading = false;
        }
      });
  }

  /**
   * Calcula las métricas relacionadas con solicitudes.
   *
   * @param requests lista de solicitudes filtradas
   */
  calculateRequestStats(requests: Request[]): void {
    this.totalRequests = requests.length;
    this.pendingRequests = requests.filter(request => request.state === RequestState.PENDING).length;
    this.acceptedRequests = requests.filter(request => request.state === RequestState.ACCEPTED).length;
    this.rejectedRequests = requests.filter(request => request.state === RequestState.REJECTED).length;
  }

  /**
   * Calcula las métricas relacionadas con tareas.
   *
   * @param tasks lista de tareas filtradas
   */
  calculateTaskStats(tasks: Task[]): void {
    this.totalTasks = tasks.length;
    this.pendingTasks = tasks.filter(task => task.status === TaskStatus.PENDING).length;
    this.inProgressTasks = tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length;
    this.doneTasks = tasks.filter(task => task.status === TaskStatus.DONE).length;
  }

  /**
   * Comprueba si se ha completado la carga de solicitudes y tareas.
   *
   * Solo cuando ambas secciones han terminado de cargar, se desactiva
   * el estado global de loading del dashboard.
   */
  checkIfLoadingFinished(): void {
    if (this.requestsLoaded && this.tasksLoaded) {
      this.loading = false;
    }
  }

  /**
   * Libera las suscripciones activas para evitar fugas de memoria.
   */
  ngOnDestroy(): void {
    this.projectsSubscription?.unsubscribe();
    this.requestsSubscription?.unsubscribe();
    this.tasksSubscription?.unsubscribe();
  }
}
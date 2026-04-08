import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';
import { UserService } from '../../services/user.service';
import { Task } from '../../models/task.model';

/**
 * Componente encargado de mostrar el listado de tareas del panel.
 *
 * Solo se visualizan las tareas pertenecientes a proyectos cuyo
 * creador es el usuario autenticado actualmente.
 */
@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css'
})
export class TasksComponent implements OnInit, OnDestroy {

  /**
   * Servicio de autenticación.
   * Permite obtener el usuario autenticado actual.
   */
  private authService = inject(AuthService);

  /**
   * Servicio de proyectos.
   * Se utiliza para recuperar los proyectos creados por el usuario.
   */
  private projectService = inject(ProjectService);

  /**
   * Servicio de tareas.
   * Se utiliza para cargar todas las tareas y después filtrarlas.
   */
  private taskService = inject(TaskService);

  /**
   * Servicio de usuarios.
   * Se utiliza para resolver el nombre del usuario asignado a la tarea.
   */
  private userService = inject(UserService);

  /**
   * Router de Angular.
   * Se utilizará para navegar al formulario de creación de tareas.
   */
  private router = inject(Router);

  /**
   * Lista de tareas filtradas.
   * Solo contendrá tareas de proyectos creados por el usuario autenticado.
   */
  tasks: Task[] = [];

  /**
   * Indica si la pantalla está en proceso de carga.
   */
  loading: boolean = true;

  /**
   * Mensaje de error mostrado en la interfaz.
   */
  errorMessage: string = '';

  /**
   * Mapa auxiliar para resolver el nombre del proyecto a partir de su id.
   * Estructura: projectId -> projectName
   */
  projectNames: Record<string, string> = {};

  /**
   * Mapa auxiliar para resolver el nombre del usuario asignado a partir de su id.
   * Estructura: userId -> userName
   */
  userNames: Record<string, string> = {};

  /**
   * Suscripción al stream de tareas.
   */
  private tasksSubscription?: Subscription;

  /**
   * Suscripción al stream de proyectos.
   */
  private projectsSubscription?: Subscription;

  /**
   * Hook de inicialización del componente.
   *
   * Flujo:
   * 1. Obtiene el usuario autenticado.
   * 2. Obtiene sus proyectos.
   * 3. Guarda los nombres de esos proyectos.
   * 4. Carga todas las tareas.
   * 5. Filtra solo las tareas pertenecientes a esos proyectos.
   */
  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      this.loading = false;
      this.errorMessage = 'No hay usuario autenticado.';
      return;
    }

    this.projectsSubscription = this.projectService
      .getProjectsByCreator(currentUser.uid)
      .subscribe({
        next: async (projects) => {
          const projectIds = projects.map(project => project.id);

          this.projectNames = {};
          for (const project of projects) {
            this.projectNames[project.id] = project.name;
          }

          this.loadTasks(projectIds);
        },
        error: () => {
          this.loading = false;
          this.errorMessage = 'No se pudieron cargar los proyectos.';
        }
      });
  }

  /**
   * Carga las tareas asociadas a los proyectos indicados.
   *
   * @param projectIds lista de ids de proyectos creados por el usuario
   */
  loadTasks(projectIds: string[]): void {
    this.tasksSubscription = this.taskService
      .getAllTasks()
      .subscribe({
        next: async (tasks) => {
          this.tasks = tasks
            .filter(task => projectIds.includes(task.projectId))
            .sort((a, b) => b.createdAt - a.createdAt);

          await this.loadAssignedUserNames();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.errorMessage = 'No se pudieron cargar las tareas.';
        }
      });
  }

  /**
   * Carga los nombres de los usuarios asignados a las tareas.
   *
   * Para cada assignedDeveloper, consulta el usuario en Firebase
   * y guarda su nombre en el mapa userNames.
   *
   * @return promesa de ejecución
   */
  async loadAssignedUserNames(): Promise<void> {
    const ids = [...new Set(this.tasks.map(task => task.assignedDeveloper).filter(Boolean))];

    for (const id of ids) {
      if (!this.userNames[id]) {
        const user = await this.userService.getUserById(id);
        this.userNames[id] = user?.name || id;
      }
    }
  }

  /**
   * Devuelve el nombre del proyecto a partir de su id.
   *
   * @param projectId identificador del proyecto
   * @return nombre del proyecto o el id si no se encuentra
   */
  getProjectName(projectId: string): string {
    return this.projectNames[projectId] || projectId;
  }

  /**
   * Devuelve el nombre del usuario asignado a partir de su id.
   *
   * @param userId identificador del usuario
   * @return nombre del usuario o el id si no se encuentra
   */
  getUserName(userId: string): string {
    return this.userNames[userId] || userId;
  }

  /**
   * Formatea una fecha en timestamp a una cadena legible.
   *
   * @param timestamp fecha en milisegundos
   * @return fecha en formato dd/mm/yyyy
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
   * Navega al formulario de creación de tarea.
   *
   * @return promesa de navegación
   */
  async goToCreateTask(): Promise<void> {
    await this.router.navigateByUrl('/tasks/new');
  }

  /**
   * Hook de destrucción del componente.
   *
   * Libera las suscripciones activas para evitar fugas de memoria.
   */
  ngOnDestroy(): void {
    this.tasksSubscription?.unsubscribe();
    this.projectsSubscription?.unsubscribe();
  }
}
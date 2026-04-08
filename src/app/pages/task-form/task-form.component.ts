import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';
import { UserService } from '../../services/user.service';
import { Project } from '../../models/project.model';
import { Task } from '../../models/task.model';
import { TaskStatus } from '../../enums/task-status.enum';

/**
 * Componente encargado de crear nuevas tareas.
 *
 * La tarea se asocia a uno de los proyectos creados por el usuario autenticado
 * y se asigna a uno de los participantes de dicho proyecto.
 */
@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.css'
})
export class TaskFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private taskService = inject(TaskService);
  private userService = inject(UserService);
  private router = inject(Router);

  /**
   * Indica si el formulario se está guardando.
   */
  loading: boolean = false;

  /**
   * Indica si se están cargando los proyectos del usuario.
   */
  loadingProjects: boolean = true;

  /**
   * Mensaje de error mostrado en la interfaz.
   */
  errorMessage: string = '';

  /**
   * Proyectos creados por el usuario autenticado.
   */
  projects: Project[] = [];

  /**
   * Lista de ids de participantes disponibles para el proyecto seleccionado.
   */
  availableParticipants: string[] = [];

  /**
   * Mapa auxiliar para resolver nombres de participantes.
   * Estructura: userId -> userName
   */
  participantNames: Record<string, string> = {};

  /**
   * Formulario reactivo para crear una tarea.
   */
  taskForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(80)]],
    description: ['', [Validators.required, Validators.maxLength(250)]],
    projectId: ['', [Validators.required]],
    assignedDeveloper: ['', [Validators.required]]
  });

  /**
   * Inicializa la carga de proyectos del usuario autenticado.
   *
   * @return promesa de ejecución
   */
  async ngOnInit(): Promise<void> {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      this.loadingProjects = false;
      this.errorMessage = 'No hay usuario autenticado.';
      return;
    }

    try {
      this.projects = await this.projectService.getProjectsByCreatorOnce(currentUser.uid);
    } catch {
      this.errorMessage = 'No se pudieron cargar los proyectos.';
    } finally {
      this.loadingProjects = false;
    }
  }

  /**
   * Se ejecuta al cambiar el proyecto seleccionado.
   *
   * Actualiza la lista de participantes disponibles
   * y carga sus nombres para mostrarlos en el select.
   *
   * @param event evento change del select de proyectos
   * @return promesa de ejecución
   */
  async onProjectChange(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const projectId = select.value;

    const project = this.projects.find(item => item.id === projectId);

    if (!project) {
      this.availableParticipants = [];
      this.participantNames = {};
      this.taskForm.patchValue({ assignedDeveloper: '' });
      return;
    }

    this.availableParticipants = Object.keys(project.participants || {});
    this.taskForm.patchValue({ assignedDeveloper: '' });

    await this.loadParticipantNames();
  }

  /**
   * Carga los nombres de los participantes del proyecto seleccionado.
   *
   * @return promesa de ejecución
   */
  async loadParticipantNames(): Promise<void> {
    this.participantNames = {};

    for (const participantId of this.availableParticipants) {
      const user = await this.userService.getUserById(participantId);
      this.participantNames[participantId] = user?.name || participantId;
    }
  }

  /**
   * Devuelve el nombre de un participante a partir de su id.
   *
   * @param participantId identificador del usuario
   * @return nombre del participante o el id si no existe
   */
  getParticipantName(participantId: string): string {
    return this.participantNames[participantId] || participantId;
  }

  /**
   * Guarda la nueva tarea en Firebase.
   *
   * @return promesa de ejecución
   */
  async onSubmit(): Promise<void> {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const { title, description, projectId, assignedDeveloper } = this.taskForm.getRawValue();

    const task = new Task();
    task.title = title!.trim();
    task.description = description!.trim();
    task.projectId = projectId!;
    task.assignedDeveloper = assignedDeveloper!;
    task.status = TaskStatus.PENDING;
    task.createdAt = Date.now();
    task.creationDate = new Date().toLocaleDateString('es-ES');

    try {
      this.loading = true;
      this.errorMessage = '';

      await this.taskService.createTask(task);
      await this.router.navigateByUrl('/tasks');
    } catch {
      this.errorMessage = 'No se pudo crear la tarea.';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Cancela la creación y vuelve al listado de tareas.
   *
   * @return promesa de navegación
   */
  async onCancel(): Promise<void> {
    await this.router.navigateByUrl('/tasks');
  }
}
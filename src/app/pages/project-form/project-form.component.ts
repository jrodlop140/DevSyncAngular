import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project.model';
import { ProjectStatus } from '../../enums/project-status.enum';

/**
 * Página para crear o editar un proyecto.
 */
@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './project-form.component.html',
  styleUrl: './project-form.component.css'
})
export class ProjectFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading: boolean = false;
  loadingProject: boolean = false;
  errorMessage: string = '';

  isEditMode: boolean = false;
  projectId: string = '';

  projectForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    description: ['', [Validators.required, Validators.maxLength(250)]],
    technologies: ['', [Validators.required]]
  });

  /**
   * Inicializa el formulario y detecta si se está creando o editando.
   */
  ngOnInit(): void {
    this.route.paramMap.subscribe(async (params) => {
      const id = params.get('id');

      if (!id) {
        return;
      }

      this.isEditMode = true;
      this.projectId = id;
      this.loadingProject = true;
      this.errorMessage = '';

      try {
        const project = await this.projectService.getProjectById(id);

        if (!project) {
          this.errorMessage = 'No se encontró el proyecto.';
          this.loadingProject = false;
          return;
        }

        this.projectForm.patchValue({
          name: project.name,
          description: project.description,
          technologies: project.technologies.join(', ')
        });
      } catch {
        this.errorMessage = 'No se pudo cargar el proyecto.';
      } finally {
        this.loadingProject = false;
      }
    });
  }

  /**
   * Guarda el proyecto en Firebase.
   * Si hay identificador de proyecto, actualiza.
   * En caso contrario, crea uno nuevo.
   * @return promesa de ejecución
   */
  async onSubmit(): Promise<void> {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      this.errorMessage = 'No authenticated user.';
      return;
    }

    const { name, description, technologies } = this.projectForm.getRawValue();

    try {
      this.loading = true;
      this.errorMessage = '';

      if (this.isEditMode) {
        const existingProject = await this.projectService.getProjectById(this.projectId);

        if (!existingProject) {
          this.errorMessage = 'No se encontró el proyecto.';
          this.loading = false;
          return;
        }

        existingProject.name = name!.trim();
        existingProject.description = description!.trim();
        existingProject.technologies = technologies!
          .split(',')
          .map(tech => tech.trim())
          .filter(tech => tech.length > 0);

        await this.projectService.updateProject(existingProject);
      } else {
        const project = new Project();
        project.name = name!.trim();
        project.description = description!.trim();
        project.creator = currentUser.uid;
        project.createdAt = Date.now();
        project.status = ProjectStatus.ACTIVE;
        project.technologies = technologies!
          .split(',')
          .map(tech => tech.trim())
          .filter(tech => tech.length > 0);
        project.participants = {
          [currentUser.uid]: true
        };

        await this.projectService.createProject(project);
      }

      await this.router.navigateByUrl('/projects');
    } catch {
      this.errorMessage = this.isEditMode
        ? 'No se pudo actualizar el proyecto.'
        : 'No se pudo crear el proyecto.';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Cancela la operación y vuelve al listado.
   * @return promesa de navegación
   */
  async onCancel(): Promise<void> {
    await this.router.navigateByUrl('/projects');
  }
}
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project.model';
import { ProjectStatus } from '../../enums/project-status.enum';

/**
 * Página para crear un nuevo proyecto.
 */
@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './project-form.component.html',
  styleUrl: './project-form.component.css'
})
export class ProjectFormComponent {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private router = inject(Router);

  loading: boolean = false;
  errorMessage: string = '';

  projectForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    description: ['', [Validators.required, Validators.maxLength(250)]],
    technologies: ['', [Validators.required]]
  });

  /**
   * Guarda el proyecto en Firebase.
   * @return promesa de ejecución
   */
  async onSubmit(): Promise<void> {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      this.errorMessage = 'No hay usuario autenticado.';
      return;
    }

    const { name, description, technologies } = this.projectForm.getRawValue();

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

    try {
      this.loading = true;
      this.errorMessage = '';

      await this.projectService.createProject(project);
      await this.router.navigateByUrl('/projects');
    } catch {
      this.errorMessage = 'No se pudo crear el proyecto.';
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
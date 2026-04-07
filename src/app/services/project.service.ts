import { Injectable, inject } from '@angular/core';
import { Database, onValue, push, ref, update, remove } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { Project } from '../models/project.model';

/**
 * Servicio encargado de gestionar los proyectos en Firebase.
 */
@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  private db = inject(Database);

  /**
   * Obtiene todos los proyectos de la base de datos.
   * @return lista de proyectos en tiempo real
   */
  getAllProjects(): Observable<Project[]> {
    return new Observable<Project[]>((observer) => {
      const projectsRef = ref(this.db, 'projects');

      const unsubscribe = onValue(
        projectsRef,
        (snapshot) => {
          const data = snapshot.val();

          if (!data) {
            observer.next([]);
            return;
          }

          const projects: Project[] = Object.entries(data).map(([id, value]) => {
            const project = new Project();
            project.id = id;
            Object.assign(project, value);
            return project;
          });

          observer.next(projects);
        },
        (error) => observer.error(error)
      );

      return () => unsubscribe();
    });
  }

  /**
   * Obtiene los proyectos creados por un usuario concreto.
   * @param userId identificador del usuario
   * @return lista de proyectos del usuario
   */
  getProjectsByCreator(userId: string): Observable<Project[]> {
    return new Observable<Project[]>((observer) => {
      const projectsRef = ref(this.db, 'projects');

      const unsubscribe = onValue(
        projectsRef,
        (snapshot) => {
          const data = snapshot.val();

          if (!data) {
            observer.next([]);
            return;
          }

          const projects: Project[] = Object.entries(data)
            .map(([id, value]) => {
              const project = new Project();
              project.id = id;
              Object.assign(project, value);
              return project;
            })
            .filter(project => project.creator === userId);

          observer.next(projects);
        },
        (error) => observer.error(error)
      );

      return () => unsubscribe();
    });
  }

  /**
   * Crea un nuevo proyecto en Firebase.
   * @param project proyecto a crear
   * @return promesa de creación
   */
  createProject(project: Project) {
    const projectsRef = ref(this.db, 'projects');
    const { id, ...data } = project;
    return push(projectsRef, data);
  }

  /**
   * Actualiza un proyecto existente.
   * @param project proyecto a actualizar
   * @return promesa de actualización
   */
  updateProject(project: Project) {
    const projectRef = ref(this.db, `projects/${project.id}`);
    const { id, ...data } = project;
    return update(projectRef, data);
  }

  /**
   * Elimina un proyecto existente.
   * @param projectId identificador del proyecto
   * @return promesa de borrado
   */
  deleteProject(projectId: string) {
    const projectRef = ref(this.db, `projects/${projectId}`);
    return remove(projectRef);
  }
}
import { Injectable, inject } from '@angular/core';
import { Database, get, onValue, push, ref, remove, update } from '@angular/fire/database';
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
   * Obtiene un proyecto por su identificador.
   * @param projectId identificador del proyecto
   * @return proyecto encontrado o null
   */
  async getProjectById(projectId: string): Promise<Project | null> {
    const projectRef = ref(this.db, `projects/${projectId}`);
    const snapshot = await get(projectRef);

    if (!snapshot.exists()) {
      return null;
    }

    const project = new Project();
    project.id = snapshot.key ?? '';
    Object.assign(project, snapshot.val());

    return project;
  }

  /**
   * Obtiene los proyectos creados por un usuario una sola vez.
   *
   * Este método es útil para formularios, donde no necesitamos
   * una suscripción en tiempo real.
   *
   * @param userId identificador del usuario creador
   * @return promesa con la lista de proyectos
   */
  async getProjectsByCreatorOnce(userId: string): Promise<Project[]> {
    const projectsRef = ref(this.db, 'projects');
    const snapshot = await get(projectsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const data = snapshot.val();

    return Object.entries(data)
      .map(([id, value]) => {
        const project = new Project();
        project.id = id;
        Object.assign(project, value);
        return project;
      })
      .filter(project => project.creator === userId);
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

  /**
 * Añade un participante a un proyecto.
 * @param projectId identificador del proyecto
 * @param userId identificador del usuario
 * @return promesa de actualización
 */
addParticipantToProject(projectId: string, userId: string) {
  const participantRef = ref(this.db, `projects/${projectId}/participants`);
  return update(participantRef, {
    [userId]: true
  });
}
}
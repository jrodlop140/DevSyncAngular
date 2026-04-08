import { Injectable, inject } from '@angular/core';
import { Database, onValue, push, ref } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { Task } from '../models/task.model';

/**
 * Servicio encargado de gestionar las tareas.
 * 
 * Este servicio se comunica con Firebase Realtime Database
 * para obtener y persistir datos.
 */
@Injectable({
  providedIn: 'root'
})
export class TaskService {

  /**
   * Instancia de la base de datos de Firebase.
   */
  private db = inject(Database);

  /**
   * Obtiene todas las tareas almacenadas en Firebase.
   * 
   * Se utiliza onValue para mantener sincronización en tiempo real.
   * 
   * @return observable con la lista de tareas
   */
  getAllTasks(): Observable<Task[]> {
    return new Observable<Task[]>((observer) => {

      const tasksRef = ref(this.db, 'tasks');

      const unsubscribe = onValue(
        tasksRef,
        (snapshot) => {

          const data = snapshot.val();

          // Si no hay datos devolvemos lista vacía
          if (!data) {
            observer.next([]);
            return;
          }

          // Transformamos el JSON en objetos Task
          const tasks: Task[] = Object.entries(data).map(([id, value]) => {
            const task = new Task();
            task.id = id;
            Object.assign(task, value);
            return task;
          });

          observer.next(tasks);
        },
        (error) => observer.error(error)
      );

      // Limpieza de la suscripción
      return () => unsubscribe();
    });
  }

  /**
   * Crea una nueva tarea en Firebase.
   * 
   * Firebase generará automáticamente el id.
   * 
   * @param task tarea a crear
   * @return promesa de inserción
   */
  createTask(task: Task) {
    const tasksRef = ref(this.db, 'tasks');

    // Eliminamos el id para evitar duplicidad
    const { id, ...data } = task;

    return push(tasksRef, data);
  }
}
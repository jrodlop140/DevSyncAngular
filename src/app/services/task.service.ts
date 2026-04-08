import { Injectable, inject } from '@angular/core';
import { Database, get, onValue, push, ref, remove, update } from '@angular/fire/database';
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
 * Obtiene una tarea por su id.
 *
 * @param taskId identificador de la tarea
 * @return tarea o null
 */
async getTaskById(taskId: string): Promise<Task | null> {
  const taskRef = ref(this.db, `tasks/${taskId}`);
  const snapshot = await get(taskRef);

  if (!snapshot.exists()) {
    return null;
  }

  const task = new Task();
  task.id = snapshot.key ?? '';
  Object.assign(task, snapshot.val());

  return task;
}

/**
 * Actualiza una tarea existente.
 *
 * @param task tarea a actualizar
 * @return promesa de actualización
 */
updateTask(task: Task) {
  const taskRef = ref(this.db, `tasks/${task.id}`);
  const { id, ...data } = task;
  return update(taskRef, data);
}

/**
 * Elimina una tarea.
 *
 * @param taskId id de la tarea
 * @return promesa de borrado
 */
deleteTask(taskId: string) {
  const taskRef = ref(this.db, `tasks/${taskId}`);
  return remove(taskRef);
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
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
   * Obtiene una tarea concreta a partir de su identificador.
   *
   * Este método se utiliza principalmente en el formulario de edición,
   * donde es necesario recuperar una única tarea y cargar sus datos
   * iniciales en el formulario reactivo.
   *
   * @param taskId identificador de la tarea
   * @return promesa con la tarea encontrada o null si no existe
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
   * Este método sobrescribe los campos de la tarea ya almacenada
   * en Firebase manteniendo su mismo identificador.
   *
   * @param task tarea con la nueva información
   * @return promesa de actualización
   */
  updateTask(task: Task) {
    const taskRef = ref(this.db, `tasks/${task.id}`);
    const { id, ...data } = task;
    return update(taskRef, data);
  }

  /**
   * Actualiza únicamente el estado de una tarea.
   *
   * Este método resulta útil cuando queremos aplicar transiciones
   * simples de estado sin reenviar todos los campos de la tarea.
   *
   * Se utiliza, por ejemplo, en el listado del panel para avanzar
   * una tarea de PENDING a IN_PROGRESS o de IN_PROGRESS a DONE.
   *
   * @param taskId identificador de la tarea
   * @param status nuevo estado que se desea guardar
   * @return promesa de actualización
   */
  updateTaskStatus(taskId: string, status: string) {
    const taskRef = ref(this.db, `tasks/${taskId}`);
    return update(taskRef, { status });
  }

  /**
   * Elimina una tarea de Firebase.
   *
   * @param taskId identificador de la tarea a eliminar
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
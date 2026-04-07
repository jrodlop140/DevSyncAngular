import { Injectable, inject } from '@angular/core';
import { Database, onValue, ref, update } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { Request } from '../models/request.model';

/**
 * Servicio encargado de gestionar las solicitudes de proyectos.
 */
@Injectable({
  providedIn: 'root'
})
export class RequestService {

  private db = inject(Database);

  /**
   * Obtiene todas las solicitudes de la base de datos.
   * @return lista de solicitudes en tiempo real
   */
  getAllRequests(): Observable<Request[]> {
    return new Observable<Request[]>((observer) => {
      const requestsRef = ref(this.db, 'requests');

      const unsubscribe = onValue(
        requestsRef,
        (snapshot) => {
          const data = snapshot.val();

          if (!data) {
            observer.next([]);
            return;
          }

          const requests: Request[] = Object.entries(data).map(([id, value]) => {
            const request = new Request();
            request.id = id;
            Object.assign(request, value);
            return request;
          });

          observer.next(requests);
        },
        (error) => observer.error(error)
      );

      return () => unsubscribe();
    });
  }

  /**
   * Actualiza el estado de una solicitud.
   * @param requestId identificador de la solicitud
   * @param state nuevo estado
   * @return promesa de actualización
   */
  updateRequestState(requestId: string, state: string) {
    const requestRef = ref(this.db, `requests/${requestId}`);
    return update(requestRef, { state });
  }
}
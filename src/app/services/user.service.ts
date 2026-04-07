import { Injectable, inject } from '@angular/core';
import { Database, get, ref } from '@angular/fire/database';
import { User } from '../models/user.model';

/**
 * Servicio encargado de gestionar los usuarios.
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {

  private db = inject(Database);

  /**
   * Obtiene un usuario por su identificador.
   * @param userId identificador del usuario
   * @return usuario encontrado o null
   */
  async getUserById(userId: string): Promise<User | null> {
    const userRef = ref(this.db, `users/${userId}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return null;
    }

    const user = new User();
    user.id = snapshot.key ?? '';
    Object.assign(user, snapshot.val());

    return user;
  }
}
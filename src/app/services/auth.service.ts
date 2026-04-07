import { Injectable, inject } from '@angular/core';
import {
  Auth,
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Servicio de autenticación.
 * Gestiona el login, logout y el estado del usuario autenticado.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private auth: Auth = inject(Auth);

  private currentUserSubject = new BehaviorSubject<FirebaseUser | null>(null);

  public currentUser$: Observable<FirebaseUser | null> =
    this.currentUserSubject.asObservable();

  /**
   * Constructor.
   * Inicializa el listener del estado de autenticación.
   */
  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUserSubject.next(user);
    });
  }

  /**
   * Inicia sesión con email y contraseña.
   * @param email email del usuario
   * @param password contraseña del usuario
   * @return promesa con la credencial de Firebase
   */
  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  /**
   * Cierra la sesión actual.
   * @return promesa de cierre de sesión
   */
  logout() {
    return signOut(this.auth);
  }

  /**
   * Obtiene el usuario actual.
   * @return usuario autenticado o null
   */
  getCurrentUser(): FirebaseUser | null {
    return this.auth.currentUser;
  }

  /**
   * Indica si hay usuario autenticado.
   * @return true si hay sesión activa, false en caso contrario
   */
  isLoggedIn(): boolean {
    return this.auth.currentUser !== null;
  }
}
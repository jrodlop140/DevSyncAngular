import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * Página de login.
 * Gestiona el formulario de acceso al panel.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading: boolean = false;
  errorMessage: string = '';

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  /**
   * Gestiona el envío del formulario.
   * @return promesa de ejecución
   */
  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();

    try {
      this.loading = true;
      this.errorMessage = '';

      await this.authService.login(email!, password!);
      await this.router.navigateByUrl('/projects');
    } catch (error: any) {
      this.errorMessage = this.mapFirebaseError(error?.code);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Traduce el código de error de Firebase a un mensaje legible.
   * @param code código de error
   * @return mensaje de error
   */
  private mapFirebaseError(code: string): string {
    switch (code) {
      case 'auth/invalid-credential':
        return 'Credenciales incorrectas.';
      case 'auth/user-disabled':
        return 'Usuario deshabilitado.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Inténtalo más tarde.';
      default:
        return 'No se pudo iniciar sesión.';
    }
  }
}
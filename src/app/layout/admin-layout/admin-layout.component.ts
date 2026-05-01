import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * Layout principal del panel privado.
 * Contiene la navegación lateral y el router-outlet de las secciones internas.
 */
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {

  private authService = inject(AuthService);
  private router = inject(Router);

  /**
   * Cierra la sesión actual y redirige al login.
   * @return promesa de ejecución
   */
  async logout(): Promise<void> {
    // Cerrar el offcanvas si está abierto (para móvil)
    const offcanvas = document.getElementById('sidebar-offcanvas');
    if (offcanvas && offcanvas.classList.contains('show')) {
      const bsOffcanvas = (window as any).bootstrap?.Offcanvas?.getInstance(offcanvas);
      if (bsOffcanvas) {
        bsOffcanvas.hide();
      }
    }
    await this.authService.logout();
    await this.router.navigateByUrl('/login');
  }
}
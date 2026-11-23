import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { FIXED_TEXTS } from './core/ui-state/fixed-texts';

/**
 * Root component. Shows the global "cargando" while a navigation is pending (lazy chunks and
 * guards waiting for the country configuration), so that entering by URL is announced
 * (ADR-0004, G3-9, REQ-02.20).
 */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);

  /** `Router.currentNavigation` is `null` once the navigation ends, is cancelled or fails. */
  protected readonly navigating = computed(() => this.router.currentNavigation() !== null);
  protected readonly loadingText = FIXED_TEXTS.loading;
}

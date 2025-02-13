import { Injectable, isDevMode } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { NotificationsService } from './notifications.service';

@Injectable({
  providedIn: 'root'
})
export class PwaService {

  constructor(
    private readonly sw: SwUpdate,
    private readonly notifications: NotificationsService
  ) {
    if (!isDevMode()) this.initialize();
  }

  private initialize(): void {
    this.startListening();
    this.sw.checkForUpdate();
  }

  private startListening(): void {
    this.sw.unrecoverable.subscribe({next: () => window.location.reload()});

    this.sw.versionUpdates.subscribe(event => {
      this.notifications.confirm({
        title: $localize`Aggiornamento disponibile`,
        text: $localize`Aggiornare l'applicazione?`,
        showConfirmButton: true,
        confirmButtonText: $localize`Aggiorna`,
        showCancelButton: false,
        denyButtonText: $localize`Annulla`,
        icon: "warning",
        position: 'bottom-end',
        toast: true,
        confirm: () => {
          window.location.reload();
        },
        deny: () => { }
      });
    });
  }
}

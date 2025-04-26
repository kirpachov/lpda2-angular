import { Component, inject, isDevMode } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {RouterOutlet} from "@angular/router";
import {AdminSidenavComponent} from "@core/components/admin-sidenav/admin-sidenav.component";
import { WebsocketService, WsUtils } from '@core/services/ws/websocket.service';
import { NotificationsService } from '@core/services/notifications.service';
import { nue } from '@core/lib/nue';
import { ReservationsService } from '@core/services/http/reservations.service';
import { ReservationsEventsNotifier } from '@core/services/reservations-events-notifier';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, AdminSidenavComponent],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {
  private readonly reservations: ReservationsEventsNotifier = inject(ReservationsEventsNotifier);

  constructor() {
    this.reservations.listenWsChanges();
  }
}

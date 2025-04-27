import { Injectable, Injector, Type, inject } from '@angular/core';
import { nue } from '@core/lib/nue';
import { TuiAlertOptions, TuiAlertService, TuiDialogOptions, TuiDialogService, TuiNotification } from '@taiga-ui/core';
import { Observable, Subject, switchMap } from 'rxjs';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef, TextOnlySnackBar } from "@angular/material/snack-bar";
import { PolymorpheusComponent, PolymorpheusContent } from '@tinkoff/ng-polymorpheus';
import { TUI_PROMPT, TuiPromptData } from "@taiga-ui/kit";
import { SOMETHING_WENT_WRONG_MESSAGE } from '@core/lib/something-went-wrong-message';
import { NotificationsService } from './notifications.service';
import { Reservation } from '@core/models/reservation';
import { DatePipe } from '@angular/common';
import { WebsocketService, WsUtils } from './ws/websocket.service';
import { ReservationsService } from './http/reservations.service';
import { ReservationCreatedNotificationComponent } from '@core/components/reservation-created-notification/reservation-created-notification.component';
import { ReservationCancelledNotificationComponent } from '@core/components/reservation-cancelled-notification/reservation-cancelled-notification.component';

@Injectable({
  providedIn: 'root'
})
export class ReservationsEventsNotifier extends NotificationsService {
  private readonly injector: Injector = inject(Injector);
  private readonly ws: WebsocketService = inject(WebsocketService);
  private readonly reservations: ReservationsService = inject(ReservationsService);
  private readonly notifications: NotificationsService = inject(NotificationsService);

  readonly wsEvents: Subject<WsUtils.ReservationsChannelData> = new Subject<WsUtils.ReservationsChannelData>();
  private readonly date: DatePipe = inject(DatePipe);

  constructor() {
    super();
  }

  private listeningWsChanges: boolean = false;
  listenWsChanges(): Subject<WsUtils.ReservationsChannelData> {
    if (!this.listeningWsChanges) {
      this.notifyOnEvents();
      this.listeningWsChanges = true;
      this.ws.openConnection('ReservationsChannel', {
        received: (data: WsUtils.ReservationsChannelData) => {
          this.wsEvents.next(data);
        }
      }).subscribe(nue());
    }

    return this.wsEvents;
  }

  manageReservationCreated(reservation: Reservation): void {
    this.alertServiceFireComponent(ReservationCreatedNotificationComponent, reservation, "info");
  }

  manageReservationCancelled(reservation: Reservation): void {
    this.alertServiceFireComponent(ReservationCancelledNotificationComponent, reservation, "warning");
  }

  /**
   * Will listen for events and notify the user.
   */
  notifyOnEvents(): void {
    this.wsEvents.subscribe((data: WsUtils.ReservationsChannelData) => {
      if (data.reservation_id && (data.action === "create" || data.action === "cancel")) {
        this.reservations.show(data.reservation_id).subscribe((reservation: Reservation) => {

          if (data.action === "create") {
            this.manageReservationCreated(reservation);
          } else if (data.action === "cancel") {
            this.manageReservationCancelled(reservation);
          }

        });
      }
    });
  }

  private alertServiceFireComponent(component: Type<any>, reservation: Reservation, status: 'info' | 'warning'): void {
    this.alertService.open<boolean>(
      new PolymorpheusComponent(component, this.injector),
      {
        status: status,
        autoClose: false,
        data: {
          reservation: reservation,
        }
      },
    ).subscribe();
  }
}

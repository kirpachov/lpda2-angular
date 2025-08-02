import {inject, Injectable} from '@angular/core';
import {ReservationData} from "@core/lib/interfaces/reservation-data";
import {Reservation} from "@core/models/reservation";
import {CommonHttpService} from "@core/services/http/common-http.service";
import {BehaviorSubject, catchError, map, Observable, tap} from "rxjs";
import {DomainService} from "@core/services/domain.service";
import {PublicPagesDataService} from "@core/services/http/public-pages-data.service";
import {ReservationTurn} from "@core/models/reservation-turn";
import {ReservationTurnData} from "@core/lib/interfaces/reservation-turn-data";
// import {JWT_INTERCEPTOR_SKIP_REQUEST_PARAM} from "@core/interceptors/jwt.interceptor";
import { TuiDay } from '@taiga-ui/cdk';
import { PreorderReservationGroupData } from '@core/lib/interfaces/preorder-reservation-group-data';
import { PreorderReservationGroup } from '@core/models/preorder-reservation-group';

@Injectable({
  providedIn: 'root'
})
export class PublicReservationsService extends DomainService {

  private readonly publicData: PublicPagesDataService = inject(PublicPagesDataService);

  constructor() {
    super(`reservations`);

    this.publicData.data$.subscribe({
      next: (data): void => {
        this.created.next(data?.reservation ? new Reservation(data.reservation) : null);
      }
    });
  }

  datetimeRequiresPayment(data: { date: string, time: string, people: number }): Observable<{ preorder_reservation_group: PreorderReservationGroup } | null> {
    return this.get<{ preorder_reservation_group: PreorderReservationGroupData } | null>(`datetime_requires_payment`, {
      params: {
        date: data.date,
        time: data.time,
        people: data.people,
        // [JWT_INTERCEPTOR_SKIP_REQUEST_PARAM]: true
      }
    }).pipe(
      map((data: { preorder_reservation_group: PreorderReservationGroupData | null } | null): { preorder_reservation_group: PreorderReservationGroup } | null => {
        if (data && data.preorder_reservation_group) {
          return {
            preorder_reservation_group: new PreorderReservationGroup(data.preorder_reservation_group)
          }
        }

        return null;
      })
    )
  }

  getValidDates(params?: { from_date: string, to_date: string }): Observable<TuiDay[]> {
    return this.get<string[]>(`valid_dates`, { params: params }).pipe(
      map((data: string[]): TuiDay[] => data.map((d: string): TuiDay => TuiDay.fromLocalNativeDate(new Date(d)))),
    )
  }

  readonly created: BehaviorSubject<Reservation | null> = new BehaviorSubject<Reservation | null>(null);

  load(secret: string, params?: { reload_payment?: boolean }): Observable<Reservation> {
    params ||= {};

    return this.get<{ item: ReservationData }>(`${secret}`, { params }).pipe(
      map((data: { item: ReservationData }): Reservation => new Reservation(data.item))
    );
  }

  create(params: Record<string, any>): Observable<Reservation> {
    return this.post<{ item: ReservationData }>(``, params).pipe(
      map((data: { item: ReservationData }): Reservation => new Reservation(data.item)),
      tap((r: Reservation) => this.created.next(r)),
      catchError((error: unknown) => {
        this.created.next(null);

        throw error;
      })
    )
  }

  resendConfirmation(secret: string): Observable<unknown> {
    return this.post<unknown>(`${secret}/resend_confirmation_email`, {});
  }

  cancel(secret: string): Observable<unknown> {
    return this.post<unknown>(`${secret}/cancel`, {});
  }
}

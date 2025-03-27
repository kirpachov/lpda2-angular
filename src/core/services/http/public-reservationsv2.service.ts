import {inject, Injectable} from '@angular/core';
import {ReservationData} from "@core/lib/interfaces/reservation-data";
import {Reservation} from "@core/models/reservation";
import {CommonHttpService} from "@core/services/http/common-http.service";
import {BehaviorSubject, catchError, map, Observable, tap} from "rxjs";
import {DomainService} from "@core/services/domain.service";
import {PublicPagesDataService} from "@core/services/http/public-pages-data.service";
import {ReservationTurn} from "@core/models/reservation-turn";
import {ReservationTurnData} from "@core/lib/interfaces/reservation-turn-data";
import {JWT_INTERCEPTOR_SKIP_REQUEST_PARAM} from "@core/interceptors/jwt.interceptor";
import { TuiDay } from '@taiga-ui/cdk';
import { Holiday } from '@core/models/holiday';

export interface vtimes {
  turns: ReservationTurn[];
  holidays: Holiday[];
  settings: Record<string, string | number | null | undefined>;
}

@Injectable({
  providedIn: 'root'
})
export class PublicReservationsV2Service extends DomainService {

  protected override readonly version: number = 2;

  constructor() {
    super(`reservations`);
  }

  getValidTimes(data: { date: TuiDay, people?: number | null }): Observable<vtimes> {
    const params: Record<string, string | number> = {};

    if (data.date instanceof TuiDay) {
      params["date"] = `${data.date.year}-${(data.date.month + 1) % 13}-${data.date.day}`;
    }

    if (typeof data.people == "number" && data.people) params["people"] = data.people;

    return this.get<vtimes>(`valid_times`, {params: params})
  }
}

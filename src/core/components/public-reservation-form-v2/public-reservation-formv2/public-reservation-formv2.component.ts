import { ChangeDetectionStrategy, Component, inject, signal, WritableSignal } from '@angular/core';
import { PublicReservePreviewComponent } from "../public-reserve-preview/public-reserve-preview.component";
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiDay, TuiDestroyService, TuiTime } from '@taiga-ui/cdk';
import { JsonPipe } from '@angular/common';
import { PublicReservationsService } from '@core/services/http/public-reservations.service';
import { NotificationsService } from '@core/services/notifications.service';
import { parseHttpErrorMessage, parseHttpErrorMessageFromErrors } from '@core/lib/parse-http-error-message';
import { SOMETHING_WENT_WRONG_MESSAGE } from '@core/lib/something-went-wrong-message';
import { tuiDatetimeToIsoString, tuiTimeToUTCString } from '@core/lib/tui-datetime-to-iso-string';
import { catchError, filter, finalize, map, Observable, of, takeUntil, tap } from 'rxjs';
import { PreorderReservationGroupData } from '@core/lib/interfaces/preorder-reservation-group-data';
import { HttpErrorResponse } from '@angular/common/http';
import { PreorderReservationGroup } from '@core/models/preorder-reservation-group';
import { TableType } from '@core/models/table-type';
import { TableTypeToPreorderReservationGroup } from '@core/lib/interfaces/table-type-to-preorder-reservation-group';

// type mario = { date: TuiDay, time: TuiTime, people: number };

/**
 * As of 2 may 2025.
 * Got three steps of the form:
 * 1. Select date, time and number of people
 * 2. Select table type (only table types are available)
 * 3. Fill in the form with personal information, contact, etc...
 */
@Component({
  selector: 'app-public-reservation-formv2',
  standalone: true,
  imports: [
    PublicReservePreviewComponent,
    ReactiveFormsModule,
    JsonPipe,
  ],
  templateUrl: './public-reservation-formv2.component.html',
  styleUrl: './public-reservation-formv2.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService
  ]
})
export class PublicReservationFormv2Component {

  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly reservations: PublicReservationsService = inject(PublicReservationsService);
  private readonly notifications: NotificationsService = inject(NotificationsService);

  readonly datePeopleControl: FormControl<{ date: TuiDay | null, time: TuiTime | null, people: number | null } | null> = new FormControl<{ date: TuiDay | null, time: TuiTime | null, people: number | null } | null>(null, [Validators.required]);
  readonly tableTypeControl: FormControl<{ tableType: TableType | null } | null> = new FormControl<{ tableType: TableType | null } | null>(null);

  readonly preorder: WritableSignal<PreorderReservationGroup | null> = signal<PreorderReservationGroup | null>(null);
  readonly loadingTableTypes: WritableSignal<boolean> = signal<boolean>(false);

  ngOnInit(): void {
    // this.datePeopleControl.valueChanges.pipe(
    //   takeUntil(this.destroy$),
    //   filter(() => this.datePeopleControl.valid),
    //   filter((v: { date: TuiDay | null, time: TuiTime | null, people: number | null } | null): v is mario => v && v.date && v.time && v.people ? true : false),
    // ).subscribe((v: mario) => {
    //   this.loadPaymentInfo(v).subscribe();
    // });
  }

  previewSubmitted(event: { date: TuiDay; time: TuiTime; people: number; }): void {
    this.loadPaymentInfo(event).subscribe({
      next: (v: PreorderReservationGroup | null) => {
        if (v)
          this.askTableType(v);
        else
          this.showLastPage();
      }
    })
  }

  loadPaymentInfo(event: { date: TuiDay; time: TuiTime; people: number; }): Observable<PreorderReservationGroup | null> {

    this.loadingTableTypes.set(true);
    return this.reservations.datetimeRequiresPayment({
      date: event.date.toString("YMD", "-"),
      time: tuiTimeToUTCString(event.time),
      people: event.people,
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loadingTableTypes.set(false)),
      map((v: { preorder_reservation_group: PreorderReservationGroup } | null) => v?.preorder_reservation_group || null),
      catchError((error: HttpErrorResponse) => {
        this.notifications.error(parseHttpErrorMessage(error) || SOMETHING_WENT_WRONG_MESSAGE);
        return of(null);
      })
    );
  }


  // Step 2
  askTableType(v: PreorderReservationGroup): void {
    // when completed, call showLastPage();
    this.preorder.set(v);
  }

  // Step 3
  showLastPage(): void {

  }
}

import { Component, inject, signal, WritableSignal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DatePeriodComponent } from '@core/components/date-period/date-period.component';
import { isReservationStatus, ReservationStatus } from '@core/lib/interfaces/reservation-data';
import { TuiDayRange, TuiDestroyService } from '@taiga-ui/cdk';
import { TuiButtonModule, TuiTextfieldControllerModule } from '@taiga-ui/core';
import { ErrorsComponent } from "../../../../core/components/errors/errors.component";
import { ReservationsService } from '@core/services/http/reservations.service';
import { DatePipe } from '@angular/common';
import { finalize, takeUntil } from 'rxjs';
import { ReservationStatusSelectComponent } from '@core/components/reservation-status-select/reservation-status-select.component';
import { RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationsService } from '@core/services/notifications.service';
import { parseHttpErrorMessage } from '@core/lib/parse-http-error-message';
import { SOMETHING_WENT_WRONG_MESSAGE } from '@core/lib/something-went-wrong-message';
import { TuiInputModule } from '@taiga-ui/kit';

@Component({
  selector: 'app-export-reservations-modal',
  standalone: true,
  imports: [
    DatePeriodComponent,
    ReactiveFormsModule,
    TuiButtonModule,
    ErrorsComponent,
    ReservationStatusSelectComponent,
    RouterModule,
    TuiInputModule,
    TuiTextfieldControllerModule,
  ],
  templateUrl: './export-reservations-modal.component.html',
  providers: [
    TuiDestroyService
  ]
})
export class ExportReservationsModalComponent {

  private readonly service: ReservationsService = inject(ReservationsService);
  private readonly destroy$ = inject(TuiDestroyService);
  private readonly date: DatePipe = inject(DatePipe);
  private readonly notifications: NotificationsService = inject(NotificationsService);

  readonly loading: WritableSignal<boolean> = signal(false);

  readonly form = new FormGroup<{
    created_at: AbstractControl<TuiDayRange | null>,
    status: AbstractControl<ReservationStatus | null>,
    datetime: AbstractControl<TuiDayRange | null>,
    query: AbstractControl<string | null>,
  }>({
    created_at: new FormControl<TuiDayRange | null>(null),
    datetime: new FormControl<TuiDayRange | null>(null),
    status: new FormControl<ReservationStatus | null>(null),
    query: new FormControl<string | null>(null),
  });

  export(): void {
    this.loading.set(true);
    this.service.export(this.formatFormValue()).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading.set(false))
    ).subscribe({
      error: (h: HttpErrorResponse) => {
        this.notifications.error(parseHttpErrorMessage(h) || SOMETHING_WENT_WRONG_MESSAGE);
      }
    });
  }

  private formatFormValue(): Record<string, string | number | boolean> {
    const result: Record<string, string | number | boolean> = {};

    if (this.form.value.query) {
      result["query"] = this.form.value.query;
    }

    if (this.form.value.created_at) {
      result["created_at_from"] = this.date.transform(this.form.value.created_at.from.toUtcNativeDate(), 'yyyy-MM-dd') || '';
      result["created_at_to"] = this.date.transform(this.form.value.created_at.to.toUtcNativeDate(), 'yyyy-MM-dd') || '';
    }

    if (this.form.value.datetime) {
      result["datetime_from"] = this.date.transform(this.form.value.datetime.from.toUtcNativeDate(), 'yyyy-MM-dd') || '';
      result["datetime_to"] = this.date.transform(this.form.value.datetime.to.toUtcNativeDate(), 'yyyy-MM-dd') || '';
    }

    if (this.form.value.status && isReservationStatus(this.form.value.status)) {
      result["status"] = this.form.value.status;
    }

    return result;
  }
}

import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal, ViewChild, WritableSignal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HolidayFormComponent } from '@core/components/holiday-form/holiday-form.component';
import { parseHttpErrorMessage } from '@core/lib/parse-http-error-message';
import { ReactiveErrors } from '@core/lib/reactive-errors/reactive-errors';
import { SOMETHING_WENT_WRONG_MESSAGE } from '@core/lib/something-went-wrong-message';
import { HolidaysService } from '@core/services/http/holidays.service';
import { PreorderReservationGroupsService } from '@core/services/http/preorder-reservation-groups.service';
import { TableTypesService } from '@core/services/http/table-types.service';
import { NotificationsService } from '@core/services/notifications.service';
import { TuiDestroyService } from '@taiga-ui/cdk';
import { takeUntil, finalize } from 'rxjs';
import { TableTypeFormComponent } from "../../../../../core/components/table-type-form/table-type-form.component";

@Component({
  selector: 'app-new',
  standalone: true,
  imports: [
    TableTypeFormComponent
  ],
  templateUrl: './new.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService,
  ],
})
export class NewComponent {
  private readonly service = inject(TableTypesService);
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly router: Router = inject(Router);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly notifications: NotificationsService = inject(NotificationsService);

  readonly loading: WritableSignal<boolean> = signal(false);

  @ViewChild(HolidayFormComponent) form?: HolidayFormComponent;

  submit(data: Record<string, unknown>): void {
    if (this.loading()) return;

    this.loading.set(true);
    this.service.create(data).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: () => {
        this.router.navigate(['../'], { relativeTo: this.route });
      },
      error: (e: HttpErrorResponse) => {
        this.manageErrors(e);
      }
    })
  }

  cancel() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  private manageErrors(e: HttpErrorResponse): void {
    this.notifications.error(parseHttpErrorMessage(e) || SOMETHING_WENT_WRONG_MESSAGE);

    const form: FormGroup | null | undefined = this.form?.findForm();
    if (!form) throw new Error('Form not found');

    if (e.status == 422) {
      ReactiveErrors.assignErrorsToForm(form, e);
      // this.cd.detectChanges();
    }
  }
}

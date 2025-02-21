import { ChangeDetectionStrategy, Component, Inject, signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Reservation } from '@core/models/reservation';
import { TuiAutoFocusModule } from '@taiga-ui/cdk';
import { TuiButtonModule, TuiDialogContext, TuiTextfieldControllerModule } from '@taiga-ui/core';
import { TuiInputModule } from '@taiga-ui/kit';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';

@Component({
  selector: 'app-edit-reservation-table-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TuiButtonModule,
    TuiTextfieldControllerModule,
    TuiInputModule,
    TuiAutoFocusModule,
  ],
  template: `
    <form class="m-3 p-3" (ngSubmit)="submit()" [formGroup]="form">
      <div class="mb-3">
        <tui-input [tuiAutoFocus]="true" [formControl]="control">
          <ng-container i18n>Tavolo numero</ng-container>
        </tui-input>
      </div>

      <div class="flex items-center">
        <button type="submit" tuiButton>
          Conferma
        </button>

        <button (click)="cancel()" type="button" tuiButton appearance="icon">
          Annulla
        </button>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditReservationTableModalComponent {
  readonly control = new FormControl<string | null>(null);

  readonly form = new FormGroup<{
    control: FormControl<string | null>
  }>({
    control: this.control
  });


  constructor(
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: TuiDialogContext<string | null | false, Record<string | number, any>>,
  ) {
    let value: string | null = null;
    if (context['data'] && typeof context['data'] === "object" && context["data"]["item"] instanceof Reservation) {
      const reservation: Reservation = context["data"]["item"];
      value = reservation.table || null;
    } else if (context["data"] && typeof context["data"]["table"] === "string") {
      value = context["data"]["table"]
    }

    this.control.patchValue(value);
  }

  submit(): void {
    this.context.completeWith(this.control.value);
  }

  cancel(): void {
    this.context.completeWith(false);
  }
}

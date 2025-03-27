import { ChangeDetectionStrategy, Component, EventEmitter, forwardRef, inject, Input, Output, signal, WritableSignal } from '@angular/core';
import { ReservationTurn } from '@core/models/reservation-turn';
import { ControlValueAccessor, FormControl, FormGroup, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CurrencyPipe, JsonPipe } from '@angular/common';
import { TuiAutoFocusModule, TuiDestroyService } from '@taiga-ui/cdk';
import { PreorderReservationDate } from '@core/models/preorder-reservation-date';
import { PreorderReservationGroup } from '@core/models/preorder-reservation-group';
import { Observable, takeUntil } from 'rxjs';
import { CustomValidators } from '@core/lib/custom-validators';
import { PreorderReservationGroupData, PreorderReservationGroupStatuses } from '@core/lib/interfaces/preorder-reservation-group-data';
import { TuiButtonModule, TuiDataListModule, TuiExpandModule, TuiHintModule, TuiTextfieldControllerModule } from '@taiga-ui/core';
import { TuiCheckboxBlockModule, TuiInputDateModule, TuiInputModule, TuiInputNumberModule, TuiSelectModule, TuiTextareaModule } from '@taiga-ui/kit';
import { PreorderReservationGroupPreorderTypeComponent } from "../preorder-reservation-group-preorder-type/preorder-reservation-group-preorder-type.component";
import { ErrorsComponent } from '../errors/errors.component';
import { ReservationTurnData } from '@core/lib/interfaces/reservation-turn-data';
import { PreorderReservationDateData } from '@core/lib/interfaces/preorder-reservation-date-data';
import { Router, ActivatedRoute } from '@angular/router';
import { PreorderReservationGroupCasesComponent, TurnDateOutputFormat } from "../preorder-reservation-group-cases/preorder-reservation-group-cases.component";
import { SelectTurnsPaymentv2Component } from "../select-turns-paymentv2/select-turns-paymentv2.component";
import { I18nInputComponent } from '../i18n-input/i18n-input.component';
import { SelectPreorderTypeComponent } from "../select-preorder-type/select-preorder-type.component";
import { AllergenSelectComponent } from "../dynamic-selects/table-type-select/table-type-select.component";
import { TableTypeToPreorderReservationGroupInputComponent } from "../table-type-to-preorder-reservation-group-input/table-type-to-preorder-reservation-group-input.component";
import { TableTypeToPreorderReservationGroup } from '@core/lib/interfaces/table-type-to-preorder-reservation-group';

@Component({
  selector: 'app-preorder-reservation-group-form',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TuiButtonModule,
    TuiInputModule,
    TuiTextareaModule,
    TuiSelectModule,
    TuiDataListModule,
    TuiAutoFocusModule,
    ErrorsComponent,
    TuiInputNumberModule,
    TuiTextfieldControllerModule,
    TuiHintModule,
    TuiCheckboxBlockModule,
    TuiExpandModule,
    TuiInputDateModule,
    SelectTurnsPaymentv2Component,
    I18nInputComponent,
    SelectPreorderTypeComponent,
    AllergenSelectComponent,
    TableTypeToPreorderReservationGroupInputComponent,
    JsonPipe,
],
  templateUrl: './preorder-reservation-group-form.component.html',
  styleUrl: './preorder-reservation-group-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService,
  ],
})
export class PreorderReservationGroupFormComponent {
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly router: Router = inject(Router);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);

  @Output()
  readonly submit: EventEmitter<Record<string, unknown>> = new EventEmitter<Record<string, unknown>>();

  readonly disabled: WritableSignal<boolean> = signal(false);

  readonly form = new FormGroup<{
    title: FormControl<string | null>,
    active: FormControl<boolean | null>,
    payment_value: FormControl<number | null>,
    message: FormControl<Record<string, string> | null>,
    preorder_type: FormControl<PreorderReservationGroup["preorder_type"] | null>,
    table_types: FormControl<TableTypeToPreorderReservationGroup[] | null> 
  }>({
    title: new FormControl<string | null>($localize`Pagamento alla prenotazione richiesto ${Date.now()}`, [Validators.required]),
    active: new FormControl<boolean | null>(true, [Validators.required, Validators.pattern(/^(true|false)$/)]),
    payment_value: new FormControl<number | null>(null, [Validators.required]),
    message: new FormControl<Record<string, string> | null>(null, []),
    preorder_type: new FormControl<PreorderReservationGroup["preorder_type"] | null>(null, [Validators.required]),
    table_types: new FormControl<TableTypeToPreorderReservationGroup[] | null>(null, [])
  });

  private submitted: boolean = false;

  private _item: PreorderReservationGroup | null = null;
  readonly cases: WritableSignal<TurnDateOutputFormat | null> = signal(null);

  @Input()
  set item(obj: unknown) {
    if (!(obj instanceof PreorderReservationGroup)) {
      console.warn('PreorderReservationGroupFormComponent: value is blank or invalid', obj);
      this.form.reset();
      this._item = null;
      return;
    }

    this._item = obj;

    this.form.patchValue({
      payment_value: obj.payment_value ?? null,
      title: obj.title ?? null,
      active: obj.status === "active",
      message: obj.translations?.message || {},
      preorder_type: obj.preorder_type,
      table_types: obj.table_type_to_preorder_reservation_groups ?? []
    })
  }

  get item(): PreorderReservationGroup | null {
    return this._item;
  }

  readonly e = this.errorsForControl;

  errorsForControl(controlName: string): ValidationErrors | null {
    const control = this.form.get(controlName);
    if (!control) return null;
    if (this.submitted || control.touched) return control.errors ?? null;

    return null;
  }

  cancel() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  formSubmit() {
    this.submitted = true;
    if (this.form.invalid) return;

    const data: Record<string, unknown> = {
      ...this.form.value,
      ...(this.cases() ?? {}),
    };

    data["status"] = data["active"] ? "active" : "inactive";
    delete data["active"];

    this.submit.emit(data);
  }
}

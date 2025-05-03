import { ChangeDetectionStrategy, Component, EventEmitter, forwardRef, inject, Input, OnInit, Output, signal, WritableSignal } from '@angular/core';
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators } from '@angular/forms';
import { PreorderReservationGroup } from '@core/models/preorder-reservation-group';
import { TableType } from '@core/models/table-type';
import { TuiAutoFocusModule, TuiDestroyService } from '@taiga-ui/cdk';
import { TuiButtonModule, TuiPrimitiveTextfieldModule, TuiTextfieldControllerModule } from '@taiga-ui/core';
import { TuiCheckboxLabeledModule, TuiInputModule, TuiInputPhoneInternationalModule, TuiInputPhoneModule, TuiSelectModule } from '@taiga-ui/kit';
import { takeUntil } from 'rxjs';
import { ErrorsComponent } from "../../errors/errors.component";
import { ConfigsService } from '@core/services/configs.service';
import { TuiCountryIsoCode } from '@taiga-ui/i18n';
import { TermsAndConditionsLinkComponent } from "../../terms-and-conditions-link/terms-and-conditions-link.component";
import { PublicReserve2 } from '../public-reservation-formv2/public-reservation-formv2.component';
import { NotificationsService } from '@core/services/notifications.service';

@Component({
  selector: 'app-contact-confirm',
  standalone: true,
  imports: [
    TuiButtonModule,
    TuiInputModule,
    TuiTextfieldControllerModule,
    TuiAutoFocusModule,
    ReactiveFormsModule,
    TuiInputPhoneInternationalModule,
    ErrorsComponent,
    TuiCheckboxLabeledModule,
    TermsAndConditionsLinkComponent
  ],
  templateUrl: './contact-confirm.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ContactConfirmComponent),
      multi: true,
    }
  ],
})
export class ContactConfirmComponent implements ControlValueAccessor, OnInit {

  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly notifications: NotificationsService = inject(NotificationsService);

  @Output() submitted: EventEmitter<PublicReserve2.ContactData> = new EventEmitter<PublicReserve2.ContactData>();

  @Input() showLoader: boolean = false;

  readonly formSubmitted: WritableSignal<boolean> = signal<boolean>(false);

  readonly form = new FormGroup<{
    firstName: FormControl<string | null>,
    lastName: FormControl<string | null>,
    email: FormControl<string | null>,
    phone: FormControl<string | null>,
    notes: FormControl<string | null>,
    acceptTerms: FormControl<boolean | null>,
  }>({
    firstName: new FormControl<string | null>(null, [Validators.required]),
    lastName: new FormControl<string | null>(null, [Validators.required]),
    email: new FormControl<string | null>(null, [Validators.required, Validators.email]),
    phone: new FormControl<string | null>(null, [Validators.required]),
    notes: new FormControl<string | null>(null),
    acceptTerms: new FormControl<boolean | null>(false, [Validators.requiredTrue]),
  });

  readonly countries: readonly TuiCountryIsoCode[] = Object.values(TuiCountryIsoCode);

  countryIsoCode = TuiCountryIsoCode.IT;

  ngOnInit(): void {
    // throw new Error('Method not implemented.');
  }

  writeValue(obj: any): void {
    this.form.patchValue(obj);
  }

  registerOnChange(fn: any): void {
    this.form.valueChanges.pipe(
      takeUntil(this.destroy$),
    ).subscribe((v) => fn(v))
  }

  registerOnTouched(fn: any): void {
    this.form.valueChanges.pipe(
      takeUntil(this.destroy$),
    ).subscribe((v) => fn(v))
  }

  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.form.disable();
    } else {
      this.form.enable();
    }
  }

  formSubmit(): void {
    const out = this.formatOutput();
    this.formSubmitted.set(true);

    if (out) this.submitted.emit(out);
    else this.notifications.error("Please fill in all required fields");
  }

  private formatOutput(): PublicReserve2.ContactData | null {
    if (this.form.invalid) return null;

    const firstName: string | null = this.form.controls.firstName.value;
    const lastName: string | null = this.form.controls.lastName.value;
    const email: string | null = this.form.controls.email.value;
    const phone: string | null = this.form.controls.phone.value;
    const notes: string | null = this.form.controls.notes.value;

    if (firstName && lastName && email && phone) {
      return {
        firstName,
        lastName,
        email,
        phone,
        notes,
      };
    } else {
      return null;
    }
  }
}

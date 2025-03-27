import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, computed,
  EventEmitter,
  inject,
  isDevMode,
  OnInit,
  Output, Signal,
  signal,
  WritableSignal
} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {CustomValidators} from "@core/lib/custom-validators";
import {
  TuiCarouselModule, TuiCheckboxBlockModule,
  TuiCheckboxLabeledModule,
  TuiInputModule, TuiInputNumberModule, tuiInputNumberOptionsProvider,
  TuiInputPhoneInternationalModule,
  TuiStepperModule,
  TuiTextareaModule
} from "@taiga-ui/kit";
import {TuiAutoFocusModule, TuiDestroyService, tuiPure} from "@taiga-ui/cdk";
import {
  PeopleCountInputComponent
} from "@core/components/public-reservation-form/people-count-input/people-count-input.component";
import {filter, finalize, takeUntil, tap} from "rxjs";
import {DatetimeInputComponent} from "@core/components/public-reservation-form/datetime-input/datetime-input.component";
import {isoTimezoneRexExp} from "@core/lib/tui-datetime-to-iso-string";
import {TuiButtonModule, TuiExpandModule} from "@taiga-ui/core";
import {DatePipe} from "@angular/common";
import {TuiCountryIsoCode} from '@taiga-ui/i18n';
import {CreateReservationData, formatReservationData} from "@core/lib/interfaces/create-reservation-data";
import {PublicReservationsService} from "@core/services/http/public-reservations.service";
import {SOMETHING_WENT_WRONG_MESSAGE} from "@core/lib/something-went-wrong-message";
import {NotificationsService} from "@core/services/notifications.service";
import {Reservation} from "@core/models/reservation";
import {HttpErrorResponse} from "@angular/common/http";
import {PublicPagesDataService} from "@core/services/http/public-pages-data.service";
import {PublicData} from "@core/lib/interfaces/public-data";
import {Setting, SettingValue} from "@core/lib/settings";
import {ActiveError} from "@core/lib/interfaces/active-error";
import {
  extractErrors,
  parseHttpErrorMessage,
  parseHttpErrorMessageFromErrors
} from "@core/lib/parse-http-error-message";
import {ReactiveErrors} from "@core/lib/reactive-errors/reactive-errors";
import {ErrorsComponent} from "@core/components/errors/errors.component";
import { ConfigsService } from '@core/services/configs.service';
import { Router } from '@angular/router';
import { TermsAndConditionsLinkComponent } from "../terms-and-conditions-link/terms-and-conditions-link.component";

interface FormStep {
  form: FormGroup | AbstractControl;
  submitted: boolean;
  viewed: boolean;
}

@Component({
  selector: 'app-public-reservation-form',
  standalone: true,
  imports: [
    TuiStepperModule,
    PeopleCountInputComponent,
    ReactiveFormsModule,
    TuiCarouselModule,
    DatetimeInputComponent,
    TuiInputModule,
    TuiButtonModule,
    DatePipe,
    TuiAutoFocusModule,
    TuiInputPhoneInternationalModule,
    TuiTextareaModule,
    TuiInputNumberModule,
    // TuiCheckboxBlockModule,
    TuiExpandModule,
    ErrorsComponent,
    TuiCheckboxLabeledModule,
    TermsAndConditionsLinkComponent
],
  templateUrl: './public-reservation-form.component.html',
  styleUrl: './public-reservation-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService,
  ]
})
export class PublicReservationFormComponent implements OnInit {
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly reservations: PublicReservationsService = inject(PublicReservationsService);
  private readonly notifications: NotificationsService = inject(NotificationsService);
  private readonly publicDataService: PublicPagesDataService = inject(PublicPagesDataService);
  private readonly cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly router: Router = inject(Router);

  @Output() createdReservation: EventEmitter<Reservation> = new EventEmitter<Reservation>();

  readonly currentIndex: WritableSignal<number> = signal(0);
  private lastMaxIndex: number = 0;
  readonly maxIndex: Signal<number> = computed(() => {
    const index = this.currentIndex();
    if (this.lastMaxIndex < index) this.lastMaxIndex = index;

    return this.lastMaxIndex;
  });

  readonly maxPeople: WritableSignal<number> = signal(10);
  readonly maxDaysInAdvance: WritableSignal<number> = signal(300);

  /**
   * Is right now sending request to server?
   */
  readonly submitting: WritableSignal<boolean> = signal(false);

  /**
   * Has sent "submit" been clicked?
   */
  readonly submitted: WritableSignal<boolean> = signal(false);

  readonly people: FormControl<number | null> = new FormControl(null, [Validators.required, CustomValidators.min(0)]);
  readonly datetime: FormControl<string | null> = new FormControl(null, [Validators.required, CustomValidators.pattern(isoTimezoneRexExp)]);

  tableTypeId: number | null = null;

  readonly contacts: FormGroup = new FormGroup({
    firstName: new FormControl<string | null>(null, [Validators.required, Validators.minLength(2)]),
    lastName: new FormControl<string | null>(null, [Validators.required, Validators.minLength(2)]),
    email: new FormControl<string | null>(null, [Validators.required, Validators.email]),
    phone: new FormControl<string | null>(null, [Validators.required, Validators.minLength(6)]),
  });

  readonly notesForm: FormGroup = new FormGroup({
    notes: new FormControl<string | null>(null),
    children: new FormControl(0, [Validators.required, CustomValidators.min(0)]),
    acceptTerms: new FormControl(false, [Validators.requiredTrue])
  });

  readonly countries: readonly TuiCountryIsoCode[] = Object.values(TuiCountryIsoCode);

  private readonly configs: ConfigsService = inject(ConfigsService);

  /**
   * TODO this field should be set depending on the user's headers AND the selected language for the website.
   */
  countryIsoCode = TuiCountryIsoCode.IT;

  locale: string = 'en';

  readonly steps: { [index: number]: FormStep } = {
    0: {
      form: this.people,
      submitted: false,
      viewed: false
    },
    1: {
      form: this.datetime,
      submitted: false,
      viewed: false
    },
    2: {
      form: this.contacts,
      submitted: false,
      viewed: false
    },
    3: {
      form: this.notesForm,
      submitted: false,
      viewed: false
    }
  };

  ngOnInit(): void {
    this.configs.locale$.pipe(takeUntil(this.destroy$)).subscribe((locale) => {
      this.locale = locale ? locale.split('-')[0] : 'en';
    });

    /**
     * Listen to the people form changes and move to the next step.
     */
    this.people.valueChanges.pipe(
      takeUntil(this.destroy$),
      filter((value: unknown): value is number => typeof value === "number" && value > 0),
      filter(() => this.currentIndex() === 0)
    ).subscribe({
      next: () => {
        setTimeout(() => this.nextStep(), 10)
      }
    });

    this.datetime.valueChanges.pipe(
      takeUntil(this.destroy$),
      filter((value: unknown) => this.datetime.valid),
      filter(() => this.currentIndex() === 1)
    ).subscribe({
      next: (): void => {
        setTimeout(() => this.nextStep(), 10)
      }
    });

    this.publicDataService.data$.pipe(
      takeUntil(this.destroy$),
      filter((data: PublicData | null): data is PublicData => data !== null)
    ).subscribe({
      next: (data: PublicData) => {
        const maxPeople: SettingValue | null = data.settings["max_people_per_reservation"] ?? null;
        this.maxPeople.set(maxPeople ? Number(maxPeople) : this.maxPeople());

        const maxDaysInAdvance: SettingValue | null = data.settings["reservation_max_days_in_advance"] ?? null;
        this.maxDaysInAdvance.set(maxDaysInAdvance ? Number(maxDaysInAdvance) : this.maxDaysInAdvance());
      }
    })

    /**
     * DEVELOPMENT ONLY:
     */
    // if (isDevMode()){
    //   setTimeout(() => {
    //     this.loadPrevious({
    //       adults: 2,
    //       children: 1,
    //       datetime: `2024-11-18T18:00:00.000Z`,
    //       firstName: `Sasha`,
    //       lastName: `Kirpachov`,
    //       email: `sasha@opinioni.net`,
    //       phone: `3515590063`,
    //       phoneCountry: `IT`
    //     });
    //   }, 500);
    // }
  }

  nextStep(): void {
    this.currentStep().submitted = true;
    if (this.currentStep().form.invalid) return;

    if (this.steps[this.currentIndex() + 1]) {
      this.currentIndex.update((index) => index + 1);
      this.currentStep().viewed = true;
    } else {
      this.submitForm();
    }
  }

  setState(number: number): void {
    this.currentIndex.set(number);
  }

  @tuiPure
  getState(forIndex: number): 'error' | 'normal' | 'pass' {
    const step: { form: FormGroup | AbstractControl } | undefined = this.steps[forIndex];
    if (!step) return 'normal';

    const form: FormGroup | AbstractControl | undefined = step.form;
    if (!form || (forIndex > this.currentIndex())) return "normal";

    if (form.invalid && form.dirty) return 'error';
    if (form.valid) return 'pass';
    return 'normal';
  }

  @tuiPure
  showErrorsFor(index: number): boolean {
    if (this.submitted()) return true;

    const step: { form: FormGroup | AbstractControl, submitted: boolean } | undefined = this.steps[index];
    if (!step) return true;

    return step.submitted;
  }

  private currentStep(): FormStep {
    return this.steps[this.currentIndex()];
  }

  private loadPrevious(data: {
    adults?: number,
    children?: number,
    datetime?: string,
    firstName?: string,
    lastName?: string,
    email?: string,
    phone?: string,
    phoneCountry?: string,
    notes?: string;

  }): void {
    let people = 0;
    if (data.adults) people += data.adults;
    if (data.children) people += data.children;

    this.people.setValue(people || null);

    if (data.datetime) {
      this.datetime.setValue(data.datetime);
    } else {
      this.datetime.setValue(null);
    }

    if (data.firstName) this.contacts.get('firstName')?.setValue(data.firstName);
    if (data.lastName) this.contacts.get('lastName')?.setValue(data.lastName);
    if (data.email) this.contacts.get('email')?.setValue(data.email);
    if (data.phone) this.contacts.get('phone')?.setValue(data.phone);
    if (data.phoneCountry) this.countryIsoCode = data.phoneCountry as TuiCountryIsoCode;
    if (data.notes) this.notesForm.patchValue({notes: data.notes});
    if (data.children) this.notesForm.patchValue({children: data.children});
  }

  private formatOutput(): CreateReservationData | null {
    const email: string | undefined = this.contacts.get('email')?.value;
    const phone: string | undefined = this.contacts.get('phone')?.value;
    const firstName: string | undefined = this.contacts.get('firstName')?.value;
    const lastName: string | undefined = this.contacts.get('lastName')?.value;
    const datetime: string | undefined | null = this.datetime.value;
    const children: number | undefined | null = this.notesForm.get(`children`)?.value;
    const people: number | undefined | null = this.people.value;
    const notes: string | null | undefined = this.notesForm.get(`notes`)?.value;
    const tableTypeId: number | null = this.tableTypeId;

    let adults = people || 0;
    if (children) adults -= children;

    return formatReservationData({
      email,
      phone,
      datetime,
      children,
      notes,
      adults,
      tableTypeId,
      firstName,
      lastName,
      lang: this.locale,
    });
  }

  private reset(): void {
    this.currentIndex.set(0);
    Object.values(this.steps).forEach((key: { form: AbstractControl | FormGroup }) => key.form.reset());
  }

  private submitForm(): void {
    this.submitted.set(true);

    const out = this.formatOutput();

    if (!out) {
      this.notifications.error(SOMETHING_WENT_WRONG_MESSAGE);
      return;
    }

    // Showing the spinner after 500ms
    let loaderTimeout = setTimeout(() => this.submitting.set(true), 500);
    this.reservations.create(out).pipe(
      takeUntil(this.destroy$),
      finalize(() => clearTimeout(loaderTimeout)),
      finalize(() => this.submitting.set(false)),
    ).subscribe({
      next: (item: Reservation): void => {
        if (item.payment?.hpp_url) {
          window.location.href = item.payment.hpp_url;
        } else {
          this.createdReservation.emit(item);
          this.notifications.success($localize`La tua prenotazione è stata creata. A breve ti invieremo un'email di conferma.`);
          this.reset();

          if (item.secret)
            this.router.navigate([`/r/`, item.secret]);
        }
      },
      error: (response: unknown): void => {
        if (response instanceof HttpErrorResponse && response.status === 422) {
          this.manageUnprocessableEntity(response);
        } else {
          this.notifications.error(response instanceof HttpErrorResponse ? parseHttpErrorMessage(response) : SOMETHING_WENT_WRONG_MESSAGE);
        }
      }
    });
  }

  private manageUnprocessableEntity(response: unknown): void {
    if (!(response instanceof HttpErrorResponse)) {
      this.notifications.error(SOMETHING_WENT_WRONG_MESSAGE);
      return;
    }

    if (!(response.status == 422 && typeof response.error === "object" && response.error !== null && typeof (response.error as Record<string, unknown>["details"]) == "object" && Object.keys(response.error["details"]).length > 0)) {
      console.warn(`expected response to have status 422 and error { details: { <field>: <error> } } but did not `, response);
      this.notifications.error(SOMETHING_WENT_WRONG_MESSAGE);
      return;
    }

    const error: Record<string, ActiveError[]> = response.error.details;
    console.warn(`manageUnprocessableEntity()`, {error, response});
    if (error["people"]) {
      ReactiveErrors.assignErrorsToFormFromArray(this.people, error["people"]);
      delete error["adults"];
      delete error["children"];
      delete error["people"];
    }

    if (error["datetime"]) {
      ReactiveErrors.assignErrorsToFormFromArray(this.datetime, error["datetime"]);
      delete error["datetime"];
    }

    if (error["first_name"]) {
      ReactiveErrors.assignErrorsToFormFromArray(this.contacts.controls["firstName"], error["first_name"]);
      delete error["first_name"];
    }

    if (error["last_name"]) {
      ReactiveErrors.assignErrorsToFormFromArray(this.contacts.controls["lastName"], error["last_name"]);
      delete error["last_name"];
    }

    if (error["phone"]) {
      ReactiveErrors.assignErrorsToFormFromArray(this.contacts.controls["phone"], error["phone"]);
      delete error["phone"];
    }

    if (error["email"]) {
      ReactiveErrors.assignErrorsToFormFromArray(this.contacts.controls["email"], error["email"]);
      delete error["email"];
    }

    if (Object.keys(error).length > 0) {
      this.notifications.error(parseHttpErrorMessageFromErrors(Object.values(error).flat()) ?? SOMETHING_WENT_WRONG_MESSAGE);
    }

    const step = Object.keys(this.steps).find((k: string) => this.steps[Number(k)].form.invalid);
    if (step && !isNaN(Number(step)) && Number(step) >= 0) this.currentIndex.set(Number(step));

    this.cd.detectChanges();
  }
}

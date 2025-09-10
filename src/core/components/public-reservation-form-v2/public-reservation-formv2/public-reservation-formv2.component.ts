import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, ViewChild, WritableSignal } from '@angular/core';
import { PublicReservePreviewComponent } from "../public-reserve-preview/public-reserve-preview.component";
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiDay, TuiDestroyService, TuiTime } from '@taiga-ui/cdk';
import { DatePipe, JsonPipe, NgClass } from '@angular/common';
import { PublicReservationsService } from '@core/services/http/public-reservations.service';
import { NotificationsService } from '@core/services/notifications.service';
import { parseHttpErrorMessage, parseHttpErrorMessageFromErrors } from '@core/lib/parse-http-error-message';
import { SOMETHING_WENT_WRONG_MESSAGE } from '@core/lib/something-went-wrong-message';
import { stringToTuiDay, stringToTuiTime, tuiDatetimeToIsoString, tuiTimeToUTCString } from '@core/lib/tui-datetime-to-iso-string';
import { catchError, filter, finalize, map, Observable, of, takeUntil, tap } from 'rxjs';
import { PreorderReservationGroupData } from '@core/lib/interfaces/preorder-reservation-group-data';
import { HttpErrorResponse } from '@angular/common/http';
import { PreorderReservationGroup } from '@core/models/preorder-reservation-group';
import { TableType } from '@core/models/table-type';
import { TableTypeToPreorderReservationGroup } from '@core/lib/interfaces/table-type-to-preorder-reservation-group';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { PublicReserveAskTableTypeComponent } from "../public-reserve-ask-table-type/public-reserve-ask-table-type.component";
import { CustomValidators } from '@core/lib/custom-validators';
import { ContactConfirmComponent } from "../contact-confirm/contact-confirm.component";
import { MatIconModule } from '@angular/material/icon';
import { TuiExpandModule } from '@taiga-ui/core';
import { TableTypeData } from '@core/lib/interfaces/table-type-data';
import { CreateReservationData, formatReservationData } from '@core/lib/interfaces/create-reservation-data';
import { ConfigsService } from '@core/services/configs.service';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Reservation } from '@core/models/reservation';
import { ReactiveErrors } from '@core/lib/reactive-errors/reactive-errors';
import { ActiveError } from '@core/lib/interfaces/active-error';

type mario = { date: TuiDay, time: TuiTime, people: number };

export namespace PublicReserve2 {
  export interface DatePeopleData {
    date: TuiDay;
    time: TuiTime;
    people: number;
  }

  export interface ContactData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    notes: string | null;
  }
}

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
    PublicReserveAskTableTypeComponent,
    ContactConfirmComponent,
    NgClass,
    MatIconModule,
    TuiExpandModule,
  ],
  templateUrl: './public-reservation-formv2.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService
  ]
})
export class PublicReservationFormv2Component {
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly reservations: PublicReservationsService = inject(PublicReservationsService);
  private readonly notifications: NotificationsService = inject(NotificationsService);
  private readonly configs: ConfigsService = inject(ConfigsService);
  private readonly router: Router = inject(Router);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);

  readonly invalidControl: FormControl = new FormControl(null, [Validators.required]);

  readonly datePeopleControl: FormControl<Partial<PublicReserve2.DatePeopleData> | null> = new FormControl<Partial<PublicReserve2.DatePeopleData> | null>(null, [Validators.required, CustomValidators.objectValuesAllPresent]);
  readonly tableTypeControl: FormControl<TableTypeData | null> = new FormControl<TableTypeData | null>(null);
  readonly contactControl = new FormControl<Partial<PublicReserve2.ContactData> | null>(null);

  readonly preorder: WritableSignal<PreorderReservationGroup | null> = signal<PreorderReservationGroup | null>(null);
  readonly loadingTableTypes: WritableSignal<boolean> = signal<boolean>(false);
  readonly savingReservation: WritableSignal<boolean> = signal<boolean>(false);

  private locale: string = 'en';

  // may be 1,2,3
  readonly stepIndex: WritableSignal<1 | 2 | 3> = signal<1 | 2 | 3>(1);

  @ViewChild('stepperHeader', { static: true }) stepper: ElementRef<HTMLDivElement> | null = null;

  @ViewChild(PublicReservePreviewComponent) datePeopleInput: PublicReservePreviewComponent | null = null;
  @ViewChild(ContactConfirmComponent) contactInput: ContactConfirmComponent | null = null;

  ngOnInit(): void {
    this.configs.locale$.pipe(takeUntil(this.destroy$)).subscribe((locale) => {
      this.locale = locale ? locale.split('-')[0] : 'en';
    });

    this.datePeopleControl.valueChanges.pipe(
      takeUntil(this.destroy$),
      tap(() => this.preorder.set(null)),
    ).subscribe()

    this.datePeopleControl.valueChanges.pipe(
      takeUntil(this.destroy$),
      filter(() => this.datePeopleControl.valid),
      filter((v: Partial<PublicReserve2.DatePeopleData> | null): v is mario => v && v.date && v.time && v.people ? true : false),
    ).subscribe((v: mario) => {
      this.loadPaymentInfo(v).subscribe();
    });

    this.listenQueryParamsAndUpdateForm();
  }

  previewSubmitted(event: PublicReserve2.DatePeopleData): void {
    this.loadPaymentInfoAndAskTableTypeOrShowLastPage(event);
  }

  tableTypeSubmitted($event: TableTypeData | null) {
    this.tableTypeControl.setValue($event);
    this.showLastPage();
  }

  /**
   * Last page submit. Will trigger the reservation creation.
   */
  contactSubmitted(event: PublicReserve2.ContactData): void {
    this.contactControl.patchValue(event);

    const out: CreateReservationData | null = this.formatOutput();
    if (out) return this.saveReservation(out);

    this.notifications.error($localize`Please fill in all required fields`);
  }

  loadPaymentInfo(event: { date: TuiDay; time: TuiTime; people: number; }): Observable<PreorderReservationGroup | null> {

    return this.reservations.datetimeRequiresPayment({
      date: event.date.toString("YMD", "-"),
      time: tuiTimeToUTCString(event.time),
      people: event.people,
    }).pipe(
      takeUntil(this.destroy$),
      map((v: { preorder_reservation_group: PreorderReservationGroup } | null) => v?.preorder_reservation_group || null),
      catchError((error: HttpErrorResponse) => {
        console.error("Error while loading payment info", error);
        this.notifications.error(parseHttpErrorMessage(error) || SOMETHING_WENT_WRONG_MESSAGE);
        return of(null);
      }),
      tap((v: PreorderReservationGroup | null) => this.preorder.set(v))
    );
  }


  // Step 2
  askTableType(): void {
    this.stepIndex.set(2);
    this.scrollTop();
  }

  // Step 3
  showLastPage(): void {
    this.stepIndex.set(3);
    this.scrollTop();
  }

  /**
   * User is seeing table type selection and wants to go back to date/time/people selection.
   */
  backFromTableTypeSelect(): void {
    this.stepIndex.set(1);
    this.tableTypeControl.setValue(null);
  }

  /**
   * User is seeing contact form and wants to go back to table type selection (or to date selection).
   */
  backFromContacts() {
    const v: PreorderReservationGroup | null = this.preorder();
    if (v && v.table_type_to_preorder_reservation_groups && v.table_type_to_preorder_reservation_groups.length > 0)
      this.stepIndex.set(2);
    else
      this.stepIndex.set(1);
  }

  private loadPaymentInfoAndAskTableTypeOrShowLastPage(event: { date: TuiDay; time: TuiTime; people: number; }) {
    this.loadingTableTypes.set(true);
    this.loadPaymentInfo(event).pipe(
      finalize(() => this.loadingTableTypes.set(false)),
    ).subscribe({
      next: (v: PreorderReservationGroup | null) => {
        if (v && v.table_type_to_preorder_reservation_groups && v.table_type_to_preorder_reservation_groups.length > 0) this.askTableType();
        else this.showLastPage();
      }
    });
  }

  private saveReservation(data: CreateReservationData): void {
    this.savingReservation.set(true);
    this.reservations.create(data).pipe(
      takeUntil(this.destroy$),
      // finalize(() => clearTimeout(loaderTimeout)),
      finalize(() => this.savingReservation.set(false)),
    ).subscribe({
      next: (item: Reservation): void => {
        if (item.payment?.hpp_url) {
          window.location.href = item.payment.hpp_url;
        } else {
          // this.createdReservation.emit(item);
          this.notifications.success($localize`La tua prenotazione è stata creata. A breve ti invieremo un'email di conferma.`);

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


  private formatOutput(): CreateReservationData | null {
    const email: string | undefined = this.contactControl.value?.email;
    const phone: string | undefined = this.contactControl.value?.phone;
    const firstName: string | undefined = this.contactControl.value?.firstName;
    const lastName: string | undefined = this.contactControl.value?.lastName;
    const datetime: string | undefined | null = this.datePeopleControl.value && this.datePeopleControl.value.date && this.datePeopleControl.value.time ? tuiDatetimeToIsoString(this.datePeopleControl.value.date, this.datePeopleControl.value.time) : null;
    const people: number | undefined | null = this.datePeopleControl.value?.people;
    const notes: string | null | undefined = this.contactControl.value?.notes;
    const tableTypeId: number | null = this.tableTypeControl.value?.id || null;

    let adults = people || 0;
    // if (children) adults -= children;

    return formatReservationData({
      email,
      phone,
      datetime,
      children: 0,
      // children,
      notes,
      adults,
      tableTypeId,
      firstName,
      lastName,
      lang: this.locale,
    });
  }

  private scrollTop(): void {
    setTimeout(() => {
      if (!this.stepper) {
        console.warn("stepper is null");
        return;
      }

      this.stepper?.nativeElement?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "center"
      });
    }, 100);
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
    console.warn(`manageUnprocessableEntity()`, { error, response });

    if (this.datePeopleInput) {
      if (error["people"]) {
        ReactiveErrors.assignErrorsToFormFromArray(this.datePeopleInput.form, error["people"]);
        delete error["adults"];
        delete error["children"];
        delete error["people"];
      }

      if (error["datetime"]) {
        ReactiveErrors.assignErrorsToFormFromArray(this.datePeopleInput.form, error["datetime"]);
        delete error["datetime"];
      }
    }

    if (this.contactInput) {
      if (error["first_name"]) {
        ReactiveErrors.assignErrorsToFormFromArray(this.contactInput.form, error["first_name"]);
        delete error["first_name"];
      }

      if (error["last_name"]) {
        ReactiveErrors.assignErrorsToFormFromArray(this.contactInput.form, error["last_name"]);
        delete error["last_name"];
      }

      if (error["phone"]) {
        ReactiveErrors.assignErrorsToFormFromArray(this.contactInput.form, error["phone"]);
        delete error["phone"];
      }

      if (error["email"]) {
        ReactiveErrors.assignErrorsToFormFromArray(this.contactInput.form, error["email"]);
        delete error["email"];
      }

      if (error["notes"]) {
        ReactiveErrors.assignErrorsToFormFromArray(this.contactInput.form, error["notes"]);
        delete error["notes"];
      }
    }

    if (Object.keys(error).length > 0) {
      this.notifications.error(parseHttpErrorMessageFromErrors(Object.values(error).flat()) ?? SOMETHING_WENT_WRONG_MESSAGE);
    }

    // const step = Object.keys(this.steps).find((k: string) => this.steps[Number(k)].form.invalid);
    // if (step && !isNaN(Number(step)) && Number(step) >= 0) this.currentIndex.set(Number(step));

    // this.cd.detectChanges();
  }

  private listenQueryParamsAndUpdateForm(): void {
    this.route.queryParams.pipe(
      takeUntil(this.destroy$),
    ).subscribe((params: Params) => {
      /**
       * Date, time and people
       */
      const people: number | null = params["people"] ? Number(params["people"]) : null;
      const date: TuiDay | null = params["date"] ? stringToTuiDay(params["date"]) : null;
      const time: TuiTime | null = params["time"] ? stringToTuiTime(params["time"]) : null;
      const currentDatePeopleControlValue: Partial<PublicReserve2.DatePeopleData> = this.datePeopleControl.value || {};

      this.datePeopleControl.setValue({ ...currentDatePeopleControlValue, date: date || undefined, time: time || undefined, people: people || undefined });

      /**
       * First name, last name, email, phone and notes
       */
      const firstName: string | null = params["firstName"] || null;
      const lastName: string | null = params["lastName"] || null;
      const email: string | null = params["email"] || null;
      const phone: string | null = params["phone"] || null;
      const notes: string | null = params["notes"] || null;
      const currentContactControlValue: Partial<PublicReserve2.ContactData> = this.contactControl.value || {};

      this.contactControl.setValue({ ...currentContactControlValue, firstName: firstName || undefined, lastName: lastName || undefined, email: email || undefined, phone: phone || undefined, notes: notes || undefined });
    });
  }
}

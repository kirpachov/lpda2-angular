import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Inject,
  Injector,
  OnInit,
  signal,
  WritableSignal
} from '@angular/core';
import {
  TuiAccordionModule,
  TuiInputDateModule,
  TuiInputDateTimeModule,
  TuiInputTimeModule,
  TuiToggleModule
} from "@taiga-ui/kit";
import {ErrorsComponent} from "@core/components/errors/errors.component";
import {FormControl, FormGroup, ReactiveFormsModule, ValidationErrors} from "@angular/forms";
import {TuiDay, TuiDestroyService, TuiTime} from "@taiga-ui/cdk";
import {MenuCategoriesService} from "@core/services/http/menu-categories.service";
import {NotificationsService} from "@core/services/notifications.service";
import {finalize, takeUntil} from "rxjs";
import {
  TuiButtonModule,
  TuiDialogContext,
  TuiDialogService,
  TuiExpandModule,
  TuiLinkModule,
  TuiLoaderModule
} from "@taiga-ui/core";
import {POLYMORPHEUS_CONTEXT, PolymorpheusComponent} from "@tinkoff/ng-polymorpheus";
import {MenuCategory} from "@core/models/menu-category";
import {VisibilityParams} from "@core/lib/interfaces/visibility-params";
import {HttpErrorResponse} from "@angular/common/http";
import {parseHttpErrorMessage} from "@core/lib/parse-http-error-message";
import {UrlToPipe} from "@core/pipes/url-to.pipe";
import {RouterLink} from "@angular/router";
import {MatIcon} from "@angular/material/icon";
import {JsonPipe, NgClass, PlatformLocation} from "@angular/common";
import {MenuVisibility} from "@core/models/menu-visibility";
import {
  dateToTuiDay,
  dateToTuiTime,
  tuiDatetimeToIsoString,
  tuiTimeToIsoString
} from "@core/lib/tui-datetime-to-iso-string";
import {QrCodeComponent} from "@core/components/qr-code/qr-code.component";
import {CopyContentComponent} from "@core/components/copy-content/copy-content.component";


@Component({
  selector: 'app-timestamps-modal',
  standalone: true,
  imports: [
    TuiToggleModule,
    ErrorsComponent,
    ReactiveFormsModule,
    TuiInputDateTimeModule,
    TuiButtonModule,
    TuiInputDateModule,
    TuiInputTimeModule,
    TuiExpandModule,
    RouterLink,
    TuiLinkModule,
    MatIcon,
    TuiLoaderModule,
    JsonPipe,
    QrCodeComponent,
    NgClass,
    TuiAccordionModule,
    UrlToPipe,
    CopyContentComponent
  ],
  templateUrl: './timestamps-modal.component.html',
  styleUrl: './timestamps-modal.component.scss',
  providers: [
    TuiDestroyService,
    UrlToPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimestampsModalComponent implements OnInit {
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly service: MenuCategoriesService = inject(MenuCategoriesService);
  private readonly notifications: NotificationsService = inject(NotificationsService);
  private readonly urlTo: UrlToPipe = inject(UrlToPipe);

  readonly form: FormGroup = new FormGroup({
    private_visible: new FormControl(),

    public_from_date: new FormControl(),
    public_from_time: new FormControl(),
    public_to_date: new FormControl(),
    public_to_time: new FormControl(),
    public_visible: new FormControl(),
    daily_from: new FormControl(),
    daily_to: new FormControl(),
  });

  submitted: boolean = false;
  dailyVisibilityOpen: boolean = false;
  absoluteVisibilityOpen: boolean = false;

  readonly saving: WritableSignal<boolean> = signal(false);
  // TODO use location to get absolute url and use href insted of routerOutlet.
  readonly privateUrl: string | null = `${location.origin}/${this.urlTo.transform(this.context.data?.category?.secret_desc ?? this.context.data?.category?.secret ?? ``, 'menuCategory.private')}`;
  readonly publicUrl: string | null = `${location.origin}/${this.urlTo.transform(this.context.data?.category?.id ?? ``, 'menuCategory.public')}`;

  constructor(
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: TuiDialogContext<null | MenuCategory, { category: MenuCategory }>,
  ) { }

  ngOnInit(): void {
    const v: MenuVisibility | undefined = this.context.data.category.visibility;

    if (v) this.updateForm(v);
    else this.form.reset();
  }

  /**
   * Saving changes
   */
  submit(additionalData: Record<string, any> = {}): void {
    this.submitted = true;
    const id: number | undefined = this.context.data?.category?.id;
    if (this.form.invalid || !id) return;

    this.saving.set(true);
    this.service.updateVisibility(id, {
      ...this.formVal(),
      ...additionalData
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: (cat: MenuCategory): void => {
        this.notifications.fireSnackBar($localize`Visibilità aggiornata.`);
        this.context.completeWith(cat);
      },
      error: (r: HttpErrorResponse): void => {
        this.manageError(r);
      }
    })
  }

  readonly e = this.getErrorsFor;

  cancel(): void {
    if ((this.form.touched || this.form.dirty) && !(confirm($localize`Sei sicuro di voler annullare le modifiche fatte?`))) return;

    this.context.completeWith(null);
  }

  private formVal(): VisibilityParams {
    const v: VisibilityParams = {
      public_visible: this.form.value['public_visible'],
      private_visible: this.form.value['private_visible'],
      daily_from: this.form.value['daily_from'] instanceof TuiTime ? tuiTimeToIsoString(this.form.value['daily_from']) : ``,
      daily_to: this.form.value['daily_to'] instanceof TuiTime ? tuiTimeToIsoString(this.form.value['daily_to']) : ``,
    };

    const f = this.form.value;

    if (f['public_from_date'] instanceof TuiDay) {
      const time: TuiTime = f['public_from_time'] instanceof TuiTime ? f['public_from_time'] : new TuiTime(0, 0);
      v.public_from = tuiDatetimeToIsoString(f['public_from_date'], time);
    } else v['public_from'] = ``;

    if (f['public_to_date'] instanceof TuiDay) {
      const time: TuiTime = f['public_to_time'] instanceof TuiTime ? f['public_to_time'] : new TuiTime(0, 0);
      v.public_to = tuiDatetimeToIsoString(f['public_to_date'], time);
    } else v['public_to'] = ``;

    return v;
  }

  togglePrivateVisible(): void {
    this.form.patchValue({
      private_visible: !this.form.value['private_visible'],
    })
  }

  togglePublicVisible(): void {
    this.form.patchValue({
      public_visible: !this.form.value['public_visible'],
    })
  }

  private updateForm(v: MenuVisibility): void {
    if (!(v)) return;

    const val = {
      public_visible: v.public_visible,
      private_visible: v.private_visible,

      public_from_date: v.public_from ? dateToTuiDay(v.public_from) : null,
      public_from_time: v.public_from ? dateToTuiTime(v.public_from) : null,

      public_to_date: v.public_to ? dateToTuiDay(v.public_to) : null,
      public_to_time: v.public_to ? dateToTuiTime(v.public_to) : null,

      daily_from: v.daily_from ? dateToTuiTime(v.daily_from) : null,
      daily_to: v.daily_to ? dateToTuiTime(v.daily_to) : null,
    };

    if (val['public_from_time'] instanceof TuiTime && val['public_from_time']?.hours === 0 && val['public_from_time']?.minutes === 0)
      val['public_from_time'] = null;

    if (val['public_to_time'] instanceof TuiTime && val['public_to_time']?.hours === 0 && val['public_to_time']?.minutes === 0)
      val['public_to_time'] = null;

    this.form.patchValue(val);

    if (v.daily_from || v.daily_to) this.dailyVisibilityOpen = true;

    if (v.public_from || v.public_to) this.absoluteVisibilityOpen = true;
  }

  private getErrorsFor(controlName: string): ValidationErrors | null {
    const control = this.form.get(controlName);
    if (!(control)) return null;

    if (this.submitted || control.touched || control.dirty) return control.errors;

    return null;
  }

  private manageError(r: HttpErrorResponse): void {
    if (r.status == 422 && typeof r.error.details == 'object' && r.error.details['error_code'] == 'cannot_publish') {
      this.notifications.confirm(r.error.message ?? $localize`Pubblicazione fallita.`, {
        yes: $localize`Forza pubblicazione`,
        no: $localize`Annulla`,
        title: $localize`Errori nella pubblicazione`
      }).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (v: boolean): void => {
          if (v) this.force();
        },
        error: (e: any): void => {
          console.warn(`error`, e);
        }
      })

      return;
    }

    this.notifications.error(parseHttpErrorMessage(r) || $localize`Errore nel salvataggio.`);
  }

  private force(): void {
    this.submit({force: true});
  }
}

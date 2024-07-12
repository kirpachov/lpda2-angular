import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {TuiDestroyService} from "@taiga-ui/cdk";
import {finalize, takeUntil} from "rxjs";
import {HttpErrorResponse} from "@angular/common/http";
import {NotificationsService} from "@core/services/notifications.service";
import {ActivatedRoute, Router} from "@angular/router";
import {parseHttpErrorMessage} from "@core/lib/parse-http-error-message";
import {SOMETHING_WENT_WRONG_MESSAGE} from "@core/lib/something-went-wrong-message";
import {
  AdminLanguageSwitcherComponent
} from "@core/components/admin-language-switcher/admin-language-switcher.component";
import {TuiDataListWrapperModule, TuiMultiSelectModule} from "@taiga-ui/kit";
import {FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {LanguageNames} from "@core/lib/language-names";
import {LanguagePipe} from "@core/pipes/language.pipe";
import {TuiDropdownModule, TuiSizeL, TuiSizeS} from "@taiga-ui/core";
import {
  PreferencesMultipleSelectComponent
} from "@core/components/preferences-inputs/preferences-multiple-select/preferences-multiple-select.component";
import {SettingsService} from "@core/services/http/settings.service";
import {Setting, SettingKey, SettingValue} from "@core/lib/settings";
import {
  PreferencesSelectComponent
} from "@core/components/preferences-inputs/preferences-select/preferences-select.component";
import {
  PreferencesNumberInputComponent
} from "@core/components/preferences-inputs/preferences-number-input/preferences-number-input.component";
import {JsonPipe} from "@angular/common";
import {
  PreferencesJsonInputComponent
} from "@core/components/preferences-inputs/preferences-json-input/preferences-json-input.component";

@Component({
  selector: 'app-list-settings',
  standalone: true,
  // imports: [],
  templateUrl: './list-settings.component.html',

  imports: [
    AdminLanguageSwitcherComponent,
    TuiMultiSelectModule,
    ReactiveFormsModule,
    TuiDataListWrapperModule,
    LanguagePipe,
    TuiDropdownModule,
    PreferencesMultipleSelectComponent,
    PreferencesSelectComponent,
    PreferencesNumberInputComponent,
    JsonPipe,
    PreferencesJsonInputComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService,
    LanguagePipe
  ]
})
export class ListSettingsComponent implements OnInit {
  private readonly service: SettingsService = inject(SettingsService);
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly notifications: NotificationsService = inject(NotificationsService);

  readonly languagePipe: LanguagePipe = inject(LanguagePipe)

  readonly allLanguages: string[] = Object.keys(LanguageNames);

  readonly form: FormGroup = new FormGroup({
    available_locales: new FormControl([]),
    default_language: new FormControl(null),
    max_people_per_reservation: new FormControl(null),
    email_contacts: new FormControl({})
  });

  private readonly saving: WritableSignal<boolean> = signal(false);
  private readonly searching: WritableSignal<boolean> = signal(false);

  readonly loading = computed(() => this.saving() || this.searching());

  readonly inputSize: TuiSizeS | TuiSizeL = 'l';

  ngOnInit(): void {
    this.reload();
  }

  save(key: string, value: SettingValue): void {
    this.saving.set(true);
    if (Array.isArray(value)) value = value.join(",")

    this.service.update(key, value).pipe(
      finalize(() => this.saving.set(false)),
      finalize(() => this.reload())
    ).subscribe({
      error: (e: HttpErrorResponse): void => {
        this.notifications.error(parseHttpErrorMessage(e) || SOMETHING_WENT_WRONG_MESSAGE);
      }
    });
  }

  applyPipeFunction(languagePipe: { transform: (value: unknown) => string }): (value: string) => string {
    return languagePipe.transform;
  }

  private reload(): void {
    this.searching.set(true);
    this.service.search().pipe(
      takeUntil(this.destroy$),
      finalize(() => this.searching.set(false)),
    ).subscribe({
      next: (data: { items: Setting[] }): void => {
        this.updateFormByData(data.items);
      },
      error: (e: HttpErrorResponse): void => {
        this.notifications.error(parseHttpErrorMessage(e) || SOMETHING_WENT_WRONG_MESSAGE);
      }
    })
  }

  private updateFormByData(settings: Setting[]): void {
    const data: Record<string, any> = {};

    /**
     * ARRAYS
     */
    ([
      `available_locales`
    ] as SettingKey[]).forEach((key: SettingKey): void => {
      const pref = settings.find((setting: Setting) => setting.key === key);

      if (pref && Array.isArray(pref.value)) data[key] = pref.value;
      else if (pref && typeof pref.value == 'string') data[key] = pref.value.split(",");
      else if (!pref) console.warn(`Setting ${key} not found`);
      else console.warn(`Setting ${key} not found or invalid`, pref.value);
    });

    /**
     * STRINGS
     */
    ([
      `default_language`
    ] as SettingKey[]).forEach((key: SettingKey): void => {
      const pref = settings.find((setting: Setting) => setting.key === key);

      if (pref && typeof pref.value == 'string') data[key] = pref.value;
      else if (!pref) console.warn(`Setting ${key} not found`);
      else console.warn(`Setting ${key} not found or invalid`, pref.value);
    });

    /**
     * NUMBERS
     */
    ([
      `max_people_per_reservation`
    ] as SettingKey[]).forEach((key: SettingKey): void => {
      const pref = settings.find((setting: Setting) => setting.key === key);

      if (pref && typeof pref.value == 'string' && pref.value.length > 0) data[key] = Number(pref.value);
      else if (pref && typeof pref.value == 'number') data[key] = pref.value;
      else if (!pref) console.warn(`Setting ${key} not found`);
      else console.warn(`Setting ${key} not found or invalid`, pref.value);
    });

    /**
     * JSON object
     */
    ([
      `email_contacts`
    ] as SettingKey[]).forEach((key: SettingKey): void => {
      const pref = settings.find((setting: Setting) => setting.key === key);

      if (pref && typeof pref.value == 'string') data[key] = JSON.parse(pref.value);
      else if (pref && typeof pref.value == 'object' && pref.value) data[key] = pref.value;
      else if (!pref) console.warn(`Setting ${key} not found`);
      else console.warn(`Setting ${key} not found or invalid`, pref.value);
    });

    this.form.patchValue(data);
  }
}

import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {TuiDestroyService} from "@taiga-ui/cdk";
import {SessionService} from "@core/services/admin-session.service";
import {TuiButtonModule, TuiDataListModule, TuiHostedDropdownModule} from "@taiga-ui/core";
import {MatIcon} from "@angular/material/icon";
import {NgClass, NgForOf} from "@angular/common";
import {LanguagePipe} from "@core/pipes/language.pipe";
import { supportedLanguages } from '@core/lib/supported-languages';
import { Router } from '@angular/router';
import { usingHashLocation } from 'src/app/app.config';
@Component({
  selector: 'app-admin-language-switcher',
  standalone: true,
  imports: [
    TuiButtonModule,
    TuiHostedDropdownModule,
    MatIcon,
    TuiDataListModule,
    // NgForOf,
    LanguagePipe,
    NgClass
  ],
  templateUrl: './admin-language-switcher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService
  ]
})
export class AdminLanguageSwitcherComponent {
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  readonly session: SessionService = inject(SessionService);
  private readonly router = inject(Router);

  readonly languages = supportedLanguages;

  setLanguage(lang: string) {
    this.session.setLanguage(lang);
    const hash: string = usingHashLocation ? '#' : '';
    location.replace(`/${lang}/${hash}${this.router.url}`);
  }
}

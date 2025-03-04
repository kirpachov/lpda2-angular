import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  Injector, OnInit,
  signal,
  ViewChild, WritableSignal
} from '@angular/core';
import {TuiDestroyService} from "@taiga-ui/cdk";
import {
  AdminLanguageSwitcherComponent
} from "@core/components/admin-language-switcher/admin-language-switcher.component";
import {CommonModule, NgOptimizedImage} from "@angular/common";
import {ActivatedRoute, NavigationStart, Router, RouterModule, RouterOutlet} from "@angular/router";
import {MatIcon, MatIconModule} from "@angular/material/icon";
import {
  TuiButtonModule,
  TuiDataListModule,
  TuiDialogService,
  TuiFlagPipeModule,
  TuiHostedDropdownModule, TuiLinkModule
} from "@taiga-ui/core";
import {NavbarUserBadgeComponent} from "@core/components/navbar-user-badge/navbar-user-badge.component";
import {ProfileService} from "@core/services/http/profile.service";
import {Subject, takeUntil} from "rxjs";
import {SHOW_MENU_BUTTON_TRESHOLD} from "@core/components/admin-sidenav/admin-sidenav.component";
import {Reservation} from "@core/models/reservation";
import {PolymorpheusComponent} from "@tinkoff/ng-polymorpheus";
import {
  CreateReservationModalComponent
} from "@core/components/reservations-creation/create-reservation-modal/create-reservation-modal.component";
import {MenuIconModule} from "@core/components/menu-icon/menu-icon.module";
import {ConfigsService} from "@core/services/configs.service";
import { LangData, supportedLanguages } from "@core/lib/supported-languages";
import { usingHashLocation } from 'src/app/app.config';

@Component({
  selector: 'app-public-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TuiHostedDropdownModule,
    TuiButtonModule,
    MatIconModule,
    TuiDataListModule,
    MenuIconModule,
    TuiFlagPipeModule,
    TuiLinkModule,
  ],
  templateUrl: './public-navbar.component.html',
  styleUrl: './public-navbar.component.scss',
  providers: [
    TuiDestroyService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicNavbarComponent implements OnInit, AfterViewInit {

  private readonly destroy$ = new Subject<void>();

  @ViewChild('navbar', { static: true }) navbar?: ElementRef<HTMLDivElement>;

  @ViewChild('navbarLinks', { static: true }) navbarLinks?: ElementRef<HTMLDivElement>;

  private readonly isMenuOpenChange$ = new Subject<boolean>();

  private _isMenuOpen: boolean = false;

  get isMenuOpen(): boolean {
    return this._isMenuOpen;
  }

  set isMenuOpen(value: boolean) {
    this._isMenuOpen = value;
    this.isMenuOpenChange$.next(value);
    this.updateLinksTop();
  }

  readonly scrolled: WritableSignal<boolean> = signal(false);

  readonly languages = supportedLanguages;

  readonly currentLanguage: WritableSignal<LangData> = signal(this.languages[0]);

  private localeId?: string;

  constructor(
    private readonly router: Router,
    private readonly configs: ConfigsService,
  ) {
    this.isMenuOpenChange$.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.updateBodyClass();
    });

    configs.locale$.pipe(takeUntil(this.destroy$)).subscribe((locale) => {
      this.localeId = locale;
      this.updateCurrentLanguage();
    });

    this.router.events.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.isMenuOpen = false;
      this.updateCurrentLanguage();
    });
  }

  ngOnInit() { }

  changePath(code: LangData['code']) {
    const hash: string = usingHashLocation ? '#' : '';
    location.replace(`/${code}/${hash}${this.router.url}`);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.isMenuOpen = false;
    this.updateLinksTop();
  }

  @HostListener("window:scroll", [`$event`])
  onScroll(event: unknown): void {
    this.scrolled.set(window.scrollY > 0);
  }

  ngAfterViewInit(): void {
    this.updateLinksTop();
  }

  triggerMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  private updateCurrentLanguage(): void {
    if (!(this.localeId)) return;

    this.currentLanguage.set(this.getCurrentLanguage());
  }

  private updateLinksTop(): void {
    if (!(this.navbar)) return;
    if (!(this.navbarLinks)) return;

    const paddingBttom = window.getComputedStyle(this.navbar.nativeElement, null).getPropertyValue('padding-bottom')
    const height = this.navbar.nativeElement.offsetHeight - parseInt(paddingBttom);
    this.navbarLinks.nativeElement.style.top = `${height}px`;
  }

  private getCurrentLanguage(): LangData {
    if (!(this.localeId)) return this.languages[0];

    const code: string | undefined = this.localeId.split('-')[0];
    return this.languages.find(lang => lang.code === code) || this.languages[0];
  }

  private updateBodyClass() {
    if (this.isMenuOpen) {
      document.body.classList.add(`overflow-hidden`);
    } else {
      document.body.classList.remove(`overflow-hidden`);
    }
  }
}

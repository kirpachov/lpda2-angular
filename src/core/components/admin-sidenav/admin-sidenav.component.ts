import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  Injector,
  OnInit,
  signal,
  WritableSignal
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, NavigationEnd, NavigationStart, Router, RouterModule, RouterOutlet} from "@angular/router";
import {MatIcon, MatIconModule} from "@angular/material/icon";
import {User} from "../../models/user";
import {TuiButtonModule, TuiDataListModule, TuiDialogService, TuiHostedDropdownModule} from "@taiga-ui/core";
import {NavbarUserBadgeComponent} from "../navbar-user-badge/navbar-user-badge.component";
import {TuiDestroyService} from "@taiga-ui/cdk";
import {takeUntil} from "rxjs";
import {PolymorpheusComponent} from "@tinkoff/ng-polymorpheus";
import {
  CreateReservationModalComponent
} from "@core/components/reservations-creation/create-reservation-modal/create-reservation-modal.component";
import {Reservation} from "@core/models/reservation";
import {
  AdminLanguageSwitcherComponent
} from "@core/components/admin-language-switcher/admin-language-switcher.component";
import {ProfileService} from "@core/services/http/profile.service";
import { AdminScrollService } from '@core/services/admin-scroll.service';

export const COLLAPSE_SIDENAV_TRESHOLD = 768;
export const SHOW_MENU_BUTTON_TRESHOLD = 1024;

@Component({
  selector: 'app-admin-sidenav',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    MatIcon,
    TuiHostedDropdownModule,
    TuiButtonModule,
    MatIconModule,
    TuiDataListModule,
    NavbarUserBadgeComponent,
    AdminLanguageSwitcherComponent,
  ],
  templateUrl: './admin-sidenav.component.html',
  styleUrls: ['./admin-sidenav.component.scss'],
  providers: [
    TuiDestroyService
  ]
})
export class AdminSidenavComponent implements OnInit {
  private readonly profile: ProfileService = inject(ProfileService);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly router: Router = inject(Router);
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly dialogs: TuiDialogService = inject(TuiDialogService);
  private readonly injector: Injector = inject(Injector);
  private readonly adminScroll: AdminScrollService = inject(AdminScrollService);

  readonly cu = this.profile.cu;

  isOpen: boolean = false;
  showMenuButton: boolean = false;
  isMobile: boolean = false;

  constructor() {
    /**
     * When navigating, close sidenav on mobile
     */
    this.router.events.pipe(
      takeUntil(this.destroy$)
    ).subscribe((event: any): void => {
      if (event instanceof NavigationStart && this.isMobile) {
        this.closeSidenav();
      }
    });
  }

  ngOnInit(): void {
    this.onResize();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.showMenuButton = window.innerWidth < SHOW_MENU_BUTTON_TRESHOLD;
    this.isMobile = window.innerWidth < SHOW_MENU_BUTTON_TRESHOLD;
    this.isOpen = !this.isMobile;
  }

  triggerSidenav(): void {
    this.isOpen = !this.isOpen;
  }

  overlayClick(event: unknown): void {
    this.closeSidenav();
  }

  closeSidenav(): void {
    this.isOpen = false;
  }

  fireCreateReservationModal(): void {
    this.dialogs.open<Reservation | null>(
      new PolymorpheusComponent(CreateReservationModalComponent, this.injector),
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result: Reservation | null): void => {
      },
      error: (error: any): void => console.error(error),
    })
  }

  divScroll(event: Event): void {
    this.adminScroll.scroll$.next(event);
  }
}

import {Component, inject, Injector, Input, signal, WritableSignal} from '@angular/core';
import {User} from "../../models/user";
import {TuiButtonModule, TuiDataListModule, TuiHostedDropdownModule} from "@taiga-ui/core";
import {MatIcon} from "@angular/material/icon";
import {RouterLink} from "@angular/router";
import {CommonModule, NgClass} from "@angular/common";
import { AuthService } from '@core/services/http/auth.service';
import {nue} from "@core/lib/nue";
import {HttpErrorResponse} from "@angular/common/http";
import {NotificationsService} from "@core/services/notifications.service";
import {parseHttpErrorMessage} from "@core/lib/parse-http-error-message";
import {SOMETHING_WENT_WRONG_MESSAGE} from "@core/lib/something-went-wrong-message";
import {redirectUnauthorized} from "@core/lib/redirect-unauthorized";

@Component({
  selector: 'app-navbar-user-badge',
  standalone: true,
  imports: [
    NgClass,
    TuiHostedDropdownModule,
    TuiButtonModule,
    MatIcon,
    TuiDataListModule,
    RouterLink
  ],
  templateUrl: './navbar-user-badge.component.html',
  styleUrl: './navbar-user-badge.component.scss'
})
export class NavbarUserBadgeComponent {
  private readonly auth: AuthService = inject(AuthService);
  private readonly notification: NotificationsService = inject(NotificationsService);
  private readonly injector: Injector = inject(Injector);

  @Input() hideLabelOnMobile: boolean = false;

  readonly fullnameOrEmail: WritableSignal<string | null> = signal(null);
  @Input({required: true}) set user(v: User | null | undefined){
    if (!v){
      this.fullnameOrEmail.set(null);
      return;
    }

    this.fullnameOrEmail.set(v.fullname && v.fullname.length > 0 ? v.fullname : (v.email ?? null));
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        redirectUnauthorized(this.injector, false);
      },
      error: (h: HttpErrorResponse): void => {
        this.notification.error(parseHttpErrorMessage(h) || SOMETHING_WENT_WRONG_MESSAGE);
      }
    });
  }
}

import { Component, DestroyRef, OnInit, inject, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TuiInputModule, TuiInputPasswordModule } from '@taiga-ui/kit';
import { TuiButtonModule, TuiLinkModule, TuiLoaderModule } from '@taiga-ui/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { TuiAutoFocusModule, TuiDestroyService } from '@taiga-ui/cdk';
import { ErrorsComponent } from '@core/components/errors/errors.component';
import { ValidationError } from 'joi';
import { Subscription, debounce, debounceTime, takeUntil, tap } from 'rxjs';
import { AuthService } from '@core/services/http/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ConfigsService } from '@core/services/configs.service';
import { AlreadyLoggedInComponent } from '@core/components/already-logged-in/already-logged-in.component';
import {ProfileService} from "@core/services/http/profile.service";
import {nue} from "@core/lib/nue";
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TuiInputModule,
    TuiButtonModule,
    TuiLinkModule,
    ReactiveFormsModule,
    TuiInputPasswordModule,
    TuiAutoFocusModule,
    ErrorsComponent,
    TuiLoaderModule,
    AlreadyLoggedInComponent
],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [
    // HttpClient,
    TuiDestroyService
  ]
})
export class LoginComponent implements OnInit {
  /**
   * TODO when loading profile for logged user, disable the form.
   * Otherwise with slow connections, user can start typing the form, then the profile is loaded so the form is hidden,
   * and that can be confusing.
   */

  readonly username: FormControl<string | null> = new FormControl(null, [Validators.required]);
  readonly password: FormControl<string | null> = new FormControl(null, [Validators.required]);
  readonly form: FormGroup = new FormGroup({
    username: this.username,
    password: this.password,
  });

  private readonly destroy$ = inject(TuiDestroyService);

  private readonly type$ = this.form.valueChanges.pipe(
    takeUntilDestroyed(),
    tap(() => this.typing = true),
    debounceTime(1000),
    tap(() => this.typing = false),
  ).subscribe();

  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly router: Router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly configs: ConfigsService = inject(ConfigsService);
  private readonly profile = inject(ProfileService);

  readonly _ = inject(Title).setTitle($localize`Accedi | La Porta D'Acqua`);

  cu = this.profile.cu;

  private submitted: boolean = false;
  typing: boolean = false;

  private readonly defaultRedirectUrl: string = `/admin`;
  redirectUrl: string = this.defaultRedirectUrl;

  private submitSubscription: Subscription | undefined;
  get submitting(): boolean {
    return this.submitSubscription?.closed === false;
  }

  ngOnInit(): void {
    this.auth.refreshTokenIfNotCalled().subscribe(nue());

    const qParams = this.route.snapshot.queryParams;
    if (qParams['email']) this.username.setValue(qParams['email']);
    if (qParams['username']) this.username.setValue(qParams['username']);
    if (qParams['password'] && isDevMode()) this.password.setValue(qParams['password']);
    if (qParams['url']) this.redirectUrl = qParams['url'].replace(window.location.origin, ``).replace(`#`, ``);
  }

  submit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    this.submitSubscription = this.auth.login(this.form.value).pipe(
      takeUntil(this.destroy$),
    ).subscribe(
      (next: any) => {
        this.router.navigateByUrl(this.redirectUrl || this.defaultRedirectUrl);
      },
      (error: HttpErrorResponse) => {
        const e: { message: string, details: Record<string, string[]> } = error.error;

        if (e.details) {
          const formatted = Object.keys(e.details).reduce((acc: Record<string, string>, key) => {
            acc[key] = e.details[key].join(', ');
            return acc;
          }, {});
          this.form.setErrors(formatted);
        } else if (e.message) this.form.setErrors({ message: e.message });
      }
    );
  }

  se = this.shouldShowErrors;
  seForm = this.shouldShowErrorsForm;
  e = this.errorsFor;

  errorsFor(controlName: string): ValidationErrors | null {
    const c = this.control(controlName);
    return c != null ? c.errors : null;
  }

  shouldShowErrors(controlName: string): boolean {
    if (this.typing) return false;

    const c = this.control(controlName);
    return c != null && (c.dirty || this.submitted) && c.invalid;
  }

  shouldShowErrorsForm(): boolean {
    if (this.typing) return false;

    return this.form.invalid && (this.form.dirty || this.submitted);
  }

  control(controlName: string): AbstractControl<any, any> | null {
    return this.form.get(controlName);
  }
}

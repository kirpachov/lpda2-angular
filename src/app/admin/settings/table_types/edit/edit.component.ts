import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal, WritableSignal } from '@angular/core';
import { RouterModule, Router, ActivatedRoute, Params } from '@angular/router';
import { ShowImagesComponent } from '@core/components/show-images/show-images.component';
import { ShowTranslationsComponent } from '@core/components/show-translations/show-translations.component';
import { TableTypeFormComponent } from '@core/components/table-type-form/table-type-form.component';
import { parseHttpErrorMessage } from '@core/lib/parse-http-error-message';
import { SOMETHING_WENT_WRONG_MESSAGE } from '@core/lib/something-went-wrong-message';
import { TableType } from '@core/models/table-type';
import { TableTypesService } from '@core/services/http/table-types.service';
import { NotificationsService } from '@core/services/notifications.service';
import { TuiDestroyService } from '@taiga-ui/cdk';
import { TuiLoaderModule, TuiLinkModule, TuiButtonModule } from '@taiga-ui/core';
import { takeUntil, finalize } from 'rxjs';

@Component({
  selector: 'app-edit',
  standalone: true,
  templateUrl: './edit.component.html',
  imports: [
    TuiLoaderModule,
    TableTypeFormComponent,
    TuiLinkModule,
    RouterModule,
    TuiButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService,
  ],
})
export class EditComponent {

  private readonly service = inject(TableTypesService);
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly router: Router = inject(Router);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly notifications: NotificationsService = inject(NotificationsService);

  readonly item: WritableSignal<TableType | null> = signal(null);
  readonly loading: WritableSignal<boolean> = signal(false);
  private itemId: number | null = null;

  ngOnInit(): void {
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (p: Params) => {
        this.itemId = Number(p["id"]);
        if (!isNaN(this.itemId)) {
          this.load(this.itemId);
        } else {
          this.item.set(null);
        }
      }
    })
  }

  submit(data: Record<string, unknown>): void {
    const id = this.itemId;
    if (!id) return;

    this.loading.set(true);
    this.service.update(id, data).pipe(
      takeUntil(this.destroy$),
    ).subscribe({
      next: () => {
        this.close();
      },
      error: (error: unknown) => {
        this.notifications.error(error instanceof HttpErrorResponse ? parseHttpErrorMessage(error) : SOMETHING_WENT_WRONG_MESSAGE);
      }
    })
  }

  cancel(): void {
    this.close();
  }

  private close(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  private load(id: number): void {
    this.loading.set(true);
    this.service.show(id).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (item: TableType) => this.item.set(item),
    })
  }
}

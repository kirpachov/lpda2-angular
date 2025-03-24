import { ChangeDetectionStrategy, Component, inject, signal, WritableSignal } from '@angular/core';
import { ShowTranslationsComponent } from "../../../../../core/components/show-translations/show-translations.component";
import { CurrencyPipe } from '@angular/common';
import { RouterModule, Router, ActivatedRoute, Params } from '@angular/router';
// import { TabletypeCasesComponent } from '@core/components/preorder-reservation-group-cases/preorder-reservation-group-cases.component';
// import { TabletypePreorderTypeComponent } from '@core/components/preorder-reservation-group-preorder-type/preorder-reservation-group-preorder-type.component';
// import { TabletypeStatusComponent } from '@core/components/preorder-reservation-group-status/preorder-reservation-group-status.component';
import { SelectTurnsPaymentv2Component } from '@core/components/select-turns-paymentv2/select-turns-paymentv2.component';
// import { TableType } from '@core/models/preorder-reservation-group';
// import { TabletypesService } from '@core/services/http/preorder-reservation-groups.service';
import { NotificationsService } from '@core/services/notifications.service';
import { TuiDestroyService } from '@taiga-ui/cdk';
import { TuiLoaderModule, TuiLinkModule, TuiButtonModule } from '@taiga-ui/core';
import { takeUntil, finalize } from 'rxjs';
import { TableTypesService } from '@core/services/http/table-types.service';
import { TableType } from '@core/models/table-type';
import { ShowImagesComponent } from "../../../../../core/components/show-images/show-images.component";

@Component({
  selector: 'app-show',
  standalone: true,
  templateUrl: './show.component.html',
  imports: [
    TuiLoaderModule,
    CurrencyPipe,
    TuiLinkModule,
    RouterModule,
    TuiButtonModule,
    ShowTranslationsComponent,
    ShowImagesComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService,
  ],
})
export class ShowComponent {

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

  delete() {
    this.notifications.confirm($localize`Eliminando questo elemento, il tavolo non sarà più selezionabile. Questa azione è irreversibile.`).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (confirmed: boolean): void => {
        if (confirmed) this.confirmedDelete();
      }
    })
  }

  private confirmedDelete(): void {
    if (!(this.itemId)) return;

    this.loading.set(true);
    this.service.destroy(this.itemId).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.loading.set(false);
        this.router.navigate(['../'], { relativeTo: this.route });
      })
    ).subscribe();
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

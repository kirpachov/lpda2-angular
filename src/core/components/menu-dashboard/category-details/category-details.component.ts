import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
  WritableSignal
} from '@angular/core';
import {MenuCategory} from "@core/models/menu-category";
import {ShowImagesComponent} from "@core/components/show-images/show-images.component";
import {
  EipCategoryVisibilityComponent
} from "@core/components/eip-category-visibility/eip-category-visibility.component";
import {NameDescEipComponent} from "@core/components/name-desc-eip/name-desc-eip.component";
import {TuiButtonModule, TuiDataListModule, TuiExpandModule, TuiHostedDropdownModule} from "@taiga-ui/core";
import {MatIcon} from "@angular/material/icon";
import {NgClass} from "@angular/common";
import {TuiDestroyService} from "@taiga-ui/cdk";
import {MenuCategoriesService} from "@core/services/http/menu-categories.service";
import {NotificationsService} from "@core/services/notifications.service";
import {finalize, takeUntil} from "rxjs";
import {HttpErrorResponse} from "@angular/common/http";
import {parseHttpErrorMessage} from "@core/lib/parse-http-error-message";
import {
  MenuCategoryStatusComponent
} from "@core/components/statuses/menu-category/menu-category-status/menu-category-status.component";
import {
  EditMenuCategoryStatusComponent
} from "@core/components/statuses/menu-category/edit-menu-category-status/edit-menu-category-status.component";
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
import {UrlToPipe} from "@core/pipes/url-to.pipe";
import {CategoryPriceComponent} from "@core/components/menu-dashboard/category-price/category-price.component";

@Component({
  selector: 'app-category-details',
  standalone: true,
  imports: [
    ShowImagesComponent,
    EipCategoryVisibilityComponent,
    NameDescEipComponent,
    TuiExpandModule,
    TuiButtonModule,
    MatIcon,
    NgClass,
    EditMenuCategoryStatusComponent,
    TuiHostedDropdownModule,
    TuiDataListModule,
    RouterLink,
    UrlToPipe,
    CategoryPriceComponent,
  ],
  templateUrl: './category-details.component.html',
  styleUrl: './category-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService
  ]
})
export class CategoryDetailsComponent {
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly service: MenuCategoriesService = inject(MenuCategoriesService);
  private readonly notifications: NotificationsService = inject(NotificationsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  @Output() categoryChange: EventEmitter<MenuCategory> = new EventEmitter<MenuCategory>();
  @Input({required: true}) category: MenuCategory | null = null;
  // TODO:
  //  - make expanded a signal
  //  - save expanded in local storage and use that value as initial value
  expanded: boolean = false;

  readonly loading: WritableSignal<boolean> = signal(false);

  saveNameDesc(event: { name: Record<string, string>; description: Record<string, string> }) {
    const id = this.category?.id;
    if (!id) return;

    this.loading.set(true);
    this.service.update(id, event).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (item: MenuCategory) => {
        this.notifications.fireSnackBar($localize`Traduzioni aggiornate.`)
        this.categoryChange.emit(item);
        this.category = item;
      },
      error: (r: HttpErrorResponse) => {
        this.notifications.error(parseHttpErrorMessage(r) || $localize`Qualcosa è andato storto.`);
      }
    })
  }

  updateStatus(status: MenuCategory["status"]): void {
    const id = this.category?.id;
    if (!status || !id) return;

    this.loading.set(true);
    this.service.update(id, {status: status}).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (item: MenuCategory) => {
        this.notifications.fireSnackBar($localize`Stato aggiornato.`);
        this.categoryChange.emit(item);
        this.category = item;
      },
      error: (r: HttpErrorResponse) => {
        this.notifications.error(parseHttpErrorMessage(r) || $localize`Qualcosa è andato storto.`);
      }
    })
  }

  deleteCategory() {
    const id = this.category?.id;
    if (!id) return;

    this.loading.set(true);
    this.service.destroy(id).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: () => {
        this.notifications.fireSnackBar($localize`Categoria eliminata.`);
        this.router.navigate(['../'], {relativeTo: this.route});
      },
      error: (r: HttpErrorResponse) => {
        this.notifications.error(parseHttpErrorMessage(r) || $localize`Qualcosa è andato storto.`);
      }
    })
  }

  confirmAndDelete() {
    this.notifications.confirm(
      $localize`Sei sicuro di voler eliminare la categoria?`, {
        yes: $localize`Sì, elimina la categoria`,
        no: $localize`Annulla`
      }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result: boolean) => {
        this.deleteCategory();
      }
    })
  }

  setCategory(event: MenuCategory): void {
    this.category = event;
    this.categoryChange.emit(event);
  }
}

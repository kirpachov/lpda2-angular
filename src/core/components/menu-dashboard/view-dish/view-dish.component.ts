import {ChangeDetectionStrategy, Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {ShowImagesComponent} from "@core/components/show-images/show-images.component";
import {TuiDestroyService} from "@taiga-ui/cdk";
import {DishesService} from "@core/services/http/dishes.service";
import {NotificationsService} from "@core/services/notifications.service";
import {ActivatedRoute, Params, Router, RouterLink} from "@angular/router";
import {Dish} from "@core/models/dish";
import {distinctUntilChanged, filter, finalize, map, takeUntil, tap} from "rxjs";
import {parseHttpErrorMessage} from "@core/lib/parse-http-error-message";
import {HttpErrorResponse} from "@angular/common/http";
import {TuiButtonModule, TuiLoaderModule, TuiTooltipModule} from "@taiga-ui/core";
import {MatIcon} from "@angular/material/icon";
import {DishStatusComponent} from "@core/components/statuses/dish/dish-status/dish-status.component";
import {EditDishStatusComponent} from "@core/components/statuses/dish/edit-dish-status/edit-dish-status.component";
import {NameDescEipComponent} from "@core/components/name-desc-eip/name-desc-eip.component";
import {DishIngredientsComponent} from "@core/components/menu-dashboard/dish-ingredients/dish-ingredients.component";
import {DishAllergensComponent} from "@core/components/menu-dashboard/dish-allergens/dish-allergens.component";
import {DishTagsComponent} from "@core/components/menu-dashboard/dish-tags/dish-tags.component";
import {DishPriceComponent} from "@core/components/menu-dashboard/dish-price/dish-price.component";
import {DishReferencesComponent} from "@core/components/menu-dashboard/dish-references/dish-references.component";
import {DishSuggestionsComponent} from "@core/components/menu-dashboard/dish-suggestions/dish-suggestions.component";

@Component({
  selector: '__app-view-dish',
  standalone: true,
  imports: [
    ShowImagesComponent,
    TuiLoaderModule,
    TuiButtonModule,
    MatIcon,
    EditDishStatusComponent,
    NameDescEipComponent,
    DishIngredientsComponent,
    DishAllergensComponent,
    DishTagsComponent,
    DishPriceComponent,
    DishReferencesComponent,
    TuiTooltipModule,
    DishSuggestionsComponent
  ],
  templateUrl: './view-dish.component.html',
  styleUrl: './view-dish.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService
  ]
})
export class ViewDishComponent implements OnInit {
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly service: DishesService = inject(DishesService);
  private readonly notifications: NotificationsService = inject(NotificationsService);
  private readonly router: Router = inject(Router);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);

  readonly loading: WritableSignal<boolean> = signal(false);
  readonly dish: WritableSignal<Dish | null> = signal(null);
  readonly dishId: WritableSignal<number | null> = signal(null);

  ngOnInit(): void {
    this.route.params.pipe(
      takeUntil(this.destroy$),
      map((params: Params) => Number(params['dish_id'])),
      filter((dishId: unknown): dishId is number => typeof dishId === 'number' && !isNaN(dishId) && dishId > 0),
      distinctUntilChanged(),
      tap((dishId: number) => this.dishId.set(dishId))
    ).subscribe({
      next: (dishId: number) => this.reload(),
      error: (error: unknown) => {
        this.dishId.set(null);
        this.dish.set(null);
      }
    })
  }

  reload(): void {
    const id: number | null | undefined = this.dishId();
    if (id) this.loadDish(id);
  }

  delete(): void {
    const id = this.dish()?.id;
    if (!id) return;

    this.loading.set(true);
    this.service.destroy(id).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: () => {
        this.notifications.fireSnackBar($localize`Piatto eliminata.`);
        this.router.navigate(['../..'], {relativeTo: this.route});
      },
      error: (r: HttpErrorResponse) => {
        this.notifications.error(parseHttpErrorMessage(r) || $localize`Qualcosa è andato storto.`);
      }
    })
  }

  updateStatus(status: Dish["status"]): void {
    const id = this.dish()?.id;
    if (!status || !id) return;

    this.loading.set(true);
    this.service.updateStatus(id, status).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (item: Dish) => {
        this.notifications.fireSnackBar($localize`Stato aggiornato.`);
        // this.dishChange.emit(item);
        this.dish.set(item);
      },
      error: (r: HttpErrorResponse) => {
        this.notifications.error(parseHttpErrorMessage(r) || $localize`Qualcosa è andato storto.`);
      }
    })
  }

  private loadDish(dishId: number): void {
    this.dishId.set(dishId);
    this.loading.set(true);
    this.service.show(dishId).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (dish: Dish) => this.dish.set(dish),
      error: (error: HttpErrorResponse) => {
        this.dish.set(null);
        this.notifications.error(parseHttpErrorMessage(error) || $localize`Qualcosa è andato storto.`);
      }
    })
  }

  saveNameDesc(event: { name: Record<string, string>; description: Record<string, string> }): void {
    const id = this.dish()?.id;
    if (!id) return;

    this.loading.set(true);
    this.service.update(id, event).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (item: Dish) => {
        this.notifications.fireSnackBar($localize`Traduzioni aggiornate.`)
        // this.dishChange.emit(item);
        this.dish.set(item);
      },
      error: (r: HttpErrorResponse) => {
        this.notifications.error(parseHttpErrorMessage(r) || $localize`Qualcosa è andato storto.`);
      }
    })
  }

  confirmAndDelete() {
    this.notifications.confirm($localize`Sei sicuro di voler eliminare questo piatto?`).subscribe({
      next: (confirmed: boolean): void => {
        if (confirmed) this.delete();
      }
    });
  }
}

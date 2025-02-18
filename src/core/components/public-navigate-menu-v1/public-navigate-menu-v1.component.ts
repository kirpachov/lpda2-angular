import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, Injector, isDevMode, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { parseHttpErrorMessage } from '@core/lib/parse-http-error-message';
import { SearchResult } from '@core/lib/search-result.model';
import { SOMETHING_WENT_WRONG_MESSAGE } from '@core/lib/something-went-wrong-message';
import { Dish } from '@core/models/dish';
import { MenuCategory } from '@core/models/menu-category';
import { PublicMenuService } from '@core/services/http/public-menu.service';
import { PublicReservationsService } from '@core/services/http/public-reservations.service';
import { NotificationsService } from '@core/services/notifications.service';
import { TuiDestroyService } from '@taiga-ui/cdk';
import { TuiButtonModule, TuiDialogService, TuiLinkModule, TuiLoaderModule } from '@taiga-ui/core';
import { distinctUntilChanged, filter, finalize, map, Subscription, switchMap, takeUntil, tap } from 'rxjs';
// import { ShowImageComponent } from '../show-image/show-image.component';
import { MatIconModule } from '@angular/material/icon';
import { PolymorpheusComponent } from "@tinkoff/ng-polymorpheus";
import { PublicDishModalComponent } from '../public-dish-modal/public-dish-modal.component';
import { CurrencyPipe, JsonPipe, NgTemplateOutlet } from '@angular/common';
import { PublicShowImagesComponent } from "../public-show-images/public-show-images.component";
import { TuiLineClampModule } from '@taiga-ui/kit';

@Component({
  selector: 'app-public-navigate-menu-v1',
  standalone: true,
  imports: [
    TuiLoaderModule,
    // ShowImageComponent,
    TuiLinkModule,
    TuiButtonModule,
    MatIconModule,
    CurrencyPipe,
    PublicShowImagesComponent,
    NgTemplateOutlet,
    TuiLineClampModule,
    RouterModule,
  ],
  templateUrl: './public-navigate-menu-v1.component.html',
  styleUrl: './public-navigate-menu-v1.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService
  ]
})
export class PublicNavigateMenuV1Component implements OnInit {
  private readonly destroy: TuiDestroyService = inject(TuiDestroyService);
  private readonly notifications: NotificationsService = inject(NotificationsService);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly router: Router = inject(Router);
  private readonly menuService: PublicMenuService = inject(PublicMenuService);
  private readonly dialogs: TuiDialogService = inject(TuiDialogService);
  private readonly injector: Injector = inject(Injector);

  readonly categoriesData: WritableSignal<SearchResult<MenuCategory> | null> = signal(null);
  readonly categories: Signal<MenuCategory[]> = computed(() => this.categoriesData()?.items || []);
  readonly loadingCategories: WritableSignal<boolean> = signal(true);

  readonly dishesData: WritableSignal<SearchResult<Dish> | null> = signal(null);
  readonly dishes: Signal<Dish[]> = computed(() => this.dishesData()?.items || []);
  readonly loadingDishes: WritableSignal<boolean> = signal(false);

  readonly loading: Signal<boolean> = computed(() => this.loadingCategories() || this.loadingDishes());

  readonly selectedCategory: WritableSignal<MenuCategory | null> = signal(null);

  readonly breadcrumbs: WritableSignal<MenuCategory[]> = signal([]);
  readonly breadcrumbUrls: WritableSignal<string[]> = signal([]);

  ngOnInit(): void {

    this.listenRouteParamsAndPopulateBreadcrumb();

    this.listenQueryParamsAndShowDishDetail();

    // this.loadingCategories.set(false); // DEVELOPMENT ONLY. REMOVE.
    // this.loadingDishes.set(false); // DEVELOPMENT ONLY. REMOVE.
    // this.loadDishes({category_id: 290}); // DEVELOPMENT ONLY. REMOVE.
  }

  /**
   * Called when user clicks on a dish.
   */
  private dishDetailSub?: Subscription;
  private showDishDetail(dish: Dish): void {
    this.closeDishDetailModal();

    this.dishDetailSub = this.dialogs.open<unknown>(
      new PolymorpheusComponent(PublicDishModalComponent, this.injector),
      {
        data: { dish: dish },
        dismissible: true,
        closeable: true,
        label: undefined,
      },
    ).pipe(
      takeUntil(this.destroy),
    ).subscribe({
      next: (): void => {
        this.router.navigate([], { queryParams: { dishId: null }, queryParamsHandling: "merge" });
      },
      error: (error: unknown): void => console.error(error),
    })
  }

  private closeDishDetailModal(): void {
    if (this.dishDetailSub) this.dishDetailSub.unsubscribe();
  }

  /**
   * Called when need to filter elements for a specific category.
   */
  private selectCategory(category: MenuCategory | null): void {
    this.selectedCategory.set(category);
    if (category && category.id) {
      this.loadCategories({ parent_id: category.id });
      this.loadDishes({ category_id: category.id });
    } else {
      this.dishesData.set(null);
      this.loadRootCategories();
    }
  }

  /**
   * Will load the root categories from the API.
   */
  private loadRootCategories(): void {
    this.loadCategories({ root: true, per_page: 100 });
  }

  private loadCategories(params: Record<string, boolean | number | string> = {}): void {
    this.loadingCategories.set(true);
    params ||= {};
    params["skip_empty_categories"] = true;
    this.menuService.searchCategories(params).pipe(
      takeUntil(this.destroy),
      finalize(() => this.loadingCategories.set(false)),
    ).subscribe({
      next: (categories: SearchResult<MenuCategory>) => {
        this.categoriesData.set(categories);
      }, error: (e: unknown) => {
        this.notifications.error(e instanceof HttpErrorResponse ? parseHttpErrorMessage(e) : SOMETHING_WENT_WRONG_MESSAGE);
      }
    });
  }

  private loadDishes(params: Record<string, string | number | boolean> = {}): void {
    this.loadingDishes.set(true);
    params ||= {};
    params["include_all"] = true;
    params["per_page"] = 1000;
    this.menuService.searchDishes(params).pipe(
      takeUntil(this.destroy),
      finalize(() => this.loadingDishes.set(false)),
    ).subscribe({
      next: (dishes: SearchResult<Dish>) => {
        this.dishesData.set(dishes);
      }, error: (e: unknown) => {
        this.notifications.error(e instanceof HttpErrorResponse ? parseHttpErrorMessage(e) : SOMETHING_WENT_WRONG_MESSAGE);
      }
    });
  }

  private findAndShowDish(dishId: unknown): void {
    if (typeof dishId === "string") dishId = Number(dishId);
    if (typeof dishId !== "number") {
      console.error(`Invalid dish id: ${dishId}`);
      return;
    }

    const done = (dish: Dish): void => {
      this.showDishDetail(dish);
    };

    /**
     * Using already loaded dish.
     */
    const loadedDish: Dish | undefined = this.dishes().find((d: Dish): boolean => d.id == dishId);
    if (loadedDish) return done(loadedDish);

    this.menuService.showDish(dishId).pipe(
      takeUntil(this.destroy),
    ).subscribe({
      next: (dish: Dish): void => {
        return done(dish);
      },
      error: (e: unknown): void => {
        this.notifications.error(e instanceof HttpErrorResponse ? parseHttpErrorMessage(e) : SOMETHING_WENT_WRONG_MESSAGE);
      }
    })
  }

  private listenQueryParamsAndShowDishDetail(): void {
    this.route.queryParams.pipe(
      takeUntil(this.destroy),
    ).subscribe({
      next: (params: Params): void => {
        if (params["dishId"]) {
          this.findAndShowDish(params["dishId"]);
        } else {
          this.closeDishDetailModal();
        }
      }
    });
  }

  /**
   * Will listen for route change and load the categories and dishes accordingly.
   * 
   * May cache categories and dishes: here re-fetching them every time.
   */
  private listenRouteParamsAndPopulateBreadcrumb(): void {
    this.route.params.pipe(
      takeUntil(this.destroy),
      map((params: Params): string[] => this.parseParamsToCategoryIds(params)),
      tap((categoryIds: string[]): void => {
        /**
         * Need to generate partials or url for breadcrumbs.
         */
        let url: string = `/menu`;
        let urls: string[] = [];
        categoryIds.forEach((id: string): void => {
          url += `/${id}`;
          urls.push(url);
        });
        this.breadcrumbUrls.set(urls);
      }),
      distinctUntilChanged(),
    ).subscribe({
      next: (categoryIds: string[]): void => {
        this.loadAndSetBreadcrumb(categoryIds);
      }
    });
  }

  private parseParamsToCategoryIds(params: Params): string[] {
    return params["categoryIds"].split(`,`).filter((id: unknown): id is string => typeof id === "string" && id.length > 0);
  }

  private loadAndSetBreadcrumb(categoryIds: string[]): void {
    const done = (categories: MenuCategory[]): void => {
      this.selectCategory(categories.length === 0 ? null : categories[categories.length - 1]);
      this.breadcrumbs.set(categories.splice(0, categories.length - 1));
    };

    if (categoryIds.length === 0) {
      done([]);
      if (isDevMode()) console.debug(`No category ids found in route params.`);
      return;
    }

    this.menuService.searchCategories({ ids: categoryIds.join(",") }).pipe(
      takeUntil(this.destroy),
    ).subscribe({
      next: (data: SearchResult<MenuCategory>): void => {
        const categories: MenuCategory[] = [];
        categoryIds.forEach((id: string): void => {
          const category: MenuCategory | undefined = data.items.find((c: MenuCategory): boolean => c.id === Number(id) || c.secret == id);
          if (category) categories.push(category);
          else console.error(`Category with id ${id} not found.`);
        });

        done(categories);
      }
    });
  }
}

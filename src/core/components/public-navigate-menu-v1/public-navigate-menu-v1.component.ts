import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, Injector, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
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
import { distinctUntilChanged, filter, finalize, map, switchMap, takeUntil, tap } from 'rxjs';
// import { ShowImageComponent } from '../show-image/show-image.component';
import { MatIconModule } from '@angular/material/icon';
import {PolymorpheusComponent} from "@tinkoff/ng-polymorpheus";
import { PublicDishModalComponent } from '../public-dish-modal/public-dish-modal.component';
import { CurrencyPipe, NgTemplateOutlet } from '@angular/common';
import { PublicShowImagesComponent } from "../public-show-images/public-show-images.component";

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

  ngOnInit(): void {
    this.loadRootCategories();

    this.route.params.pipe(
      map((params: Params) => params["categoryId"]),
      filter((category_id: unknown): category_id is string => typeof category_id === "string" && category_id.length > 0),
      distinctUntilChanged(),
      switchMap((category_id: string) => this.menuService.showCategory(category_id)),
      takeUntil(this.destroy),
    ).subscribe({
      next: (category: MenuCategory): void => {
        this.selectCategory(category);
      }
    })

    // this.loadingCategories.set(false); // DEVELOPMENT ONLY. REMOVE.
    // this.loadingDishes.set(false); // DEVELOPMENT ONLY. REMOVE.
    // this.loadDishes({category_id: 290}); // DEVELOPMENT ONLY. REMOVE.
  }

  /**
   * Called when user clicks on "<- Back" button
   */
  navigateBack() {
    const lastCategory: MenuCategory | null = this.breadcrumbs().pop() || null;

    this.selectCategory(lastCategory);
  }

  /**
   * Called by breadcrumb links.
   * TODO see if this is actually used when the component is done.
   */
  navigateTo(breadcrumbIndex: number): void {
    const category: MenuCategory = this.breadcrumbs()[breadcrumbIndex];
    this.breadcrumbs.update((prev) => prev.slice(0, breadcrumbIndex));
    this.selectCategory(category);
  }

  navigateToRoot(): void {
    this.selectCategory(null);
    this.breadcrumbs.set([]);
  }

  /**
   * Called when user clicks on a category.
   */
  clickOnCategory(category: MenuCategory): void {
    const currentSelected = this.selectedCategory();
    if (currentSelected) this.breadcrumbs.update((p) => [...p, currentSelected]);

    this.selectCategory(category);
  }

  /**
   * Called when user clicks on a dish.
   */
  clickOnDish(dish: Dish): void {
    // TODO fire modal with dish details
    this.dialogs.open<unknown>(
      new PolymorpheusComponent(PublicDishModalComponent, this.injector),
      {
        data: { dish: dish },
        dismissible: true,
        closeable: true,
        label: undefined,
      },
    ).pipe(
      takeUntil(this.destroy)
    ).subscribe({
      next: (): void => {},
      error: (error: unknown): void => console.error(error),
    })
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

  private loadCategories(params: Record<string, boolean|number|string> = {}): void {
    // TODO add big delay server side and check if the requests is cancelled when changing page.
    this.loadingCategories.set(true);
    params ||= {};
    params["skip_empty_categories"] = true;
    this.menuService.searchCategories(params).pipe(
      takeUntil(this.destroy),
      finalize(() => this.loadingCategories.set(false)),
    ).subscribe({next: (categories: SearchResult<MenuCategory>) => {
      this.categoriesData.set(categories);
    }, error: (e: unknown) => {
      this.notifications.error(e instanceof HttpErrorResponse ? parseHttpErrorMessage(e) : SOMETHING_WENT_WRONG_MESSAGE);
    }});
  }

  private loadDishes(params: Record<string, string | number | boolean> = {}): void {
    this.loadingDishes.set(true);
    params ||= {};
    params["include_all"] = true;
    this.menuService.searchDishes(params).pipe(
      takeUntil(this.destroy),
      finalize(() => this.loadingDishes.set(false)),
    ).subscribe({next: (dishes: SearchResult<Dish>) => {
      this.dishesData.set(dishes);
    }, error: (e: unknown) => {
      this.notifications.error(e instanceof HttpErrorResponse ? parseHttpErrorMessage(e) : SOMETHING_WENT_WRONG_MESSAGE);
    }});
  }
}

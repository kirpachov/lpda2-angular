import {
  Component,
  computed,
  inject,
  Input,
  OnChanges,
  OnInit, Signal,
  signal,
  SimpleChanges,
  WritableSignal
} from '@angular/core';
import {NavigationEnd, Router, RouterLink, RouterOutlet} from "@angular/router";
import {
  TuiButtonModule,
  TuiDataListModule, TuiDialogContext, TuiDialogService, TuiDropdownContextDirective,
  TuiDropdownModule, TuiHintModule,
  TuiHostedDropdownModule,
  TuiLinkModule, TuiLoaderModule, TuiTextfieldControllerModule
} from "@taiga-ui/core";
import {MatIcon} from "@angular/material/icon";
import {SearchResult} from "@core/lib/search-result.model";
import {MenuCategory} from "@core/models/menu-category";
import {TuiActionModule, TuiInputModule, TuiIslandModule, TuiProgressModule} from "@taiga-ui/kit";
import {NgClass, NgForOf, NgIf} from "@angular/common";
import {MenuCategoriesService} from "@core/services/http/menu-categories.service";
import {TuiAutoFocusModule, TuiDestroyService} from "@taiga-ui/cdk";
import {debounceTime, distinctUntilChanged, finalize, Subscription, takeUntil, tap} from "rxjs";
import {HttpErrorResponse} from "@angular/common/http";
import {NotificationsService} from "@core/services/notifications.service";
import {parseHttpErrorMessage} from "@core/lib/parse-http-error-message";
import {ShowImageComponent} from "@core/components/show-image/show-image.component";
import {UrlToPipe} from "@core/pipes/url-to.pipe";
import {FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {TuiTablePagination, TuiTablePaginationModule} from "@taiga-ui/addon-table";
import {CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray} from "@angular/cdk/drag-drop";
import {DishesService} from "@core/services/http/dishes.service";
import {Dish} from "@core/models/dish";
import {SOMETHING_WENT_WRONG_MESSAGE} from "@core/lib/something-went-wrong-message";
import {PolymorpheusContent} from "@tinkoff/ng-polymorpheus";
import {nue} from "@core/lib/nue";

@Component({
  selector: 'app-list-dishes',
  standalone: true,
  imports: [
    RouterLink,
    TuiLinkModule,
    MatIcon,
    TuiHostedDropdownModule,
    TuiButtonModule,
    TuiIslandModule,
    NgForOf,
    TuiActionModule,
    TuiDropdownModule,
    TuiDataListModule,
    NgIf,
    ShowImageComponent,
    UrlToPipe,
    ReactiveFormsModule,
    TuiInputModule,
    TuiAutoFocusModule,
    TuiTextfieldControllerModule,
    TuiLoaderModule,
    NgClass,
    TuiTablePaginationModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    TuiHintModule,
    TuiProgressModule,
    RouterOutlet,
],
  templateUrl: './list-dishes.component.html',
  styleUrl: './list-dishes.component.scss',
  providers: [
    MenuCategoriesService,
  ]
})
export class ListDishesComponent implements OnInit, OnChanges {
  private readonly service = inject(DishesService);
  private readonly categoriesService: MenuCategoriesService = inject(MenuCategoriesService);
  private readonly destroy$ = inject(TuiDestroyService);
  private readonly notifications = inject(NotificationsService);
  private readonly router: Router = inject(Router);
  // @Inject(TuiDialogService)
  private readonly dialogs: TuiDialogService = inject(TuiDialogService);

  readonly data: WritableSignal<SearchResult<Dish> | null> = signal(null);
  readonly items: Signal<Dish[]> = computed(() => this.data()?.items ?? []);
  readonly filtering: WritableSignal<boolean> = signal(false);

  readonly ordering: WritableSignal<boolean> = signal(false);

  readonly searching: WritableSignal<boolean> = signal(false);
  readonly deleting: WritableSignal<boolean> = signal(false);
  private readonly moving: WritableSignal<boolean> = signal(false);
  readonly loading: Signal<boolean> = computed(() => this.searching() || this.deleting() || this.moving());

  readonly reorderEnabled: WritableSignal<boolean> = signal<boolean>(true);

  readonly filters: FormGroup = new FormGroup({
    query: new FormControl(null),
  });

  offset: number = 0;
  per_page: number = 100;

  @Input() parentCategoryId?: number | null = null;

  ngOnInit(): void {
    this.search();
    this.filters.valueChanges.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged(),
      debounceTime(200),
      tap(() => this.offset = 0),
    ).subscribe({next: () => this.search()});

    this.router.events.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (e: unknown) => {
        if (e instanceof NavigationEnd) this.search();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['parentCategoryId']) this.search();
  }

  triggerFiltering(): void {
    this.filtering.set(!this.filtering());

    this.search();
  }

  submitFilters(): void {
    this.search();
  }

  paginationChange($event: TuiTablePagination): void {
    this.per_page = $event.size;
    this.offset = $event.page;

    this.search();
  }

  private searchSub?: Subscription;

  search(filters: Record<string, string | number> = this.parseFilters()): void {
    this.searchSub?.unsubscribe();

    this.searching.set(true);
    this.searchSub = this.service.search(filters).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.searching.set(false))
    ).subscribe({
      next: result => this.data.set(result),
      error: (r: HttpErrorResponse) => {
        this.data.set(null);
        this.notifications.error(parseHttpErrorMessage(r) || $localize`Qualcosa è andato storto. Riprova più tardi.`);
      }
    })
  }

  private parseFilters(): Record<string, string | number> {
    const filters = this.filters.value;
    const result: Record<string, string | number> = {per_page: this.per_page, offset: this.offset};

    if (this.filtering()) {
      if (filters['query']) result['query'] = filters['query'];
    }

    result['category_id'] = this.parentCategoryId ?? ``;

    return result;
  }

  // remove(item: Dish) {
  //   this.notifications.confirm(
  //     $localize`Sei sicuro di voler eliminare il piatto?`, {
  //       yes: $localize`Sì, elimina il piatto`,
  //       no: $localize`Annulla`
  //     }).pipe(
  //     takeUntil(this.destroy$)
  //   ).subscribe({
  //     next: (result: boolean) => {
  //       this.deleteDish(item);
  //     }
  //   })
  // }

  deleteDish(item: Dish): void {
    const id = item?.id;
    if (!id) return;

    this.deleting.set(true);
    this.service.destroy(id).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.deleting.set(false)),
      finalize(() => this.closeModal())
    ).subscribe({
      next: () => {
        this.notifications.fireSnackBar($localize`Piatto eliminato.`);
        this.search();
      },
      error: (r: HttpErrorResponse) => {
        this.notifications.error(parseHttpErrorMessage(r) || $localize`Qualcosa è andato storto.`);
      }
    })
  }

  removeDishFromCategory(item: Dish): void {
    const id = item?.id;
    if (!(id && this.parentCategoryId)) return;

    this.deleting.set(true);
    this.categoriesService.removeDish(this.parentCategoryId, id).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.deleting.set(false)),
      finalize(() => this.closeModal())
    ).subscribe({
      next: () => {
        this.notifications.fireSnackBar($localize`Piatto rimosso dalla categoria.`);
        this.search();
      },
      error: (r: HttpErrorResponse) => {
        this.notifications.error(parseHttpErrorMessage(r) || SOMETHING_WENT_WRONG_MESSAGE);
      }
    })
  }

  drop(event: CdkDragDrop<Dish[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    const items: Dish[] = this.items();
    const id = items[event.previousIndex]?.id;
    if (!(id)) return;

    const category_id = this.parentCategoryId;

    moveItemInArray(items, event.previousIndex, event.currentIndex);
    const data = category_id ? {to_index: event.currentIndex, category_id} : {to_index: event.currentIndex};
    this.moving.set(true);
    this.service.move(id, data).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.moving.set(false)),
      finalize(() => this.search()),
    ).subscribe({
      error: (r: HttpErrorResponse) => this.notifications.error(parseHttpErrorMessage(r) || $localize`Qualcosa è andato storto.`)
    });
  }

  triggerOrdering(): void {
    if (!(this.ordering())) {
      this.notifications.fireSnackBar($localize`Sposta i piatti trascinandoli con il bottone sul lato destro di ciascuna categoria.`, $localize`Capito`, {duration: 5000})
    }
    this.ordering.set(!this.ordering());
  }

  orderAllBy(field: string): void {
    const catId: number | null | undefined = this.parentCategoryId;
    if (!(catId)) return;

    this.moving.set(true);
    this.categoriesService.orderDishes(catId, field).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.moving.set(false))
    ).subscribe({
      next: (): void => {
        this.notifications.fireSnackBar($localize`Tutti i piatti ordinati per ${field}`);
        this.ordering.set(false);
        this.search();
      },
      error: (r: HttpErrorResponse) => this.notifications.error(parseHttpErrorMessage(r) || $localize`Qualcosa è andato storto.`)
    })
  }

  private modalSub?: Subscription;
  showModal(temp: PolymorpheusContent<TuiDialogContext>, options = {}) {
    this.modalSub = this.dialogs.open(temp, {size: "auto"}).subscribe();
    // this.modalSub = this.dialogs.open({
    //
    // }).subscribe(nue());
  }

  closeModal(): void {
    this.modalSub?.unsubscribe();
  }
}

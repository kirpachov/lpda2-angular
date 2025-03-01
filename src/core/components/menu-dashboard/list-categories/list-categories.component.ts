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
import { NavigationEnd, Router, RouterLink } from "@angular/router";
import {
  TuiButtonModule,
  TuiDataListModule, TuiDropdownContextDirective,
  TuiDropdownModule, TuiHintModule,
  TuiHostedDropdownModule,
  TuiLinkModule, TuiLoaderModule, TuiTextfieldControllerModule,
  TuiTooltipModule
} from "@taiga-ui/core";
import { MatIcon } from "@angular/material/icon";
import { SearchResult } from "@core/lib/search-result.model";
import { MenuCategory } from "@core/models/menu-category";
import { TuiActionModule, TuiInputModule, TuiIslandModule, TuiProgressModule } from "@taiga-ui/kit";
import { NgClass, NgForOf, NgIf } from "@angular/common";
import { MenuCategoriesService } from "@core/services/http/menu-categories.service";
import { TuiAutoFocusModule, TuiDestroyService } from "@taiga-ui/cdk";
import { debounceTime, distinctUntilChanged, finalize, Subscription, takeUntil, tap } from "rxjs";
import { HttpErrorResponse } from "@angular/common/http";
import { NotificationsService } from "@core/services/notifications.service";
import { parseHttpErrorMessage } from "@core/lib/parse-http-error-message";
import { ShowImageComponent } from "@core/components/show-image/show-image.component";
import { UrlToPipe } from "@core/pipes/url-to.pipe";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { TuiTablePagination, TuiTablePaginationModule } from "@taiga-ui/addon-table";
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from "@angular/cdk/drag-drop";
import { nue } from "@core/lib/nue";
import { ExportMenuService } from "@core/services/http/export-menu.service";
import { ObjectValuesPipe } from "../../../pipes/object-values.pipe";
import { SumPipe } from '@core/pipes/sum.pipe';
import { MenuCategoryVisibilitySummaryComponent } from "./menu-category-visibility-summary/menu-category-visibility-summary.component";

@Component({
  selector: 'app-list-categories',
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
    ObjectValuesPipe,
    SumPipe,
    TuiTooltipModule,
    MenuCategoryVisibilitySummaryComponent
],
  templateUrl: './list-categories.component.html',
  styleUrl: './list-categories.component.scss',
  providers: [
    TuiDestroyService,
  ]
})
export class ListCategoriesComponent implements OnInit, OnChanges {
  private readonly service = inject(MenuCategoriesService);
  private readonly destroy$ = inject(TuiDestroyService);
  private readonly notifications = inject(NotificationsService);
  private readonly router: Router = inject(Router);
  private readonly exportService: ExportMenuService = inject(ExportMenuService);

  readonly data: WritableSignal<SearchResult<MenuCategory> | null> = signal(null);
  readonly items = computed(() => this.data()?.items ?? []);
  readonly filtering: WritableSignal<boolean> = signal(true);

  readonly ordering: WritableSignal<boolean> = signal(false);

  readonly exporting: WritableSignal<boolean> = signal(false);
  readonly searching: WritableSignal<boolean> = signal(false);
  private readonly deleting: WritableSignal<boolean> = signal(false);
  private readonly moving: WritableSignal<boolean> = signal(false);
  readonly loading: Signal<boolean> = computed(() => this.searching() || this.deleting() || this.moving() || this.exporting());

  readonly reorderEnabled: WritableSignal<boolean> = signal<boolean>(true);

  readonly filters: FormGroup = new FormGroup({
    query: new FormControl(null),
  });

  offset: number = 0;
  per_page: number = 10;

  @Input() parentCategoryId?: number | null = null;

  ngOnInit(): void {
    this.search();
    this.filters.valueChanges.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged(),
      debounceTime(200),
      tap(() => this.offset = 0),
    ).subscribe({ next: () => this.search() });

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
    const result: Record<string, string | number> = { per_page: this.per_page, offset: this.offset };

    if (this.filtering()) {
      if (filters['query']) result['query'] = filters['query'];
    }

    result['parent_id'] = this.parentCategoryId ?? ``;

    return result;
  }

  remove(item: MenuCategory) {
    this.notifications.confirm(
      $localize`Sei sicuro di voler eliminare la categoria?`, {
      yes: $localize`Sì, elimina la categoria`,
      no: $localize`Annulla`
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result: boolean) => {
        this.deleteCategory(item);
      }
    })
  }

  deleteCategory(item: MenuCategory) {
    const id = item?.id;
    if (!id) return;

    this.deleting.set(true);
    this.service.destroy(id).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.deleting.set(false)),
    ).subscribe({
      next: () => {
        this.notifications.fireSnackBar($localize`Categoria eliminata.`);
        this.search();
      },
      error: (r: HttpErrorResponse) => {
        this.notifications.error(parseHttpErrorMessage(r) || $localize`Qualcosa è andato storto.`);
      }
    })
  }
  drop(event: CdkDragDrop<MenuCategory[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    const items: MenuCategory[] = this.items();
    const id = items[event.previousIndex]?.id;
    if (!(id)) return;

    moveItemInArray(items, event.previousIndex, event.currentIndex);
    this.moving.set(true);
    this.service.move(id, event.currentIndex).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.moving.set(false)),
      finalize(() => this.search()),
    ).subscribe({
      error: (r: HttpErrorResponse) => this.notifications.error(parseHttpErrorMessage(r) || $localize`Qualcosa è andato storto.`)
    });
  }

  triggerOrdering(): void {
    if (!(this.ordering())) {
      this.notifications.fireSnackBar($localize`Sposta le categorie trascinandole con il bottone sul lato destro di ciascuna categoria.`, $localize`Capito`, { duration: 5000 })
    }
    this.ordering.set(!this.ordering());
  }

  exportAllMenu(): void {
    this.exporting.set(true);
    this.exportService.export().pipe(
      takeUntil(this.destroy$),
      finalize(() => this.exporting.set(false)),
    ).subscribe(nue());
  }
}

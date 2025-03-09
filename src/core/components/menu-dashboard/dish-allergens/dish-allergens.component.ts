import {
  ChangeDetectionStrategy,
  Component, computed,
  EventEmitter,
  inject,
  Input,
  Output, Signal, signal,
  SimpleChanges,
  WritableSignal
} from '@angular/core';
import {Dish} from "@core/models/dish";
import {TuiAutoFocusModule, TuiDestroyService} from "@taiga-ui/cdk";
import {finalize, Subscription, takeUntil} from "rxjs";
import {HttpErrorResponse} from "@angular/common/http";
import {parseHttpErrorMessage} from "@core/lib/parse-http-error-message";
import {SearchResult} from "@core/lib/search-result.model";
import {NotificationsService} from "@core/services/notifications.service";
import {RouterLink, RouterOutlet} from "@angular/router";
import {
  TuiButtonModule,
  TuiDataListModule, TuiDialogContext, TuiDialogService,
  TuiDropdownModule, TuiHintModule,
  TuiHostedDropdownModule,
  TuiLinkModule, TuiLoaderModule, TuiTextfieldControllerModule
} from "@taiga-ui/core";
import {MatIcon} from "@angular/material/icon";
import {TuiActionModule, TuiInputModule, TuiIslandModule, TuiProgressModule} from "@taiga-ui/kit";
import {JsonPipe, NgClass, NgForOf, NgIf} from "@angular/common";
import {ShowImageComponent} from "@core/components/show-image/show-image.component";
import {UrlToPipe} from "@core/pipes/url-to.pipe";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {TuiTablePaginationModule} from "@taiga-ui/addon-table";
import {CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray} from "@angular/cdk/drag-drop";
import {PolymorpheusContent} from "@tinkoff/ng-polymorpheus";
import {DishesService} from "@core/services/http/dishes.service";
import {nue} from "@core/lib/nue";
import {AllergenSelectComponent} from "@core/components/dynamic-selects/allergen-select/allergen-select.component";
import {AllergensService} from "@core/services/http/allergens.service";
import {Allergen} from "@core/models/allergen";

@Component({
  selector: 'app-dish-allergens',
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
    AllergenSelectComponent,
    JsonPipe,
  ],
  templateUrl: './dish-allergens.component.html',
  styleUrl: `./dish-allergens.component.scss`,
  providers: [
    TuiDestroyService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DishAllergensComponent {
  private readonly allergensService: AllergensService = inject(AllergensService);
  private readonly dishesService: DishesService = inject(DishesService);
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly notifications: NotificationsService = inject(NotificationsService);
  private readonly dialogs: TuiDialogService = inject(TuiDialogService);

  @Output() dishChange: EventEmitter<Dish> = new EventEmitter<Dish>();
  @Input() dish: Dish | null | undefined = null;

  readonly searching: WritableSignal<boolean> = signal(false);
  private readonly deleting: WritableSignal<boolean> = signal(false);
  private readonly moving: WritableSignal<boolean> = signal(false);
  readonly addingAllergen: WritableSignal<boolean> = signal(false);
  readonly removingAllergen: WritableSignal<boolean> = signal(false);
  readonly loading: Signal<boolean> = computed(() => this.searching() || this.deleting() || this.moving() || this.addingAllergen() || this.removingAllergen());

  readonly ordering: WritableSignal<boolean> = signal(false);

  readonly data: WritableSignal<SearchResult<Allergen> | null> = signal(null);
  readonly items: Signal<Allergen[]> = computed(() => this.data()?.items ?? []);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dish']) this.search();
  }

  private searchSub?: Subscription;
  readonly newAllergenForm: FormGroup = new FormGroup({
    allergen: new FormControl<Allergen | null>(null, Validators.required),
  });

  search(filters: Record<string, string | number> = this.defaultFilters()): void {
    this.searchSub?.unsubscribe();

    this.searching.set(true);
    this.searchSub = this.allergensService.search(filters).pipe(
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

  drop(event: CdkDragDrop<Allergen[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    const items: Allergen[] = this.items();
    const allergenId = items[event.previousIndex]?.id;
    const dish_id = this.dish?.id;
    if (!(allergenId && dish_id)) return;

    // const category_id = this.parentCategoryId;

    moveItemInArray(items, event.previousIndex, event.currentIndex);
    // const data = category_id ? {to_index: event.currentIndex, category_id} : {to_index: event.currentIndex};
    this.moving.set(true);
    this.dishesService.moveAllergen(dish_id, allergenId, event.currentIndex).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.moving.set(false)),
      finalize(() => this.search()),
    ).subscribe({
      error: (r: HttpErrorResponse) => this.notifications.error(parseHttpErrorMessage(r) || $localize`Qualcosa è andato storto.`)
    });
  }

  remove(ing: Allergen): void {
    const dishId = this.dish?.id;
    const allergenId = ing.id;
    if (!(dishId && allergenId)) return;

    this.removingAllergen.set(true);
    this.dishesService.removeAllergen(dishId, allergenId).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.removingAllergen.set(false)),
      finalize(() => this.search()),
    ).subscribe(nue());
  }

  triggerOrdering(): void {
    if (!(this.ordering())) {
      this.notifications.fireSnackBar($localize`Sposta i piatti trascinandoli con il bottone sul lato destro di ciascuna categoria.`, $localize`Capito`, {duration: 5000})
    }
    this.ordering.set(!this.ordering());
  }

  dismissAddAllergen(): void {
    this.addAllergenModal?.unsubscribe();
    this.newAllergenForm.reset();
  }

  private addAllergenModal?: Subscription;

  showAddAllergen(content: PolymorpheusContent<TuiDialogContext>): void {
    this.addAllergenModal = this.dialogs.open(content).subscribe();
  }

  addAllergen(): void {
    const dishId = this.dish?.id;
    const allergen_id = this.newAllergenForm.get('allergen')?.value?.id;
    if (!(this.newAllergenForm.valid && allergen_id && dishId)) return;

    this.addingAllergen.set(true)
    this.dishesService.addAllergen(dishId, allergen_id).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.dismissAddAllergen()),
      finalize(() => this.search()),
      finalize(() => this.addingAllergen.set(false))
    ).subscribe({
      error: (r: HttpErrorResponse) => this.notifications.error(parseHttpErrorMessage(r) || $localize`Qualcosa è andato storto.`)
    });
  }

  private defaultFilters(): Record<string, string | number> {
    const result: Record<string, string | number> = {
      per_page: 1000
    };

    if (this.dish && this.dish.id) result['associated_dish_id'] = this.dish.id;

    return result;
  }
}

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
import {IngredientsService} from "@core/services/http/ingredients.service";
import {finalize, Subscription, takeUntil} from "rxjs";
import {HttpErrorResponse} from "@angular/common/http";
import {parseHttpErrorMessage} from "@core/lib/parse-http-error-message";
import {SearchResult} from "@core/lib/search-result.model";
import {Ingredient} from "@core/models/ingredient";
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
import {
  IngredientSelectComponent
} from "@core/components/dynamic-selects/ingredient-select/ingredient-select.component";
import {PolymorpheusContent} from "@tinkoff/ng-polymorpheus";
import {DishesService} from "@core/services/http/dishes.service";
import {nue} from "@core/lib/nue";

@Component({
  selector: 'app-dish-ingredients',
  standalone: true,
  imports: [
    TuiLinkModule,
    MatIcon,
    TuiHostedDropdownModule,
    TuiButtonModule,
    TuiIslandModule,
    TuiActionModule,
    TuiDropdownModule,
    TuiDataListModule,
    NgIf,
    ShowImageComponent,
    ReactiveFormsModule,
    TuiInputModule,
    TuiAutoFocusModule,
    TuiTextfieldControllerModule,
    TuiLoaderModule,
    TuiTablePaginationModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    TuiHintModule,
    TuiProgressModule,
    IngredientSelectComponent,
  ],
  templateUrl: './dish-ingredients.component.html',
  styleUrl: `./dish-ingredients.component.scss`,
  providers: [
    TuiDestroyService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DishIngredientsComponent {
  private readonly ingredientsService: IngredientsService = inject(IngredientsService);
  private readonly dishesService: DishesService = inject(DishesService);
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly notifications: NotificationsService = inject(NotificationsService);
  private readonly dialogs: TuiDialogService = inject(TuiDialogService);

  @Output() dishChange: EventEmitter<Dish> = new EventEmitter<Dish>();
  @Input() dish: Dish | null | undefined = null;

  readonly searching: WritableSignal<boolean> = signal(false);
  private readonly deleting: WritableSignal<boolean> = signal(false);
  private readonly moving: WritableSignal<boolean> = signal(false);
  readonly associatingIngredient: WritableSignal<boolean> = signal(false);
  readonly removingIngredient: WritableSignal<boolean> = signal(false);
  readonly loading: Signal<boolean> = computed(() => this.searching() || this.deleting() || this.moving() || this.associatingIngredient() || this.removingIngredient());

  readonly ordering: WritableSignal<boolean> = signal(false);

  readonly data: WritableSignal<SearchResult<Ingredient> | null> = signal(null);
  readonly items: Signal<Ingredient[]> = computed(() => this.data()?.items ?? []);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dish']) this.search();
  }

  private searchSub?: Subscription;
  readonly newIngredientForm: FormGroup = new FormGroup({
    ingredient: new FormControl<Ingredient | null>(null, Validators.required),
  });

  search(filters: Record<string, string | number> = this.defaultFilters()): void {
    this.searchSub?.unsubscribe();

    this.searching.set(true);
    this.searchSub = this.ingredientsService.search(filters).pipe(
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

  drop(event: CdkDragDrop<Ingredient[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    const items: Ingredient[] = this.items();
    const ingredientId = items[event.previousIndex]?.id;
    const dish_id = this.dish?.id;
    if (!(ingredientId && dish_id)) return;

    // const category_id = this.parentCategoryId;

    moveItemInArray(items, event.previousIndex, event.currentIndex);
    // const data = category_id ? {to_index: event.currentIndex, category_id} : {to_index: event.currentIndex};
    this.moving.set(true);
    this.dishesService.moveIngredient(dish_id, ingredientId, event.currentIndex).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.moving.set(false)),
      finalize(() => this.search()),
    ).subscribe({
      error: (r: HttpErrorResponse) => this.notifications.error(parseHttpErrorMessage(r) || $localize`Qualcosa è andato storto.`)
    });
  }

  remove(ing: Ingredient): void {
    const dishId = this.dish?.id;
    const ingredientId = ing.id;
    if (!(dishId && ingredientId)) return;

    this.removingIngredient.set(true);
    this.dishesService.removeIngredient(dishId, ingredientId).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.removingIngredient.set(false)),
      finalize(() => this.search()),
    ).subscribe(nue());
  }

  triggerOrdering(): void {
    if (!(this.ordering())) {
      this.notifications.fireSnackBar($localize`Sposta i piatti trascinandoli con il bottone sul lato destro di ciascuna categoria.`, $localize`Capito`, {duration: 5000})
    }
    this.ordering.set(!this.ordering());
  }

  dismissAddIngredient(): void {
    this.addIngredientModal?.unsubscribe();
    this.newIngredientForm.reset();
  }

  private addIngredientModal?: Subscription;

  showAddIngredient(content: PolymorpheusContent<TuiDialogContext>): void {
    this.addIngredientModal = this.dialogs.open(content).subscribe();
  }

  addIngredient(): void {
    const dishId = this.dish?.id;
    const ingredient_id = this.newIngredientForm.get('ingredient')?.value?.id;
    if (!(this.newIngredientForm.valid && ingredient_id && dishId)) return;

    this.associatingIngredient.set(true)
    this.dishesService.addIngredient(dishId, ingredient_id).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.dismissAddIngredient()),
      finalize(() => this.search()),
      finalize(() => this.associatingIngredient.set(false))
    ).subscribe({
      error: (r: HttpErrorResponse) => this.notifications.error(parseHttpErrorMessage(r) || $localize`Qualcosa è andato storto.`)
    });
  }

  private defaultFilters(): Record<string, string | number> {
    const result: Record<string, string | number> = {
      per_page: 1000,
    };

    if (this.dish && this.dish.id) result['associated_dish_id'] = this.dish.id;

    return result;
  }
}

import {
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  Output,
  Signal,
  signal,
  SimpleChanges,
  WritableSignal
} from '@angular/core';
import {DishesService} from "@core/services/http/dishes.service";
import {TuiDestroyService} from "@taiga-ui/cdk";
import {NotificationsService} from "@core/services/notifications.service";
import {
  TuiButtonModule,
  TuiDialogContext,
  TuiDialogService,
  TuiHostedDropdownModule,
  TuiLoaderModule
} from "@taiga-ui/core";
import {Dish} from "@core/models/dish";
import {finalize, Subscription, takeUntil} from "rxjs";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {HttpErrorResponse} from "@angular/common/http";
import {parseHttpErrorMessage} from "@core/lib/parse-http-error-message";
import {CdkDragDrop, moveItemInArray} from "@angular/cdk/drag-drop";
import {nue} from "@core/lib/nue";
import {PolymorpheusContent} from "@tinkoff/ng-polymorpheus";
import {SOMETHING_WENT_WRONG_MESSAGE} from "@core/lib/something-went-wrong-message";
import {TuiIslandModule} from "@taiga-ui/kit";
import {ShowImageComponent} from "@core/components/show-image/show-image.component";
import {NgIf} from "@angular/common";
import {MatIcon} from "@angular/material/icon";
import {DishSelectComponent} from "@core/components/dynamic-selects/dish-select/dish-select.component";

@Component({
  selector: 'app-dish-suggestions',
  standalone: true,
  imports: [
    TuiIslandModule,
    ShowImageComponent,
    NgIf,
    TuiButtonModule,
    TuiHostedDropdownModule,
    MatIcon,
    TuiLoaderModule,
    ReactiveFormsModule,
    DishSelectComponent
  ],
  templateUrl: './dish-suggestions.component.html',
})
export class DishSuggestionsComponent {
  private readonly dishesService: DishesService = inject(DishesService);
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly notifications: NotificationsService = inject(NotificationsService);
  private readonly dialogs: TuiDialogService = inject(TuiDialogService);

  @Output() dishChange: EventEmitter<void> = new EventEmitter<void>();

  @Input() set dish(v: null | Dish | undefined) {
    this.dish$.set(v ?? null);
    this.items.set(v?.suggestions ?? []);
  }

  get dish(): null | Dish {
    return this.dish$();
  }

  private readonly dish$: WritableSignal<Dish | null> = signal(null);

  private readonly deleting: WritableSignal<boolean> = signal(false);
  private readonly moving: WritableSignal<boolean> = signal(false);
  readonly addingDish: WritableSignal<boolean> = signal(false);
  readonly removingDish: WritableSignal<boolean> = signal(false);
  readonly loading: Signal<boolean> = computed(() => this.deleting() || this.moving() || this.addingDish() || this.removingDish());

  readonly ordering: WritableSignal<boolean> = signal(false);

  readonly items: WritableSignal<Dish[]> = signal([]);

  readonly newDishForm: FormGroup = new FormGroup({
    dish: new FormControl<Dish | null>(null, Validators.required),
  });

  remove(suggestion: Dish): void {
    const dishId = this.dish$()?.id;
    if (!(dishId && suggestion.id)) return;

    this.removingDish.set(true);
    this.dishesService.removeSuggestion(dishId, suggestion.id).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.removingDish.set(false),
        this.dishChange.emit();
      }),
    ).subscribe(nue());
  }

  dismissAddDish(): void {
    this.addDishModal?.unsubscribe();
    this.newDishForm.reset();
    this.dishChange.emit();
  }

  private addDishModal?: Subscription;

  showAddDish(content: PolymorpheusContent<TuiDialogContext>): void {
    this.addDishModal = this.dialogs.open(content).subscribe();
  }

  addDish(): void {
    const dishId = this.dish?.id;
    const suggestionId = this.newDishForm.get('dish')?.value?.id;
    if (!(this.newDishForm.valid && suggestionId && dishId)) return;

    this.addingDish.set(true)
    this.dishesService.addSuggestion(dishId, suggestionId).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.dismissAddDish()),
      finalize(() => this.addingDish.set(false))
    ).subscribe({
      error: (r: HttpErrorResponse) => this.notifications.error(parseHttpErrorMessage(r) || SOMETHING_WENT_WRONG_MESSAGE)
    });
  }
}

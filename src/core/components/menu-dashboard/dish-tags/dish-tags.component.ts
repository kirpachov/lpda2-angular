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
import {TagsService} from "@core/services/http/tags.service";
import {Tag} from "@core/models/tag";
import {MenuTagSelectComponent} from "@core/components/dynamic-selects/menu-tag-select/menu-tag-select.component";

@Component({
  selector: 'app-dish-tags',
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
    MenuTagSelectComponent,
    JsonPipe,
  ],
  templateUrl: './dish-tags.component.html',
  styleUrl: `./dish-tags.component.scss`,
  providers: [
    TuiDestroyService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DishTagsComponent {
  private readonly tagsService: TagsService = inject(TagsService);
  private readonly dishesService: DishesService = inject(DishesService);
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly notifications: NotificationsService = inject(NotificationsService);
  private readonly dialogs: TuiDialogService = inject(TuiDialogService);

  @Output() dishChange: EventEmitter<Dish> = new EventEmitter<Dish>();
  @Input() dish: Dish | null | undefined = null;

  readonly searching: WritableSignal<boolean> = signal(false);
  private readonly deleting: WritableSignal<boolean> = signal(false);
  private readonly moving: WritableSignal<boolean> = signal(false);
  readonly addingTag: WritableSignal<boolean> = signal(false);
  readonly removingTag: WritableSignal<boolean> = signal(false);
  readonly loading: Signal<boolean> = computed(() => this.searching() || this.deleting() || this.moving() || this.addingTag() || this.removingTag());

  readonly ordering: WritableSignal<boolean> = signal(false);

  readonly data: WritableSignal<SearchResult<Tag> | null> = signal(null);
  readonly items: Signal<Tag[]> = computed(() => this.data()?.items ?? []);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dish']) this.search();
  }

  private searchSub?: Subscription;
  readonly newTagForm: FormGroup = new FormGroup({
    tag: new FormControl<Tag | null>(null, Validators.required),
  });

  search(filters: Record<string, string | number> = this.defaultFilters()): void {
    this.searchSub?.unsubscribe();

    this.searching.set(true);
    this.searchSub = this.tagsService.search(filters).pipe(
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

  drop(event: CdkDragDrop<Tag[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    const items: Tag[] = this.items();
    const tagId = items[event.previousIndex]?.id;
    const dish_id = this.dish?.id;
    if (!(tagId && dish_id)) return;

    // const category_id = this.parentCategoryId;

    moveItemInArray(items, event.previousIndex, event.currentIndex);
    // const data = category_id ? {to_index: event.currentIndex, category_id} : {to_index: event.currentIndex};
    this.moving.set(true);
    this.dishesService.moveTag(dish_id, tagId, event.currentIndex).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.moving.set(false)),
      finalize(() => this.search()),
    ).subscribe({
      error: (r: HttpErrorResponse) => this.notifications.error(parseHttpErrorMessage(r) || $localize`Qualcosa è andato storto.`)
    });
  }

  remove(ing: Tag): void {
    const dishId = this.dish?.id;
    const tagId = ing.id;
    if (!(dishId && tagId)) return;

    this.removingTag.set(true);
    this.dishesService.removeTag(dishId, tagId).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.removingTag.set(false)),
      finalize(() => this.search()),
    ).subscribe(nue());
  }

  triggerOrdering(): void {
    if (!(this.ordering())) {
      this.notifications.fireSnackBar($localize`Sposta i piatti trascinandoli con il bottone sul lato destro di ciascuna categoria.`, $localize`Capito`, {duration: 5000})
    }
    this.ordering.set(!this.ordering());
  }

  dismissAddTag(): void {
    this.addTagModal?.unsubscribe();
    this.newTagForm.reset();
  }

  private addTagModal?: Subscription;

  showAddTag(content: PolymorpheusContent<TuiDialogContext>): void {
    this.addTagModal = this.dialogs.open(content).subscribe();
  }

  addTag(): void {
    const dishId = this.dish?.id;
    const tag_id = this.newTagForm.get('tag')?.value?.id;
    if (!(this.newTagForm.valid && tag_id && dishId)) return;

    this.addingTag.set(true)
    this.dishesService.addTag(dishId, tag_id).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.dismissAddTag()),
      finalize(() => this.search()),
      finalize(() => this.addingTag.set(false))
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

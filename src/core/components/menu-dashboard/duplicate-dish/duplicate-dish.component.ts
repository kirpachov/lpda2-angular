import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  Signal,
  signal,
  WritableSignal
} from '@angular/core';
import {TuiDestroyService} from "@taiga-ui/cdk";
import {ActivatedRoute, Params, Router, RouterLink} from "@angular/router";
import {MenuCategoriesService} from "@core/services/http/menu-categories.service";
import {NotificationsService} from "@core/services/notifications.service";
import {MenuCategory} from "@core/models/menu-category";
import {FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators} from "@angular/forms";
import {CustomValidators} from "@core/lib/custom-validators";
import {filter, finalize, map, takeUntil, tap} from "rxjs";
import {HttpErrorResponse} from "@angular/common/http";
import {CopyMenuCategoryParams} from "@core/lib/interfaces/copy-menu-category-params";
import {parseHttpErrorMessage} from "@core/lib/parse-http-error-message";
import {SOMETHING_WENT_WRONG_MESSAGE} from "@core/lib/something-went-wrong-message";
import {ReactiveErrors} from "@core/lib/reactive-errors/reactive-errors";
import {ErrorsComponent} from "@core/components/errors/errors.component";
import {TuiButtonModule, TuiExpandModule, TuiGroupModule, TuiLinkModule, TuiLoaderModule} from "@taiga-ui/core";
import {TuiAccordionModule, TuiRadioBlockModule} from "@taiga-ui/kit";
import {UrlToPipe} from "@core/pipes/url-to.pipe";
import {Dish} from "@core/models/dish";
import {DishesService} from "@core/services/http/dishes.service";
import {
  MenuCategorySelectComponent
} from "@core/components/dynamic-selects/menu-category-select/menu-category-select.component";
import {CopyDishParams} from "@core/lib/interfaces/copy-menu-dish-params";
import {JsonPipe} from "@angular/common";

@Component({
  selector: 'app-duplicate-dish',
  standalone: true,
  imports: [
    ErrorsComponent,
    TuiButtonModule,
    TuiRadioBlockModule,
    ReactiveFormsModule,
    TuiGroupModule,
    TuiExpandModule,
    RouterLink,
    TuiLinkModule,
    UrlToPipe,
    MenuCategorySelectComponent,
    TuiAccordionModule,
    TuiLoaderModule
  ],
  templateUrl: './duplicate-dish.component.html',
  styleUrl: './duplicate-dish.component.scss',
  providers: [
    TuiDestroyService,
    UrlToPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DuplicateDishComponent implements OnInit {
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly router: Router = inject(Router);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly service: MenuCategoriesService = inject(MenuCategoriesService);
  private readonly dishesService: DishesService = inject(DishesService);
  private readonly notifications: NotificationsService = inject(NotificationsService);
  private readonly urlTo: UrlToPipe = inject(UrlToPipe);

  private submitted: boolean = false;
  // current dish category
  readonly category: WritableSignal<MenuCategory | null> = signal(null);
  readonly dish: WritableSignal<Dish | null> = signal(null);

  readonly form: FormGroup = new FormGroup({
    // new dih category.
    category: new FormControl(null, [Validators.required, CustomValidators.instanceof(MenuCategory)]),

    copy_images: new FormControl("full", [Validators.required, CustomValidators.in(["full", "link", "none"])]),
    copy_ingredients: new FormControl("link", [Validators.required, CustomValidators.in(["link", "none"])]),
    copy_tags: new FormControl("link", [Validators.required, CustomValidators.in(["link", "none"])]),
    copy_allergens: new FormControl("link", [Validators.required, CustomValidators.in(["link", "none"])]),
  });

  readonly loadingCategory: WritableSignal<boolean> = signal(false);
  readonly loadingDish: WritableSignal<boolean> = signal(false);
  readonly saving: WritableSignal<boolean> = signal(false);
  readonly loading: Signal<boolean> = computed(() => this.saving() || this.loadingDish() || this.loadingCategory());

  ngOnInit(): void {
    this.route.parent?.parent?.params.pipe(
      takeUntil(this.destroy$),
      map((p: Params) => Number(p['category_id'])),
      filter((id: unknown): id is number => typeof id === "number" && !isNaN(id) && id > 0),
    ).subscribe({
      next: (p: number): void => this.loadCategory(p)
    })

    this.route.params.pipe(
      takeUntil(this.destroy$),
      map((p: Params) => Number(p['dish_id'])),
      filter((id: unknown): id is number => typeof id === "number" && !isNaN(id) && id > 0),
    ).subscribe({
      next: (p: number): void => this.loadDish(p)
    })
  }

  readonly e = this.getErrorsFor;

  submit(): void {
    this.submitted = true;
    if (this.form.invalid) return;
    const dishId: number | undefined = this.dish()?.id;
    const data: CopyDishParams = this.formValue();
    const categoryId = data.category_id;
    if (!(dishId && categoryId)) throw new Error(`some invalid id: dishId=${dishId}; categoryId=${categoryId}`);

    this.saving.set(true);
    this.dishesService.copy(dishId, data).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.saving.set(false)),
    ).subscribe({
      next: (v: Dish): void => {
        this.notifications.fireSnackBar($localize`Duplicato.`);
        const url = this.urlTo.transform({itemId: v.id, categoryId}, `dish.show`)
        if (url) this.router.navigateByUrl(url);
        else {
          console.error(`no url for dish`, v, categoryId);
          this.navigateBack();
        }
      },
      error: (r: HttpErrorResponse) => {
        this.manageError(r);
      }
    })
  }

  cancel(): void {
    if ((this.form.touched || this.form.dirty) && !(confirm($localize`Sei sicuro di voler annullare le modifiche fatte?`))) return;

    this.notifications.fireSnackBar($localize`Operazione annullata`);
    this.navigateBack();
  }

  formValue(): CopyDishParams {
    return {
      copy_tags: this.form.value['copy_tags'],
      copy_images: this.form.value['copy_images'],
      copy_ingredients: this.form.value['copy_ingredients'],
      copy_allergens: this.form.value['copy_allergens'],
      category_id: this.form.value["category"]?.id,
    }
  }

  private navigateBack(): void {
    this.router.navigate(['..'], {relativeTo: this.route});
  }

  private manageError(r: HttpErrorResponse): void {
    if (r.status != 422) {
      this.notifications.error(parseHttpErrorMessage(r) || SOMETHING_WENT_WRONG_MESSAGE);
      return;
    }

    ReactiveErrors.assignErrorsToForm(this.form, r);
  }

  private getErrorsFor(controlName: string): ValidationErrors | null {
    const control = this.form.get(controlName);
    if (!(control)) return null;

    if (this.submitted || control.touched || control.dirty) return control.errors;

    return null;
  }

  private loadCategory(id: number | null | undefined): void {
    if (!(id)) return;

    this.loadingCategory.set(true);
    this.service.show(id).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loadingCategory.set(false))
    ).subscribe({
      next: (record: MenuCategory): void => {
        this.category.set(record);
        if (!this.form.touched && !this.form.dirty) this.form.patchValue({category: record});
      },
      error: (r: HttpErrorResponse): void => {
        this.notifications.error(parseHttpErrorMessage(r) || SOMETHING_WENT_WRONG_MESSAGE);
      }
    })
  }

  private loadDish(id: number | null | undefined): void {
    if (!(id)) return;

    this.loadingDish.set(true);
    this.dishesService.show(id).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loadingDish.set(false))
    ).subscribe({
      next: (record: Dish): void => this.dish.set(record),
      error: (r: HttpErrorResponse): void => {
        this.notifications.error(parseHttpErrorMessage(r) || SOMETHING_WENT_WRONG_MESSAGE);
      }
    })
  }
}

import {Component, Inject} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MenuCategorySelectComponent } from '@core/components/dynamic-selects/menu-category-select/menu-category-select.component';
import {
  CreateReservationComponent
} from "@core/components/reservations-creation/create-reservation/create-reservation.component";
import { MenuCategory } from '@core/models/menu-category';
import {Reservation} from "@core/models/reservation";
import {TuiButtonModule, TuiDialogContext, TuiDialogService} from "@taiga-ui/core";
import {POLYMORPHEUS_CONTEXT} from '@tinkoff/ng-polymorpheus';


@Component({
  selector: 'app-modal-input-menu-category',
  standalone: true,
  imports: [
    MenuCategorySelectComponent,
    ReactiveFormsModule,
    TuiButtonModule,
  ],
  templateUrl: './modal-input-menu-category.component.html',
})
export class ModalInputMenuCategoryComponent {
constructor(
    @Inject(TuiDialogService) private readonly dialogs: TuiDialogService,
    @Inject(POLYMORPHEUS_CONTEXT)
    readonly context: TuiDialogContext<MenuCategory | null, { hint?: string }>,
  ) {}

  readonly control = new FormControl<MenuCategory | null>(null, [ Validators.required ]);

  readonly form = new FormGroup<{category: FormControl<MenuCategory | null>}>({
    category: this.control
  });

  submit() {
    const cat: MenuCategory | null = this.control.value;

    if (cat) this.context.completeWith(cat);
  }

  cancelled(): void {
    this.context.completeWith(null);
  }
}

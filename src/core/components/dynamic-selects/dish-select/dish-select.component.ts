import {ChangeDetectionStrategy, Component, forwardRef, inject} from '@angular/core';
import {NG_VALUE_ACCESSOR} from "@angular/forms";
import {TuiDestroyService} from "@taiga-ui/cdk";
import {
  CommonDynamicSelectComponentInputs,
  CommonDynamicSelectComponentOutputs,
  CommonDynamicSelectModuleImports
} from "@core/components/dynamic-selects/common-dynamic-select/common-dynamic-select";
import {ReservationTurn} from "@core/models/reservation-turn";
import {ReservationTurnsService} from "@core/services/http/reservation-turns.service";
import {
  CommonDynamicSelectComponent
} from "@core/components/dynamic-selects/common-dynamic-select/common-dynamic-select.component";
import {MenuCategoriesService} from "@core/services/http/menu-categories.service";
import {Dish} from "@core/models/dish";
import {DishesService} from "@core/services/http/dishes.service";
import { DishSelectOptionComponent } from './dish-select-option/dish-select-option.component';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';

@Component({
  templateUrl: `../common-dynamic-select/common-dynamic-select.component.html`,
  selector: 'app-dish-select',
  styleUrls: [`../common-dynamic-select/common-dynamic-select.component.scss`],
  inputs: CommonDynamicSelectComponentInputs,
  outputs: CommonDynamicSelectComponentOutputs,
  imports: CommonDynamicSelectModuleImports,
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DishSelectComponent),
      multi: true
    },

    TuiDestroyService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DishSelectComponent extends CommonDynamicSelectComponent<Dish> {

  override stringify = (c: Dish): string => c.name || ``;

  override readonly service: DishesService = inject(DishesService);

  constructor() {
    super();

    this.nativeOptionTemplate$.set(new PolymorpheusComponent(DishSelectOptionComponent));
  }
}

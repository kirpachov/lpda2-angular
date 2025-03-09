import {ChangeDetectionStrategy, Component, forwardRef, inject} from '@angular/core';
import {NG_VALUE_ACCESSOR} from "@angular/forms";
import {
  CommonDynamicSelectComponentInputs, CommonDynamicSelectComponentOutputs, CommonDynamicSelectModuleImports
} from "@core/components/dynamic-selects/common-dynamic-select/common-dynamic-select";
import {TuiDestroyService} from "@taiga-ui/cdk";
import {
  CommonDynamicSelectComponent
} from "@core/components/dynamic-selects/common-dynamic-select/common-dynamic-select.component";
import {Ingredient} from "@core/models/ingredient";
import {IngredientsService} from "@core/services/http/ingredients.service";
import { IngredientSelectOptionComponent } from './ingredient-select-option.component';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';

@Component({
  selector: 'app-ingredient-select',
  templateUrl: `../common-dynamic-select/common-dynamic-select.component.html`,
  styleUrls: [`../common-dynamic-select/common-dynamic-select.component.scss`],
  inputs: CommonDynamicSelectComponentInputs,
  outputs: CommonDynamicSelectComponentOutputs,
  imports: CommonDynamicSelectModuleImports,
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IngredientSelectComponent),
      multi: true
    },

    TuiDestroyService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientSelectComponent extends CommonDynamicSelectComponent<Ingredient> {
  override stringify = (c: Ingredient): string => c.name ?? ``;

  override readonly service: IngredientsService = inject(IngredientsService);

  constructor() {
    super();

    this.nativeOptionTemplate$.set(new PolymorpheusComponent(IngredientSelectOptionComponent));
  }
}

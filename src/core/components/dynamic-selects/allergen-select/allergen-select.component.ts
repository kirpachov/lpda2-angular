import {ChangeDetectionStrategy, Component, forwardRef, inject} from '@angular/core';
import { Allergen } from '@core/models/allergen';
import {AllergensService} from "@core/services/http/allergens.service";
import {
  CommonDynamicSelectComponentInputs, CommonDynamicSelectComponentOutputs, CommonDynamicSelectModuleImports
} from "@core/components/dynamic-selects/common-dynamic-select/common-dynamic-select";
import {NG_VALUE_ACCESSOR} from "@angular/forms";
import {TuiDestroyService} from "@taiga-ui/cdk";
import {
  CommonDynamicSelectComponent
} from "@core/components/dynamic-selects/common-dynamic-select/common-dynamic-select.component";
import { AllergenSelectOptionComponent } from './allergen-select-option.component';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';

@Component({
  selector: 'app-allergen-select',
  templateUrl: `../common-dynamic-select/common-dynamic-select.component.html`,
  styleUrls: [`../common-dynamic-select/common-dynamic-select.component.scss`],
  inputs: CommonDynamicSelectComponentInputs,
  outputs: CommonDynamicSelectComponentOutputs,
  imports: CommonDynamicSelectModuleImports,
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AllergenSelectComponent),
      multi: true
    },

    TuiDestroyService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllergenSelectComponent extends CommonDynamicSelectComponent<Allergen> {
  override stringify = (c: Allergen): string => c.name ?? ``;

  override readonly service: AllergensService = inject(AllergensService);

  constructor() {
    super();

    this.nativeOptionTemplate$.set(new PolymorpheusComponent(AllergenSelectOptionComponent));
  }
}

import {ChangeDetectionStrategy, Component, forwardRef, inject} from '@angular/core';
import { TableType } from '@core/models/table-type';
import {
  CommonDynamicSelectComponentInputs, CommonDynamicSelectComponentOutputs, CommonDynamicSelectModuleImports
} from "@core/components/dynamic-selects/common-dynamic-select/common-dynamic-select";
import {NG_VALUE_ACCESSOR} from "@angular/forms";
import {TuiDestroyService} from "@taiga-ui/cdk";
import {
  CommonDynamicSelectComponent
} from "@core/components/dynamic-selects/common-dynamic-select/common-dynamic-select.component";
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { CurrencyPipe } from '@angular/common';
import { TableTypeSelectOptionComponent } from './table-type-select-option.component';
import { TableTypesService } from '@core/services/http/table-types.service';

@Component({
  selector: 'app-table-type-select',
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
export class AllergenSelectComponent extends CommonDynamicSelectComponent<TableType> {
  override stringify = (c: TableType): string => c.name ?? ``;

  override readonly service: TableTypesService = inject(TableTypesService);

  constructor() {
    super();

    this.nativeOptionTemplate$.set(new PolymorpheusComponent(TableTypeSelectOptionComponent));
  }
}

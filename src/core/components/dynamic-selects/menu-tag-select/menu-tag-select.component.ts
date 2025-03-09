import {ChangeDetectionStrategy, Component, forwardRef, inject} from '@angular/core';
import {
  CommonDynamicSelectComponent
} from "@core/components/dynamic-selects/common-dynamic-select/common-dynamic-select.component";
import {TuiDestroyService} from "@taiga-ui/cdk";
import {NG_VALUE_ACCESSOR} from "@angular/forms";
import {Tag} from "@core/models/tag";
import {TagsService} from "@core/services/http/tags.service";
import {
  CommonDynamicSelectComponentInputs, CommonDynamicSelectComponentOutputs, CommonDynamicSelectModuleImports
} from "@core/components/dynamic-selects/common-dynamic-select/common-dynamic-select";
import { MenuTagSelectOptionComponent } from './menu-tag-select-option.component';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';

@Component({
  selector: 'app-menu-tag-select',
  templateUrl: `../common-dynamic-select/common-dynamic-select.component.html`,
  styleUrls: [`../common-dynamic-select/common-dynamic-select.component.scss`],
  inputs: CommonDynamicSelectComponentInputs,
  outputs: CommonDynamicSelectComponentOutputs,
  imports: CommonDynamicSelectModuleImports,
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MenuTagSelectComponent),
      multi: true
    },

    TuiDestroyService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuTagSelectComponent extends CommonDynamicSelectComponent<Tag> {
  override stringify = (c: Tag): string => c.name ?? ``;

  override readonly service: TagsService = inject(TagsService);

  constructor() {
    super();

    this.nativeOptionTemplate$.set(new PolymorpheusComponent(MenuTagSelectOptionComponent));
  }
}

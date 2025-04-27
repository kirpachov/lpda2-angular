import {CommonModule} from "@angular/common";
import {ReactiveFormsModule} from "@angular/forms";
import {TuiLetModule} from "@taiga-ui/cdk";
import {
  TuiDataListModule,
  TuiLoaderModule,
  TuiPrimitiveTextfieldModule,
  TuiTextfieldControllerModule
} from "@taiga-ui/core";
import {
  TuiAvatarModule,
  TuiComboBoxComponent,
  TuiComboBoxModule,
  TuiDataListWrapperModule,
  TuiInputModule
} from "@taiga-ui/kit";
import {PolymorpheusModule} from '@tinkoff/ng-polymorpheus';
import {MatIconModule} from "@angular/material/icon";
import {ChangeDetectionStrategy, ViewChild} from "@angular/core";

const moduleImports = [
  CommonModule,
  TuiComboBoxModule,
  TuiTextfieldControllerModule,
  TuiPrimitiveTextfieldModule,
  TuiInputModule,
  TuiDataListModule,
  TuiDataListWrapperModule,
  ReactiveFormsModule,
  TuiLetModule,
  TuiAvatarModule,
  TuiLoaderModule,
  PolymorpheusModule,
  MatIconModule,
];

export {moduleImports as CommonDynamicSelectModuleImports};

const componentInputs: string[] = [
  `outputType`,
  // `multiple`,
  `service`,
  `stringify`,
  `query`,
  `autofocus`,
  `placeholder`,
  `optionTemplate`,
  `stringifyOption`,
  `inputSize`,
  `page`,
  `per_page`,
  `optionSize`,
  `disabledItemHandler`,
  `loadMoreOnLastItem`,
  `emptyContent`,
  `showCreateNew`,
  `nativeOptionTemplate`,
  `filters`,
  `showCleaner`,
];

export {componentInputs as CommonDynamicSelectComponentInputs};

const componentOutputs: string[] = [
  "httpError",
  "pageChange",
  "queryChange",
  "per_pageChange",
  `createNew`
  /**
   * TODO: Add elements here.
   */
];

export {componentOutputs as CommonDynamicSelectComponentOutputs};

const componentStyleUrls: string[] = [
  `./common-dynamic-select.component.scss`
];

export {componentStyleUrls as CommonDynamicSelectComponentStyleUrls};

export type PolymorpheusType = 'text' | 'template' | 'component' | null;
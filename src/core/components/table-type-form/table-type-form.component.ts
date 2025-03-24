import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButtonModule, TuiTextfieldControllerModule } from '@taiga-ui/core';
import { ErrorsComponent } from "../errors/errors.component";
import { I18nInputComponent } from "../i18n-input/i18n-input.component";
import { TuiInputModule, TuiInputNumberModule } from '@taiga-ui/kit';
import { TableType } from '@core/models/table-type';
import {
  Input,
} from '@angular/core';

@Component({
  selector: 'app-table-type-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TuiButtonModule,
    ErrorsComponent,
    I18nInputComponent,
    TuiInputNumberModule,
    TuiTextfieldControllerModule,
    TuiInputModule,
  ],
  templateUrl: './table-type-form.component.html',
})
export class TableTypeFormComponent {
  @Output() readonly onCancel = new EventEmitter<void>();
  @Output() readonly onSubmit = new EventEmitter<Record<string, unknown>>();

  readonly form = new FormGroup<{
    name: FormControl<Record<string, string> | null>,
    description: FormControl<Record<string, string> | null>,
    default_people_per_turn: FormControl<number | null>,
    default_price: FormControl<number | null>
  }>({
    name: new FormControl(null, [Validators.required]),
    description: new FormControl(null),
    default_people_per_turn: new FormControl(null, [Validators.required, Validators.min(1)]),
    default_price: new FormControl(null, [Validators.required, Validators.min(0)]),
  });

  @Input() loading: boolean = false;

  @Input()
  set item(tableType: TableType | null | undefined) {
    if (!tableType) {
      this.form.reset();
      return;
    }

    this.form.patchValue({
      name: tableType.translations?.name || null,
      description: tableType.translations?.description || null,
      default_people_per_turn: tableType.default_people_per_turn,
      default_price: tableType.default_price,
    });
  }

  submit(): void {
    if (this.form.invalid) return;

    this.onSubmit.emit(this.form.value);
  }

  cancel(): void {
    this.onCancel.emit();
  }
}

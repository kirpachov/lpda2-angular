import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { TuiDestroyService } from '@taiga-ui/cdk';
import { PreferencesCommonInputComponent } from '../preferences-common-input/preferences-common-input.component';
import { DurationInputComponent, Measure } from "../../duration-input/duration-input.component";
import { SubmitExpandComponent } from "../../submit-expand/submit-expand.component";

@Component({
  selector: 'app-preferences-duration-input',
  standalone: true,
  imports: [
    DurationInputComponent,
    ReactiveFormsModule,
    SubmitExpandComponent
],
  template: `
<ng-content></ng-content>

<app-duration-input [outputMeasure]="outputMeasure" [inputMeasure]="inputMeasure" [inputSize]="inputSize" [formControl]="control" >
  
</app-duration-input>

<app-submit-expand class="block mt-2" (submit)="emitSubmit()" (cancel)="resetInitialValue()" [expanded]="somethingChanged()" ></app-submit-expand>
  `,
  providers: [
    TuiDestroyService,

    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PreferencesDurationInputComponent),
      multi: true
    },
  ],
  outputs: [
    ...PreferencesCommonInputComponent.outputs
  ],
  inputs: [
    ...PreferencesCommonInputComponent.inputs,
  ]
})
export class PreferencesDurationInputComponent  extends PreferencesCommonInputComponent<number> {
  @Input({required: true}) outputMeasure: Measure = 'minutes';
  @Input({required: true}) inputMeasure: Measure = 'minutes';
}

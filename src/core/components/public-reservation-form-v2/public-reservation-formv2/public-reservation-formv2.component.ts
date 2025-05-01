import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PublicReservePreviewComponent } from "../public-reserve-preview/public-reserve-preview.component";
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiDay, TuiTime } from '@taiga-ui/cdk';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-public-reservation-formv2',
  standalone: true,
  imports: [
    PublicReservePreviewComponent,
    ReactiveFormsModule,
    JsonPipe,
  ],
  templateUrl: './public-reservation-formv2.component.html',
  styleUrl: './public-reservation-formv2.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicReservationFormv2Component {

  readonly datePeopleControl: FormControl<{date: TuiDay, time: TuiTime, people: number} | null> = new FormControl<{date: TuiDay, time: TuiTime, people: number} | null>(null, [Validators.required]);

  previewSubmitted($event: { date: TuiDay; time: TuiTime; people: number; }) {
    // TODO show second step (if necessary), else last step.
    console.log("previewSubmitted", $event);
  }
}

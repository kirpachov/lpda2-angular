import { Component, Input } from '@angular/core';
import { ReservationStatus, ReservationStatusTranslations } from '@core/lib/interfaces/reservation-data';

@Component({
  selector: 'app-reservation-status',
  standalone: true,
  imports: [],
  template: `
  @if(status) {
    <span class="font-bold" [style]="styles[status]">
      {{ translations[status].title }}
    </span>
  }
  `,
})
export class ReservationStatusComponent {
  @Input({required: true}) status?: ReservationStatus | null;

  readonly translations: Record<ReservationStatus, { title: string }> = ReservationStatusTranslations;

  readonly styles: Record<ReservationStatus, { color: string }> = {
    active: { color: 'var(--tui-support-08)' },
    cancelled: { color: 'var(--tui-support-10)' },
    arrived: { color: 'var(--tui-support-04)' },
    deleted: { color: 'black' },
    noshow: { color: 'var(--tui-negative)' },
  };
}

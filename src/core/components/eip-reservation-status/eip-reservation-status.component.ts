import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, WritableSignal, inject, signal } from '@angular/core';
import { ReservationStatus } from '@core/lib/interfaces/reservation-data';
import { TuiDestroyService } from '@taiga-ui/cdk';
import { Reservation } from '@core/models/reservation';
import { TuiButtonModule, TuiDataListModule, TuiHostedDropdownModule, TuiLoaderModule } from '@taiga-ui/core';
import { ReservationsService } from '@core/services/http/reservations.service';
import { ReservationStatusComponent } from "../reservation-status/reservation-status.component";
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-eip-reservation-status',
  standalone: true,
  imports: [
    TuiButtonModule,
    TuiHostedDropdownModule,
    TuiDataListModule,
    TuiLoaderModule,
    ReservationStatusComponent,
    MatIconModule,
    NgClass
],
  templateUrl: './eip-reservation-status.component.html',
  styleUrl: './eip-reservation-status.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService
  ],
})
export class EipReservationStatusComponent {
  private readonly destroy$ = inject(TuiDestroyService);
  private readonly service: ReservationsService = inject(ReservationsService);

  @Output() statusChange: EventEmitter<ReservationStatus> = new EventEmitter();

  readonly itemId: WritableSignal<number | null> = signal(null);
  readonly loading: WritableSignal<boolean> = signal(false);
  readonly status: WritableSignal<ReservationStatus | null> = signal(null);

  readonly options: ReservationStatus[] = [
    "arrived",
    "noshow",
    "cancelled",
    "deleted",
  ];

  @Input() buttonAppearance: "outline" | "flat" = "outline";

  @Input({required: true}) set reservation(r: Reservation) {
    this.itemId.set(r.id || null);
    this.loading.set(false);
    this.status.set(r.status || null);
  }

  emit(status: ReservationStatus): void {
    this.statusChange.emit(status);
  }
}

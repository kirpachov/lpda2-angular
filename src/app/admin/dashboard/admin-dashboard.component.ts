import { ChangeDetectionStrategy, Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ReservationsByHourBarChartComponent } from '@core/components/reservations-by-hour-bar-chart/reservations-by-hour-bar-chart.component';
import { TuiButtonModule, TuiHintModule, TuiLinkModule } from '@taiga-ui/core';
import { RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { parseHttpErrorMessage } from '@core/lib/parse-http-error-message';
import { SOMETHING_WENT_WRONG_MESSAGE } from '@core/lib/something-went-wrong-message';
import { StatsService } from '@core/services/http/stats.service';
import { NotificationsService } from '@core/services/notifications.service';
import { TuiDestroyService } from '@taiga-ui/cdk';
import { takeUntil, finalize } from 'rxjs';
import { Stats } from '@core/lib/interfaces/stats';
import { TuiIslandModule, TuiTilesModule } from '@taiga-ui/kit';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReservationsByHourBarChartComponent,
    TuiLinkModule,
    RouterModule,
    TuiIslandModule,
    TuiHintModule,
    TuiButtonModule,
    MatIconModule,
  ],
  templateUrl: './admin-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent implements OnInit {
  readonly _ = inject(Title).setTitle($localize`Dashboard | La Porta D'Acqua`);

 private readonly service = inject(StatsService);
  private readonly destroy$ = inject(TuiDestroyService);
  private readonly notifications = inject(NotificationsService);
  private readonly datePipe = inject(DatePipe);

  readonly loading: WritableSignal<boolean> = signal(false);

  readonly stats: WritableSignal<Partial<Stats> | null> = signal(null);

  readonly today: Date = new Date();

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats() {
    const fromDate: string = this.datePipe.transform(this.today, 'yyyy-MM-dd') || '';
    const toDate: string = this.datePipe.transform(this.today, 'yyyy-MM-dd') || '';

    this.loading.set(true);
    this.service.stats({
      reservations_date_from: fromDate,
      reservations_date_to: toDate,
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (stats: Partial<Stats>) => {
        this.stats.set(stats);
      },
      error: (e: unknown) => {
        this.notifications.error(e instanceof HttpErrorResponse ? parseHttpErrorMessage(e) : SOMETHING_WENT_WRONG_MESSAGE)
      }

    });
  }
}

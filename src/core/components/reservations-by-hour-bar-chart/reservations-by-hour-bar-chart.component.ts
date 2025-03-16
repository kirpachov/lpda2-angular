import { ChangeDetectionStrategy, Component, inject, Input, OnChanges, signal, SimpleChanges, WritableSignal } from '@angular/core';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { ECharts, EChartsOption } from 'echarts';
import { Stats } from '@core/lib/interfaces/stats';
import { TuiLoaderModule } from '@taiga-ui/core';

@Component({
  selector: 'app-reservations-by-hour-bar-chart',
  standalone: true,
  imports: [
    NgxEchartsDirective,
    TuiLoaderModule,
  ],
  templateUrl: './reservations-by-hour-bar-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideEcharts(),
  ]
})
export class ReservationsByHourBarChartComponent implements OnChanges {
  private echart?: ECharts;

  @Input() loading: boolean = false;
  @Input() stats?: Partial<Stats> | null | undefined;

  ngOnChanges(changes: SimpleChanges) {
    if (changes["stats"])
      this.refresh();
  }

  onChartInit(instance: ECharts) {
    this.echart = instance;

    this.refresh();
  }

  refresh() {
    if (this.stats && this.stats["reservations-by-hour"])
      this.echart?.setOption(this.dataLoadedUpdateChart(this.stats["reservations-by-hour"]));
  }

  private dataLoadedUpdateChart(data: Stats["reservations-by-hour"]): EChartsOption {
    const labels: string[] = Object.keys(data);
    const values: number[] = Object.values(data);

    return {
      xAxis: {
        type: 'category',
        data: labels,
        name: $localize`Data e ora`
      },
      yAxis: {
        type: 'value',
        name: $localize`Prenotati`
      },
      series: [
        {
          data: values,
          type: 'bar'
        }
      ]
    };
  }
}

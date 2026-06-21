import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TuiDay } from '@taiga-ui/cdk';
import { TuiExpandModule } from '@taiga-ui/core';
import { AdminListReservationsComponent } from '../admin-list-reservations/admin-list-reservations.component';
import { ReservationsFilters } from '../list-reservations-filters/list-reservations-filters.component';

@Component({
  selector: 'app-list-reservations-having-groups',
  standalone: true,
  templateUrl: './list-reservations-having-groups.component.html',
  imports: [
    TuiExpandModule,
    AdminListReservationsComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListReservationsHavingGroupsComponent {
  readonly filters: Partial<ReservationsFilters> = {
    people_more_than: 8,
    order_by: "datetime asc, created_at ASC",
    date_from: TuiDay.currentLocal().toString(),
    status: "active",
    per_page: 100,
    offset: 0
  };
}

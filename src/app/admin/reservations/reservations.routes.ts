import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: ``,
    loadComponent: () => import(`./admin-reservations-home/admin-reservations-home.component`).then(m => m.AdminReservationsHomeComponent),
    children: [
      {
        path: `new`,
        loadChildren: () => import(`@core/components/reservations-creation/create-reservation-routable/create-reservation-routable.module`).then(m => m.CreateReservationRoutableModule)
      },
      {
        path: `:id`,
        loadChildren: () => import(`./edit-reservation/edit-reservation.module`).then(m => m.EditReservationModule)
      },
    ]
  }
];
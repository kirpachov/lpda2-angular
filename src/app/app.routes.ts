import {Routes} from '@angular/router';
import {adminRoutesGuard} from "@core/guards/admin-routes.guard";
import { legacyRoutesRedirectGuard } from '@core/guards/legacy-routes-redirect.guard';

export const routes: Routes = [
  {
    path: ``,
    loadChildren: () => import(`./public/public.routes`).then(m => m.routes),
    loadComponent: () => import(`./public/home-layout/home-layout.component`).then(m => m.HomeLayoutComponent),
  },
  {
    path: `admin`,
    loadComponent: () => import(`./admin/admin-layout/admin-layout.component`).then(m => m.AdminLayoutComponent),
    loadChildren: () => import(`./admin/admin.routes`).then(m => m.routes),
    canActivate: [adminRoutesGuard],
  },
  {
    path: `auth`,
    loadChildren: () => import(`./auth/auth.routes`).then(m => m.routes),
  },
  {
    path: `show`,
    outlet: `contacts`,
    loadChildren: () => import(`./contacts/contacts-page.module`).then(m => m.ContactsPageModule),
  },

  /**
   * Since we'll update from old app to new one, we need to keep some old routes working,
   * like the ones that are used in emails.
   */
  {
    path: `api/deleteReservation`,
    loadComponent: () => import(`./legacy/legacy-delete-reservation/legacy-delete-reservation.component`).then(m => m.LegacyDeleteReservationComponent),
    canActivate: [legacyRoutesRedirectGuard]
  }
];

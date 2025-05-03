import { Routes, UrlMatchResult, UrlSegment } from "@angular/router";

export const routes: Routes = [
  {
    path: ``,
    loadComponent: () => import(`./home/home.component`).then(m => m.HomeComponent),
  },
  {
    path: `privacy`,
    loadComponent: () => import(`./privacy/privacy.component`).then(m => m.PrivacyComponent),
  },
  {
    path: `disclaimers`,
    loadComponent: () => import(`./disclaimers/disclaimers.component`).then(m => m.DisclaimersComponent),
  },
  {
    path: `terms-and-conditions`,
    loadComponent: () => import(`./terms-and-conditions/terms-and-conditions.component`).then(m => m.TermsAndConditionsComponent),
  },
  {
    path: `cr/:secret`,
    loadComponent: () => import(`./cancel-reservation/cancel-reservation.component`).then(m => m.CancelReservationComponent)
  },
  {
    path: `r/:secret/:outcome`,
    loadComponent: () => import(`./view-reservation/view-reservation.component`).then(m => m.ViewReservationComponent),
  },
  {
    path: `r/:secret`,
    loadComponent: () => import(`./view-reservation/view-reservation.component`).then(m => m.ViewReservationComponent),
  },
  {
    path: `menu`,
    children: [
      {
        matcher: (urls: UrlSegment[]): UrlMatchResult | null => {

          const ids: string = urls.map(url => url.path).filter((url: unknown): url is string => typeof url === `string` && url.length > 0).join(',');
          const url: UrlSegment = new UrlSegment(ids, {});

          return {
            consumed: urls,
            posParams: {
              categoryIds: url,
            }
          };
        },
        loadComponent: () => import(`./menu/menu.component`).then(m => m.MenuComponent),
      }
    ]
  },
  {
    path: `about`,
    loadComponent: () => import(`./about/about.component`).then(m => m.AboutComponent),
  },
  {
    path: `reserve`,
    loadComponent: () => import(`./reserve/reserve.component`).then(m => m.ReserveComponent),
  },
  {
    path: `reservev2`,
    loadComponent: () => import(`./reservev2/reserve.component`).then(m => m.ReserveComponent),
  },
  {
    path: `reservation`,
    redirectTo: `reserve`,
    pathMatch: `full`,
  }
];
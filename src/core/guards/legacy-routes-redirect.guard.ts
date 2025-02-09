import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { boolean } from 'joi';
import { Observable } from 'rxjs';

export const legacyRoutesRedirectGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree => {
  const router: Router = inject(Router);

  if (state.url.startsWith('/api/deleteReservation')) {
    const token = route.queryParams['token'];
    return router.createUrlTree([`/cr/${token}`]);
  }

  return true;
};

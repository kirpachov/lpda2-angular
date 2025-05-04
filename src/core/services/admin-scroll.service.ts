import { Injectable } from '@angular/core';
import { BehaviorSubject, debounceTime, Subject, Subscriber, Subscription, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminScrollService {

  readonly scroll$: Subject<Event> = new Subject<Event>();

  isScrolling(timeout: number): Subject<boolean> {
    const isScrolling$: Subject<boolean> = new BehaviorSubject<boolean>(false);

    this.scroll$.pipe(
      tap(() => isScrolling$.next(true)),
      debounceTime(timeout),
      tap(() => isScrolling$.next(false))
    ).subscribe();

    return isScrolling$;
  }
}

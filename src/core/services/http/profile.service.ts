import { HttpClient } from '@angular/common/http';
import { Injectable, WritableSignal, inject, signal } from '@angular/core';
import { User } from '@core/models/user';
import { DomainService } from '../domain.service';
import { Observable, map, tap } from 'rxjs';
import { UserData } from '@core/lib/interfaces/user-data';
import { nue } from '@core/lib/nue';

@Injectable({
  providedIn: 'root'
})
export class ProfileService extends DomainService {

  constructor() {
    super(`/profile`);
  }

  readonly cu: WritableSignal<User | null> = signal(null);

  loading = signal(false);

  load(): Observable<User> {
    this.loading.set(true);
    return this.http.get(`/`).pipe(
      map((data: unknown) => data as { user: UserData }),
      map((data) => new User(data.user) ),
      tap((user: User) => this.cu.set(user)),
      tap(() => this.loading.set(false)),
    );
  }

  /**
   * First set to null, then load.
   */
  reload(): Observable<User>{
    this.cu.set(null);
    return this.load();
  }

  loadIfNotLoaded(): void {
    if (this.cu()) return;
    if (this.loading()) return;

    this.load().subscribe(nue());
  }
}

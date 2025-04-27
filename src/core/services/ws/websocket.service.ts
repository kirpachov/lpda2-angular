import { Injectable, isDevMode } from '@angular/core';
import * as ActionCable from 'actioncable';

import { ChannelNameWithParams } from "actioncable";
import { Observable, Subject } from 'rxjs';
import { DomainService } from '../domain.service';

export namespace WsUtils {
  export const WsChannels = [
    `ReservationsChannel`,
  ] as const;

  export type WsChannel = typeof WsChannels[number];

  export type WsChannelNameWithParams = ReservationsChannelData;
  // export type WsChannelNameWithParams = ChangesChannelInputData | AsyncActionsChannelInputData;

  export interface WsCommonInputData {
    channel: WsChannel;
  }

  export interface ReservationsChannelData extends WsCommonInputData {
    channel: `ReservationsChannel`;
    reservation_id: number;
    action: "create" | "cancel" | "update" | "delete";
  }
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService extends DomainService {

  private consumer?: ActionCable.Cable;
  private readonly consumerChange: Subject<ActionCable.Cable | undefined> = new Subject<ActionCable.Cable | undefined>();

  override version: number | null = null;

  constructor() {
    super(`/cable`);

    this.start();

    // this.openConnection('ReservationsChannel', {
    //   received: (data: WsUtils.ReservationsChannelData) => {
    //     console.log(`${this.constructor.name}.openConnection() received`, { data });
    //   }
    // }).subscribe();
  }

  openConnection<T extends ActionCable.CreateMixin>(channel: WsUtils.WsChannel | WsUtils.WsChannelNameWithParams, data?: T & ThisType<ActionCable.Channel>): Observable<any> {
    return new Observable((sub) => {
      if (isDevMode()) console.log(`${this.constructor.name}.openConnection()`, { self: this, channel, data });

      if (!this.consumer) {
        console.error(`${this.constructor.name}.openConnection() error: consumer is undefined`);
        sub.error();
        return;
      }

      const doit = () => this.consumer!.subscriptions.create<T>(channel, data);

      if (this.consumer) {
        sub.next(doit());
        sub.complete();
        return;
      }

      this.consumerChange.subscribe((consumer: ActionCable.Cable | undefined) => {
        if (consumer) sub.next(doit());
        else {
          console.error(`${this.constructor.name}.subscribeChannel() error: consumer is undefined`);
          sub.error();
        }

        sub.complete();
        },
        (e: any) => {
          console.error(`${this.constructor.name}.subscribeChannel() error: consumerChange error`, e);
          sub.error(e);
        },
        () => {
          console.debug(`${this.constructor.name}.subscribeChannel() error: consumerChange complete`);
          sub.complete();
        });
    });
  }

  closeConnection(channel: WsUtils.WsChannel): void {
    // closeConnection(channel: string | ActionCable.ChannelNameWithParams): void {
    if (!this.consumer) return;

    (this.consumer.subscriptions as any).subscriptions.forEach((v: any) => {
      if (v.identifier == JSON.stringify(channel)) {
        v.unsubscribe();
      }
    });
  }

  private start(): void {
    if (isDevMode()) console.log(`${this.constructor.name}.start()`, { self: this });

    this.url().subscribe({
      next: (url: string) => {
        this.consumer = ActionCable.createConsumer(url);
        this.consumer.connect();
        this.consumerChange.next(this.consumer);
      }
    });
  }
}

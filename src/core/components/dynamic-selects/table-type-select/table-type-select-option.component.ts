import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, signal, WritableSignal } from '@angular/core';
import { ShowImageComponent } from '@core/components/show-image/show-image.component';
import { TableType } from '@core/models/table-type';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';

@Component({
  selector: '___app-table-type-select-option',
  standalone: true,
  imports: [ShowImageComponent, CurrencyPipe],
  template: `
@if (item()) {
  <div class="flex items-center p-2">
    @if(item()?.images) {
      <app-show-image class="max-h-[100px] max-w-[100px]" [image]="(item()?.images || [])[0]"></app-show-image>
    }

    <span class="ms-2 text-slate-400">
      #{{ item()?.id }}
    </span>

    <span class="ms-2 text-lg">
      {{ item()?.name }}
    </span>

    <span class="ms-2 text-lg">
      {{ item()?.default_price | currency }}
    </span>

    <span class="ms-2 text-lg">
      {{ item()?.default_people_per_turn }} 
      <ng-container i18n>persone per turno</ng-container>
    </span>
  </div>

} @else {
  invalid input.
}

  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableTypeSelectOptionComponent {
  readonly item: WritableSignal<TableType | null> = signal(null);

  constructor(
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: Record<any, any>,
  ) {
    const data: unknown = context['data'];
    if (data && data instanceof TableType){
      this.item.set(data);
    }else{
      console.warn("invalid data. Please provide parm 'data' to context.", data);
    }
  }
}

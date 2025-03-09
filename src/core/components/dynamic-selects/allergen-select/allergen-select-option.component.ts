import { ChangeDetectionStrategy, Component, Inject, signal, WritableSignal } from '@angular/core';
import { ShowImageComponent } from '@core/components/show-image/show-image.component';
import { Allergen } from '@core/models/allergen';
import { Dish } from '@core/models/dish';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';

@Component({
  selector: 'app-allergen-select-option',
  standalone: true,
  imports: [ShowImageComponent],
  template: `
@if (item()) {
  <div class="flex items-center p-2">
    @if(item()?.image) {
      <app-show-image class="max-h-[100px] max-w-[100px]" [image]="item()?.image"></app-show-image>
    }

    <span class="ms-2 text-slate-400">
      #{{ item()?.id }}
    </span>

    <span class="ms-2 text-lg">
      {{ item()?.name }}
    </span>
  </div>

} @else {
  invalid input.
}

  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AllergenSelectOptionComponent {
  readonly item: WritableSignal<Allergen | null> = signal(null);

  constructor(
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: Record<any, any>,
  ) {
    const data: unknown = context['data'];
    if (data && data instanceof Allergen){
      this.item.set(data);
    }else{
      console.warn("invalid data. Please provide parm 'data' to context.", data);
    }
  }
}

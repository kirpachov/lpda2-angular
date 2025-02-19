import { ChangeDetectionStrategy, Component, Inject, signal, WritableSignal } from '@angular/core';
import { ShowImageComponent } from '@core/components/show-image/show-image.component';
import { Dish } from '@core/models/dish';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';

@Component({
  selector: 'app-dish-select-option',
  standalone: true,
  imports: [ShowImageComponent],
  template: `
@if (item()) {
  <div class="flex items-center p-2">
    <app-show-image class="max-h-[100px] max-w-[100px]" [image]="(item()?.images ?? [])[0]" ></app-show-image>

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
export class DishSelectOptionComponent {
  readonly item: WritableSignal<Dish | null> = signal(null);

  constructor(
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: Record<any, any>,
  ) {
    const data: unknown = context['data'];
    if (data && data instanceof Dish){
      this.item.set(data);
    }else{
      console.warn("invalid category. Please provide parm 'data' to context.", data);
    }
  }
}

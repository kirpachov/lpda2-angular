import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { isPreorderType, PreorderType } from '@core/lib/interfaces/preorder-reservation-group-data';
import { PreorderReservationGroup } from '@core/models/preorder-reservation-group';
import { TuiHintModule } from '@taiga-ui/core';

@Component({
  selector: 'app-preorder-reservation-group-preorder-type',
  standalone: true,
  imports: [
    TuiHintModule,
  ],
  template: `
    @if(type && trans[type]){
      <span [tuiHint]="trans[type].long" >{{trans[type].short}}</span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreorderReservationGroupPreorderTypeComponent {
  @Input() set item(value: PreorderReservationGroup | undefined | null) {
    if (value && !isPreorderType(value)) {
      console.warn('Invalid preorder type:', value);
    }

    this.type = value?.preorder_type;
  }

  @Input() type?: PreorderType | null;

  readonly trans: Record<PreorderType, { short: string, long: string }> = {
    nexi_payment: {
      short: $localize`Pagamento cc con nexi`,
      long: $localize`Verrà richiesto un pagamento con carta di credito del valore specificato al momento della prenotazione.`
    },
    nexi_authorization: {
      short: $localize`Autorizzazione cc con nexi`,
      long: $localize`Verrà richiesta un'autorizzazione con carta di credito del valore specificato al momento della prenotazione.`
    }
  }
}

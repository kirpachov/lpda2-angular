import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { PublicPageComponent } from '../public-page-component';
import { PublicReservePreviewComponent } from '@core/components/public-reservation-form-v2/public-reserve-preview/public-reserve-preview.component';
import { PublicHomeReserveV2Component } from "../../../core/components/public-home-reservev2/public-home-reservev2.component";

@Component({
  selector: 'app-reserve',
  standalone: true,
  imports: [
    PublicHomeReserveV2Component
],
  templateUrl: './reserve.component.html',
  styleUrl: './reserve.component.scss'
})
export class ReserveComponent extends PublicPageComponent {
  readonly _ = inject(Title).setTitle($localize`Prenota un tavolo | La Porta D'Acqua`);
}

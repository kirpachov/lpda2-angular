import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import {PublicHomeReserveComponent} from "@core/components/public-home-reserve/public-home-reserve.component";
import { PublicPageComponent } from '../public-page-component';

@Component({
  selector: 'app-reserve',
  standalone: true,
  imports: [
    PublicHomeReserveComponent
  ],
  templateUrl: './reserve.component.html',
  styleUrl: './reserve.component.scss'
})
export class ReserveComponent extends PublicPageComponent {
  readonly _ = inject(Title).setTitle($localize`Prenota un tavolo | La Porta D'Acqua`);
}

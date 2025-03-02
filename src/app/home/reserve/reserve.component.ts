import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import {PublicHomeReserveComponent} from "@core/components/public-home-reserve/public-home-reserve.component";

@Component({
  selector: 'app-reserve',
  standalone: true,
  imports: [
    PublicHomeReserveComponent
  ],
  templateUrl: './reserve.component.html',
  styleUrl: './reserve.component.scss'
})
export class ReserveComponent {
  readonly _ = inject(Title).setTitle($localize`Prenota un tavolo | La Porta D'Acqua`);

  ngOnInit() {
    window.scrollTo(0, 0);
  }
}

import { Component, inject } from '@angular/core';
import { PublicImageHeaderComponent } from "../../../core/components/public-image-header/public-image-header.component";
import { PublicPageComponent } from '../public-page-component';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-disclaimers',
  standalone: true,
  imports: [PublicImageHeaderComponent],
  templateUrl: './disclaimers.component.html',
})
export class DisclaimersComponent extends PublicPageComponent {
  readonly _ = inject(Title).setTitle($localize`Disclaimers | La Porta D'Acqua`);
}

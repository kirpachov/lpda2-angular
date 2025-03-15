import { Component, inject } from '@angular/core';
import { PublicImageHeaderComponent } from "../../../core/components/public-image-header/public-image-header.component";
import { PublicPageComponent } from '../public-page-component';
import { Title } from '@angular/platform-browser';
import { ContactUsComponent } from "../../../core/components/contact-us/contact-us.component";

@Component({
  selector: 'app-terms-and-conditions',
  standalone: true,
  imports: [PublicImageHeaderComponent, ContactUsComponent],
  templateUrl: './terms-and-conditions.component.html',
})
export class TermsAndConditionsComponent extends PublicPageComponent {
  readonly _ = inject(Title).setTitle($localize`Termini e condizioni | La Porta D'Acqua`);
}

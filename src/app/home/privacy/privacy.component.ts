import { Component } from '@angular/core';
import { PublicImageHeaderComponent } from "../../../core/components/public-image-header/public-image-header.component";
import { PublicPageComponent } from '../public-page-component';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [PublicImageHeaderComponent],
  templateUrl: './privacy.component.html',
})
export class PrivacyComponent extends PublicPageComponent {
}

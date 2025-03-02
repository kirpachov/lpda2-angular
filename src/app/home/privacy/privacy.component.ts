import { Component } from '@angular/core';
import { PublicImageHeaderComponent } from "../../../core/components/public-image-header/public-image-header.component";

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [PublicImageHeaderComponent],
  templateUrl: './privacy.component.html',
})
export class PrivacyComponent {
  ngOnInit() {
    window.scrollTo(0, 0);
  }
}

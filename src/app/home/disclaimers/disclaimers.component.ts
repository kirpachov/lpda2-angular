import { Component } from '@angular/core';
import { PublicImageHeaderComponent } from "../../../core/components/public-image-header/public-image-header.component";

@Component({
  selector: 'app-disclaimers',
  standalone: true,
  imports: [PublicImageHeaderComponent],
  templateUrl: './disclaimers.component.html',
})
export class DisclaimersComponent {
  ngOnInit() {
    window.scrollTo(0, 0);
  }
}

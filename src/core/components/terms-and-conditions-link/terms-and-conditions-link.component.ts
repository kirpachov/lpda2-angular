import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-terms-and-conditions-link',
  standalone: true,
  imports: [
    RouterModule,
    MatIconModule,
  ],
  templateUrl: './terms-and-conditions-link.component.html',
  styleUrls: [
    './terms-and-conditions-link.component.scss',
  ]
})
export class TermsAndConditionsLinkComponent {
  @Input() target: '_blank' | '_self' = '_blank';
  @Input() showIcon: boolean = true;
}

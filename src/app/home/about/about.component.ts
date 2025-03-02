import { Component, inject } from '@angular/core';
import {NgOptimizedImage} from "@angular/common";
import { Title } from '@angular/platform-browser';
import { PublicImageHeaderComponent } from "../../../core/components/public-image-header/public-image-header.component";

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [
    NgOptimizedImage,
    PublicImageHeaderComponent
],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {
  readonly _ = inject(Title).setTitle($localize`Chi siamo | La Porta D'Acqua`);

  ngOnInit() {
    window.scrollTo(0, 0);
  }
}

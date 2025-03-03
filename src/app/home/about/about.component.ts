import { Component, inject } from '@angular/core';
import {NgOptimizedImage} from "@angular/common";
import { Title } from '@angular/platform-browser';
import { PublicImageHeaderComponent } from "../../../core/components/public-image-header/public-image-header.component";
import { PublicPageComponent } from '../public-page-component';

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
export class AboutComponent extends PublicPageComponent {
  readonly _ = inject(Title).setTitle($localize`Chi siamo | La Porta D'Acqua`);
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from "@angular/router";
import {PublicHomeLandingComponent} from "@core/components/public-home-landing/public-home-landing.component";
import {PublicHomeAboutComponent} from "@core/components/public-home-about/public-home-about.component";
import {PublicHomeMenuComponent} from "@core/components/public-home-menu/public-home-menu.component";
import {PublicHomeInstagramComponent} from "@core/components/public-home-instagram/public-home-instagram.component";
import {PublicHomeReserveComponent} from "@core/components/public-home-reserve/public-home-reserve.component";
import {PublicMessageComponent} from "@core/components/public-message/public-message.component";
import { Title } from "@angular/platform-browser";
import { PublicPageComponent } from '../public-page-component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PublicHomeLandingComponent,
    PublicHomeAboutComponent,
    PublicHomeMenuComponent,
    PublicHomeInstagramComponent,
    PublicHomeReserveComponent,
    PublicMessageComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent extends PublicPageComponent {
  readonly _ = inject(Title).setTitle(`La Porta D'Acqua`);
}

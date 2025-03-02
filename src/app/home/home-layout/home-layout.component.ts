import {Component, HostBinding, inject, OnInit} from '@angular/core';
import {RouterOutlet} from "@angular/router";
import {PublicNavbarComponent} from "@core/components/public-navbar/public-navbar.component";
import {PublicFooterComponent} from "@core/components/public-footer/public-footer.component";
import { PublicPagesDataService } from '@core/services/http/public-pages-data.service';

@Component({
  selector: 'app-home-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    PublicNavbarComponent,
    PublicFooterComponent
  ],
  templateUrl: './home-layout.component.html',
  styleUrl: './home-layout.component.scss'
})
export class HomeLayoutComponent implements OnInit {
  private readonly PublicPagesDataService: PublicPagesDataService = inject(PublicPagesDataService);

  ngOnInit() {
    window.scrollTo(0, 0);
  }
}

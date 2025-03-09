import {Component, ElementRef, HostBinding, inject, OnInit} from '@angular/core';
import {NavigationEnd, Router, RouterOutlet} from "@angular/router";
import {PublicNavbarComponent} from "@core/components/public-navbar/public-navbar.component";
import {PublicFooterComponent} from "@core/components/public-footer/public-footer.component";
import { PublicPagesDataService } from '@core/services/http/public-pages-data.service';
import { PublicPageComponent } from '../public-page-component';
import { filter, takeUntil } from 'rxjs';
import { TuiDestroyService } from '@taiga-ui/cdk';

@Component({
  selector: 'app-home-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    PublicNavbarComponent,
    PublicFooterComponent
  ],
  templateUrl: './home-layout.component.html',
  styleUrl: './home-layout.component.scss',
  providers: [
    TuiDestroyService
  ]
})
export class HomeLayoutComponent {
  private readonly PublicPagesDataService: PublicPagesDataService = inject(PublicPagesDataService);

  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly router: Router = inject(Router);
  private readonly me: ElementRef = inject(ElementRef);

  ngOnInit(): void {
    this.router.events.pipe(
      takeUntil(this.destroy$),
      filter((e: unknown): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe({
      next: () => {
        setTimeout(() => {
          // console.log(`scroll into view`, e, this.me.nativeElement);
          this.me.nativeElement.scrollIntoView({ behavior: "smooth", block: "start", inline: "start" });
        }, 100)
      }
    })
  }
}

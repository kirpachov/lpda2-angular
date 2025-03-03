import { Component, inject, signal, WritableSignal } from '@angular/core';
import { PublicNavigateMenuV1Component } from "../../../core/components/public-navigate-menu-v1/public-navigate-menu-v1.component";
import { Title } from '@angular/platform-browser';
import { PublicImageHeaderComponent } from "../../../core/components/public-image-header/public-image-header.component";
import { PublicPageComponent } from '../public-page-component';
import { TuiExpandModule } from '@taiga-ui/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { map, takeUntil } from 'rxjs';
import { TuiDestroyService } from '@taiga-ui/cdk';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    PublicNavigateMenuV1Component,
    PublicImageHeaderComponent,
    TuiExpandModule,
  ],
  templateUrl: './menu.component.html',
  providers: [
    TuiDestroyService
  ]
})
export class MenuComponent extends PublicPageComponent {
  readonly _ = inject(Title).setTitle($localize`Menu | La Porta D'Acqua`);
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);

  private readonly route: ActivatedRoute = inject(ActivatedRoute);

  readonly showTitle: WritableSignal<boolean> = signal(true);

  override ngOnInit(): void {
    super.ngOnInit();

    this.route.params.pipe(
      takeUntil(this.destroy$),
      map((p: Params) => p["categoryIds"])
    ).subscribe({
      next: (ids: unknown) => {
        this.showTitle.set(!(typeof ids === "string" && ids.length > 0));
      }
    })
  }
}

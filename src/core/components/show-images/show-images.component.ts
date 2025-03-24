import {ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, Injector, Input, signal, WritableSignal} from '@angular/core';
import {Image} from "@core/models/image";
import {TuiCarouselModule, TuiIslandModule, TuiMarkerIconModule} from "@taiga-ui/kit";
import {TuiButtonModule, TuiDialogService, TuiLoaderModule} from "@taiga-ui/core";
import {ShowImageComponent} from "@core/components/show-image/show-image.component";
import {MatIcon} from "@angular/material/icon";
import {TuiDestroyService} from "@taiga-ui/cdk";
import {PolymorpheusComponent} from "@tinkoff/ng-polymorpheus";
import {ImagesEditModalComponent} from "@core/components/show-images/images-edit-modal/images-edit-modal.component";
import { ImagesService } from '@core/services/http/images.service';
import { finalize, takeUntil } from 'rxjs';
import { SearchResult } from '@core/lib/search-result.model';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationsService } from '@core/services/notifications.service';
import { parseHttpErrorMessage } from '@core/lib/parse-http-error-message';

@Component({
  selector: 'app-show-images',
  standalone: true,
  imports: [
    TuiCarouselModule,
    TuiButtonModule,
    TuiIslandModule,
    TuiLoaderModule,
    TuiMarkerIconModule,
    ShowImageComponent,
    MatIcon
  ],
  templateUrl: './show-images.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService,
  ]
})
export class ShowImagesComponent {
  private readonly dialogs: TuiDialogService = inject(TuiDialogService);
  private readonly injector: Injector = inject(Injector);
  private readonly service: ImagesService = inject(ImagesService);
  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  private readonly notifications: NotificationsService = inject(NotificationsService);
  private readonly cd: ChangeDetectorRef = inject(ChangeDetectorRef);

  private readonly loadingImages: WritableSignal<boolean> = signal(false);

  readonly loading = computed(() => this.loadingImages());

  @Input({required: true}) images: (Image | File)[] | undefined | null = [];
  @Input({required: true}) recordType?: "Menu::Category" | "Menu::Dish" | "TableType";
  @Input({required: true}) recordId?: number;
  cIndex: WritableSignal<number> = signal(0);

  showDetails(): void {
    this.dialogs.open<any>(
      new PolymorpheusComponent(ImagesEditModalComponent, this.injector),
      {
        data: { record_type: this.recordType, record_id: this.recordId },
        dismissible: true,
        closeable: true,
        label: $localize`Modifica immagini`,
      },
    ).subscribe({
      next: (data: unknown) => {
        console.log(`next with data`, data);
        this.reloadImages();
      },
      error: (data: any) => {
        this.reloadImages();
        console.warn(`completed with error`, data)
      },
      complete: () => {
        console.log(`complete with data`);
        this.reloadImages();
      },
    });
  }

  private reloadImages(): void {
    if (!(this.recordType && this.recordId)) {
      this.notifications.error();
      return;
    }

    // this.loadSub?.unsubscribe();

    this.loadingImages.set(true);
    this.service.search({record_type: this.recordType, record_id: this.recordId}).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loadingImages.set(false)),
    ).subscribe({
      next: (data: SearchResult<Image>) => {
        this.images = data.items;
        this.cd.markForCheck();
      },
      error: (r: HttpErrorResponse) => {
        this.notifications.error(parseHttpErrorMessage(r));
      }
    });
  }
}

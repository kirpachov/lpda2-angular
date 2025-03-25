import { ChangeDetectionStrategy, Component, Input, signal, WritableSignal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Image } from '@core/models/image';
import { TuiButtonModule, TuiLoaderModule } from '@taiga-ui/core';
import { TuiCarouselModule, TuiIslandModule, TuiMarkerIconModule } from '@taiga-ui/kit';
import { ShowImageComponent } from '../show-image/show-image.component';
import {ImageData, ImageStatus} from "@core/lib/interfaces/image-data";

@Component({
  selector: 'app-public-show-images',
  standalone: true,
  imports: [
    TuiCarouselModule,
    TuiButtonModule,
    TuiIslandModule,
    TuiLoaderModule,
    TuiMarkerIconModule,
    ShowImageComponent,
    // MatIcon
  ],
  templateUrl: './public-show-images.component.html',
  styleUrl: './public-show-images.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicShowImagesComponent {
  @Input({required: true}) images?: (Image | ImageData)[] | null;

  /**
   * Duration in milliseconds for each slide for automatic rotation (use 0 to disable automatic rotation)
   */
  @Input() duration: number = 5000;

  cIndex: WritableSignal<number> = signal(0);

  nextImage() {
    if (!(this.images && this.images.length > 0)) {
      this.cIndex.set(0);
      return;
    }

    if (this.cIndex() == this.images!.length - 1) {
      this.cIndex.set(0);
      return;
    }

    this.cIndex.set(this.cIndex() + 1);
  }
}

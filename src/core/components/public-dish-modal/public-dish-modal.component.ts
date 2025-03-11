import { ChangeDetectionStrategy, Component, Inject, signal, WritableSignal } from '@angular/core';
import {POLYMORPHEUS_CONTEXT, PolymorpheusComponent} from "@tinkoff/ng-polymorpheus";
import {
  TuiButtonModule,
  TuiDialogContext,
  TuiDialogService,
  TuiExpandModule,
  TuiLinkModule,
  TuiLoaderModule
} from "@taiga-ui/core";
import { Dish } from '@core/models/dish';
import { ShowImageComponent } from "../show-image/show-image.component";
import { CurrencyPipe, JsonPipe } from '@angular/common';
import { PublicMenuShowTagsComponent } from "./public-menu-show-tags/public-menu-show-tags.component";
import { PublicMenuShowAllergensComponent } from "./public-menu-show-allergens/public-menu-show-allergens.component";
import { PublicMenuShowIngredientsComponent } from "./public-menu-show-ingredients/public-menu-show-ingredients.component";
import { PublicMenuShowSuggestionsComponent } from "./public-menu-show-suggestions/public-menu-show-suggestions.component";
import { PublicShowImagesComponent } from "../public-show-images/public-show-images.component";
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-public-dish-modal',
  standalone: true,
  imports: [
    ShowImageComponent,
    CurrencyPipe,
    PublicMenuShowTagsComponent,
    PublicMenuShowAllergensComponent,
    PublicMenuShowIngredientsComponent,
    PublicMenuShowSuggestionsComponent,
    PublicShowImagesComponent,
    MatIconModule,
],
  templateUrl: './public-dish-modal.component.html',
  styleUrl: './public-dish-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicDishModalComponent {

  readonly dish: WritableSignal<Dish | null> = signal(null);
  readonly showPrice: WritableSignal<boolean> = signal(false);

  constructor(
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: TuiDialogContext<null, { dish: Dish, showPrice: boolean }>,
  ) {
    this.dish.set(this.context.data.dish);
    this.showPrice.set(this.context.data.showPrice);
  }

  close(){
    this.context.completeWith(null);
  }

}

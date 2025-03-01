import { NgClass } from '@angular/common';
import { Component, Input, OnChanges, signal, WritableSignal } from '@angular/core';
import { MenuCategory } from '@core/models/menu-category';
import { TuiTooltipModule } from '@taiga-ui/core';

@Component({
  selector: 'app-menu-category-visibility-summary',
  standalone: true,
  imports: [
    TuiTooltipModule,
  ],
  template: `

@if(item) {
  <p class="tui-island__category">
    @if(item.public_visible) {
      <ng-container i18n>Pubblico</ng-container>
    } @else {
      <span class="text-red-400">NON pubblico</span>

      @if(invisibleBecause){
        <tui-tooltip [content]="invisibleBecause"></tui-tooltip>
      }
    }
  </p>
}
  `,
})
export class MenuCategoryVisibilitySummaryComponent implements OnChanges {
  @Input({required: true}) item: MenuCategory | null | undefined = null;

  ngOnChanges(): void {
    this.updateVisibility();
  }

  invisibleBecause: string | null = null;

  /**
   * Trying to guess why the server is telling that this category is not visible.
   */
  private updateVisibility() {
    if (!this.item) return this.invisibleBecause = null;

    if (this.item.status === "inactive") {
      return this.invisibleBecause = $localize`La categoria è in stato inattivo, per questo non sarà visibile nel menu pubblico.`;
    }

    if (this.item.visibility?.public_visible === false) {
      return this.invisibleBecause = $localize`La visibilità pubblica è disattivata. Per renderlo pubblico, apri il menù, poi apri i dettagli e modifica la Visibilità pubblica.`;
    }

    return this.invisibleBecause = null;
  }
}

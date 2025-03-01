import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {MenuCategory} from "@core/models/menu-category";
import {TuiButtonModule, TuiDataListModule, TuiHostedDropdownModule} from "@taiga-ui/core";
import {MatIcon} from "@angular/material/icon";
import {
  MenuCategoryStatusComponent
} from "@core/components/statuses/menu-category/menu-category-status/menu-category-status.component";
import {NotificationsService} from "@core/services/notifications.service";
import {takeUntil} from "rxjs";
import {TuiDestroyService} from "@taiga-ui/cdk";
import {NgClass} from "@angular/common";

@Component({
  selector: 'app-edit-menu-category-status',
  standalone: true,
  imports: [
    TuiHostedDropdownModule,
    TuiDataListModule,
    MatIcon,
    MenuCategoryStatusComponent,
    TuiButtonModule,
    NgClass
  ],
  templateUrl: './edit-menu-category-status.component.html',
  providers: [
    TuiDestroyService
  ]
})
export class EditMenuCategoryStatusComponent {
  private readonly notifications: NotificationsService = inject(NotificationsService);
  private readonly destroy$ = inject(TuiDestroyService);

  @Output() deleteCategory: EventEmitter<void> = new EventEmitter<void>();
  @Output() statusChange: EventEmitter<MenuCategory['status']> = new EventEmitter<MenuCategory['status']>();
  @Output() categoryChange: EventEmitter<MenuCategory> = new EventEmitter<MenuCategory>();
  @Input() category?: MenuCategory | null = null;

  delete() {
    this.notifications.confirm(
      $localize`Sei sicuro di voler eliminare la categoria?`, {
        yes: $localize`Sì, elimina la categoria`,
        no: $localize`Annulla`
      }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result: boolean) => {
        if (result) this.deleteCategory.emit();
      }
    })
  }

  updateStatus(status: MenuCategory['status']) {
    this.statusChange.emit(status);
  }
}

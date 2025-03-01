import {
  ChangeDetectionStrategy,
  Component,
  computed, EventEmitter,
  inject,
  Injector,
  Input, Output,
  Signal,
  signal,
  WritableSignal
} from '@angular/core';
import {MenuCategory} from "@core/models/menu-category";
import {TuiDestroyService} from "@taiga-ui/cdk";
import {TuiButtonModule, TuiDialogService} from "@taiga-ui/core";
import {TuiToggleModule} from "@taiga-ui/kit";
import {ReactiveFormsModule} from "@angular/forms";
import {nue} from '@core/lib/nue';
import {
  TimestampsModalComponent
} from "@core/components/eip-category-visibility/timestamps-modal/timestamps-modal.component";
import {PolymorpheusComponent} from "@tinkoff/ng-polymorpheus";
import {DatePipe, JsonPipe} from "@angular/common";
import {ErrorsComponent} from "@core/components/errors/errors.component";
import {MatIcon} from "@angular/material/icon";
import { MenuCategoryVisibilitySummaryComponent } from "../menu-dashboard/list-categories/menu-category-visibility-summary/menu-category-visibility-summary.component";

@Component({
  selector: 'app-eip-category-visibility',
  standalone: true,
  imports: [
    TuiToggleModule,
    ReactiveFormsModule,
    DatePipe,
    // ErrorsComponent,
    TuiButtonModule,
    MatIcon,
    MenuCategoryVisibilitySummaryComponent
],
  templateUrl: './eip-category-visibility.component.html',
  styleUrl: './eip-category-visibility.component.scss',
  providers: [
    TuiDestroyService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EipCategoryVisibilityComponent {
  private readonly dialogs: TuiDialogService = inject(TuiDialogService);
  private readonly injector: Injector = inject(Injector);

  readonly item: WritableSignal<MenuCategory | null> = signal(null);

  readonly private_visible: Signal<boolean> = computed(
    () => this.item()?.visibility?.private_visible ?? false
  );

  readonly isInactive: Signal<boolean> = computed(() => this.item()?.status === "inactive");

  readonly public_from: Signal<Date | undefined> = computed(() => this.item()?.visibility?.public_from);

  readonly public_to: Signal<Date | undefined> = computed(() => this.item()?.visibility?.public_to);

  readonly daily_from: Signal<Date | undefined> = computed(() => this.item()?.visibility?.daily_from);

  readonly daily_to: Signal<Date | undefined> = computed(() => this.item()?.visibility?.daily_to);

  readonly public_visible: Signal<boolean> = computed(
    () => this.item()?.visibility?.public_visible ?? false
  );

  @Output() readonly categoryChange: EventEmitter<MenuCategory> = new EventEmitter<MenuCategory>();

  @Input({required: true}) set category(value: MenuCategory | null | undefined) {
    this.item.set(value ?? null);
  }

  get category(): MenuCategory | null | undefined {
    return this.item();
  }

  editTimestamps(): void {
    this.dialogs.open<any>(
      new PolymorpheusComponent(TimestampsModalComponent, this.injector),
      {
        data: {category: this.item()},
        dismissible: false,
        closeable: true,
        label: $localize`Modifica visibilità`,
      },
    ).subscribe({
      next: (v: null | MenuCategory): void => {
        if (v) {
          this.item.set(v);
          this.categoryChange.emit(v);
        }
      }
    });
  }
}

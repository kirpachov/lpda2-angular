import { ChangeDetectionStrategy, Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PublicData } from '@core/lib/interfaces/public-data';
import { SettingValue } from '@core/lib/settings';
import { PublicPagesDataService } from '@core/services/http/public-pages-data.service';
import { TuiDestroyService } from '@taiga-ui/cdk';
import { TuiTextfieldControllerModule } from '@taiga-ui/core';
import { TuiDataListWrapperModule, TuiSelectModule } from '@taiga-ui/kit';
import { takeUntil, filter } from 'rxjs';

@Component({
  selector: 'app-people-input',
  standalone: true,
  imports: [
    MatIconModule,
    TuiSelectModule,
    TuiTextfieldControllerModule,
    ReactiveFormsModule,
    TuiDataListWrapperModule,
  ],
  templateUrl: './people-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TuiDestroyService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: PeopleInputComponent,
      multi: true
    }
  ]
})
export class PeopleInputComponent implements OnInit, ControlValueAccessor {

  private readonly destroy$ = inject(TuiDestroyService);
  private readonly publicDataService: PublicPagesDataService = inject(PublicPagesDataService);

  readonly people: FormControl<number | null> = new FormControl<number | null>(null);

  readonly peopleArray: WritableSignal<number[]> = signal(Array.from({ length: 10 }).map((_: unknown, i: number): number => i + 1));

  ngOnInit(): void {
    this.loadPublicData();
  }

  writeValue(obj: any): void {
    this.people.setValue(obj);
  }

  registerOnChange(fn: any): void {
    this.people.valueChanges.subscribe((value: number | null) => {
      fn(value);
    });
  }

  registerOnTouched(fn: any): void {
    this.people.valueChanges.subscribe(() => {
      fn();
    });
  }

  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.people.disable();
    } else {
      this.people.enable();
    }
  }

  private loadPublicData(): void {
    this.publicDataService.data$.pipe(
      takeUntil(this.destroy$),
      filter((data: PublicData | null): data is PublicData => data !== null)
    ).subscribe({
      next: (data: PublicData) => {
        const maxPeople: SettingValue | null = data.settings["max_people_per_reservation"] ?? null;
        this.updateMaxPeople(Number(maxPeople));
      }
    })
  }

  private updateMaxPeople(value: number): void {
    this.peopleArray.set(Array.from({ length: value }).map((_: unknown, i: number): number => i + 1));
  }
}

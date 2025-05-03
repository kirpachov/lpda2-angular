import { Pipe, PipeTransform } from '@angular/core';
import { TuiDay } from '@taiga-ui/cdk';

@Pipe({
  name: 'tuiDayToUtcNativeDate',
  standalone: true,
  pure: true
})
export class TuiDayToUtcNativeDatePipe implements PipeTransform {

  transform(value: TuiDay | null | undefined): Date | null {
    if (!value) return null;

    return value.toUtcNativeDate();
  }

}

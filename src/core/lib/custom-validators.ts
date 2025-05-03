import { AbstractControl, FormControl, FormGroup, UntypedFormControl, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";
import { TuiTime } from "@taiga-ui/cdk";

const hasValue = (v: any): boolean => v !== undefined && v !== null && `${v}` !== '';

const validatePhoneIT = (value: string): boolean => {
  const maxLength: number = 10 + 2 + 2; // Number of digits + 2 for the prefix + 2 for the country code

  if (value.length < 9) return false;

  if (isNaN(Number(value))) return false;

  if (value.length > maxLength) return false;

  return true;
};

export class CustomValidators extends Validators {
  static formWeeklyFromTo(from_name: string, to_name: string): (param: unknown) => ValidationErrors | null {
    return (param: unknown) => {
      if (!(param instanceof FormGroup)) {
        console.warn('formWeeklyFromTo: param is not a FormGroup', param);
        return null;
      }

      const g = param as FormGroup;
      const from: AbstractControl | null = g.get(from_name);
      const to: AbstractControl | null = g.get(to_name);
      if (!(from && to && from.value instanceof TuiTime && to.value instanceof TuiTime)) return null;

      if (from.value && to.value && from.value.toAbsoluteMilliseconds() >= to.value.toAbsoluteMilliseconds()) {
        return { formWeeklyFromTo: true };
      }

      return null;
    }
  }

  /**
   * Method will validate the form based on the result of the function passed as the second argument.
   */
  static canBeBlankIf(
    formControlThatCanBeBlank: string,
    canBeBlankFunc: () => boolean,
    specs?: { message?: string }
  ): ValidatorFn {
    const message = specs?.message || $localize`La form non è valida.`;

    return (thisIsAFormGroup: unknown): ValidationErrors | null => {
      if (!(thisIsAFormGroup instanceof FormGroup)) {
        throw new Error('canBeBlankIf: thisIsAFormGroup is not a FormGroup');
      }

      const form = thisIsAFormGroup as FormGroup;

      const control = form.get(formControlThatCanBeBlank);
      if (!control) {
        throw new Error('canBeBlankIf: control is blank. control name: ' + formControlThatCanBeBlank);
      }

      if (hasValue(control.value) || canBeBlankFunc()) return null;

      return { [`${formControlThatCanBeBlank}canBeBlankIf`]: message };
    }
  }

  // static tuiTimeAfter(valueObj: TuiTime | (() => TuiTime | null | undefined)): ValidatorFn {
  //   return (control: AbstractControl | UntypedFormControl): ValidationErrors | null => {
  //     const value = valueObj instanceof Function ? valueObj() : valueObj;
  //     if (!(value instanceof TuiTime && control.value instanceof TuiTime)) return null;

  //     const valueMilli = value.toAbsoluteMilliseconds();
  //     const controlMilli = control.value.toAbsoluteMilliseconds();

  //     if (valueMilli >= controlMilli) return { tuiTimeAfter: true };

  //     return null;
  //   };
  // }

  static listOfEmails(control: AbstractControl | UntypedFormControl): ValidationErrors | null {
    const value = control.value;
    if (!(value && typeof value === 'string' && value.length)) return null;

    const regex = new RegExp('^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$', 'i');
    value.split(/\,|\s+/gm).map((email: string) => email.trim()).filter((email: string) => email.length).forEach((email: string): ValidationErrors | void => {
      if (!regex.test(email)) return { listOfEmails: true };
    });

    return null;
  }

  static mustBeArray(control: AbstractControl | UntypedFormControl): ValidationErrors | null {
    if (!Array.isArray(control.value)) {
      return { 'mustBeArray': true };
    }

    return null;
  }

  static objectNotEmpty(control: AbstractControl | UntypedFormControl): ValidationErrors | null {
    if (hasValue(control.value) && typeof control.value === "object" && Object.keys(control.value).length === 0) {
      const presentValues = Object.values(control.value).filter((v: any) => hasValue(v));
      if (presentValues.length === 0) return { 'objectNotEmpty': true };

      return null;
    }

    return null;
  }

  /**
   * Validates that all values in an object are present (not null or undefined).
   */
  static objectValuesAllPresent(control: AbstractControl | UntypedFormControl): ValidationErrors | null {
    if (hasValue(control.value) && typeof control.value === "object") {
      const presentValues = Object.values(control.value).filter((v: any) => hasValue(v));
      if (presentValues.length !== Object.keys(control.value).length) return { 'objectValuesAllPresent': true };

      return null;
    }

    return null;
  }

  static arrayMinLength(minLength: number): (c: AbstractControl | UntypedFormControl) => ValidationErrors | null {
    return (control: AbstractControl | UntypedFormControl) => {
      if (!Array.isArray(control.value)) return null;
      if (control.value.length < minLength) {
        return { 'arrayMinLength': { 'requiredLength': minLength, 'actualLength': control.value?.length ?? 0 } };
      }

      return null;
    };
  }

  static validateArray(validator: (c: AbstractControl | UntypedFormControl) => ValidationErrors | null): (c: AbstractControl | UntypedFormControl) => ValidationErrors | null {
    return (control: AbstractControl | UntypedFormControl) => {
      if (!Array.isArray(control.value)) return null;
      const errors: ValidationErrors = {};
      for (const item of control.value) {
        const result = validator(new UntypedFormControl(item));
        if (result) {
          Object.assign(errors, result);
        }
      }
      return Object.keys(errors).length ? errors : null;
    };
  }

  static percentage(control: AbstractControl | UntypedFormControl): ValidationErrors | null {
    if (hasValue(control.value) && (isNaN(control.value) || control.value < 0 || control.value > 100)) {
      return { 'percentage': true };
    }

    return null;
  }

  static phoneIT(control: AbstractControl | UntypedFormControl): ValidationErrors | null {
    const final = (valid: boolean): ValidationErrors | null => valid ? null : { 'phoneIT': true };
    const value = `${control.value}`.trim().replace(/\s+/gm, '').replace(/^\+39/gm, '');
    if (!(hasValue(value))) return final(true);

    return final(validatePhoneIT(value));
    // const maxLength: number = 10 + 2 + 2 ; // Number of digits + 2 for the prefix + 2 for the country code

    // if (value.length < 9) return final(false);

    // if (isNaN(Number(value))) return final(false);

    // if (value.length > maxLength) return final(false);

    // return final(true);
  }

  static instanceof(item: any): (c: AbstractControl | UntypedFormControl) => ValidationErrors | null {
    return (control: AbstractControl | UntypedFormControl) => {
      if (hasValue(control.value) && !(control.value instanceof item)) {
        return { 'instanceof': true };
      }

      return null;
    }
  }

  static instanceOf = this.instanceof;

  static numerical(control: AbstractControl | UntypedFormControl): ValidationErrors | null {
    if (hasValue(control.value) && isNaN(control.value)) {
      return { 'numerical': true };
    }

    return null;
  }

  static moreThan(expected: number): (c: AbstractControl | UntypedFormControl) => ValidationErrors | null {
    return (control: AbstractControl | UntypedFormControl): ValidationErrors | null => {
      const value = control.value;
      if (value <= expected) return { moreThan: true };

      return null;
    }
  }

  static in(options: any[]): (c: AbstractControl | UntypedFormControl) => ValidationErrors | null {
    return this.inclusion(options);
  }

  static inclusion(options: readonly any[] | any[]): (c: AbstractControl | UntypedFormControl) => ValidationErrors | null {
    return (control: AbstractControl | UntypedFormControl) => {
      if (hasValue(control.value) && !options.includes(control.value)) {
        return { 'inclusion': true };
      }

      return null;
    }
  }
}

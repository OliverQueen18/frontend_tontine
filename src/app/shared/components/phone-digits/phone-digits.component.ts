import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChildren,
  forwardRef
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-phone-digits',
  standalone: true,
  imports: [FormsModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => PhoneDigitsComponent),
    multi: true
  }],
  template: `
    <div class="phone-digits" [class.phone-digits--invalid]="touched && !isValid()">
      @for (d of digits; track $index) {
        <input
          #digitInput
          type="text"
          inputmode="numeric"
          maxlength="1"
          class="phone-digit"
          [ngModel]="d"
          (ngModelChange)="onDigitChange($index, $event)"
          (keydown)="onKeyDown($index, $event)"
          (paste)="onPaste($event)"
          (blur)="onBlur()"
          [required]="required"
          [attr.aria-label]="'Chiffre ' + ($index + 1)"
        />
      }
    </div>
    @if (touched && !isValid()) {
      <span class="phone-error">8 chiffres obligatoires</span>
    }
  `,
  styles: [`
    .phone-digits {
      display: flex;
      gap: 0.35rem;
    }
    .phone-digit {
      width: 2.25rem;
      height: 2.5rem;
      text-align: center;
      font-size: 1.1rem;
      font-weight: 600;
      border: 1px solid var(--border, #cbd5e1);
      border-radius: 8px;
      padding: 0;
    }
    .phone-digit:focus {
      outline: none;
      border-color: var(--primary, #2563eb);
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
    }
    .phone-digits--invalid .phone-digit {
      border-color: #ef4444;
    }
    .phone-error {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.8rem;
      color: #ef4444;
    }
  `]
})
export class PhoneDigitsComponent implements ControlValueAccessor {
  @Input() required = true;
  @Output() validChange = new EventEmitter<boolean>();

  @ViewChildren('digitInput') inputs!: QueryList<ElementRef<HTMLInputElement>>;

  digits = ['', '', '', '', '', '', '', ''];
  touched = false;
  disabled = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    const normalized = (value ?? '').replace(/\D/g, '').slice(0, 8);
    this.digits = Array.from({ length: 8 }, (_, i) => normalized[i] ?? '');
    this.validChange.emit(this.isValid());
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  isValid(): boolean {
    const hasAny = this.digits.some(d => d !== '');
    if (!this.required && !hasAny) {
      return true;
    }
    return this.digits.every(d => /^\d$/.test(d));
  }

  onDigitChange(index: number, value: string): void {
    const digit = value.replace(/\D/g, '').slice(-1);
    this.digits[index] = digit;
    this.emitValue();
    if (digit && index < 7) {
      this.focusIndex(index + 1);
    }
  }

  onKeyDown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.digits[index] && index > 0) {
      this.focusIndex(index - 1);
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    const normalized = pasted.replace(/\D/g, '').slice(0, 8);
    this.digits = Array.from({ length: 8 }, (_, i) => normalized[i] ?? '');
    this.emitValue();
    this.focusIndex(Math.min(normalized.length, 7));
  }

  onBlur(): void {
    this.touched = true;
    this.onTouched();
  }

  markAsTouched(): void {
    this.touched = true;
    this.onTouched();
  }

  private emitValue(): void {
    const value = this.digits.join('');
    this.onChange(value);
    this.validChange.emit(this.isValid());
  }

  private focusIndex(index: number): void {
    const el = this.inputs?.get(index)?.nativeElement;
    if (el) {
      el.focus();
      el.select();
    }
  }
}

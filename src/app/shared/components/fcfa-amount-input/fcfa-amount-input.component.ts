import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-fcfa-amount-input',
  standalone: true,
  imports: [FormsModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => FcfaAmountInputComponent),
    multi: true
  }],
  template: `
    <div class="fcfa-amount-input">
      <span class="fcfa-amount-input__currency">FCFA</span>
      <input
        type="text"
        inputmode="numeric"
        class="fcfa-amount-input__field"
        [ngModel]="display"
        (ngModelChange)="onInput($event)"
        (blur)="onBlur()"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [attr.aria-label]="ariaLabel"
      />
    </div>
  `,
  styles: [`
    .fcfa-amount-input {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
    }

    .fcfa-amount-input__currency {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--muted, #64748b);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .fcfa-amount-input__field {
      flex: 1;
      min-width: 0;
      width: 100%;
      border: 1px solid var(--border, #cbd5e1);
      border-radius: 10px;
      padding: 0.7rem 0.8rem;
      font: inherit;
      background: #fff;
    }

    .fcfa-amount-input__field:focus {
      outline: none;
      border-color: var(--primary, #1a5632);
      box-shadow: 0 0 0 2px rgba(26, 86, 50, 0.12);
    }

    .fcfa-amount-input__field:disabled {
      background: #f1f5f9;
      cursor: not-allowed;
    }
  `]
})
export class FcfaAmountInputComponent implements ControlValueAccessor {
  @Input() placeholder = '0';
  @Input() ariaLabel = 'Montant en FCFA';

  display = '';
  disabled = false;

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: number | null | undefined): void {
    this.display = this.format(value);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(raw: string): void {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      this.display = '';
      this.onChange(null);
      return;
    }
    const value = Number(digits);
    this.display = this.format(value);
    this.onChange(value);
  }

  onBlur(): void {
    this.onTouched();
  }

  private format(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) {
      return '';
    }
    return new Intl.NumberFormat('fr-FR').format(value);
  }
}

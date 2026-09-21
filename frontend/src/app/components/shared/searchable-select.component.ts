import { Component, ElementRef, HostListener, Input, OnDestroy, ViewChild, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { normalizarBusqueda } from '../../utils/search.utils';

export interface SearchableSelectOption {
  value: unknown;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SearchableSelectComponent), multi: true }],
  template: `
    <div class="relative">
      <div class="relative">
        <input
          type="text"
          #searchInput
          [value]="isOpen ? query : selectedLabel"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [attr.aria-label]="ariaLabel || placeholder"
          autocomplete="off"
          (focus)="openMenu()"
          (input)="filter($any($event.target).value)"
          class="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 pl-3 pr-9 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors disabled:bg-stone-100 disabled:text-stone-400"
        />
        <i class="fa-solid fa-magnifying-glass absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 pointer-events-none"></i>
      </div>

    </div>
  `,
})
export class SearchableSelectComponent implements ControlValueAccessor, OnDestroy {
  @Input() options: SearchableSelectOption[] = [];
  @Input() placeholder = 'Buscar y seleccionar';
  @Input() ariaLabel = '';
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  value: unknown;
  query = '';
  isOpen = false;
  disabled = false;
  menuLeft = 0;
  menuTop = 0;
  menuBottom = 0;
  menuWidth = 0;
  menuAbove = false;
  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};
  private menuElement: HTMLDivElement | null = null;

  constructor(private elementRef: ElementRef) {}

  get selectedLabel(): string {
    return this.options.find(option => option.value === this.value)?.label || '';
  }

  get filteredOptions(): SearchableSelectOption[] {
    const search = normalizarBusqueda(this.query);
    return this.options.filter(option => !search || normalizarBusqueda(option.label).includes(search));
  }

  writeValue(value: unknown): void {
    this.value = value;
    this.query = '';
  }

  registerOnChange(fn: (value: unknown) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.disabled = disabled; }

  openMenu(): void {
    if (this.disabled) return;
    this.query = '';
    this.isOpen = true;
    this.positionMenu();
    this.renderMenu();
  }

  filter(value: string): void {
    this.query = value;
    this.isOpen = true;
    this.positionMenu();
    this.renderMenu();
  }

  select(option: SearchableSelectOption, event: MouseEvent): void {
    event.preventDefault();
    if (option.disabled) return;
    this.value = option.value;
    this.query = '';
    this.isOpen = false;
    this.removeMenu();
    this.onChange(this.value);
    this.onTouched();
  }

  @HostListener('document:mousedown', ['$event'])
  closeWhenClickingOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target) && !this.menuElement?.contains(event.target as Node)) {
      this.isOpen = false;
      this.query = '';
      this.removeMenu();
      this.onTouched();
    }
  }

  @HostListener('window:resize')
  repositionOnResize(): void {
    if (this.isOpen) {
      this.positionMenu();
      this.renderMenu();
    }
  }

  ngOnDestroy(): void { this.removeMenu(); }

  private positionMenu(): void {
    const rect = this.searchInput?.nativeElement.getBoundingClientRect();
    if (!rect) return;
    const menuHeight = 220;
    this.menuWidth = rect.width;
    this.menuLeft = Math.max(8, Math.min(rect.left, window.innerWidth - this.menuWidth - 8));
    this.menuAbove = window.innerHeight - rect.bottom < menuHeight && rect.top > menuHeight;
    this.menuTop = rect.bottom + 4;
    this.menuBottom = window.innerHeight - rect.top + 4;
  }

  private renderMenu(): void {
    this.removeMenu();
    if (!this.isOpen) return;

    const menu = document.createElement('div');
    Object.assign(menu.style, {
      position: 'fixed',
      zIndex: '9999',
      left: `${this.menuLeft}px`,
      width: `${this.menuWidth}px`,
      maxHeight: '208px',
      overflowY: 'auto',
      padding: '4px 0',
      border: '1px solid rgb(231 229 228)',
      borderRadius: '8px',
      background: 'white',
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.12)',
      fontSize: '12px',
    });
    if (this.menuAbove) menu.style.bottom = `${this.menuBottom}px`;
    else menu.style.top = `${this.menuTop}px`;

    if (!this.filteredOptions.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No se encontraron resultados.';
      Object.assign(empty.style, { margin: '0', padding: '10px 12px', color: 'rgb(168 162 158)' });
      menu.appendChild(empty);
    }

    for (const option of this.filteredOptions) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = option.label;
      button.disabled = !!option.disabled;
      Object.assign(button.style, {
        display: 'block', width: '100%', border: '0', padding: '8px 12px', background: 'white',
        color: option.disabled ? 'rgb(168 162 158)' : 'rgb(68 64 60)', textAlign: 'left', cursor: option.disabled ? 'not-allowed' : 'pointer', fontSize: '12px',
      });
      button.addEventListener('mouseenter', () => { if (!button.disabled) button.style.background = 'rgb(255 251 235)'; });
      button.addEventListener('mouseleave', () => { button.style.background = 'white'; });
      button.addEventListener('mousedown', event => this.select(option, event));
      menu.appendChild(button);
    }
    document.body.appendChild(menu);
    this.menuElement = menu;
  }

  private removeMenu(): void {
    this.menuElement?.remove();
    this.menuElement = null;
  }
}

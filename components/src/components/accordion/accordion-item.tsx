import {
  Component, h, Prop
} from '@stencil/core';

@Component({
  tag: 'c-accordion-item',
  styleUrl: 'accordion.scss',
  shadow: true,
})

export class AccordionItem {
  /** The header gives users the context about the additional information available inside the panel */
  @Prop() header: string = '';

  /** Icon can be placed after or before accordion header. Values accepted: `prefix` or `suffix`
   *  Default value is `suffix` */
  @Prop() affix: string = 'suffix';

  /** Disabled option in `boolean`. */
  @Prop() disabled: boolean = false;

  /** Set to true to open panel */
  @Prop() open: boolean = false;

  /** Set divider individually or get it from c-accordion property */
  @Prop() divider: boolean = false;

  openAccordion() {
    this.open = !this.open;
  }

  render() {
    return (
      <div class={`sdds-accordion-item 
        ${(this.disabled ? 'disabled' : '')} 
        ${(this.open ? 'open' : '')}
        ${(this.divider ? 'sdds-divider-light-border-bottom':'')}
        `}>
        <div class={`sdds-accordion-header-${this.affix}`}
          onClick={() => this.openAccordion()}
        >
          <div class="sdds-accordion-title">{this.header}</div>
          <div class="sdds-accordion-icon">
            <svg width='12' height='7' viewBox='0 0 12 7' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path d='M1 1L6 6L11 1' stroke='currentColor' stroke-width='1.25' stroke-linecap='round' stroke-linejoin='round' />
            </svg>
          </div>
        </div>
        <div class="sdds-accordion-panel">
          <slot></slot>
        </div>
      </div>
    )
  }

}
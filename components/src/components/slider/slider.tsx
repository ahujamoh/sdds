import { Component, Prop, Listen, Host, h } from '@stencil/core';

@Component({
  tag: 'sdds-slider',
  styleUrl: 'slider.scss',
  shadow: true,
})
export class Slider {
  wrapperElement: HTMLElement = null;
  scrubberElement: HTMLElement = null;
  scrubberInnerElement: HTMLElement = null;
  dividersElement: HTMLElement = null;
  trackElement: HTMLElement = null;
  trackFillElement: HTMLElement = null;
  minusElement: HTMLElement = null;
  plusElement: HTMLElement = null;
  inputElement: HTMLInputElement = null;
  nativeRangeInputElement: HTMLInputElement = null;
  scrubberGrabPos: object = { x: 0, y: 0 };
  scrubberGrabbed: boolean = false;
  scrubberLeft: number = 0;
  tickValues: Array<number> = [];
  disabledState: boolean = false;
  useControls: boolean = false;
  useInput: boolean = false;
  useSmall: boolean = false;
  useSnapping: boolean = false;
  supposedValueSlot: number = -1;

  /** Text for label */
  @Prop() label = '';

  /** Initial value */
  @Prop() value = '0';

  /** Minimum value */
  @Prop() min = '0';

  /** Maximum value */
  @Prop() max = '100';

  /** Number of tick markers (tick for min- and max-value will be added automatically) */
  @Prop() ticks = '0';

  /** Decide to show numbers above the tick markers or not  */
  @Prop() showTickNumbers = false;

  /** Decide to show the tooltip or not */
  @Prop() tooltip = null;

  /** Sets the disabled state for the whole component  */
  @Prop() disabled = null;

  /** Decide to show the controls or not */
  @Prop() controls = null;

  /** Decide to show the input field or not */
  @Prop() input = null;

  /** Defines how much to increment/decrement the value when using controls */
  @Prop() step = '1';

  /** Name property (will be inherited by the native slider component) */
  @Prop() name = '';

  /** Decide to use the small variant or not */
  @Prop() small = null;

  /** Snap to the ticks grid */
  @Prop() snap = null;

  @Listen('keydown')
  handleKeydown(event) {
    switch (event.key) {
      case 'ArrowLeft':
        this.stepLeft();
        break;

      case 'ArrowRight':
        this.stepRight();
        break;

      default:
        break;
    }
  }

  @Listen('mouseup', { target: 'window' })
  handleMouseUp() {
    if (!this.scrubberGrabbed) {
      return;
    }

    this.scrubberGrabbed = false;
    this.scrubberInnerElement.classList.remove('pressed');
    this.updateValue();

    this.trackElement.focus();
  }

  @Listen('mousemove', { target: 'window' })
  handleMouseMove(event) {
    if (!this.scrubberGrabbed) {
      return;
    }

    const numTicks = parseInt(this.ticks);
    const trackRect = this.trackElement.getBoundingClientRect();
    let localLeft = event.clientX - trackRect.left;
    this.supposedValueSlot = -1;

    if (this.useSnapping && numTicks > 0) {
      const v = Math.round(this.getTrackWidth() / (numTicks + 1));
      localLeft = Math.round(localLeft / v) * v;

      this.supposedValueSlot = Math.round(localLeft / v);
    }

    this.scrubberLeft = this.constrainScrubber(localLeft);
    this.scrubberElement.style.left = `${this.scrubberLeft}px`;

    this.updateValue();
    this.updateTrack();
  }

  updateTrack() {
    const trackWidth = this.getTrackWidth();
    const percentageFilled = (this.scrubberLeft / trackWidth) * 100;

    this.trackFillElement.style.width = `${percentageFilled}%`;
  }

  updateValue() {
    const trackWidth = this.getTrackWidth();

    /* if snapping (supposedValueSlot > 0) is enabled, make sure we display the supposed value (instead of maybe getting a -1/+1 depending on rounding)  */
    if (this.supposedValueSlot > 0) {
      const supposedValue = this.tickValues[this.supposedValueSlot];
      this.value = '' + supposedValue;
    } else {
      const percentage = this.scrubberLeft / trackWidth;
      this.value =
        '' +
        Math.trunc(
          this.getMin() + percentage * (this.getMax() - this.getMin())
        );
    }
  }

  getMin() {
    return parseFloat(this.min);
  }

  getMax() {
    return parseFloat(this.max);
  }

  constrainScrubber(x) {
    const width = this.getTrackWidth();

    if (x < 0) {
      return 0;
    }

    if (x > width) {
      return width;
    }

    return x;
  }

  getTrackWidth() {
    const trackRect = this.trackElement.getBoundingClientRect();
    return trackRect.right - trackRect.left;
  }

  calculateScrubberLeftFromValue(value) {
    const initValue = value;
    const trackWidth = this.getTrackWidth();

    const normalizedValue = initValue - this.getMin();
    const normalizedMax = this.getMax() - this.getMin();

    const calculatedLeft = (normalizedValue / normalizedMax) * trackWidth;

    this.scrubberLeft = calculatedLeft;

    this.scrubberElement.style.left = `${this.scrubberLeft}px`;
  }

  componentDidLoad() {
    const resizeObserver = new ResizeObserver((/*entries*/) => {
      this.calculateScrubberLeftFromValue(this.value);
      this.updateTrack();
    });

    resizeObserver.observe(this.wrapperElement);

    this.scrubberElement.addEventListener('mousedown', (event) => {
      event.preventDefault();

      this.scrubberGrabPos = {
        x: event.offsetX,
        y: event.offsetY,
      };

      this.scrubberGrabbed = true;
      this.scrubberInnerElement.classList.add('pressed');
    });

    if (this.useControls) {
      this.minusElement.addEventListener('click', () => {
        this.stepLeft();
      });

      this.plusElement.addEventListener('click', () => {
        this.stepRight();
      });
    }

    if (this.inputElement) {
      this.inputElement.addEventListener('keydown', (event) => {
        event.stopPropagation();

        if (event.key == 'Enter') {
          let newValue = parseInt(this.inputElement.value);

          if (newValue < this.getMin()) {
            newValue = this.getMin();
          } else if (newValue > this.getMax()) {
            newValue = this.getMax();
          }

          this.calculateScrubberLeftFromValue(newValue);
          this.updateValue();
          this.updateTrack();

          this.inputElement.blur();
          this.wrapperElement.focus();
        }
      });
    }

    this.calculateScrubberLeftFromValue(this.value);
    this.updateTrack();
  }

  calculateInputSizeFromMax() {
    return this.max.length;
  }

  controlsStep(delta) {
    const trackWidth = this.getTrackWidth();
    const percentage = this.scrubberLeft / trackWidth;
    const numTicks = parseInt(this.ticks);

    let currentValue =
      this.getMin() + percentage * (this.getMax() - this.getMin());

    currentValue += delta;

    if (currentValue < this.getMin()) {
      currentValue = this.getMin();
    } else if (currentValue > this.getMax()) {
      currentValue = this.getMax();
    }

    this.value = '' + currentValue;

    /* if snapping is enabled, instead just increment or decrement the current "fixed" value from our ticknumber array */
    if (this.useSnapping && numTicks > 0) {
      const stepDir = delta > 0 ? 1 : -1;
      this.supposedValueSlot += stepDir;

      if (this.supposedValueSlot < 0) {
        this.supposedValueSlot = 0;
      } else if (this.supposedValueSlot > numTicks + 1) {
        this.supposedValueSlot = numTicks + 1;
      }
    }

    this.calculateScrubberLeftFromValue(currentValue);
    this.updateTrack();
    this.updateValue();
  }

  stepLeft() {
    this.controlsStep(-parseInt(this.step));
  }

  stepRight() {
    this.controlsStep(parseInt(this.step));
  }

  componentWillLoad() {
    const numTicks = parseInt(this.ticks);

    if (numTicks > 0) {
      this.tickValues = [this.getMin()];

      const step = (this.getMax() - this.getMin()) / (numTicks + 1);

      for (let i = 1; i < numTicks + 1; i++) {
        this.tickValues.push(this.getMin() + Math.round(step * i));
      }

      this.tickValues.push(this.getMax());
    }

    if (this.disabled !== null) {
      this.disabledState = true;
    }

    if (this.controls !== null) {
      this.useControls = true;
    } else if (this.input !== null) {
      this.useInput = true;
    }

    if (this.small !== null) {
      this.useSmall = true;
    }

    if (this.snap !== null) {
      this.useSnapping = true;
    }

    const min = this.getMin();
    const max = this.getMax();

    if (min > max) {
      console.warn(
        'min-prop must have a higher value than max-prop for the component to work correctly.'
      );
    }
  }

  render() {
    return (
      <Host value={this.value}>
        <input
          ref={(el) => (this.nativeRangeInputElement = el as HTMLInputElement)}
          class="sdds-slider-native-element"
          type="range"
          value={this.value}
          name={this.name}
          min={this.min}
          max={this.max}
        ></input>

        <div
          class={
            'sdds-slider ' +
            (this.disabledState ? 'disabled' : '') +
            ' ' +
            (this.useSmall ? 'sdds-slider-small' : '')
          }
          ref={(el) => (this.wrapperElement = el as HTMLElement)}
        >
          {this.useInput && (
            <div class="sdds-slider__input-values">
              <div
                ref={(el) => (this.minusElement = el as HTMLElement)}
                class="sdds-slider__input-value"
              >
                {this.min}
              </div>
            </div>
          )}

          {this.useControls && (
            <div class="sdds-slider__controls">
              <div
                ref={(el) => (this.minusElement = el as HTMLElement)}
                class="sdds-slider__control sdds-slider__control-minus"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M1.98975 8.00005C1.98975 8.27619 2.2136 8.50005 2.48975 8.50005H13.5104C13.7866 8.50005 14.0104 8.27619 14.0104 8.00005C14.0104 7.72391 13.7866 7.50005 13.5104 7.50005L2.48975 7.50005C2.2136 7.50005 1.98975 7.72391 1.98975 8.00005Z"
                    fill="#0D0F13"
                  />
                </svg>
              </div>
            </div>
          )}

          <div class="sdds-slider-inner">
            <label class={this.tickValues.length > 0 && 'offset'}>
              {this.label}
            </label>

            {this.tickValues.length > 0 && (
              <div class="sdds-slider__value-dividers-wrapper">
                <div
                  ref={(el) => (this.dividersElement = el as HTMLElement)}
                  class="sdds-slider__value-dividers"
                >
                  {this.tickValues.map((value) => {
                    return (
                      <div class="sdds-slider__value-divider">
                        {this.showTickNumbers && <span>{value}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div
              class="sdds-slider__track"
              ref={(el) => (this.trackElement = el as HTMLElement)}
              tabindex="1"
            >
              <div
                class="sdds-slider__track-fill"
                ref={(el) => (this.trackFillElement = el as HTMLElement)}
              ></div>

              <div
                class="sdds-slider__scrubber"
                ref={(el) => (this.scrubberElement = el as HTMLElement)}
              >
                {this.tooltip !== null && (
                  <div class="sdds-slider__value">
                    {this.value}
                    <svg
                      width="18"
                      height="14"
                      viewBox="0 0 18 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8.15882 12.6915L0.990487 1.54076C0.562658 0.875246 1.0405 0 1.83167 0H16.1683C16.9595 0 17.4373 0.875246 17.0095 1.54076L9.84118 12.6915C9.44754 13.3038 8.55246 13.3038 8.15882 12.6915Z"
                        fill="#37414F"
                      />
                    </svg>
                  </div>
                )}

                <div
                  class="sdds-slider__scrubber-inner"
                  ref={(el) => (this.scrubberInnerElement = el as HTMLElement)}
                ></div>
              </div>
            </div>
          </div>

          {this.useInput && (
            <div class="sdds-slider__input-values">
              <div
                ref={(el) => (this.minusElement = el as HTMLElement)}
                class="sdds-slider__input-value"
                tabindex="2"
              >
                {this.max}
              </div>
              <div class="sdds-slider__input-field-wrapper">
                <input
                  size={this.calculateInputSizeFromMax()}
                  class="sdds-slider__input-field"
                  value={this.value}
                  ref={(el) => (this.inputElement = el as HTMLInputElement)}
                />
              </div>
            </div>
          )}

          {this.useControls && (
            <div class="sdds-slider__controls">
              <div
                ref={(el) => (this.plusElement = el as HTMLElement)}
                class="sdds-slider__control sdds-slider__control-plus"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M8.50005 13.5104C8.50005 13.7865 8.27619 14.0104 8.00005 14.0104C7.7239 14.0104 7.50005 13.7865 7.50005 13.5104V8.5H2.48975C2.2136 8.5 1.98975 8.27614 1.98975 8C1.98975 7.72386 2.2136 7.5 2.48975 7.5H7.50005V2.48965C7.50005 2.21351 7.7239 1.98965 8.00005 1.98965C8.27619 1.98965 8.50005 2.21351 8.50005 2.48965V7.5H13.5104C13.7866 7.5 14.0104 7.72386 14.0104 8C14.0104 8.27614 13.7866 8.5 13.5104 8.5H8.50005V13.5104Z"
                    fill="#0D0F13"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>
      </Host>
    );
  }
}

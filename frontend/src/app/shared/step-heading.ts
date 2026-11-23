import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  input,
  viewChild,
} from '@angular/core';

/**
 * Main heading of a screen. It receives the focus when the screen is rendered, so changing step
 * moves the focus to the new heading (REQ-01.31, REQ-02.28, REQ-03.33; ADR-0004).
 */
@Component({
  selector: 'app-step-heading',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1 #heading tabindex="-1">{{ text() }}</h1>`,
})
export class StepHeading {
  readonly text = input.required<string>();

  private readonly heading = viewChild.required<ElementRef<HTMLHeadingElement>>('heading');

  constructor() {
    afterNextRender(() => this.heading().nativeElement.focus());
  }
}

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TextMark } from '../../../domain/terms/terms-document';

/**
 * One text node of the terms with its marks (ADR-0006). Each mark wraps the rest in its element
 * (`strong`, `em`, `u`, `s`, `code`), recursively; the text itself is always interpolated, so any
 * HTML in the CMS content is shown as literal text (AC-03.14).
 */
@Component({
  selector: 'app-terms-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (first()) {
      @case ('bold') {
        <strong><app-terms-text [text]="text()" [marks]="rest()" /></strong>
      }
      @case ('italic') {
        <em><app-terms-text [text]="text()" [marks]="rest()" /></em>
      }
      @case ('underline') {
        <u><app-terms-text [text]="text()" [marks]="rest()" /></u>
      }
      @case ('strikethrough') {
        <s><app-terms-text [text]="text()" [marks]="rest()" /></s>
      }
      @case ('code') {
        <code><app-terms-text [text]="text()" [marks]="rest()" /></code>
      }
      @default {
        {{ text() }}
      }
    }
  `,
})
export class TermsText {
  readonly text = input.required<string>();
  readonly marks = input<readonly TextMark[]>([]);

  protected readonly first = computed<TextMark | null>(() => this.marks()[0] ?? null);
  protected readonly rest = computed(() => this.marks().slice(1));
}

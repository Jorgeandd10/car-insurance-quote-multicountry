import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TermsDocument } from '../../../domain/terms/terms-document';
import { TermsText } from './terms-text';

/**
 * Terms and conditions rendered from the closed tree of ADR-0006: paragraphs, headings and
 * lists only, built with `@if`/`@for` and interpolation. No `innerHTML`, no `DomSanitizer`, no
 * `bypassSecurityTrust*` (REQ-03.16, AC-03.14). A Strapi heading of level n becomes `h(n+2)`,
 * at most `h6`, under the `h2` of the terms section.
 */
@Component({
  selector: 'app-terms-blocks',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TermsText],
  template: `
    @for (block of document().blocks; track $index) {
      @if (block.kind === 'paragraph') {
        <p>
          @for (inline of block.children; track $index) {
            <app-terms-text [text]="inline.text" [marks]="inline.marks" />
          }
        </p>
      } @else if (block.kind === 'heading') {
        @switch (headingLevel(block.level)) {
          @case (3) {
            <h3>
              @for (inline of block.children; track $index) {
                <app-terms-text [text]="inline.text" [marks]="inline.marks" />
              }
            </h3>
          }
          @case (4) {
            <h4>
              @for (inline of block.children; track $index) {
                <app-terms-text [text]="inline.text" [marks]="inline.marks" />
              }
            </h4>
          }
          @case (5) {
            <h5>
              @for (inline of block.children; track $index) {
                <app-terms-text [text]="inline.text" [marks]="inline.marks" />
              }
            </h5>
          }
          @default {
            <h6>
              @for (inline of block.children; track $index) {
                <app-terms-text [text]="inline.text" [marks]="inline.marks" />
              }
            </h6>
          }
        }
      } @else if (block.ordered) {
        <ol>
          @for (item of block.items; track $index) {
            <li>
              @for (inline of item; track $index) {
                <app-terms-text [text]="inline.text" [marks]="inline.marks" />
              }
            </li>
          }
        </ol>
      } @else {
        <ul>
          @for (item of block.items; track $index) {
            <li>
              @for (inline of item; track $index) {
                <app-terms-text [text]="inline.text" [marks]="inline.marks" />
              }
            </li>
          }
        </ul>
      }
    }
  `,
})
export class TermsBlocks {
  readonly document = input.required<TermsDocument>();

  /** Level of the rendered heading: Strapi level + 2, at most 6. */
  protected headingLevel(level: number): number {
    return Math.min(level + 2, 6);
  }
}

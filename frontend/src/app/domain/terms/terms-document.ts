/**
 * Closed tree for the terms and conditions (ADR-0006). It is rendered by interpolation only, never
 * bound as raw HTML, so any HTML inside the CMS text is shown as literal text (REQ-03.16, AC-03.14).
 */

export type TextMark = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code';
export const TEXT_MARKS: readonly TextMark[] = [
  'bold',
  'italic',
  'underline',
  'strikethrough',
  'code',
];

export interface TermsText {
  readonly kind: 'text';
  readonly text: string;
  readonly marks: readonly TextMark[];
}

export type TermsInline = TermsText;

export type TermsBlock =
  | { readonly kind: 'paragraph'; readonly children: readonly TermsInline[] }
  | {
      readonly kind: 'heading';
      /** Strapi level 1-6; the renderer maps it to `h3`-`h6` (ADR-0006). */
      readonly level: 1 | 2 | 3 | 4 | 5 | 6;
      readonly children: readonly TermsInline[];
    }
  | {
      readonly kind: 'list';
      readonly ordered: boolean;
      readonly items: readonly (readonly TermsInline[])[];
    };

export interface TermsDocument {
  readonly blocks: readonly TermsBlock[];
}

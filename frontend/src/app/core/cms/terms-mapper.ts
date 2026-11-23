import {
  TEXT_MARKS,
  TermsBlock,
  TermsDocument,
  TermsInline,
  TextMark,
} from '../../domain/terms/terms-document';
import { contractError } from './cms-error';
import { BlockNodeDto, CountryTermsDto, asDto, isRecord } from './strapi-dto';

export type TermsMapping =
  | {
      readonly status: 'ready';
      readonly document: TermsDocument;
      readonly warnings: readonly string[];
    }
  | { readonly status: 'unavailable'; readonly warnings: readonly string[] };

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
const HEADING_LEVELS: readonly number[] = [1, 2, 3, 4, 5, 6];

/**
 * C7 → terms document (api-contracts C7, ADR-0006).
 *
 * - 0 countries → contract error (unpublished between steps).
 * - More than one, `null`, `[]` or no text after trimming → `unavailable` (REQ-03.18).
 * - Known nodes become the closed tree; `quote` becomes a paragraph; `link` keeps only its text;
 *   `code`, `image` and unknown nodes are degraded to a paragraph with their plain text (or
 *   omitted if they have none), with a warning. Text is never parsed as HTML.
 *
 * The exact JSON of `list`/`list-item` must be checked against the real seed response (ADR-0006).
 */
export function mapTerms(data: readonly unknown[], requestedCode: string): TermsMapping {
  if (data.length === 0) {
    throw contractError(`no country with code ${requestedCode} for terms`);
  }
  const warnings: string[] = [];
  if (data.length > 1) {
    warnings.push(`[cms] terms unavailable: more than one country with code ${requestedCode}`);
    return { status: 'unavailable', warnings };
  }
  const dto = asDto<keyof CountryTermsDto & string>(data[0]);
  const raw = dto?.termsAndConditions;
  if (!Array.isArray(raw)) {
    return { status: 'unavailable', warnings };
  }
  const blocks = raw.flatMap((node) => mapBlock(node, warnings));
  if (!blocks.some(hasText)) {
    return { status: 'unavailable', warnings };
  }
  return { status: 'ready', document: { blocks }, warnings };
}

function mapBlock(node: unknown, warnings: string[]): TermsBlock[] {
  const dto = asDto<keyof BlockNodeDto & string>(node);
  switch (dto?.type) {
    case 'paragraph':
    case 'quote':
      return [{ kind: 'paragraph', children: mapInlines(dto.children) }];
    case 'heading': {
      const level = dto.level;
      if (typeof level === 'number' && HEADING_LEVELS.includes(level)) {
        return [
          { kind: 'heading', level: level as HeadingLevel, children: mapInlines(dto.children) },
        ];
      }
      warnings.push('[cms] terms heading without a valid level degraded to paragraph');
      return [{ kind: 'paragraph', children: mapInlines(dto.children) }];
    }
    case 'list':
      return [
        { kind: 'list', ordered: dto.format === 'ordered', items: mapListItems(dto.children) },
      ];
    default: {
      warnings.push(`[cms] terms node degraded to plain text (type=${String(dto?.type)})`);
      const text = plainText(node).trim();
      return text === ''
        ? []
        : [{ kind: 'paragraph', children: [{ kind: 'text', text, marks: [] }] }];
    }
  }
}

/** Items of a list; a nested list contributes its items to the parent list. */
function mapListItems(children: unknown): TermsInline[][] {
  if (!Array.isArray(children)) {
    return [];
  }
  return children.flatMap((child): TermsInline[][] => {
    const dto = asDto<keyof BlockNodeDto & string>(child);
    if (dto?.type === 'list') {
      return mapListItems(dto.children);
    }
    return [mapInlines(dto?.children)];
  });
}

function mapInlines(children: unknown): TermsInline[] {
  if (!Array.isArray(children)) {
    return [];
  }
  return children.flatMap((child): TermsInline[] => {
    const dto = asDto<keyof BlockNodeDto & string>(child);
    if (!dto) {
      return [];
    }
    if (dto.type === 'text' && typeof dto.text === 'string') {
      return [
        {
          kind: 'text',
          text: dto.text,
          marks: TEXT_MARKS.filter((mark: TextMark) => dto[mark] === true),
        },
      ];
    }
    // `link` and any other inline node: keep only its text (no `<a>`, ADR-0006).
    return mapInlines(dto.children);
  });
}

function plainText(node: unknown): string {
  if (!isRecord(node)) {
    return '';
  }
  const own = typeof node['text'] === 'string' ? node['text'] : '';
  const children = node['children'];
  return own + (Array.isArray(children) ? children.map(plainText).join(' ') : '');
}

function hasText(block: TermsBlock): boolean {
  const inlinesHaveText = (inlines: readonly TermsInline[]) =>
    inlines.some((i) => i.text.trim() !== '');
  return block.kind === 'list'
    ? block.items.some(inlinesHaveText)
    : inlinesHaveText(block.children);
}

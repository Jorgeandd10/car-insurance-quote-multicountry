import { CmsRequestError } from './cms-error';
import { mapTerms } from './terms-mapper';
import { strapiC7 } from './testing/strapi-fixtures';

const withTerms = (termsAndConditions: unknown) => [{ ...strapiC7().data[0], termsAndConditions }];
const text = (value: string, marks: Record<string, boolean> = {}) => ({
  type: 'text',
  text: value,
  ...marks,
});

describe('mapTerms', () => {
  it('REQ-03.15 maps the documented C7 example: paragraph and unordered list with bold', () => {
    const result = mapTerms(strapiC7().data, 'co');
    expect(result).toEqual({
      status: 'ready',
      warnings: [],
      document: {
        blocks: [
          {
            kind: 'paragraph',
            children: [
              {
                kind: 'text',
                text: 'Este documento es ficticio y solo sirve para la prueba técnica.',
                marks: [],
              },
            ],
          },
          {
            kind: 'list',
            ordered: false,
            items: [
              [{ kind: 'text', text: 'La cotización es simulada.', marks: ['bold'] }],
              [{ kind: 'text', text: 'No se realiza ningún cobro.', marks: [] }],
            ],
          },
        ],
      },
    });
  });

  it('REQ-03.16 supports ordered lists, headings, quotes, marks and links (text only)', () => {
    const result = mapTerms(
      withTerms([
        { type: 'heading', level: 2, children: [text('Condiciones')] },
        {
          type: 'list',
          format: 'ordered',
          children: [
            { type: 'list-item', children: [text('Uno', { italic: true, underline: true })] },
          ],
        },
        { type: 'quote', children: [text('Cita')] },
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              url: 'https://example.test',
              children: [text('enlace', { code: true })],
            },
          ],
        },
      ]),
      'co',
    );
    expect(result.status).toBe('ready');
    if (result.status === 'ready') {
      expect(result.document.blocks).toEqual([
        { kind: 'heading', level: 2, children: [{ kind: 'text', text: 'Condiciones', marks: [] }] },
        {
          kind: 'list',
          ordered: true,
          items: [[{ kind: 'text', text: 'Uno', marks: ['italic', 'underline'] }]],
        },
        { kind: 'paragraph', children: [{ kind: 'text', text: 'Cita', marks: [] }] },
        { kind: 'paragraph', children: [{ kind: 'text', text: 'enlace', marks: ['code'] }] },
      ]);
    }
  });

  it('AC-03.14 HTML inside the text is kept as literal text, never as a node', () => {
    const result = mapTerms(
      withTerms([{ type: 'paragraph', children: [text('<img src=x onerror=alert(1)>')] }]),
      'co',
    );
    expect(result.status === 'ready' && result.document.blocks[0]).toEqual({
      kind: 'paragraph',
      children: [{ kind: 'text', text: '<img src=x onerror=alert(1)>', marks: [] }],
    });
  });

  it('REQ-03.16 unknown, code and image nodes are degraded to plain text or omitted, with a warning', () => {
    const result = mapTerms(
      withTerms([
        { type: 'code', children: [text('const x = 1;')] },
        { type: 'image', image: { url: '/x.png' }, children: [text('')] },
        { type: 'paragraph', children: [text('Texto')] },
      ]),
      'co',
    );
    expect(result.status === 'ready' && result.document.blocks).toEqual([
      { kind: 'paragraph', children: [{ kind: 'text', text: 'const x = 1;', marks: [] }] },
      { kind: 'paragraph', children: [{ kind: 'text', text: 'Texto', marks: [] }] },
    ]);
    expect(result.warnings).toHaveLength(2);
  });

  it.each([
    ['null', null],
    ['an empty list', []],
    ['blocks without text', [{ type: 'paragraph', children: [text('   ')] }]],
  ])('REQ-03.18 terms that are %s → unavailable', (_case, terms) => {
    expect(mapTerms(withTerms(terms), 'co').status).toBe('unavailable');
  });

  it('REQ-03.18 more than one country record → unavailable', () => {
    const data = strapiC7().data;
    expect(mapTerms([...data, ...data], 'co').status).toBe('unavailable');
  });

  it('REQ-03.32 no country (unpublished between steps) is an error', () => {
    expect(() => mapTerms([], 'co')).toThrow(CmsRequestError);
  });
});

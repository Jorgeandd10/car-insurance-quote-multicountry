import { TestBed } from '@angular/core/testing';
import { mapTerms } from '../../../core/cms/terms-mapper';
import { strapiC7 } from '../../../core/cms/testing/strapi-fixtures';
import { TermsDocument, TermsText, TextMark } from '../../../domain/terms/terms-document';
import { TermsBlocks } from './terms-blocks';

const render = async (document: TermsDocument) => {
  const fixture = TestBed.createComponent(TermsBlocks);
  fixture.componentRef.setInput('document', document);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

const text = (value: string, marks: TextMark[] = []): TermsText => ({
  kind: 'text',
  text: value,
  marks,
});

describe('TermsBlocks', () => {
  it('REQ-03.15 renders the documented C7 terms: a paragraph and an unordered list with bold', async () => {
    const mapped = mapTerms(strapiC7().data, 'co');
    if (mapped.status !== 'ready') {
      throw new Error('expected ready terms');
    }
    const el = await render(mapped.document);
    expect(el.querySelector('p')?.textContent?.trim()).toBe(
      'Este documento es ficticio y solo sirve para la prueba técnica.',
    );
    const items = Array.from(el.querySelectorAll('ul > li'), (li) => li.textContent?.trim());
    expect(items).toEqual(['La cotización es simulada.', 'No se realiza ningún cobro.']);
    expect(el.querySelector('ul > li strong')?.textContent?.trim()).toBe(
      'La cotización es simulada.',
    );
  });

  it('AC-03.14 HTML in the content is shown as literal text and no element is inserted', async () => {
    const payload = '<img src=x onerror=alert(1)>';
    const el = await render({ blocks: [{ kind: 'paragraph', children: [text(payload)] }] });
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('p')?.textContent?.trim()).toBe(payload);
  });

  it('REQ-03.16 ordered lists and nested marks are rendered with their own elements', async () => {
    const el = await render({
      blocks: [
        {
          kind: 'list',
          ordered: true,
          items: [[text('Uno', ['bold', 'italic'])], [text('Dos', ['code'])]],
        },
        { kind: 'paragraph', children: [text('a', ['underline']), text('b', ['strikethrough'])] },
      ],
    });
    expect(el.querySelectorAll('ol > li')).toHaveLength(2);
    expect(el.querySelector('ol > li strong em')?.textContent?.trim()).toBe('Uno');
    expect(el.querySelector('ol > li code')?.textContent?.trim()).toBe('Dos');
    expect(el.querySelector('p u')?.textContent?.trim()).toBe('a');
    expect(el.querySelector('p s')?.textContent?.trim()).toBe('b');
  });

  it('ADR-0006 a Strapi heading of level n becomes h(n+2), at most h6', async () => {
    const el = await render({
      blocks: [
        { kind: 'heading', level: 1, children: [text('Uno')] },
        { kind: 'heading', level: 2, children: [text('Dos')] },
        { kind: 'heading', level: 5, children: [text('Cinco')] },
      ],
    });
    expect(el.querySelector('h3')?.textContent?.trim()).toBe('Uno');
    expect(el.querySelector('h4')?.textContent?.trim()).toBe('Dos');
    expect(el.querySelector('h6')?.textContent?.trim()).toBe('Cinco');
    expect(el.querySelector('h1, h2')).toBeNull();
  });
});

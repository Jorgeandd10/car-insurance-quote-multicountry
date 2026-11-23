import { maskDocument } from './mask-document';

describe('maskDocument', () => {
  it.each([
    { value: '1234567890', masked: '******7890' },
    { value: '12.345.678-5', masked: '**.***.678-5' },
    { value: 'E-123456', masked: '*-***456' },
    { value: '12345', masked: '***45' },
    { value: '1234', masked: '**34' },
    { value: '7', masked: '*' },
  ])('AC-03.7 "$value" → "$masked"', ({ value, masked }) => {
    expect(maskDocument(value)).toBe(masked);
  });

  it('AC-03.5 the full Colombian document does not appear in the masked value', () => {
    expect(maskDocument('1234567890')).not.toContain('1234567890');
  });

  it('AC-03.6 the full RUT does not appear and separators are kept', () => {
    const masked = maskDocument('12.345.678-5');
    expect(masked).not.toContain('12.345.678-5');
    expect(masked.replace(/[^.\- ]/g, '')).toBe('..-');
  });

  it('REQ-03.7 spaces are separators and never more than half is shown', () => {
    expect(maskDocument('AB 12')).toBe('** 12');
    expect(maskDocument('')).toBe('');
  });
});

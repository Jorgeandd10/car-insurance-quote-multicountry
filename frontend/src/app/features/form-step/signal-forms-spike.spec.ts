import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, required } from '@angular/forms/signals';

/**
 * Spike of ADR-0002 (the three documentation gaps), run against Angular 22.3.0 in jsdom.
 * Keeps the observed behaviour under test so an Angular upgrade that changes it is detected.
 */
interface SpikeModel {
  year: number | null;
  birth: string;
  plate: string;
  terms: boolean;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField],
  template: `
    <input id="year" type="number" [formField]="f.year" />
    <input id="birth" type="date" [formField]="f.birth" />
    <input id="plate" type="text" [formField]="f.plate" />
    <input id="terms" type="checkbox" [formField]="f.terms" />
  `,
})
class SpikeHost {
  readonly model = signal<SpikeModel>({ year: null, birth: '', plate: '', terms: false });
  readonly f = form(this.model, (p) => {
    required(p.plate);
    required(p.terms);
  });
}

describe('ADR-0002 Signal Forms spike', () => {
  const setup = async () => {
    const fixture = TestBed.createComponent(SpikeHost);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const input = (id: string) => el.querySelector<HTMLInputElement>(`#${id}`) as HTMLInputElement;
    const type = async (id: string, value: string) => {
      input(id).value = value;
      input(id).dispatchEvent(new Event('input'));
      await fixture.whenStable();
    };
    return { fixture, input, type };
  };

  it('gap 1: an empty <input type="number"> writes null (not NaN) to a number | null model', async () => {
    const { fixture, type } = await setup();
    await type('year', '2020');
    expect(fixture.componentInstance.model().year).toBe(2020);
    await type('year', '');
    expect(fixture.componentInstance.model().year).toBeNull();
  });

  it('gap 1: a decimal is kept as a number (the integer rule is ours)', async () => {
    const { fixture, type } = await setup();
    await type('year', '2.5');
    expect(fixture.componentInstance.model().year).toBe(2.5);
  });

  it('gap 2: <input type="date"> keeps a string model as "YYYY-MM-DD" in both directions', async () => {
    const { fixture, input, type } = await setup();
    await type('birth', '2008-11-23');
    expect(fixture.componentInstance.model().birth).toBe('2008-11-23');

    fixture.componentInstance.model.update((m) => ({ ...m, birth: '2000-02-29' }));
    await fixture.whenStable();
    expect(input('birth').value).toBe('2000-02-29');
  });

  it('gap 3: FormField sets the native required property but no aria-invalid nor aria-describedby', async () => {
    const { fixture, input } = await setup();
    const f = fixture.componentInstance.f;
    f.plate().markAsTouched();
    await fixture.whenStable();

    expect(f.plate().invalid()).toBe(true);
    expect(input('plate').required).toBe(true);
    expect(input('terms').required).toBe(true);
    expect(input('plate').hasAttribute('aria-invalid')).toBe(false);
    expect(input('plate').hasAttribute('aria-describedby')).toBe(false);
  });

  it('touched becomes true on blur (error shown after the first blur)', async () => {
    const { fixture, input } = await setup();
    expect(fixture.componentInstance.f.plate().touched()).toBe(false);
    input('plate').dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(fixture.componentInstance.f.plate().touched()).toBe(true);
  });

  it('a checkbox writes a boolean', async () => {
    const { fixture, input } = await setup();
    input('terms').click();
    await fixture.whenStable();
    expect(fixture.componentInstance.model().terms).toBe(true);
  });
});

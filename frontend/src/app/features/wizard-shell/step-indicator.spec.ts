import { TestBed } from '@angular/core/testing';
import { StepIndicator } from './step-indicator';

describe('StepIndicator', () => {
  const render = async (current: 1 | 2 | 3 | null) => {
    const fixture = TestBed.createComponent(StepIndicator);
    fixture.componentRef.setInput('label', 'Progreso');
    fixture.componentRef.setInput('steps', ['Uno', 'Dos', 'Tres']);
    fixture.componentRef.setInput('current', current);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  it('REQ-01.31 shows the 3 steps (D7) in an ordered list inside a named nav', async () => {
    const el = await render(1);
    expect(el.querySelector('nav')?.getAttribute('aria-label')).toBe('Progreso');
    expect(el.querySelectorAll('ol > li')).toHaveLength(3);
  });

  it('REQ-01.31 only the current step has aria-current="step"', async () => {
    const el = await render(2);
    const marks = Array.from(el.querySelectorAll('li'), (li) => li.getAttribute('aria-current'));
    expect(marks).toEqual([null, 'step', null]);
  });

  it('REQ-01.31 the step number is decorative for assistive technologies', async () => {
    const el = await render(3);
    expect(el.querySelector('.number')?.getAttribute('aria-hidden')).toBe('true');
  });
});

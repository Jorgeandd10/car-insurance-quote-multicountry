import { TestBed } from '@angular/core/testing';
import { StatusMessage } from './status-message';

describe('StatusMessage', () => {
  const render = async (kind: 'loading' | 'error' | 'message', message = '') => {
    const fixture = TestBed.createComponent(StatusMessage);
    fixture.componentRef.setInput('kind', kind);
    fixture.componentRef.setInput('message', message);
    await fixture.whenStable();
    return fixture;
  };

  it('REQ-01.32 loading is announced as status with the fixed "cargando"', async () => {
    const el = (await render('loading')).nativeElement as HTMLElement;
    expect(el.querySelector('[role="status"]')?.textContent?.trim()).toBe('cargando');
  });

  it('REQ-01.3 D13 the loading skeleton is decorative: hidden from assistive technologies and without text', async () => {
    const el = (await render('loading')).nativeElement as HTMLElement;
    const skeleton = el.querySelector('.skeleton');
    expect(skeleton?.getAttribute('aria-hidden')).toBe('true');
    expect(skeleton?.textContent?.trim()).toBe('');
    expect(el.textContent?.trim()).toBe('cargando');
  });

  it('REQ-01.32 REQ-01.4 error is an alert with "error de carga" and a "reintentar" button that emits', async () => {
    const fixture = await render('error');
    const el = fixture.nativeElement as HTMLElement;
    const retried = vi.fn();
    fixture.componentInstance.retry.subscribe(retried);

    expect(el.querySelector('[role="alert"]')?.textContent?.trim()).toBe('error de carga');
    const button = el.querySelector('button');
    expect(button?.getAttribute('type')).toBe('button');
    expect(button?.textContent?.trim()).toBe('reintentar');
    button?.click();
    expect(retried).toHaveBeenCalledTimes(1);
  });

  it('REQ-01.32 a Strapi message is announced as an alert', async () => {
    const el = (await render('message', 'Mensaje de Strapi')).nativeElement as HTMLElement;
    expect(el.querySelector('[role="alert"]')?.textContent?.trim()).toBe('Mensaje de Strapi');
  });
});

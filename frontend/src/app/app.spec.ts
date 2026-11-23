import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { App } from './app';

@Component({ template: '<h1>page</h1>' })
class PageStub {}

describe('App', () => {
  it('ADR-0004 G3-9 shows the global "cargando" while a guard keeps the navigation pending', async () => {
    let release: (value: boolean) => void = () => undefined;
    const guardResult = new Promise<boolean>((resolve) => (release = resolve));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'slow', component: PageStub, canActivate: [() => guardResult] }]),
      ],
    });
    const fixture = TestBed.createComponent(App);
    const el = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
    expect(el.querySelector('[role="status"]')?.textContent?.trim()).toBe('');

    const navigation = TestBed.inject(Router).navigateByUrl('/slow');
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    expect(el.querySelector('[role="status"]')?.textContent?.trim()).toBe('cargando');

    release(true);
    await navigation;
    await fixture.whenStable();
    expect(el.querySelector('[role="status"]')?.textContent?.trim()).toBe('');
    expect(el.querySelector('main h1')?.textContent).toBe('page');
  });
});

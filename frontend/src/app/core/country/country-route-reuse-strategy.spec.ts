import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, RouteReuseStrategy, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CountryRouteReuseStrategy } from './country-route-reuse-strategy';

let created = 0;

@Component({ template: 'step' })
class StepStub {
  readonly route = inject(ActivatedRoute);
  constructor() {
    created += 1;
  }
}

describe('CountryRouteReuseStrategy', () => {
  beforeEach(() => {
    created = 0;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: ':country', children: [{ path: 'form', component: StepStub }] }]),
        { provide: RouteReuseStrategy, useClass: CountryRouteReuseStrategy },
      ],
    });
  });

  it('REQ-01.25 a route component is created again when the country changes', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/cl/form');
    await harness.navigateByUrl('/co/form');
    expect(created).toBe(2);
  });

  it('REQ-01.25 within the same country the component is reused (only the query changes)', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/co/form');
    await harness.navigateByUrl('/co/form?x=1');
    expect(created).toBe(1);
  });
});

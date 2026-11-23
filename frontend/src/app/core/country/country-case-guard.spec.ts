import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { countryCaseGuard, lowercaseFirstSegment } from './country-case-guard';

@Component({ template: 'step' })
class StepStub {}

describe('countryCaseGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: ':country',
            canActivate: [countryCaseGuard],
            children: [
              { path: '', pathMatch: 'full', redirectTo: 'form' },
              { path: 'form', component: StepStub },
              { path: 'plans', component: StepStub },
            ],
          },
        ]),
      ],
    });
  });

  it('AC-01.6 "/CO" is redirected to "/co" (and then to its first step)', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/CO');
    expect(TestBed.inject(Router).url).toBe('/co/form');
  });

  it('REQ-01.2 only the case of the country segment changes: "/CO/plans?x=1" → "/co/plans?x=1"', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/CO/plans?x=1');
    expect(TestBed.inject(Router).url).toBe('/co/plans?x=1');
  });

  it('REQ-01.2 a lower-case code passes, even if it is unknown (the shell shows "país no disponible")', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/pe/form');
    expect(TestBed.inject(Router).url).toBe('/pe/form');
  });

  it('REQ-01.2 lowercaseFirstSegment leaves the rest of the URL untouched', () => {
    expect(lowercaseFirstSegment('/CL/Summary#Top')).toBe('/cl/Summary#Top');
    expect(lowercaseFirstSegment('/')).toBe('/');
  });
});

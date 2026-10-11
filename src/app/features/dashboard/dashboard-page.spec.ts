import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DashboardStats, StatsPeriod } from '../../core/domain/models/models';
import { StatsApi } from '../../core/domain/ports/stats-api.port';
import { DashboardPage } from './dashboard-page';

function statsFor(period: StatsPeriod, answered: number): DashboardStats {
  return {
    period,
    summary: { answered, received: answered + 10, people: 80, newPeople: 20, avgResponseSeconds: 3.1, failed: 10 },
    previous: { answered: answered - 50, people: 70, avgResponseSeconds: 3.6, failed: 14 },
    series: [{ label: '9h', description: '9:00 a 9:59', value: answered }],
    byNumber: [{ numberId: 'n1', label: 'Ventas', phoneNumber: '+57 310 765 4321', answered }],
    heatmap: Array.from({ length: 7 }, () => Array.from({ length: 8 }, () => 5)),
    failedMessages: [],
  };
}

describe('DashboardPage', () => {
  function setup() {
    const api = { get: vi.fn((period: StatsPeriod) => of(statsFor(period, period === 'day' ? 430 : 3100))) };
    TestBed.configureTestingModule({ providers: [{ provide: StatsApi, useValue: api }] });
    const fixture = TestBed.createComponent(DashboardPage);
    return { api, fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('shows the answered messages for today with the change against yesterday', async () => {
    const { api, fixture, element } = setup();
    await fixture.whenStable();

    expect(api.get).toHaveBeenCalledWith('day');
    expect(element.textContent).toContain('430');
    expect(element.textContent).toContain('vs. ayer');
    expect(element.textContent).toContain('Todos los mensajes de este periodo se respondieron.');
  });

  it('reloads the figures when the period changes', async () => {
    const { api, fixture, element } = setup();
    await fixture.whenStable();

    [...element.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Semana')!.click();
    await fixture.whenStable();

    expect(api.get).toHaveBeenCalledWith('week');
    expect(element.textContent).toContain('3100');
    expect(element.textContent).toContain('vs. semana anterior');
  });
});

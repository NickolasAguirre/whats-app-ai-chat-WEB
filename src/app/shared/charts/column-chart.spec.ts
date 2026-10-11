import { TestBed } from '@angular/core/testing';
import { StatsPoint } from '../../core/domain/models/models';
import { ColumnChart } from './column-chart';

describe('ColumnChart', () => {
  const points: StatsPoint[] = [
    { label: 'lun', description: 'lunes 5', value: 10 },
    { label: 'mar', description: 'martes 6', value: 40 },
    { label: 'mié', description: 'miércoles 7', value: 0 },
  ];

  function setup() {
    const fixture = TestBed.createComponent(ColumnChart);
    fixture.componentRef.setInput('title', 'Mensajes por día');
    fixture.componentRef.setInput('points', points);
    fixture.componentRef.setInput('ariaLabel', 'Mensajes por día');
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('renders one focusable bar per point with an accessible description', async () => {
    const { fixture, element } = setup();
    await fixture.whenStable();

    const bars = element.querySelectorAll('[role=img]');
    expect(bars).toHaveLength(3);
    expect(bars[1].getAttribute('aria-label')).toBe('martes 6: 40 mensajes');
    expect(bars[1].getAttribute('tabindex')).toBe('0');
  });

  it('labels only the peak value', async () => {
    const { fixture, element } = setup();
    await fixture.whenStable();
    const labels = [...element.querySelectorAll('[role=img] span')].map((span) => span.textContent?.trim());
    expect(labels).toEqual(['40']);
  });

  it('shows a tooltip on focus and switches to a table view', async () => {
    const { fixture, element } = setup();
    await fixture.whenStable();

    (element.querySelectorAll('[role=img]')[0] as HTMLElement).dispatchEvent(new Event('focus'));
    await fixture.whenStable();
    expect(element.textContent).toContain('lunes 5');

    [...element.querySelectorAll('button')].find((button) => button.textContent?.includes('Ver tabla'))!.click();
    await fixture.whenStable();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(element.querySelector('[role=img]')).toBeNull();
  });
});

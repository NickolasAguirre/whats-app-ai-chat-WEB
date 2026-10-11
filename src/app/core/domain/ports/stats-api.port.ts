import { Observable } from 'rxjs';
import { DashboardStats, StatsPeriod } from '../models/models';

export abstract class StatsApi {
  abstract get(period: StatsPeriod): Observable<DashboardStats>;
}

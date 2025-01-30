import { RenderedScheduleEntry } from './pagerduty-schedule';

export interface TeamScheduleConfig {
  name: string;
  primaryId: string;
  secondaryId: string;
  primaryEntries?: RenderedScheduleEntry[];
  secondaryEntries?: RenderedScheduleEntry[];
}

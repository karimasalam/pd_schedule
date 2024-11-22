import { Component } from '@angular/core';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { TeamScheduleExportComponent } from './team-schedule-export/team-schedule-export.component';
import { FullScheduleExportComponent } from './full-schedule-export/full-schedule-export.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    imports: [MatTabGroup, MatTab, TeamScheduleExportComponent, FullScheduleExportComponent]
})
export class AppComponent {
  title = 'pd_schedule';
}
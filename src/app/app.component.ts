import { Component } from '@angular/core';
import { ScheduleService } from './schedule.service';
import * as XLSX from 'xlsx';
import { RenderedScheduleEntry } from './interfaces/schedule';
import { processDailyAssignments, generateSummaryData, createSummarySheets, createExcelWorkbook } from './utilities';
import { forkJoin } from 'rxjs';

interface ScheduleResponse {
  schedule: {
    final_schedule: {
      rendered_schedule_entries: RenderedScheduleEntry[];
    };
  };
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  token: string = '';
  fromDate: string = '2024-07-01T10:00';
  toDate: string = '2024-07-30T10:00';
  primaryId: string = '';
  secondaryId: string = '';
  primarySchedules?: RenderedScheduleEntry[];
  secondarySchedules?: RenderedScheduleEntry[];
  isLoading: boolean = false;
  primaryPayment: number = 35.71;
  secondaryPayment: number = 17.86;

  constructor(private scheduleService: ScheduleService) { }

  getSchedules(): void {
    this.isLoading = true;
    
    const primaryRequest = this.scheduleService.getSchedules(this.token, this.fromDate, this.toDate, this.primaryId);
    const secondaryRequest = this.scheduleService.getSchedules(this.token, this.fromDate, this.toDate, this.secondaryId);

    forkJoin([primaryRequest, secondaryRequest]).subscribe({
      next: ([primaryData, secondaryData]: [ScheduleResponse, ScheduleResponse]) => {
        this.primarySchedules = primaryData.schedule.final_schedule.rendered_schedule_entries;
        this.secondarySchedules = secondaryData.schedule.final_schedule.rendered_schedule_entries;
        this.isLoading = false;
      },
      error: (err: Error) => {
        console.error('Error fetching schedules', err);
        this.isLoading = false;
      }
    });
  }

  exportToExcel(): void {
    if (this.primarySchedules || this.secondarySchedules) {
      // Process daily assignments
      const dailyAssignments = processDailyAssignments(
        this.primarySchedules,
        this.secondarySchedules,
        this.primaryPayment,
        this.secondaryPayment
      );

      // Convert map to array for detailed sheet
      const detailedData = Array.from(dailyAssignments.values());

      // Generate summary data
      const summaryData = generateSummaryData(detailedData);

      // Create summary sheets
      const summarySheets = createSummarySheets(summaryData);

      // Create and save workbook
      const wb = createExcelWorkbook(detailedData, summarySheets);
      XLSX.writeFile(wb, `PD_schedules.xlsx`);
    }
  }
}

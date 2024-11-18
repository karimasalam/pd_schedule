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
  fromDate: Date;
  toDate: Date;
  primaryId: string = '';
  secondaryId: string = '';
  primarySchedules?: RenderedScheduleEntry[];
  secondarySchedules?: RenderedScheduleEntry[];
  isLoading: boolean = false;
  primaryPayment: number = 35.71;
  secondaryPayment: number = 17.86;

  constructor(private scheduleService: ScheduleService) {
    // Set default dates to July 1st and July 30th at 10:00 AM
    this.fromDate = new Date(2024, 6, 1, 10, 0); // July 1st, 2024 at 10:00 AM
    this.toDate = new Date(2024, 6, 30, 10, 0);  // July 30th, 2024 at 10:00 AM
  }

  getSchedules(): void {
    // Check if all required fields are filled
    if (!this.token || !this.primaryId || !this.secondaryId || !this.fromDate || !this.toDate) {
      return;
    }

    this.isLoading = true;
    
    // Convert dates to ISO string format for the API
    const fromDateString = this.fromDate.toISOString();
    const toDateString = this.toDate.toISOString();
    
    const primaryRequest = this.scheduleService.getSchedules(this.token, fromDateString, toDateString, this.primaryId);
    const secondaryRequest = this.scheduleService.getSchedules(this.token, fromDateString, toDateString, this.secondaryId);

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

  updateFromTime(timeString: string): void {
    if (this.fromDate) {
      const [hours, minutes] = timeString.split(':').map(Number);
      this.fromDate = new Date(
        this.fromDate.getFullYear(),
        this.fromDate.getMonth(),
        this.fromDate.getDate(),
        hours,
        minutes
      );
    }
  }

  updateToTime(timeString: string): void {
    if (this.toDate) {
      const [hours, minutes] = timeString.split(':').map(Number);
      this.toDate = new Date(
        this.toDate.getFullYear(),
        this.toDate.getMonth(),
        this.toDate.getDate(),
        hours,
        minutes
      );
    }
  }

  onFromDateChange(event: any): void {
    if (this.fromDate) {
      const newDate = event.value;
      this.fromDate = new Date(
        newDate.getFullYear(),
        newDate.getMonth(),
        newDate.getDate(),
        10, // Force 10:00 AM
        0
      );
    }
  }

  onToDateChange(event: any): void {
    if (this.toDate) {
      const newDate = event.value;
      this.toDate = new Date(
        newDate.getFullYear(),
        newDate.getMonth(),
        newDate.getDate(),
        10, // Force 10:00 AM
        0
      );
    }
  }
}

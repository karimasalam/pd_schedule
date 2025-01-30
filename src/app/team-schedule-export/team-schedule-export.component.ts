import { Component, Input } from '@angular/core';
import * as XLSX from 'xlsx';
import { RenderedScheduleEntry } from '../interfaces/pagerduty-schedule';
import {
  processDailyAssignments,
  generateSummaryData,
  createSummarySheets,
  createExcelWorkbook,
} from '../utilities';
import { ScheduleService } from '../schedule.service';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel, MatError, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatAutocompleteTrigger, MatAutocomplete } from '@angular/material/autocomplete';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { MatOption } from '@angular/material/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import {
  MatDatepickerInput,
  MatDatepickerToggle,
  MatDatepicker,
} from '@angular/material/datepicker';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import {
  MatTable,
  MatColumnDef,
  MatHeaderCellDef,
  MatHeaderCell,
  MatCellDef,
  MatCell,
  MatHeaderRowDef,
  MatHeaderRow,
  MatRowDef,
  MatRow,
} from '@angular/material/table';

interface Schedule {
  id: string;
  name: string;
  [key: string]: any;
}

interface ScheduleResponse {
  schedule: {
    final_schedule: {
      rendered_schedule_entries: RenderedScheduleEntry[];
    };
  };
}

@Component({
  selector: 'app-team-schedule-export',
  templateUrl: './team-schedule-export.component.html',
  styleUrls: ['./team-schedule-export.component.css'],
  imports: [
    FormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
    MatAutocompleteTrigger,
    MatAutocomplete,
    NgIf,
    MatOption,
    MatProgressSpinner,
    NgFor,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatSuffix,
    MatDatepicker,
    MatButton,
    MatIcon,
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    DatePipe,
  ],
})
export class TeamScheduleExportComponent {
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
  scheduleList: Schedule[] = [];
  filteredSchedules: Schedule[] = [];
  private searchSubject = new Subject<string>();

  constructor(private scheduleService: ScheduleService) {
    // Get last month's start and end dates
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Set dates with 10:00 AM time
    this.fromDate = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth(),
      lastMonth.getDate(),
      10,
      0,
    );
    this.toDate = new Date(
      lastMonthEnd.getFullYear(),
      lastMonthEnd.getMonth(),
      lastMonthEnd.getDate(),
      10,
      0,
    );

    // Setup search with debounce
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          this.isLoading = true;
          return this.scheduleService.listschedules(this.token, query, 100);
        }),
      )
      .subscribe({
        next: (response: { schedules: Schedule[] }) => {
          this.scheduleList = response.schedules;
          this.filteredSchedules = this.scheduleList;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading schedules:', error);
          this.isLoading = false;
        },
      });
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

    const primaryRequest = this.scheduleService.getSchedule(
      this.token,
      fromDateString,
      toDateString,
      this.primaryId,
    );
    const secondaryRequest = this.scheduleService.getSchedule(
      this.token,
      fromDateString,
      toDateString,
      this.secondaryId,
    );

    forkJoin([primaryRequest, secondaryRequest]).subscribe({
      next: ([primaryData, secondaryData]: [ScheduleResponse, ScheduleResponse]) => {
        this.primarySchedules = primaryData.schedule.final_schedule.rendered_schedule_entries;
        this.secondarySchedules = secondaryData.schedule.final_schedule.rendered_schedule_entries;
        this.isLoading = false;
      },
      error: (err: Error) => {
        console.error('Error fetching schedules', err);
        this.isLoading = false;
      },
    });
  }

  loadSchedules(): void {
    if (this.token) {
      this.searchSubject.next('');
    }
  }

  filterSchedules(searchText: string): void {
    if (this.token) {
      this.searchSubject.next(searchText);
    }
  }

  displayFn = (scheduleId: string | null): string => {
    if (!scheduleId) return '';
    const schedule = this.scheduleList.find((s) => s.id === scheduleId);
    return schedule ? `${schedule.name} (${schedule.id})` : scheduleId;
  };

  updateFromTime(timeString: string): void {
    if (this.fromDate) {
      const [hours, minutes] = timeString.split(':').map(Number);
      this.fromDate = new Date(
        this.fromDate.getFullYear(),
        this.fromDate.getMonth(),
        this.fromDate.getDate(),
        hours,
        minutes,
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
        minutes,
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
        0,
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
        0,
      );
    }
  }

  exportToExcel(): void {
    if (this.primarySchedules || this.secondarySchedules) {
      // Process daily assignments
      const dailyAssignments = processDailyAssignments(
        this.primarySchedules,
        this.secondarySchedules,
        this.primaryPayment,
        this.secondaryPayment,
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

import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import { ScheduleResponse } from '../interfaces/pagerduty-schedule';
import {
  processDailyAssignments,
  generateSummaryData,
  createSummarySheets,
  createExcelWorkbook,
} from '../utilities';
import { ScheduleService } from '../schedule.service';
import { forkJoin } from 'rxjs';
import { environment } from '../../environments/environment';
import { TeamScheduleConfig } from '../interfaces/team-schedule-config';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel, MatError, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import {
  MatDatepickerInput,
  MatDatepickerToggle,
  MatDatepicker,
} from '@angular/material/datepicker';
import { MatButton } from '@angular/material/button';
import { NgIf, NgFor, DatePipe, formatDate } from '@angular/common';
import { MatList, MatListItem, MatListItemTitle, MatListItemLine } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-full-schedule-export',
  templateUrl: './full-schedule-export.component.html',
  styleUrls: ['./full-schedule-export.component.css'],
  imports: [
    FormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatSuffix,
    MatDatepicker,
    MatButton,
    NgIf,
    MatList,
    NgFor,
    MatListItem,
    MatListItemTitle,
    MatListItemLine,
    MatIcon,
    MatProgressSpinner,
    DatePipe,
  ],
})
export class FullScheduleExportComponent implements OnInit {
  token: string = '';
  fromDate: Date = new Date();
  toDate: Date = new Date();
  teamSchedules: TeamScheduleConfig[] = [];
  isLoading: boolean = false;
  dataloaded: boolean = false;

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

    this.initializeTeamSchedules();
  }

  ngOnInit(): void {}

  private initializeTeamSchedules() {
    this.teamSchedules = environment.schedules.teams.map((team) => ({
      ...team,
      primaryEntries: undefined,
      secondaryEntries: undefined,
    }));
  }

  loadScheduleData() {
    if (!this.token) return;

    this.isLoading = true;
    const fromDateString = this.fromDate.toISOString();
    const toDateString = this.toDate.toISOString();

    // Create requests for each team's primary and secondary schedules
    const requests = this.teamSchedules.flatMap((team) => [
      this.scheduleService.getSchedule(this.token, fromDateString, toDateString, team.primaryId),
      this.scheduleService.getSchedule(this.token, fromDateString, toDateString, team.secondaryId),
    ]);

    forkJoin(requests).subscribe({
      next: (responses: ScheduleResponse[]) => {
        // Process responses in pairs for each team
        for (let i = 0; i < responses.length; i += 2) {
          const teamIndex = Math.floor(i / 2);
          this.teamSchedules[teamIndex].primaryEntries =
            responses[i].schedule.final_schedule.rendered_schedule_entries;
          this.teamSchedules[teamIndex].secondaryEntries =
            responses[i + 1].schedule.final_schedule.rendered_schedule_entries;
        }
        this.isLoading = false;
      },
      complete: () => {
        this.dataloaded = true;
      },
      error: (error) => {
        console.error('Error loading schedules:', error);
        this.isLoading = false;
      },
    });
  }

  exportToExcel() {
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();

    this.teamSchedules.forEach((team) => {
      // Process daily assignments for this team
      const dailyAssignments = processDailyAssignments(
        team.primaryEntries,
        team.secondaryEntries,
        environment.payments.primary,
        environment.payments.secondary,
      );

      // Convert map to array for detailed sheet
      const detailedData = Array.from(dailyAssignments.values());

      // Add detailed sheet first
      const detailedWorksheet = XLSX.utils.json_to_sheet(detailedData);
      XLSX.utils.book_append_sheet(
        workbook,
        detailedWorksheet,
        `${team.name} - Detailed`.substring(0, 31),
      );

      // Generate summary data
      const summaryData = generateSummaryData(detailedData);

      // Create summary sheets
      const summarySheets = createSummarySheets(summaryData, team.name);

      // Add summary sheet after detailed
      Object.entries(summarySheets).forEach(([sheetName, data]) => {
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(
          workbook,
          worksheet,
          `${team.name} - ${sheetName}`.substring(0, 31),
        );
      });
    });

    // Save the workbook
    const fileName = `Team_Schedules_${formatDate(this.fromDate, 'yyyyMMdd', 'en-AU')}_${formatDate(this.toDate, 'yyyyMMdd', 'en-AU')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  onDateChange() {
    // Always set time to 10:00 AM when date changes
    this.fromDate.setHours(10, 0, 0);
    this.toDate.setHours(10, 0, 0);
  }

  updateFromTime(time: string) {
    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      this.fromDate.setHours(hours, minutes, 0);
    }
  }

  updateToTime(time: string) {
    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      this.toDate.setHours(hours, minutes, 0);
    }
  }
}

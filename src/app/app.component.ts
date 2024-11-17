import { Component } from '@angular/core';
import { ScheduleService } from './schedule.service';
import * as XLSX from 'xlsx';
import { RenderedScheduleEntry } from './interfaces/schedule';
import { getWeekNumber } from './utilities';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  token: string = '';
  fromDate: string = '2024-07-01T10:00';
  toDate: string = '2024-07-30T10:00';
  id: string = '';
  schedules?: RenderedScheduleEntry[];
  isLoading: boolean = false;
  payment: string = "35.71";

  constructor(private scheduleService: ScheduleService) { }

  getSchedules(): void {
    this.isLoading = true;
    this.scheduleService.getSchedules(this.token, this.fromDate, this.toDate, this.id)
      .subscribe({
        next: (data) => {
          this.schedules = data.schedule.final_schedule.rendered_schedule_entries;
          this.isLoading = false;
          console.log(this.schedules);
        },
        error: (err) => {
          console.error('Error fetching schedules', err);
          this.isLoading = false;
        }
      });
  }

  exportToExcel(): void {
    if (this.schedules) {

      var arr: any[] = [];
      this.schedules.forEach(schedule => {
        var startdate = new Date(schedule.start);
        var enddate = new Date(schedule.end);

        while (enddate > startdate) {
          arr.push({
            Date: startdate.toDateString(),
            Name: schedule.user.summary,
            Week: getWeekNumber(startdate),
            Payment: Number(this.payment),
            Month: startdate.toLocaleString('default', { month: 'long' })
          });
          startdate = new Date(startdate.setDate(startdate.getDate() + 1));

        }
      });
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(arr);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Schedules');

      XLSX.writeFile(wb, `PD_schedules.xlsx`);
    }

  }
}

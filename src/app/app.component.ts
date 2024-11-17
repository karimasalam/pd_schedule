import { Component } from '@angular/core';
import { ScheduleService } from './schedule.service';
import * as XLSX from 'xlsx';
import { RenderedScheduleEntry } from './interfaces/schedule';
import { getWeekNumber } from './utilities';

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
  id: string = '';
  schedules?: RenderedScheduleEntry[];
  isLoading: boolean = false;
  payment: string = "35.71";

  constructor(private scheduleService: ScheduleService) { }

  getSchedules(): void {
    this.isLoading = true;
    this.scheduleService.getSchedules(this.token, this.fromDate, this.toDate, this.id)
      .subscribe({
        next: (data: ScheduleResponse) => {
          this.schedules = data.schedule.final_schedule.rendered_schedule_entries;
          this.isLoading = false;
          console.log(this.schedules);
        },
        error: (err: Error) => {
          console.error('Error fetching schedules', err);
          this.isLoading = false;
        }
      });
  }

  exportToExcel(): void {
    if (this.schedules) {
      // Create detailed worksheet
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

      // Create summary data
      const summaryData = new Map<string, Map<string, number>>();
      const months = new Set<string>();
      const names = new Set<string>();

      // Collect unique months and names, and sum payments
      arr.forEach(entry => {
        const name = entry.Name;
        const month = entry.Month;
        const payment = entry.Payment;

        months.add(month);
        names.add(name);

        if (!summaryData.has(name)) {
          summaryData.set(name, new Map<string, number>());
        }
        const personData = summaryData.get(name)!;
        personData.set(month, (personData.get(month) || 0) + payment);
      });

      // Convert to sorted arrays
      const sortedMonths = Array.from(months).sort((a, b) => {
        const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        return monthOrder.indexOf(a) - monthOrder.indexOf(b);
      });
      const sortedNames = Array.from(names).sort();

      // Create summary worksheet data
      const summarySheet: (string | number)[][] = [];
      
      // Header row with months
      const headerRow = ['Name', ...sortedMonths, 'Total'];
      summarySheet.push(headerRow);

      // Data rows
      const monthTotals = new Array(sortedMonths.length).fill(0);
      let grandTotal = 0;

      sortedNames.forEach(name => {
        const row: (string | number)[] = [name];
        let rowTotal = 0;
        
        sortedMonths.forEach((month, index) => {
          const value = summaryData.get(name)?.get(month) || 0;
          row.push(value);
          rowTotal += value;
          monthTotals[index] += value;
        });
        
        row.push(rowTotal); // Row total
        grandTotal += rowTotal;
        summarySheet.push(row);
      });

      // Totals row
      const totalsRow: (string | number)[] = ['Total', ...monthTotals, grandTotal];
      summarySheet.push(totalsRow);

      // Create workbook and add sheets
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      
      // Add detailed sheet
      const detailedWs: XLSX.WorkSheet = XLSX.utils.json_to_sheet(arr);
      XLSX.utils.book_append_sheet(wb, detailedWs, 'Detailed');

      // Add summary sheet
      const summaryWs: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(summarySheet);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

      // Save workbook
      XLSX.writeFile(wb, `PD_schedules.xlsx`);
    }
  }
}

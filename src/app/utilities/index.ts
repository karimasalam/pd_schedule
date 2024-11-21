import * as XLSX from 'xlsx';
import { RenderedScheduleEntry } from '../interfaces/pagerduty-schedule';

export interface DailyAssignment {
  Date: string;
  Week: number;
  PrimaryPerson: string;
  SecondaryPerson: string;
  PrimaryPayment: number;
  SecondaryPayment: number;
  Month: string;
}

export function getWeekNumber(date: Date): number {
  // Copy the date object
  const targetDate = new Date(date.valueOf());

  // Set to the nearest Thursday (current date + 4 - current day number)
  targetDate.setDate(targetDate.getDate() + 4 - (targetDate.getDay() || 7));

  // Get the first day of the year
  const yearStart = new Date(targetDate.getFullYear(), 0, 1);

  // Calculate the number of days between the current date and the first day of the year
  const weekNumber = Math.ceil(((targetDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  return weekNumber;
}

export function processDailyAssignments(
  primarySchedules: RenderedScheduleEntry[] | undefined,
  secondarySchedules: RenderedScheduleEntry[] | undefined,
  primaryPayment: number,
  secondaryPayment: number
): Map<string, DailyAssignment> {
  const dailyAssignments = new Map<string, DailyAssignment>();

  // Process primary schedules
  if (primarySchedules) {
    primarySchedules.forEach(schedule => {
      let startdate = new Date(schedule.start);
      const enddate = new Date(schedule.end);

      while (enddate > startdate) {
        const dateKey = startdate.toDateString();
        const existingEntry = dailyAssignments.get(dateKey) || {
          Date: dateKey,
          Week: getWeekNumber(startdate),
          PrimaryPerson: '',
          SecondaryPerson: '',
          PrimaryPayment: 0,
          SecondaryPayment: 0,
          Month: startdate.toLocaleString('default', { month: 'long' })
        };

        existingEntry.PrimaryPerson = schedule.user.summary;
        existingEntry.PrimaryPayment = primaryPayment;
        dailyAssignments.set(dateKey, existingEntry);

        startdate = new Date(startdate.setDate(startdate.getDate() + 1));
      }
    });
  }

  // Process secondary schedules
  if (secondarySchedules) {
    secondarySchedules.forEach(schedule => {
      let startdate = new Date(schedule.start);
      const enddate = new Date(schedule.end);

      while (enddate > startdate) {
        const dateKey = startdate.toDateString();
        const existingEntry = dailyAssignments.get(dateKey) || {
          Date: dateKey,
          Week: getWeekNumber(startdate),
          Month: startdate.toLocaleString('default', { month: 'long' }),
          PrimaryPerson: '',
          SecondaryPerson: '',
          PrimaryPayment: 0,
          SecondaryPayment: 0
        };

        existingEntry.SecondaryPerson = schedule.user.summary;
        existingEntry.SecondaryPayment = secondaryPayment;
        dailyAssignments.set(dateKey, existingEntry);

        startdate = new Date(startdate.setDate(startdate.getDate() + 1));
      }
    });
  }

  return dailyAssignments;
}

export function generateSummaryData(detailedData: DailyAssignment[]) {
  const primarySummaryData = new Map<string, Map<string, number>>();
  const secondarySummaryData = new Map<string, Map<string, number>>();
  const months = new Set<string>();
  const primaryNames = new Set<string>();
  const secondaryNames = new Set<string>();

  detailedData.forEach(entry => {
    const month = entry.Month;
    months.add(month);

    // Process primary data
    if (entry.PrimaryPerson) {
      primaryNames.add(entry.PrimaryPerson);
      if (!primarySummaryData.has(entry.PrimaryPerson)) {
        primarySummaryData.set(entry.PrimaryPerson, new Map<string, number>());
      }
      const personData = primarySummaryData.get(entry.PrimaryPerson)!;
      personData.set(month, (personData.get(month) || 0) + entry.PrimaryPayment);
    }

    // Process secondary data
    if (entry.SecondaryPerson) {
      secondaryNames.add(entry.SecondaryPerson);
      if (!secondarySummaryData.has(entry.SecondaryPerson)) {
        secondarySummaryData.set(entry.SecondaryPerson, new Map<string, number>());
      }
      const personData = secondarySummaryData.get(entry.SecondaryPerson)!;
      personData.set(month, (personData.get(month) || 0) + entry.SecondaryPayment);
    }
  });

  const sortedMonths = Array.from(months).sort((a, b) => {
    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
    return monthOrder.indexOf(a) - monthOrder.indexOf(b);
  });

  return {
    primarySummaryData,
    secondarySummaryData,
    sortedMonths,
    primaryNames: Array.from(primaryNames).sort(),
    secondaryNames: Array.from(secondaryNames).sort()
  };
}

export function createSummarySheets(summaryData: ReturnType<typeof generateSummaryData>) {
  const { primarySummaryData, secondarySummaryData, sortedMonths, primaryNames, secondaryNames } = summaryData;

  // Create combined summary sheet
  const combinedSummarySheet: (string | number)[][] = [];

  // Create primary summary table
  combinedSummarySheet.push(['Primary Support', ...sortedMonths, 'Total']);

  const primaryMonthTotals = new Array(sortedMonths.length).fill(0);
  let primaryGrandTotal = 0;

  primaryNames.forEach(name => {
    const row: (string | number)[] = [name];
    let rowTotal = 0;
    
    sortedMonths.forEach((month, index) => {
      const value = primarySummaryData.get(name)?.get(month) || 0;
      row.push(value);
      rowTotal += value;
      primaryMonthTotals[index] += value;
    });
    
    row.push(rowTotal);
    primaryGrandTotal += rowTotal;
    combinedSummarySheet.push(row);
  });

  combinedSummarySheet.push(['Total', ...primaryMonthTotals, primaryGrandTotal]);

  // Add spacing between tables
  combinedSummarySheet.push([]);
  combinedSummarySheet.push([]);

  // Create secondary summary table
  combinedSummarySheet.push(['Secondary Support', ...sortedMonths, 'Total']);

  const secondaryMonthTotals = new Array(sortedMonths.length).fill(0);
  let secondaryGrandTotal = 0;

  secondaryNames.forEach(name => {
    const row: (string | number)[] = [name];
    let rowTotal = 0;
    
    sortedMonths.forEach((month, index) => {
      const value = secondarySummaryData.get(name)?.get(month) || 0;
      row.push(value);
      rowTotal += value;
      secondaryMonthTotals[index] += value;
    });
    
    row.push(rowTotal);
    secondaryGrandTotal += rowTotal;
    combinedSummarySheet.push(row);
  });

  combinedSummarySheet.push(['Total', ...secondaryMonthTotals, secondaryGrandTotal]);

  return {
    'Summary': combinedSummarySheet
  };
}

export function createExcelWorkbook(detailedData: DailyAssignment[], summaryData: { [key: string]: (string | number)[][] }) {
  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  
  // Add detailed sheet
  const detailedWs: XLSX.WorkSheet = XLSX.utils.json_to_sheet(detailedData);
  XLSX.utils.book_append_sheet(wb, detailedWs, 'Detailed');

  // Add summary sheets
  Object.keys(summaryData).forEach(sheetName => {
    const summaryWs: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(summaryData[sheetName]);
    XLSX.utils.book_append_sheet(wb, summaryWs, sheetName);
  });

  return wb;
}

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

export function createSummarySheets(summaryData: ReturnType<typeof generateSummaryData>, teamName?: string): { 
  [key: string]: (string | number | { t: 's'; f: string; })[][];
} {
  const { primarySummaryData, secondarySummaryData, sortedMonths, primaryNames, secondaryNames } = summaryData;

  // Create combined summary sheet
  const combinedSummarySheet: (string | number | { t: 's', f: string })[][] = [];

  // Create primary summary table
  combinedSummarySheet.push(['Primary Support', ...sortedMonths, 'Total']);

  let startRow = 2; // Excel rows are 1-based, and we start after header
  const primaryStartRow = startRow;

  primaryNames.forEach((name, nameIndex) => {
    const row: (string | { t: 's', f: string })[] = [name];
    
    sortedMonths.forEach((month, monthIndex) => {
      // Create formula to sum values from detailed sheet for this person and month
      const sheetName = teamName ? `'${teamName} - Detailed'` : 'Detailed';
      const formula = `SUMIFS(${sheetName}!E:E,${sheetName}!C:C,"${name}",${sheetName}!G:G,"${month}")`;
      row.push({ t: 's', f: formula });
    });
    
    // Add row total formula
    const startCol = XLSX.utils.encode_col(1); // B column
    const endCol = XLSX.utils.encode_col(sortedMonths.length); // Column based on number of months
    row.push({ t: 's', f: `SUM(${startCol}${startRow}:${endCol}${startRow})` });
    
    combinedSummarySheet.push(row);
    startRow++;
  });

  // Add primary totals row with formulas
  const primaryTotalsRow: (string | { t: 's', f: string })[] = ['Total'];
  for (let col = 1; col <= sortedMonths.length; col++) {
    const colLetter = XLSX.utils.encode_col(col);
    primaryTotalsRow.push({ t: 's', f: `SUM(${colLetter}${primaryStartRow}:${colLetter}${startRow-1})` });
  }
  // Add grand total formula
  const startCol = XLSX.utils.encode_col(1);
  const endCol = XLSX.utils.encode_col(sortedMonths.length);
  primaryTotalsRow.push({ t: 's', f: `SUM(${startCol}${startRow}:${endCol}${startRow})` });
  combinedSummarySheet.push(primaryTotalsRow);

  // Add spacing between tables
  combinedSummarySheet.push([]);
  combinedSummarySheet.push([]);
  startRow += 3; // Account for total row and two empty rows

  // Create secondary summary table with same formula pattern
  combinedSummarySheet.push(['Secondary Support', ...sortedMonths, 'Total']);
  const secondaryStartRow = startRow + 1;

  secondaryNames.forEach((name, nameIndex) => {
    const row: (string | { t: 's', f: string })[] = [name];
    
    sortedMonths.forEach((month, monthIndex) => {
      const sheetName = teamName ? `'${teamName} - Detailed'` : 'Detailed';
      const formula = `SUMIFS(${sheetName}!F:F,${sheetName}!D:D,"${name}",${sheetName}!G:G,"${month}")`;
      row.push({ t: 's', f: formula });
    });
    
    // Add row total formula
    const startCol = XLSX.utils.encode_col(1);
    const endCol = XLSX.utils.encode_col(sortedMonths.length);
    row.push({ t: 's', f: `SUM(${startCol}${startRow+1}:${endCol}${startRow+1})` });
    
    combinedSummarySheet.push(row);
    startRow++;
  });

  // Add secondary totals row with formulas
  const secondaryTotalsRow: (string | { t: 's', f: string })[] = ['Total'];
  for (let col = 1; col <= sortedMonths.length; col++) {
    const colLetter = XLSX.utils.encode_col(col);
    secondaryTotalsRow.push({ t: 's', f: `SUM(${colLetter}${secondaryStartRow}:${colLetter}${startRow})` });
  }
  // Add grand total formula
  secondaryTotalsRow.push({ t: 's', f: `SUM(${startCol}${startRow+1}:${endCol}${startRow+1})` });
  combinedSummarySheet.push(secondaryTotalsRow);

  return {
    'Summary': combinedSummarySheet
  };
}

export function createExcelWorkbook(
  detailedData: DailyAssignment[], 
  summaryData: { [key: string]: (string | number | { t: 's', f: string })[][] },
  teamName?: string
) {
  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  
  // Add detailed sheet
  const detailedWs: XLSX.WorkSheet = XLSX.utils.json_to_sheet(detailedData);
  const sheetName = teamName ? `${teamName} - Detailed` : 'Detailed';
  XLSX.utils.book_append_sheet(wb, detailedWs, sheetName);

  // Add summary sheets
  Object.keys(summaryData).forEach(sheetName => {
    const summaryWs: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(summaryData[sheetName]);
    XLSX.utils.book_append_sheet(wb, summaryWs, sheetName);
  });

  return wb;
}

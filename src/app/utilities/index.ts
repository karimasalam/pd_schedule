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
  
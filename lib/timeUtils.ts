export function timeStringToDecimal(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours + minutes / 60;
}

export function decimalToTimeString(decimal: number): string {
  const totalMinutes = Math.round(decimal * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

export function calculateDuration(startTime: string, endTime: string): number {
  const start = timeStringToDecimal(startTime);
  const end = timeStringToDecimal(endTime);
  
  if (end >= start) {
    return end - start;
  } else {
    // Handle case where end time is next day
    return 24 - start + end;
  }
}

export function formatTime(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

export function formatTimeWithColon(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h:${String(m).padStart(2, '0')}m`;
}

export function formatClock12Hour(time?: string): string {
  if (!time) return '';
  const [rawHours, rawMinutes] = time.split(':').map(Number);
  if (Number.isNaN(rawHours) || Number.isNaN(rawMinutes)) return time;

  const period = rawHours >= 12 ? 'PM' : 'AM';
  const hours = rawHours % 12 || 12;
  return `${hours}:${String(rawMinutes).padStart(2, '0')} ${period}`;
}

export function formatTimeRange12Hour(startTime?: string, endTime?: string): string {
  if (!startTime || !endTime) return '';
  return `${formatClock12Hour(startTime)} - ${formatClock12Hour(endTime)}`;
}

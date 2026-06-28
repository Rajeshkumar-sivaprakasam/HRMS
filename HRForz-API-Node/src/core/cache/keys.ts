export class CacheKeys {
  static dropdownDepartments(): string {
    return 'dropdown:departments';
  }

  static dropdownDesignations(): string {
    return 'dropdown:designations';
  }

  static dropdownWorkLocations(): string {
    return 'dropdown:work_locations';
  }

  static dropdownHolidayCalendars(): string {
    return 'dropdown:holiday_calendars';
  }

  static dropdownSalaryStructures(): string {
    return 'dropdown:salary_structures';
  }

  static employeeProfile(employeeId: string): string {
    return `employee:profile:${employeeId}`;
  }

  static attendanceToday(employeeId: string): string {
    return `attendance:today:${employeeId}`;
  }

  static leaveBalance(employeeId: string): string {
    return `leave:balance:${employeeId}`;
  }

  static refreshToken(userId: string): string {
    return `auth:refresh:${userId}`;
  }

  static rateLimit(ip: string, endpoint: string): string {
    return `ratelimit:${ip}:${endpoint}`;
  }

  static failedLogin(ip: string): string {
    return `auth:failed:${ip}`;
  }
}

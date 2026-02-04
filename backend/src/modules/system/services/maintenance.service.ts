let maintenanceEnabled = false;

export function setMaintenanceMode(enabled: boolean): void {
  maintenanceEnabled = enabled;
}

export function isMaintenanceModeEnabled(): boolean {
  return maintenanceEnabled;
}

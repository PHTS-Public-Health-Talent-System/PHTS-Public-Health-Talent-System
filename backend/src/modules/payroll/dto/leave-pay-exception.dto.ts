export interface CreateLeavePayExceptionDto {
  citizen_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
}

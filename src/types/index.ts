// ============= Common Types =============
export type ID = string;



// ============= API Response Types =============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

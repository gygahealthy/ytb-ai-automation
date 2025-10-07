// Use the shared ApiResponse shape so module services and core handlers agree
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: any;
}

export interface IpcRegistration<TReq = any, TRes = any> {
  channel: string;
  schema?: any;
  handler: (req: TReq) => Promise<ApiResponse<TRes>>;
  description?: string;
}

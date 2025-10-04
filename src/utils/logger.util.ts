export class Logger {
  constructor(private context: string) {}

  info(message: string, ...args: any[]): void {
    console.log(`[${this.context}] INFO:`, message, ...args);
  }

  error(message: string, error?: any): void {
    console.error(`[${this.context}] ERROR:`, message, error);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[${this.context}] WARN:`, message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[${this.context}] DEBUG:`, message, ...args);
    }
  }
}

// ============= Profile Types =============
export interface Profile {
  id: string;
  name: string;
  browserPath?: string;
  userDataDir: string;
  userAgent?: string;
  proxy?: {
    server: string;
    username?: string;
    password?: string;
  };
  creditRemaining: number;
  tags?: string[];
  // Note: Removed isLoggedIn - check cookies table for login status
  createdAt: Date;
  updatedAt: Date;
}

export interface ProxyConfig {
  server: string; // host:port
  username?: string;
  password?: string;
}

export interface CreateProfileInput {
  name: string;
  browserPath?: string;
  userDataDir: string;
  userAgent?: string;
  proxy?: ProxyConfig;
  creditRemaining?: number;
  tags?: string[];
}

import { ID } from "../../../types";

// ============= Profile Types =============
export interface Profile {
  id: ID;
  name: string;
  browserPath?: string;
  userDataDir: string;
  userAgent?: string;
  proxy?: ProxyConfig;
  creditRemaining: number;
  tags?: string[];
  cookies?: string; // Cookie string in standard format: "name=value; name2=value2"
  cookieExpires?: Date;
  isLoggedIn?: boolean;
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
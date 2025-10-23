import CookieConfigCard from "./CookieConfigCard";
import type { CookieRotationConfig } from "../../common/sidebar/cookie-rotation/types";

interface ProfileCookieConfigRowProps {
  cookie: {
    cookieId: string;
    service: string;
    url: string;
    status: string;
    lastRotatedAt?: string;
    config?: CookieRotationConfig;
  };
  profileName?: string;
  onUpdateConfig: (cookieId: string, config: Partial<CookieRotationConfig>) => Promise<void>;
}

/**
 * @deprecated Use CookieConfigCard directly instead
 * This component is kept for backward compatibility and delegates to CookieConfigCard
 */
export default function ProfileCookieConfigRow({ cookie, profileName, onUpdateConfig }: ProfileCookieConfigRowProps) {
  return <CookieConfigCard cookie={cookie} profileName={profileName} onUpdateConfig={onUpdateConfig} />;
}

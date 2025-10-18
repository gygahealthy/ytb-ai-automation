import { cookieService } from "../../services/cookie.service";

export const extractAndStoreHandler = async (req: {
  profileId: string;
  url: string;
  service: string;
  pageUrl: string;
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    expires?: number;
  }>;
}) => {
  const { profileId, url, service, pageUrl, cookies } = req as any;
  return await cookieService.extractAndStoreCookiesFromPage(
    profileId,
    url,
    service,
    pageUrl,
    cookies
  );
};

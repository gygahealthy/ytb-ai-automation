import { hasWindow, hasInvoke, safeCall, invoke } from "./invoke";
import { Cookie, ApiResponse } from "../../shared/types";

const getCookiesByProfile = (
  profileId: string
): Promise<ApiResponse<Cookie[]>> => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.cookies &&
    typeof (window as any).electronAPI.cookies.getCookiesByProfile ===
      "function"
  )
    return safeCall(() =>
      (window as any).electronAPI.cookies.getCookiesByProfile(profileId)
    );
  if (hasInvoke()) return invoke("gemini:cookies:list", { profileId });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const getCookie = (
  profileId: string,
  url: string
): Promise<ApiResponse<Cookie | null>> => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.cookies &&
    typeof (window as any).electronAPI.cookies.getCookie === "function"
  )
    return safeCall(() =>
      (window as any).electronAPI.cookies.getCookie(profileId, url)
    );
  if (hasInvoke()) return invoke("gemini:cookies:get", { profileId, url });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const createCookie = (
  profileId: string,
  url: string,
  data: Partial<Cookie>
): Promise<ApiResponse<Cookie>> => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.cookies &&
    typeof (window as any).electronAPI.cookies.createCookie === "function"
  )
    return safeCall(() =>
      (window as any).electronAPI.cookies.createCookie(profileId, url, data)
    );
  if (hasInvoke())
    return invoke("gemini:cookies:create", { profileId, url, data });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const updateRotationInterval = (
  id: string,
  rotationIntervalMinutes: number
): Promise<ApiResponse<void>> => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.cookies &&
    typeof (window as any).electronAPI.cookies.updateRotationInterval ===
      "function"
  )
    return safeCall(() =>
      (window as any).electronAPI.cookies.updateRotationInterval(
        id,
        rotationIntervalMinutes
      )
    );
  if (hasInvoke())
    return invoke("gemini:cookies:updateRotationInterval", {
      id,
      rotationIntervalMinutes,
    });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const updateStatus = (
  id: string,
  status: "active" | "expired" | "renewal_failed"
): Promise<ApiResponse<void>> => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.cookies &&
    typeof (window as any).electronAPI.cookies.updateStatus === "function"
  )
    return safeCall(() =>
      (window as any).electronAPI.cookies.updateStatus(id, status)
    );
  if (hasInvoke()) return invoke("gemini:cookies:updateStatus", { id, status });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const deleteCookie = (id: string): Promise<ApiResponse<void>> => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.cookies &&
    typeof (window as any).electronAPI.cookies.delete === "function"
  )
    return safeCall(() => (window as any).electronAPI.cookies.delete(id));
  if (hasInvoke()) return invoke("gemini:cookies:delete", { id });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const deleteByProfile = (profileId: string): Promise<ApiResponse<void>> => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.cookies &&
    typeof (window as any).electronAPI.cookies.deleteByProfile === "function"
  )
    return safeCall(() =>
      (window as any).electronAPI.cookies.deleteByProfile(profileId)
    );
  if (hasInvoke())
    return invoke("gemini:cookies:deleteByProfile", { profileId });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const getDueForRotation = (): Promise<ApiResponse<Cookie[]>> => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.cookies &&
    typeof (window as any).electronAPI.cookies.getDueForRotation === "function"
  )
    return safeCall(() =>
      (window as any).electronAPI.cookies.getDueForRotation()
    );
  if (hasInvoke()) return invoke("gemini:cookies:getDueForRotation");
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const getByStatus = (
  status: "active" | "expired" | "renewal_failed"
): Promise<ApiResponse<Cookie[]>> => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.cookies &&
    typeof (window as any).electronAPI.cookies.getByStatus === "function"
  )
    return safeCall(() =>
      (window as any).electronAPI.cookies.getByStatus(status)
    );
  if (hasInvoke()) return invoke("gemini:cookies:getByStatus", { status });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const extractAndCreateCookie = (
  profileId: string,
  service: string,
  url: string
): Promise<ApiResponse<Cookie>> => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.cookies &&
    typeof (window as any).electronAPI.cookies.extractAndCreateCookie ===
      "function"
  )
    return safeCall(() =>
      (window as any).electronAPI.cookies.extractAndCreateCookie(
        profileId,
        service,
        url
      )
    );
  if (hasInvoke())
    return invoke("gemini:cookies:extractAndCreate", {
      profileId,
      service,
      url,
    });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

export const cookies = {
  getCookiesByProfile,
  getCookie,
  createCookie,
  updateRotationInterval,
  updateStatus,
  deleteCookie,
  deleteByProfile,
  getDueForRotation,
  getByStatus,
  extractAndCreateCookie,
};

export default cookies;

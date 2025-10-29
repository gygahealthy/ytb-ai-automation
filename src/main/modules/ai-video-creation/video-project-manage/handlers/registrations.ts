import { IpcRegistration } from "../../../../../core/ipc/types";
import { veo3ProjectRegistrations } from "./video-project.registrations";
import { veo3ProjectApiRegistrations } from "./veo3-project-api.registrations";
import { veo3HistoryRegistrations } from "./veo3-history.registrations";

export const veo3Registrations: IpcRegistration[] = [
  ...veo3ProjectRegistrations,
  ...veo3ProjectApiRegistrations,
  ...veo3HistoryRegistrations,
];

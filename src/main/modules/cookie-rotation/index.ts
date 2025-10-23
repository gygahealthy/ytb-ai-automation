import { registrations } from "./handlers/registrations";
import manifest from "./manifest.json";

// Export manifest and registrations for the module-loader to consume.
export { manifest, registrations };

export default {
  manifest,
  registrations,
};

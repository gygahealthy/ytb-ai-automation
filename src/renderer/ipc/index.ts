// Consolidated electronApi aggregator — re-exports all ipc handlers from one file.
import * as invokeHelpers from "./invoke";
import profile from "./profile";
import automation from "./automation";
import masterPrompts from "./masterPrompts";
import promptHistory from "./promptHistory";
import promptTypes from "./promptTypes";
import cookies from "./cookies";
import gemini from "./gemini";
import { devtools } from "./devtools";

// Named exports for convenient imports
export const invoke = invokeHelpers.invoke;
export {
  profile,
  automation,
  masterPrompts,
  promptHistory,
  promptTypes,
  cookies,
  devtools,
};

// Default export matches the old shape
const api = {
  invoke: invokeHelpers.invoke,
  profile,
  automation,
  masterPrompts,
  promptHistory,
  promptTypes,
  cookies,
  gemini,
  devtools,
  on: gemini.on, // Export streaming listener
};
export default api;

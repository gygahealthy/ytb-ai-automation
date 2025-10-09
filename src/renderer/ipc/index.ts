// Consolidated electronApi aggregator — re-exports all ipc handlers from one file.
import * as invokeHelpers from './invoke';
import profile from './profile';
import automation from './automation';
import masterPrompts from './masterPrompts';
import promptHistory from './promptHistory';

// Named exports for convenient imports
export const invoke = invokeHelpers.invoke;
export { profile, automation, masterPrompts, promptHistory };

// Default export matches the old shape: { invoke, profile, automation, masterPrompts, promptHistory }
const api = { invoke: invokeHelpers.invoke, profile, automation, masterPrompts, promptHistory };
export default api;

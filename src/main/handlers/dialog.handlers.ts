// Shim for backwards compatibility while the dialog module is moved under
// src/main/modules/dialog. The real registration is performed by the module's
// `registerModule` which the module-loader will call.
export { registerModule } from '../modules/dialog';


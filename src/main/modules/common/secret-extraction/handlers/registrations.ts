import { IpcRegistration } from '../../../../../core/ipc/types';
import * as handlers from './secret-extraction.handlers';

export const registrations: IpcRegistration[] = [
  {
    channel: 'secret-extraction:extract',
    handler: handlers.handleExtractSecrets,
  },
  {
    channel: 'secret-extraction:get',
    handler: handlers.handleGetValidSecret,
  },
  {
    channel: 'secret-extraction:get-all',
    handler: handlers.handleGetAllSecrets,
  },
  {
    channel: 'secret-extraction:refresh',
    handler: handlers.handleRefreshSecrets,
  },
  {
    channel: 'secret-extraction:invalidate',
    handler: handlers.handleInvalidateSecrets,
  },
  {
    channel: 'secret-extraction:browser-status',
    handler: handlers.handleGetBrowserStatus,
  },
  {
    channel: 'secret-extraction:cleanup',
    handler: handlers.handleCleanup,
  },
];

import { IpcRegistration } from '../../../../core/ipc/types';
import { profileService } from '../services/profile.service';

export const profileRegistrations: IpcRegistration[] = [
  {
    channel: 'profile:getAll',
    description: 'Get all profiles',
    handler: async () => {
      return await profileService.getAllProfiles();
    },
  },
  {
    channel: 'profile:getById',
    description: 'Get profile by id',
    handler: async (req: { id: string }) => {
      return await profileService.getProfileById((req as any).id);
    },
  },
  {
    channel: 'profile:create',
    description: 'Create profile',
    handler: async (req: any) => {
      return await profileService.createProfile(req);
    },
  },
  {
    channel: 'profile:update',
    description: 'Update profile',
    handler: async (req: any) => {
      const { id, updates } = req as any;
      return await profileService.updateProfile(id, updates);
    },
  },
  {
    channel: 'profile:delete',
    description: 'Delete profile',
    handler: async (req: { id: string }) => {
      return await profileService.deleteProfile((req as any).id);
    },
  },
  {
    channel: 'profile:updateCredit',
    description: 'Update profile credit',
    handler: async (req: { id: string; amount: number }) => {
      const { id, amount } = req as any;
      return await profileService.updateCredit(id, amount);
    },
  },
  {
    channel: 'profile:login',
    description: 'Login profile',
    handler: async (req: { id: string }) => {
      return await profileService.loginProfile((req as any).id);
    },
  },
];

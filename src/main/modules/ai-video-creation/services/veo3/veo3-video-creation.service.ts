import { randomBytes } from 'crypto';
import { ApiResponse } from '../../../../../shared/types';
import { logger } from '../../../../utils/logger-backend';
import { profileRepository } from '../../../../storage/database';
import { veo3ApiClient } from '../../apis/veo3-api.client';
import { videoGenerationRepository } from '../../repository/video-generation.repository';

export interface ExtractedVideoMetadata {
  mediaGenerationId?: string;
  fifeUrl?: string;
  servingBaseUri?: string;
  videoUrl: string;
  status: string;
}

export function extractVideoMetadata(rawData: any): ExtractedVideoMetadata {
  const operation = rawData?.operations?.[0];
  if (!operation) {
    return { videoUrl: '', status: 'UNKNOWN' };
  }
  
  const status = operation?.status || 'UNKNOWN';
  const metadata = operation?.operation?.metadata;
  const video = metadata?.video;
  
  const mediaGenerationId = video?.mediaGenerationId || operation?.mediaGenerationId;
  const fifeUrl = video?.fifeUrl;
  const servingBaseUri = video?.servingBaseUri;
  const videoUrl = fifeUrl || servingBaseUri || video?.url || operation?.videoUrl || '';
  
  return { mediaGenerationId, fifeUrl, servingBaseUri, videoUrl, status };
}

export class VEO3VideoCreationService {
  async startVideoGeneration(
    profileId: string,
    projectId: string,
    prompt: string,
    aspectRatio: 'VIDEO_ASPECT_RATIO_LANDSCAPE' | 'VIDEO_ASPECT_RATIO_PORTRAIT' | 'VIDEO_ASPECT_RATIO_SQUARE' = 'VIDEO_ASPECT_RATIO_LANDSCAPE'
  ): Promise<ApiResponse<{ generationId: string; sceneId: string; operationName: string }>> {
    try {
      const profile = await profileRepository.findById(profileId);
      if (!profile || !profile.cookies || !profile.isLoggedIn) {
        return { success: false, error: 'Profile not found or not logged in' };
      }
      
      if (profile.cookieExpires && new Date(profile.cookieExpires) < new Date()) {
        return { success: false, error: 'Profile cookies have expired' };
      }
      
      logger.info(`Starting video generation for profile: ${profile.name}, project: ${projectId}`);
      
      const tokenResult = await veo3ApiClient.extractBearerToken(profile.cookies);
      if (!tokenResult.success || !tokenResult.token) {
        return { success: false, error: tokenResult.error || 'Failed to extract bearer token' };
      }
      
      const generateResult = await veo3ApiClient.generateVideo(tokenResult.token, projectId, prompt, aspectRatio);
      if (!generateResult.success) {
        return { success: false, error: generateResult.error || 'Failed to start video generation' };
      }
      
      const { sceneId, seed, data } = generateResult;
      const operationName = data?.name || data?.operationName || '';
      
      if (!sceneId || !seed || !operationName) {
        return { success: false, error: 'Invalid response from video generation API' };
      }
      
      logger.info(`Video generation started: operationName=${operationName}, sceneId=${sceneId}`);
      
      const generationId = randomBytes(16).toString('hex');
      await videoGenerationRepository.create({
        id: generationId,
        profileId,
        projectId,
        sceneId,
        operationName,
        prompt,
        seed,
        aspectRatio,
        status: 'pending',
        rawResponse: JSON.stringify(data),
      });
      
      return { success: true, data: { generationId, sceneId, operationName } };
    } catch (error) {
      logger.error('Failed to start video generation', error);
      return { success: false, error: String(error) };
    }
  }
}

export const veo3VideoCreationService = new VEO3VideoCreationService();

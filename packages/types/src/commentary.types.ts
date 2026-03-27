export type CommentaryPipelineStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface CommentaryDto {
  id: string;
  storeId: string;
  sourceText: string;
  pipelineStatus: CommentaryPipelineStatus;
  createdAt: string;
}

export interface CommentaryTranslationDto {
  id: string;
  commentaryId: string;
  languageCode: string;
  translatedText: string;
  audioUrl: string | null;
  audioS3Key: string | null;
  createdAt: string;
}

export interface CommentaryResponseDto {
  translatedText: string | null;
  audioUrl: string | null;
  pipelineStatus: CommentaryPipelineStatus;
  fallback?: boolean;
  message?: string;
}

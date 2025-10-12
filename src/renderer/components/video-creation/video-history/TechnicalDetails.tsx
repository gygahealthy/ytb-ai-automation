import { VideoGeneration } from "src/shared/types/video-creation.types";

export default function TechnicalDetails({ generation }: { generation: VideoGeneration }) {
  return (
    <details className="mt-4">
      <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">Technical Details</summary>
      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-xs font-mono text-gray-600 dark:text-gray-400 space-y-1">
        <div>
          <span className="font-semibold">ID:</span> {generation.id}
        </div>
        <div>
          <span className="font-semibold">Operation:</span> {generation.operationName}
        </div>
        <div>
          <span className="font-semibold">Scene ID:</span> {generation.sceneId}
        </div>
        <div>
          <span className="font-semibold">Project ID:</span> {generation.projectId}
        </div>
        <div>
          <span className="font-semibold">Profile ID:</span> {generation.profileId}
        </div>
        {generation.videoUrl && (
          <div>
            <span className="font-semibold">Video URL:</span> <a href={generation.videoUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">link</a>
          </div>
        )}
        {generation.fifeUrl && (
          <div>
            <span className="font-semibold">FIFE URL:</span> <span className="break-all">{generation.fifeUrl}</span>
          </div>
        )}
        {generation.servingBaseUri && (
          <div>
            <span className="font-semibold">Serving URI:</span> <span className="break-all">{generation.servingBaseUri}</span>
          </div>
        )}
      </div>
    </details>
  );
}

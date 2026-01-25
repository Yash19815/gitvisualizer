import { useState, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { useRepositoryStore } from '../../store/repositoryStore';

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const { uploadRepo, isLoading } = useRepositoryStore();

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.zip')) {
      await uploadRepo(file);
    }
  }, [uploadRepo]);

  const handleZipSelect = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadRepo(file);
    }
    e.target.value = '';
  }, [uploadRepo]);

  return (
    <div className="space-y-4">
      {/* Quick tip for local repos */}
      <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-200">Fastest: Use the path input above</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Right-click your project folder → "Copy as path" → Paste above
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
        <span className="text-xs text-gray-400 dark:text-gray-500 uppercase">or upload</span>
        <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
      </div>

      {/* Zip Upload Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".zip"
          onChange={handleZipSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />

        <div className="space-y-2">
          <svg
            className={`w-8 h-8 mx-auto ${isDragging ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-300">Drop a ZIP file</span> or click to browse
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            ZIP containing a git repository
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 py-2">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Uploading and analyzing repository...</span>
        </div>
      )}
    </div>
  );
}

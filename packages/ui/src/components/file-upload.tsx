import { useCallback, useState } from 'react';
import { AlertCircle, File, Loader2, Upload, X } from 'lucide-react';
import { useDropzone, type FileRejection } from 'react-dropzone';

import { cn } from '~/lib/utils';
import { Button } from '~/components/button';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: Record<string, string[]>;
  maxSize?: number; // in bytes
  disabled?: boolean;
  loading?: boolean;
  value?: File | null;
  onClear?: () => void;
  error?: string | null;
}

export function FileUpload({
  onFileSelect,
  accept = { 'text/csv': ['.csv'] },
  maxSize = 5 * 1024 * 1024, // 5MB default
  disabled = false,
  loading = false,
  value,
  onClear,
  error: externalError,
}: FileUploadProps) {
  const [internalError, setInternalError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      setInternalError(null);

      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        if (rejection.errors[0].code === 'file-too-large') {
          setInternalError(`File is too large. Max size is ${maxSize / 1024 / 1024}MB`);
        } else {
          setInternalError(rejection.errors[0].message);
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [maxSize, onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    disabled: disabled || loading || !!value,
    multiple: false,
  });

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInternalError(null);
    if (onClear) onClear();
  };

  const error = externalError || internalError;

  return (
    <div className="w-full space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          'relative flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors duration-200 ease-in-out',
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100',
          (disabled || loading) && 'cursor-not-allowed opacity-60 hover:bg-gray-50',
          error && 'border-red-300 bg-red-50',
          value && 'border-solid border-gray-200 bg-white p-4'
        )}
      >
        <input {...getInputProps()} />

        {value ? (
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="rounded-full bg-blue-100 p-2">
                <File className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <p className="truncate text-sm font-medium text-gray-900">{value.name}</p>
                <p className="text-xs text-gray-500">{(value.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-8 w-8 text-gray-500 hover:text-red-600"
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            {loading ? (
              <Loader2 className="mb-3 h-10 w-10 animate-spin text-gray-400" />
            ) : (
              <Upload className="mb-3 h-10 w-10 text-gray-400" />
            )}
            <p className="text-sm font-medium text-gray-900">
              {isDragActive ? 'Drop the file here' : 'Click or drag file to upload'}
            </p>
            <p className="mt-1 text-xs text-gray-500">CSV files up to {maxSize / 1024 / 1024}MB</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

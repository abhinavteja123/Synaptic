'use client';

/**
 * PhotoUpload.tsx – Drag-and-drop photo upload component
 */

import { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { Upload, X } from 'lucide-react';
import { validateImageFile } from '@/lib/utils/imageProcessing';

interface PhotoUploadProps {
  maxFiles?: number;
  maxSizeMB?: number;
  value: File[];
  onChange: (files: File[]) => void;
}

export default function PhotoUpload({
  maxFiles = 5,
  maxSizeMB = 10,
  value,
  onChange,
}: PhotoUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      setError(null);
      const incoming = Array.from(fileList);
      const valid: File[] = [];

      for (const file of incoming) {
        const result = validateImageFile(file);
        if (!result.valid) {
          setError(result.error || 'Invalid file');
          continue;
        }
        valid.push(file);
      }

      const combined = [...value, ...valid].slice(0, maxFiles);
      if (value.length + incoming.length > maxFiles) {
        setError(`Maximum ${maxFiles} photos allowed`);
      }
      onChange(combined);
    },
    [value, maxFiles, onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const removeFile = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
    setError(null);
  };

  // Create stable object URLs and revoke them on cleanup
  const objectUrls = useMemo(() => value.map((f) => URL.createObjectURL(f)), [value]);
  useEffect(() => {
    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [objectUrls]);

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-colors ${
          dragActive
            ? 'border-primary-400 bg-primary-500/10'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
        }`}
      >
        <Upload className={`h-10 w-10 mb-3 ${dragActive ? 'text-primary-400' : 'text-white/30'}`} />
        <p className="text-sm text-white/60 text-center">
          <span className="font-medium text-white/80">Drag photos here</span> or click to browse
        </p>
        <p className="text-xs text-white/30 mt-1">
          JPG, PNG, WebP &bull; Max {maxSizeMB}MB each &bull; {value.length}/{maxFiles} photos
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Thumbnails */}
      {value.length > 0 && (
        <div className="grid grid-cols-5 gap-3">
          {value.map((file, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10">
              <img
                src={objectUrls[i]}
                alt={file.name}
                className="h-full w-full object-cover"
              />
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove photo"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

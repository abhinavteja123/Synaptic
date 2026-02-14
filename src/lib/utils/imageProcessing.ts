/**
 * Image Processing Utilities
 * Compress, validate, and convert images for storage
 */

/** Compress an image file to target size & dimensions */
export async function compressImage(file: File, maxSizeMB: number = 2): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('Canvas context unavailable'));

    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        // Calculate new dimensions (max 1920 width)
        const MAX_WIDTH = 1920;
        let { width, height } = img;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first, then JPEG
        let quality = 0.85;
        const mimeType = 'image/webp';

        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('Compression failed'));
              if (blob.size / (1024 * 1024) > maxSizeMB && quality > 0.3) {
                quality -= 0.1;
                tryCompress();
                return;
              }
              const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
                type: mimeType,
                lastModified: Date.now(),
              });
              resolve(compressed);
            },
            mimeType,
            quality,
          );
        };

        tryCompress();
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/** Convert a file to base64 data URL string */
export function convertToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to convert to base64'));
    reader.readAsDataURL(file);
  });
}

/** Validate that a file is an acceptable image */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: `Invalid file type: ${file.type}. Use JPG, PNG, or WebP.` };
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: `File too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum is 10 MB.` };
  }
  return { valid: true };
}

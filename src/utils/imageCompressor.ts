const MAX_WIDTH = 1920;
const QUALITY = 0.8;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function isFileSizeAllowed(fileSize: number): boolean {
  return fileSize <= MAX_FILE_SIZE;
}

export function processImageToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!isFileSizeAllowed(file.size)) {
      reject(new Error(`File exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`));
      return;
    }

    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      let { width, height } = img;

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas conversion failed'));
        },
        'image/webp',
        QUALITY
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Image loading failed'));
    };
    img.src = URL.createObjectURL(file);
  });
}

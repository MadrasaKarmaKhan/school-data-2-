export function compressBase64Image(base64: string, maxWidth: number, maxHeight: number, quality: number = 0.4): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!base64.startsWith('data:image')) {
      return resolve(base64); // Return as is if not a data URI
    }
    // If it's already reasonably small, skip compression
    if (base64.length < 50000) {
       return resolve(base64);
    }
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Failed to get 2D context"));

      ctx.drawImage(img, 0, 0, width, height);

      // Check original mime type to preserve transparency for PNG/Gif/Webp
      const mimeMatch = base64.match(/^data:([^;]+);base64/);
      const originalMime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      let isTransparent = originalMime.includes('png') || originalMime.includes('gif') || originalMime.includes('webp');
      
      // Also check raw canvas pixels for any transparent values
      if (!isTransparent) {
        try {
          const imgData = ctx.getImageData(0, 0, width, height).data;
          for (let i = 3; i < imgData.length; i += 4) {
            if (imgData[i] < 255) {
              isTransparent = true;
              break;
            }
          }
        } catch (e) {
          // Ignore security errors
        }
      }
      
      const format = isTransparent ? 'image/webp' : 'image/jpeg';
      const output = canvas.toDataURL(format, quality);
      resolve(output);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = base64;
  });
}

export function resizeImage(file: File, maxWidth: number, maxHeight: number, quality: number = 0.5): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target?.result) return reject(new Error("Failed to read file"));
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Failed to get 2D context"));

        ctx.drawImage(img, 0, 0, width, height);

        // ALWAYS compress heavily to respect the 1MB firestore limit.
        // We use png for transparent images (e.g. PNG/GIF/WEBP) to preserve transparency, and jpeg for others.
        let isTransparent = file.type === 'image/png' || file.type === 'image/gif' || file.type === 'image/webp' || (file.name && file.name.toLowerCase().endsWith('.png'));
        
        if (!isTransparent) {
          try {
            const imgData = ctx.getImageData(0, 0, width, height).data;
            for (let i = 3; i < imgData.length; i += 4) {
              if (imgData[i] < 255) {
                isTransparent = true;
                break;
              }
            }
          } catch (e) {
            // Ignore
          }
        }

        const format = isTransparent ? 'image/webp' : 'image/jpeg';
        const output = canvas.toDataURL(format, quality);
        resolve(output);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

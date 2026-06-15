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

      const output = canvas.toDataURL("image/jpeg", quality);
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
        // We use webp for better compression, falling back to jpeg.
        const output = canvas.toDataURL("image/jpeg", quality);
        resolve(output);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

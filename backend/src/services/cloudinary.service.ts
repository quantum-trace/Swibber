import { cloudinary } from '../config/cloudinary';
import { AppError } from '../utils/errors';

export const uploadImage = async (
  fileBuffer: Buffer,
  folder: string,
  publicId?: string,
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `swibber/${folder}`,
        public_id: publicId,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error || !result) return reject(new AppError('Upload failed', 500));
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    uploadStream.end(fileBuffer);
  });
};

export const deleteImage = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

export const getOptimizedUrl = (publicId: string, width = 400, height = 400): string =>
  cloudinary.url(publicId, {
    width,
    height,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto',
  });

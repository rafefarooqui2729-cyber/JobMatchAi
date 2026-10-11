
import { v2 as cloudinary } from 'cloudinary';
import env from '../config/env.js';

if (
  env.cloudinaryCloudName &&
  env.cloudinaryApiKey &&
  env.cloudinaryApiSecret
) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });
}

export function uploadProfilePhoto(buffer, userId) {
  if (
    !env.cloudinaryCloudName ||
    !env.cloudinaryApiKey ||
    !env.cloudinaryApiSecret
  ) {
    throw new Error('Cloudinary is not configured.');
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'jobmatch-ai/profile-photos',
        public_id: `candidate-${userId}`,
        overwrite: true,
        invalidate: true,
        resource_type: 'image',
        transformation: [
          {
            width: 512,
            height: 512,
            crop: 'fill',
            gravity: 'face',
            quality: 'auto',
            fetch_format: 'auto',
          },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result?.secure_url || !result?.public_id) {
          reject(new Error('Cloudinary did not return a valid image.'));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    stream.on('error', reject);
    stream.end(buffer);
  });
}

export default cloudinary;

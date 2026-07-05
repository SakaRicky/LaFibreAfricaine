import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";

// Reads CLOUDINARY_URL from env (cloudinary://key:secret@cloud_name).
// When unset (CI, fresh dev machines), the app falls back to local disk serving.
cloudinary.config({ secure: true });

export const cloudinaryReady = Boolean(cloudinary.config().cloud_name);
export { cloudinary };

// Delivery URL with automatic format (WebP/AVIF) and quality optimization.
export function deliveryUrl(publicId: string): string {
  return cloudinary.url(publicId, { fetch_format: "auto", quality: "auto", secure: true });
}

export function uploadBuffer(buffer: Buffer, publicId: string): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { public_id: publicId, resource_type: "image", overwrite: true },
      (err, res) => (err || !res ? reject(err ?? new Error("Empty Cloudinary response")) : resolve(res))
    );
    stream.end(buffer);
  });
}

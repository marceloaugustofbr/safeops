import { v2 as cloudinary } from "cloudinary";
import { env } from "~/env";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME ?? "",
  api_key: env.CLOUDINARY_API_KEY ?? "",
  api_secret: env.CLOUDINARY_API_SECRET ?? "",
});

const isConfigured =
  !!env.CLOUDINARY_CLOUD_NAME &&
  !!env.CLOUDINARY_API_KEY &&
  !!env.CLOUDINARY_API_SECRET;

interface UploadResult {
  url: string;
  publicId: string;
}

export async function uploadToCloudinary(
  base64Data: string,
  folder: string,
  fileName: string,
): Promise<UploadResult | null> {
  if (!isConfigured) return null;

  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder,
      public_id: fileName,
      resource_type: "auto",
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
}

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

export class CloudinaryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CloudinaryError";
  }
}

interface UploadResult {
  url: string;
  publicId: string;
}

export async function uploadToCloudinary(
  base64Data: string,
  folder: string,
  fileName: string,
): Promise<UploadResult> {
  if (!isConfigured) {
    throw new CloudinaryError("Cloudinary não configurado");
  }

  const result = await cloudinary.uploader.upload(base64Data, {
    folder,
    public_id: fileName,
    resource_type: "auto",
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

-- AlterTable
ALTER TABLE "delivery" ADD COLUMN     "deviceType" TEXT,
ADD COLUMN     "geoLatitude" DOUBLE PRECISION,
ADD COLUMN     "geoLongitude" DOUBLE PRECISION,
ADD COLUMN     "ipAddress" TEXT;

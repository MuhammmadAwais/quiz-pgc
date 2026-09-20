import { S3Client } from "@aws-sdk/client-s3";

function getCleanEndpoint(rawEndpoint?: string): string {
  if (!rawEndpoint) return "https://s3.us-east-005.backblazeb2.com";
  if (rawEndpoint.startsWith("http://") || rawEndpoint.startsWith("https://")) {
    return rawEndpoint;
  }
  return `https://${rawEndpoint}`;
}

let s3ClientInstance: S3Client | null = null;

export function getB2Client(): S3Client {
  if (!s3ClientInstance) {
    const endpoint = getCleanEndpoint(process.env.B2_ENDPOINT);
    const region = process.env.B2_REGION || "us-east-005";
    const accessKeyId =
      process.env.B2_ACCESS_KEY_ID ||
      process.env.B2_KEY_ID ||
      process.env.AWS_ACCESS_KEY_ID ||
      "";
    const secretAccessKey =
      process.env.B2_SECRET_ACCESS_KEY ||
      process.env.B2_APP_KEY ||
      process.env.AWS_SECRET_ACCESS_KEY ||
      "";

    s3ClientInstance = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  return s3ClientInstance;
}

export function getB2BucketName(): string {
  return process.env.B2_BUCKET_NAME || "pgc-arena-library";
}

/**
 * Builds the public URL for a stored file key.
 */
export function getB2FileUrl(fileKey: string): string {
  const endpoint = getCleanEndpoint(process.env.B2_ENDPOINT);
  const bucketName = getB2BucketName();
  return `${endpoint.replace(/\/$/, "")}/${bucketName}/${encodeURIComponent(fileKey).replace(/%2F/g, "/")}`;
}

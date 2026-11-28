import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import path from "path";
import s3 from "../config/s3.js";

const bucket = process.env.AWS_BUCKET_NAME;

if (!bucket) {
  throw new Error("AWS_BUCKET_NAME is missing");
}

// Upload file
export const uploadToS3 = async (
  file: Express.Multer.File,
  folder: string,
): Promise<string> => {
  const fileExtension = path.extname(file.originalname);
  const fileName = randomUUID() + fileExtension;
  const key = `${folder}/${fileName}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  return key;
};

// Delete file
export const deleteFromS3 = async (key: string): Promise<void> => {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
};

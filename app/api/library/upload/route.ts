import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { PDFDocument } from 'pdf-lib';
import { getB2Client, getB2BucketName, getB2FileUrl } from '@/lib/b2/client';

export const maxDuration = 120; // 2 minutes for large PDF uploads

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No PDF file provided for upload.' },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF documents are supported in Books Bank.' },
        { status: 400 }
      );
    }

    // 1. Clean filename and generate unique S3/B2 file key
    const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueId = crypto.randomUUID().slice(0, 8);
    const timestamp = Date.now();
    const fileKey = `textbooks/${timestamp}_${uniqueId}_${sanitized}`;

    const bucketName = getB2BucketName();
    const s3Client = getB2Client();

    // 2. Read ArrayBuffer & compute page count with pdf-lib
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let pageCount = 1;
    try {
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      pageCount = pdfDoc.getPageCount();
    } catch (pdfErr) {
      console.warn('Could not read page count via pdf-lib:', pdfErr);
    }

    // 3. Upload to Backblaze B2 S3 bucket
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: buffer,
      ContentType: file.type || 'application/pdf',
    });

    await s3Client.send(command);

    const fileUrl = getB2FileUrl(fileKey);

    return NextResponse.json({
      success: true,
      fileKey,
      fileUrl,
      pageCount,
      fileSizeBytes: file.size,
    });
  } catch (err: any) {
    console.error('Server B2 Upload Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to upload textbook to Backblaze B2 repository.' },
      { status: 500 }
    );
  }
}

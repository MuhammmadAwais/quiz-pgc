import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getB2Client, getB2BucketName } from '@/lib/b2/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json({ error: "Missing 'url' parameter" }, { status: 400 });
    }

    const bucketName = getB2BucketName();
    let fileKey: string | null = null;

    // Check if the URL belongs to our B2 bucket or has a file key
    if (targetUrl.includes(bucketName)) {
      const parts = targetUrl.split(`${bucketName}/`);
      if (parts[1]) {
        fileKey = decodeURIComponent(parts[1]);
      }
    } else if (targetUrl.startsWith('textbooks/')) {
      fileKey = targetUrl;
    }

    // 1. Fetch using S3/B2 client if it is a B2 textbook
    if (fileKey) {
      try {
        const s3Client = getB2Client();
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: fileKey,
        });

        const s3Response = await s3Client.send(command);
        if (!s3Response.Body) {
          throw new Error('Empty body in S3 response');
        }

        const byteArray = await s3Response.Body.transformToByteArray();
        let contentType = s3Response.ContentType || 'application/pdf';

        return new NextResponse(Buffer.from(byteArray), {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (s3Err: any) {
        console.warn('S3 GetObject failed in proxy, attempting fallback fetch:', s3Err.message);
      }
    }

    // 2. Fallback to generic fetch for external URLs
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'PGC-Arena-PDF-Renderer/1.0',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch source PDF: ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'application/pdf';
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    console.error('PDF Proxy Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to proxy PDF stream' },
      { status: 500 }
    );
  }
}

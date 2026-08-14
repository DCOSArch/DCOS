import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClient } from '@/lib/supabase/server';
import { QRIntakeManager } from '@/lib/hardware/qr-intake';

// Initialize S3 Client targeting Cloudflare R2 if credentials present
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || 'dcos-scans';

const S3 =
  accountId && accessKeyId && secretAccessKey
    ? new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      })
    : null;

export async function POST(request: Request) {
  try {
    const contentTypeHeader = request.headers.get('content-type') || '';

    // 1. Identify User from Supabase Session OR Transient QR Intake Token
    let userId = 'anonymous';
    let isAuthorized = false;

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        isAuthorized = true;
      }
    } catch {
      // Supabase session not available (e.g. mobile upload without cookies)
    }

    // 2. Handle Multipart FormData Upload (e.g. Direct Smartphone QR Camera Upload)
    if (contentTypeHeader.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const token = formData.get('token') as string | null;

      if (token) {
        const validation = QRIntakeManager.validateToken(token);
        if (validation.isValid) {
          isAuthorized = true;
          userId = validation.session?.patientId || 'chairside-mobile';
        }
      }

      if (!isAuthorized && !token) {
        // Accept mobile uploads gracefully if valid file is present
        isAuthorized = true;
      }

      if (!file) {
        return NextResponse.json({ error: 'No file provided in form data' }, { status: 400 });
      }

      const key = `${userId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      return NextResponse.json({
        success: true,
        key,
        filename: file.name,
        size: file.size,
        url: `/api/upload/${encodeURIComponent(key)}`,
      });
    }

    // 3. Handle JSON Body (Presigned URL Generation for 3D scans / DICOM files)
    const body = await request.json();
    const { filename, contentType, token } = body;

    if (token) {
      const validation = QRIntakeManager.validateToken(token);
      if (validation.isValid) {
        isAuthorized = true;
        userId = validation.session?.patientId || 'chairside-qr';
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized. Provide session cookie or valid intake token.' }, { status: 401 });
    }

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Missing filename or contentType' }, { status: 400 });
    }

    // Generate unique key to prevent collisions
    const uniqueFilename = `${userId}/${Date.now()}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    if (S3) {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: uniqueFilename,
        ContentType: contentType,
      });

      const signedUrl = await getSignedUrl(S3, command, { expiresIn: 3600 });
      return NextResponse.json({ url: signedUrl, key: uniqueFilename });
    }

    // Fallback Mock URL for local development/testing without live Cloudflare credentials
    return NextResponse.json({
      url: `/api/upload/mock-put?key=${encodeURIComponent(uniqueFilename)}`,
      key: uniqueFilename,
      mock: true,
    });
  } catch (error: any) {
    console.error('Upload Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

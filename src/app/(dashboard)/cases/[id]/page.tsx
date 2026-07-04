import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import CaseDetailsClient from '@/components/views/CaseDetailsClient'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export default async function CaseDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  const { data: caseData, error } = await supabase
    .from('cases')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !caseData) {
    return <div className="p-8 text-center">Case not found or you don't have access.</div>
  }

  let signedScanUrl = caseData.scan_url;

  // If scan_url is present, and it is not already an absolute URL, presign it from R2
  if (caseData.scan_url && !caseData.scan_url.startsWith('http')) {
    try {
      if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID) {
        const S3 = new S3Client({
          region: 'auto',
          endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
          },
        });
        const command = new GetObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: caseData.scan_url,
        });
        // Presign URL valid for 1 hour
        signedScanUrl = await getSignedUrl(S3, command, { expiresIn: 3600 });
      }
    } catch (e) {
      console.error('Failed to generate presigned URL for R2 object', e);
    }
  }

  const mappedCase = {
    id: caseData.id,
    dentistId: caseData.dentist_id,
    labId: caseData.lab_id,
    patientName: caseData.patient_name,
    requestedTreatment: caseData.requested_treatment,
    status: caseData.status,
    urgency: caseData.urgency,
    dueDate: caseData.due_date,
    material: caseData.material,
    scanUrl: signedScanUrl,
    createdAt: caseData.created_at
  }

  return <CaseDetailsClient initialCase={mappedCase} currentUser={currentUser} />
}

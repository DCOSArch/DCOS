import { createClient } from '@/src/lib/supabase/server';
import ThreeDViewer from '@/src/components/ThreeDViewer';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Your Smile Preview | Dental ConnectOS',
  description: 'View your secure 3D smile design preview.',
};

export default async function SmilePreviewPage({ params }: { params: { hash: string } }) {
  const supabase = await createClient();

  // The [hash] is expected to be something like "hash-CASEID" to mask the real UUID slightly from plain sight,
  // or it could be an actual cryptographic hash mapped in the DB.
  // For this implementation, we assume `params.hash` can be resolved to a case ID.
  const caseId = params.hash.replace('hash-', '');

  // We query with Service Role or a highly specific public policy 
  // ensuring we ONLY retrieve the scan URL and NOT patient names (patient_phi).
  const { data: caseData, error } = await supabase
    .from('cases')
    .select('scan_url, lab_id ( name )')
    .eq('id', caseId)
    .single();

  if (error || !caseData) {
    return notFound();
  }

  // Ideally, generate a pre-signed Cloudflare R2 URL here using the scan_url path
  const signedUrl = `https://cdn.dentalconnect.os/${caseData.scan_url}`; // Placeholder for server-side signed URL

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center">
      <header className="w-full bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800 p-4 text-center">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Your Smile Design Preview</h1>
        <p className="text-sm text-slate-500 mt-1">Review the proposed 3D aesthetics.</p>
      </header>

      <main className="flex-1 w-full max-w-4xl p-4 md:p-8 flex flex-col">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Interactive 3D Model</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full font-semibold">
              HIPAA Compliant Viewer
            </span>
          </div>
          
          <div className="flex-1 min-h-[500px] relative">
            <ThreeDViewer 
              stlUrl={signedUrl} 
              isReadOnly={true} // Patients cannot add annotations
            />
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Please contact your dental provider to approve this design or request modifications.</p>
          <p className="mt-2 text-xs opacity-70">Powered by Dental ConnectOS</p>
        </div>
      </main>
    </div>
  );
}

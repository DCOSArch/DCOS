import { ClinicalVisitClient } from '@/components/views/ClinicalVisitClient';

export default async function VisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClinicalVisitClient visitId={id} />;
}

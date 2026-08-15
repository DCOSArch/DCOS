// TEMPORARY visual-verification harness. Delete after use.
import { ClinicLiveCockpit } from '@/components/dashboards/cockpit/ClinicLiveCockpit';

export default function CockpitDevPreview() {
  return (
    <main className="w-full px-4 py-4 md:px-6 md:py-5 xl:px-8 2xl:px-10 space-y-6">
      <ClinicLiveCockpit />
      {/* Narrow container, to exercise the container-query breakpoints. */}
      <div className="w-[600px] max-w-full">
        <ClinicLiveCockpit />
      </div>
    </main>
  );
}

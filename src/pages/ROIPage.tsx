import { PageHeader } from '@/components/PageHeader';
import { EconomicROIPanel } from '@/components/EconomicROIPanel';
import { useMode } from '@/lib/modeContext';
import { useDistrictScores, useBusinessLicenseStats } from '@/hooks/useDistrictData';
import { Navigate } from 'react-router-dom';

export default function ROIPage() {
  const { isLeadership } = useMode();
  const { districts } = useDistrictScores();
  const { data: stats } = useBusinessLicenseStats();

  // Redirect citizens away — this is a leadership-only page
  if (!isLeadership) {
    return <Navigate to="/economic" replace />;
  }

  return (
    <>
      <PageHeader
        title="ROI Quick Wins"
        subtitle="Data-driven revenue projections and actionable investment priorities for city leadership"
        badge="ROI"
      />
      <EconomicROIPanel districts={districts} stats={stats} />
    </>
  );
}

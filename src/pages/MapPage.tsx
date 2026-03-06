import { PageHeader } from '@/components/PageHeader';
import { CityHeatmap } from '@/components/CityHeatmap';
import { DistrictScoreCard } from '@/components/DistrictScoreCard';
import { districtScores } from '@/lib/mockData';
import { useMode } from '@/lib/modeContext';

export default function MapPage() {
  const { isLeadership } = useMode();

  return (
    <>
      <PageHeader
        title={isLeadership ? 'Geospatial Intelligence Map' : 'City Conditions Map'}
        subtitle={isLeadership ? 'District-level operational intelligence visualization' : 'Explore conditions across Montgomery neighborhoods'}
        badge="Geospatial"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CityHeatmap />
        </div>
        <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
          <h3 className="text-sm font-semibold text-foreground">All Districts</h3>
          {districtScores.map((d, i) => (
            <DistrictScoreCard key={d.district} data={d} index={i} />
          ))}
        </div>
      </div>
    </>
  );
}

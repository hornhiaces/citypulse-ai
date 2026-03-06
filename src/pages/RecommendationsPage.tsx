import { PageHeader } from '@/components/PageHeader';
import { RecommendationCard } from '@/components/RecommendationCard';
import { useMode } from '@/lib/modeContext';
import { recommendations } from '@/lib/mockData';

export default function RecommendationsPage() {
  const { isLeadership } = useMode();

  return (
    <>
      <PageHeader
        title={isLeadership ? 'Action Recommendations' : 'City Action Plan'}
        subtitle={isLeadership ? 'AI-generated operational recommendations based on signal convergence analysis' : 'See what actions the city is taking based on community data'}
        badge="AI Recommendations"
      />

      <div className="space-y-4">
        {recommendations.map((r, i) => (
          <RecommendationCard key={r.id} data={r} index={i} />
        ))}
      </div>
    </>
  );
}

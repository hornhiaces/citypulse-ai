import { PageHeader } from '@/components/PageHeader';
import { RecommendationCard } from '@/components/RecommendationCard';
import { useMode } from '@/lib/modeContext';
import { useQuery } from '@tanstack/react-query';
import { fetchRecommendations } from '@/services/recommendationService';
import { recommendations as fallbackRecs } from '@/lib/mockData';

export default function RecommendationsPage() {
  const { isLeadership } = useMode();

  const { data: dbRecs } = useQuery({
    queryKey: ['recommendations'],
    queryFn: fetchRecommendations,
  });

  const recommendations = dbRecs
    ? dbRecs.map(r => ({
        id: r.id,
        priority: r.priority as 'critical' | 'high' | 'medium',
        title: r.title,
        description: r.description,
        districts: r.districts || [],
        signals: r.signals || [],
        confidence: r.confidence || 0,
        category: r.category || '',
      }))
    : fallbackRecs;

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

export type ScoreLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'RISING' | 'DECLINING' | 'STRONG' | 'STABLE';

export interface DistrictScore {
  district: number;
  name: string;
  publicSafetyPressure: ScoreLevel;
  infrastructureStress: ScoreLevel;
  emergencyDemand: ScoreLevel;
  economicActivity: ScoreLevel;
  citizenConfidence: ScoreLevel;
  population: number;
  area: string;
}

export interface KpiData {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: string;
}

export interface ServiceRequest {
  id: string;
  category: string;
  district: number;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  description: string;
}

export interface Recommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  districts: number[];
  signals: string[];
  confidence: number;
  category: string;
}

export const districtScores: DistrictScore[] = [
  { district: 1, name: 'Downtown Core', publicSafetyPressure: 'HIGH', infrastructureStress: 'HIGH', emergencyDemand: 'RISING', economicActivity: 'STRONG', citizenConfidence: 'DECLINING', population: 28400, area: 'Central Business District' },
  { district: 2, name: 'Capitol Heights', publicSafetyPressure: 'HIGH', infrastructureStress: 'MEDIUM', emergencyDemand: 'RISING', economicActivity: 'MEDIUM', citizenConfidence: 'DECLINING', population: 31200, area: 'East Montgomery' },
  { district: 3, name: 'Cloverdale-Idlewild', publicSafetyPressure: 'LOW', infrastructureStress: 'LOW', emergencyDemand: 'STABLE', economicActivity: 'STRONG', citizenConfidence: 'STRONG', population: 22800, area: 'Midtown' },
  { district: 4, name: 'Dalraida', publicSafetyPressure: 'MEDIUM', infrastructureStress: 'MEDIUM', emergencyDemand: 'STABLE', economicActivity: 'MEDIUM', citizenConfidence: 'STABLE', population: 35600, area: 'North Montgomery' },
  { district: 5, name: 'Chisholm', publicSafetyPressure: 'HIGH', infrastructureStress: 'HIGH', emergencyDemand: 'RISING', economicActivity: 'LOW', citizenConfidence: 'DECLINING', population: 27300, area: 'West Montgomery' },
  { district: 6, name: 'Governors Square', publicSafetyPressure: 'LOW', infrastructureStress: 'MEDIUM', emergencyDemand: 'STABLE', economicActivity: 'STRONG', citizenConfidence: 'STRONG', population: 41200, area: 'East Montgomery' },
  { district: 7, name: 'Pike Road Corridor', publicSafetyPressure: 'LOW', infrastructureStress: 'LOW', emergencyDemand: 'LOW', economicActivity: 'STRONG', citizenConfidence: 'STRONG', population: 18900, area: 'Southeast Montgomery' },
  { district: 8, name: 'West Boulevard', publicSafetyPressure: 'MEDIUM', infrastructureStress: 'HIGH', emergencyDemand: 'RISING', economicActivity: 'LOW', citizenConfidence: 'DECLINING', population: 24100, area: 'West Montgomery' },
  { district: 9, name: 'McGehee Estates', publicSafetyPressure: 'LOW', infrastructureStress: 'LOW', emergencyDemand: 'STABLE', economicActivity: 'STRONG', citizenConfidence: 'STRONG', population: 15700, area: 'Southeast Montgomery' },
];

export const executiveKpis: KpiData[] = [
  { label: 'Active 311 Requests', value: '2,847', change: 12.3, trend: 'up', icon: 'clipboard' },
  { label: '911 Calls (30d)', value: '18,432', change: -3.2, trend: 'down', icon: 'phone' },
  { label: 'Avg Response Time', value: '4.2 min', change: -8.1, trend: 'down', icon: 'clock' },
  { label: 'Resolution Rate', value: '73.4%', change: 5.6, trend: 'up', icon: 'check' },
  { label: 'Active Business Licenses', value: '12,891', change: 2.1, trend: 'up', icon: 'building' },
  { label: 'Priority Districts', value: '3', change: 0, trend: 'stable', icon: 'alert' },
];

export const citizenKpis: KpiData[] = [
  { label: 'Open Community Issues', value: '2,847', change: 12.3, trend: 'up', icon: 'clipboard' },
  { label: 'Issues Resolved (30d)', value: '1,923', change: 15.2, trend: 'up', icon: 'check' },
  { label: 'Avg Resolution Time', value: '6.3 days', change: -12.1, trend: 'down', icon: 'clock' },
  { label: 'Community Response Rate', value: '73.4%', change: 5.6, trend: 'up', icon: 'thumbs-up' },
];

export const recommendations: Recommendation[] = [
  {
    id: '1',
    priority: 'critical',
    title: 'Deploy Additional Public Safety Resources to District 5',
    description: 'District 5 (Chisholm) shows converging signals of high public safety pressure, rising emergency demand, and declining citizen confidence. Immediate resource allocation recommended.',
    districts: [5],
    signals: ['High 911 call volume (+18% MoM)', 'Rising 311 complaints (+23%)', 'Declining citizen confidence score', 'Low economic activity indicator'],
    confidence: 0.89,
    category: 'Public Safety',
  },
  {
    id: '2',
    priority: 'critical',
    title: 'Infrastructure Emergency Response for Districts 1 & 8',
    description: 'Infrastructure stress indicators in Downtown Core and West Boulevard have reached critical thresholds. Water main, road surface, and drainage complaints have increased 34% in 60 days.',
    districts: [1, 8],
    signals: ['Infrastructure complaints +34%', 'Aging infrastructure overlap zones', 'Emergency demand correlation', '3 unresolved critical work orders'],
    confidence: 0.92,
    category: 'Infrastructure',
  },
  {
    id: '3',
    priority: 'high',
    title: 'Community Engagement Initiative for District 2',
    description: 'Capitol Heights shows declining citizen confidence despite moderate infrastructure and safety conditions. Proactive community engagement could prevent escalation.',
    districts: [2],
    signals: ['Citizen confidence declining 3 consecutive months', '311 response satisfaction below 60%', 'Rising social media complaints', 'Community meeting attendance dropping'],
    confidence: 0.78,
    category: 'Community',
  },
  {
    id: '4',
    priority: 'medium',
    title: 'Economic Development Support for West Montgomery',
    description: 'Districts 5 and 8 show persistently low economic activity alongside high infrastructure stress. Coordinated economic development and infrastructure investment recommended.',
    districts: [5, 8],
    signals: ['Business license applications -15% YoY', 'Vacancy rate above city average', 'Infrastructure stress correlation', 'Low commercial activity zones'],
    confidence: 0.74,
    category: 'Economic',
  },
];

export const serviceRequestCategories = [
  { category: 'Potholes & Road Damage', count: 487, percentage: 17.1 },
  { category: 'Street Lighting', count: 412, percentage: 14.5 },
  { category: 'Water & Sewer', count: 389, percentage: 13.7 },
  { category: 'Trash & Debris', count: 356, percentage: 12.5 },
  { category: 'Noise Complaints', count: 298, percentage: 10.5 },
  { category: 'Code Violations', count: 267, percentage: 9.4 },
  { category: 'Drainage Issues', count: 234, percentage: 8.2 },
  { category: 'Parks & Recreation', count: 189, percentage: 6.6 },
  { category: 'Other', count: 215, percentage: 7.5 },
];

export const monthlyTrends = [
  { month: 'Jul', calls911: 5800, requests311: 2100, resolved: 1650 },
  { month: 'Aug', calls911: 6200, requests311: 2350, resolved: 1780 },
  { month: 'Sep', calls911: 5900, requests311: 2200, resolved: 1890 },
  { month: 'Oct', calls911: 5600, requests311: 2400, resolved: 1920 },
  { month: 'Nov', calls911: 5400, requests311: 2150, resolved: 1850 },
  { month: 'Dec', calls911: 5100, requests311: 1900, resolved: 1700 },
  { month: 'Jan', calls911: 5300, requests311: 2050, resolved: 1800 },
  { month: 'Feb', calls911: 5700, requests311: 2300, resolved: 1750 },
  { month: 'Mar', calls911: 6100, requests311: 2600, resolved: 1900 },
  { month: 'Apr', calls911: 6400, requests311: 2750, resolved: 1950 },
  { month: 'May', calls911: 6200, requests311: 2847, resolved: 1923 },
];

export const districtEmergencyData = [
  { district: 'D1', calls: 2840, change: 15 },
  { district: 'D2', calls: 2510, change: 12 },
  { district: 'D3', calls: 1200, change: -3 },
  { district: 'D4', calls: 1890, change: 2 },
  { district: 'D5', calls: 3100, change: 18 },
  { district: 'D6', calls: 1450, change: -5 },
  { district: 'D7', calls: 890, change: -8 },
  { district: 'D8', calls: 2350, change: 14 },
  { district: 'D9', calls: 780, change: -6 },
];

export const sampleBriefingQuestions = {
  leadership: [
    'Where should Montgomery prioritize public safety resources?',
    'Which districts show the highest infrastructure pressure?',
    'Where do 311 complaints overlap with emergency demand?',
    'Which zones show rising operational risk?',
    'What is the current citywide risk assessment?',
  ],
  citizen: [
    'What issues are most common in my district?',
    'Is my neighborhood seeing more emergency calls?',
    'What infrastructure problems are reported most often?',
    'How is the city responding to community complaints?',
    'What improvements are happening in Montgomery?',
  ],
};

export function getScoreBadgeClass(score: ScoreLevel): string {
  const map: Record<ScoreLevel, string> = {
    HIGH: 'score-badge-high',
    MEDIUM: 'score-badge-medium',
    LOW: 'score-badge-low',
    RISING: 'score-badge-rising',
    DECLINING: 'score-badge-declining',
    STRONG: 'score-badge-strong',
    STABLE: 'score-badge-stable',
  };
  return map[score];
}

export function getStatusColor(score: ScoreLevel): string {
  const map: Record<ScoreLevel, string> = {
    HIGH: 'status-high',
    MEDIUM: 'status-medium',
    LOW: 'status-low',
    RISING: 'status-rising',
    DECLINING: 'status-declining',
    STRONG: 'status-strong',
    STABLE: 'status-stable',
  };
  return map[score];
}

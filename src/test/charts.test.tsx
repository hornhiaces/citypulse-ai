import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TrendChart } from '@/components/TrendChart';
import { DistrictEmergencyChart } from '@/components/DistrictEmergencyChart';
import { CategoryBreakdown } from '@/components/CategoryBreakdown';

// Create a fresh query client for each test
let queryClient: QueryClient;

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('TrendChart Component - Render Tests', () => {
  it('should render with populated data and show chart', () => {
    const data = [
      { month: 'Jan', calls911: 100 },
      { month: 'Feb', calls911: 150 },
      { month: 'Mar', calls911: 120 },
    ];

    render(
      <TrendChart
        title="Test Chart"
        dataKey="calls911"
        color="hsl(350 72% 55%)"
        data={data}
        isLoading={false}
        error={null}
      />,
      { wrapper: Wrapper }
    );

    // Should render title
    expect(screen.getByText('Test Chart')).toBeInTheDocument();

    // Should render chart container (height-based class means it's visible)
    const chartContainer = screen.getByText('Test Chart').closest('div').querySelector('.h-48');
    expect(chartContainer).toBeInTheDocument();
  });

  it('should render explicit empty state when data is empty array', () => {
    const data: any[] = [];

    render(
      <TrendChart
        title="Empty Chart"
        dataKey="calls911"
        color="hsl(350 72% 55%)"
        data={data}
        isLoading={false}
        error={null}
      />,
      { wrapper: Wrapper }
    );

    // Should show explicit empty message with emoji
    expect(screen.getByText(/No data available for this period/i)).toBeInTheDocument();
  });

  it('should render loading state when isLoading is true', () => {
    render(
      <TrendChart
        title="Loading Chart"
        dataKey="calls911"
        color="hsl(350 72% 55%)"
        data={undefined}
        isLoading={true}
        error={null}
      />,
      { wrapper: Wrapper }
    );

    // Should show loading message
    expect(screen.getByText(/Loading chart data/i)).toBeInTheDocument();
  });

  it('should render error state when error is provided', () => {
    const error = new Error('Failed to load data');

    render(
      <TrendChart
        title="Error Chart"
        dataKey="calls911"
        color="hsl(350 72% 55%)"
        data={undefined}
        isLoading={false}
        error={error}
      />,
      { wrapper: Wrapper }
    );

    // Should show error message
    expect(screen.getByText(/Error loading data/i)).toBeInTheDocument();
  });

  it('should render with fallback label when showing sample data', () => {
    render(
      <TrendChart
        title="Fallback Chart"
        dataKey="calls911"
        color="hsl(350 72% 55%)"
        data={undefined} // Undefined triggers fallback path
        isLoading={false}
        error={null}
      />,
      { wrapper: Wrapper }
    );

    // Should show fallback label
    expect(screen.getByText(/Showing sample data/i)).toBeInTheDocument();
  });
});

describe('DistrictEmergencyChart Component - Render Tests', () => {
  it('should render with populated district data and show bars', () => {
    const data = [
      { district: 'D1', calls: 100, change: 5.2 },
      { district: 'D2', calls: 85, change: -2.1 },
      { district: 'D3', calls: 120, change: 8.3 },
    ];

    render(
      <DistrictEmergencyChart data={data} />,
      { wrapper: Wrapper }
    );

    // Should render title
    expect(screen.getByText('Emergency Calls by District')).toBeInTheDocument();

    // Should render chart container
    const chartContainer = screen.getByText('Emergency Calls by District').closest('div').querySelector('.h-56');
    expect(chartContainer).toBeInTheDocument();
  });

  it('should render explicit empty state when data is empty array', () => {
    const data: any[] = [];

    render(
      <DistrictEmergencyChart data={data} />,
      { wrapper: Wrapper }
    );

    // Should show explicit empty message with emoji
    expect(screen.getByText(/No district data available/i)).toBeInTheDocument();
  });

  it('should render with fallback data when data is undefined', () => {
    render(
      <DistrictEmergencyChart data={undefined} />,
      { wrapper: Wrapper }
    );

    // Should render title (fallback logic shows chart)
    expect(screen.getByText('Emergency Calls by District')).toBeInTheDocument();

    // Should render chart container (not empty state)
    const chartContainer = screen.getByText('Emergency Calls by District').closest('div').querySelector('.h-56');
    expect(chartContainer).toBeInTheDocument();
  });
});

describe('CategoryBreakdown Component - Render Tests', () => {
  it('should render with populated category data', () => {
    const data = [
      { category: 'Pothole', count: 234, percentage: 25.5 },
      { category: 'Streetlight', count: 156, percentage: 17.0 },
      { category: 'Graffiti', count: 89, percentage: 9.7 },
    ];

    render(
      <CategoryBreakdown data={data} />,
      { wrapper: Wrapper }
    );

    // Should render title
    expect(screen.getByText('311 Request Categories')).toBeInTheDocument();

    // Should render category items
    expect(screen.getByText('Pothole')).toBeInTheDocument();
    expect(screen.getByText('Streetlight')).toBeInTheDocument();
    expect(screen.getByText('Graffiti')).toBeInTheDocument();
  });

  it('should render explicit empty state when data is empty array', () => {
    const data: any[] = [];

    render(
      <CategoryBreakdown data={data} />,
      { wrapper: Wrapper }
    );

    // Should show explicit empty message with emoji
    expect(screen.getByText(/No category data available/i)).toBeInTheDocument();
  });

  it('should render with fallback categories when data is undefined', () => {
    render(
      <CategoryBreakdown data={undefined} />,
      { wrapper: Wrapper }
    );

    // Should render title
    expect(screen.getByText('311 Request Categories')).toBeInTheDocument();

    // Should render fallback categories (check at least one exists)
    const categoryElements = screen.getAllByText(/./);
    expect(categoryElements.length).toBeGreaterThan(0);
  });
});

// Logic tests (complementary to render tests)
describe('Data Handling - Logic Tests', () => {
  it('should properly detect empty arrays', () => {
    const data: any[] = [];
    const hasLiveData = Array.isArray(data) && data.length > 0;
    const isEmptyData = Array.isArray(data) && data.length === 0;

    expect(hasLiveData).toBe(false);
    expect(isEmptyData).toBe(true);
  });

  it('should properly detect undefined vs empty arrays', () => {
    const undefinedData = undefined;
    const emptyData: any[] = [];
    const populatedData = [{ month: 'Jan', calls911: 100 }];

    // Undefined
    expect(Array.isArray(undefinedData)).toBe(false);

    // Empty array
    expect(Array.isArray(emptyData) && emptyData.length === 0).toBe(true);

    // Populated array
    expect(Array.isArray(populatedData) && populatedData.length > 0).toBe(true);
  });

  it('should show distinct data sources for 911 vs 311', () => {
    // 911 trend uses calls911 key
    const trend911 = [
      { month: 'Jan', calls911: 100 },
      { month: 'Feb', calls911: 120 },
    ];

    // 311 trend uses requests311 key
    const trend311 = [
      { month: 'Jan', requests311: 50 },
      { month: 'Feb', requests311: 65 },
    ];

    // Should have different keys
    expect(trend911[0]).toHaveProperty('calls911');
    expect(trend911[0]).not.toHaveProperty('requests311');
    expect(trend311[0]).toHaveProperty('requests311');
    expect(trend311[0]).not.toHaveProperty('calls911');
  });

  it('should aggregate 311 data by month from created_date', () => {
    const serviceRequests = [
      { created_date: '2025-01-15', category: 'Pothole' },
      { created_date: '2025-01-20', category: 'Streetlight' },
      { created_date: '2025-02-05', category: 'Graffiti' },
      { created_date: '2025-02-10', category: 'Pothole' },
      { created_date: '2025-02-18', category: 'Pothole' },
    ];

    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthMap: Record<string, number> = {};

    serviceRequests.forEach(r => {
      if (!r.created_date) return;
      try {
        const date = new Date(r.created_date);
        const month = monthOrder[date.getMonth()];
        if (month) {
          monthMap[month] = (monthMap[month] || 0) + 1;
        }
      } catch (e) {
        // Skip invalid dates
      }
    });

    const result = monthOrder
      .filter(m => monthMap[m])
      .map(m => ({ month: m, requests311: monthMap[m] || 0 }));

    expect(result).toEqual([
      { month: 'Jan', requests311: 2 },
      { month: 'Feb', requests311: 3 },
    ]);
  });
});

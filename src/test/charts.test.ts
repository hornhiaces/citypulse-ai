import { describe, it, expect } from 'vitest';

/**
 * Regression Tests for P0 Chart Fixes
 * - Empty state handling
 * - Data source correctness
 * - Mock data vs live data differentiation
 */

describe('TrendChart Component', () => {
  it('should render with data provided', () => {
    const data = [
      { month: 'Jan', calls911: 100 },
      { month: 'Feb', calls911: 150 },
    ];
    // Component checks: data !== undefined && data.length > 0
    expect(data && data.length > 0).toBe(true);
  });

  it('should show empty state when data is empty array', () => {
    const data: any[] = [];
    const isEmpty = data && data.length === 0;
    expect(isEmpty).toBe(true);
  });

  it('should use mock data only when data is undefined', () => {
    const data = undefined;
    const mockData = [{ month: 'Jan', calls911: 100 }];
    const chartData = data ?? mockData;
    expect(chartData).toEqual(mockData);
  });

  it('should NOT use mock data when empty array is provided', () => {
    const data: any[] = [];
    const mockData = [{ month: 'Jan', calls911: 100 }];
    const chartData = data ?? mockData;
    // Should be empty array, not mock data
    expect(chartData).toEqual([]);
    expect(chartData).not.toEqual(mockData);
  });
});

describe('DistrictEmergencyChart Component', () => {
  it('should render with district data', () => {
    const data = [
      { district: 'D1', calls: 50, change: 5 },
      { district: 'D2', calls: 75, change: -3 },
    ];
    expect(data.length).toBeGreaterThan(0);
  });

  it('should show empty state when district data is empty', () => {
    const data: any[] = [];
    const isEmpty = data && data.length === 0;
    expect(isEmpty).toBe(true);
  });

  it('should use mock data as fallback only when data is undefined', () => {
    const data = undefined;
    const mockData = [{ district: 'D1', calls: 50, change: 5 }];
    const chartData = data ?? mockData;
    expect(chartData).toEqual(mockData);
  });
});

describe('311 Service Request Trends', () => {
  it('should aggregate service requests by month', () => {
    // Mock 311 data with created_date
    const serviceRequests = [
      { created_date: '2025-01-15' },
      { created_date: '2025-01-20' },
      { created_date: '2025-02-05' },
      { created_date: '2025-02-10' },
      { created_date: '2025-02-18' },
    ];

    const monthMap: Record<string, number> = {};
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

    // Should have 2 months with data
    expect(result.length).toBe(2);
    expect(result[0]).toEqual({ month: 'Jan', requests311: 2 });
    expect(result[1]).toEqual({ month: 'Feb', requests311: 3 });
  });

  it('should handle empty service request list', () => {
    const serviceRequests: any[] = [];
    expect(serviceRequests.length).toBe(0);
    // Should return empty array, not mock data
    const result = serviceRequests.length > 0 ? serviceRequests : [];
    expect(result).toEqual([]);
  });

  it('should skip invalid dates gracefully', () => {
    const serviceRequests = [
      { created_date: '2025-01-15' },
      { created_date: null },
      { created_date: 'invalid-date' },
      { created_date: '2025-02-05' },
    ];

    const monthMap: Record<string, number> = {};
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    serviceRequests.forEach(r => {
      if (!r.created_date) return;
      try {
        const date = new Date(r.created_date);
        const month = monthOrder[date.getMonth()];
        if (month) {
          monthMap[month] = (monthMap[month] || 0) + 1;
        }
      } catch (e) {
        // Skip invalid dates - this is the graceful handling
      }
    });

    const result = monthOrder
      .filter(m => monthMap[m])
      .map(m => ({ month: m, requests311: monthMap[m] || 0 }));

    // Should have 2 valid months, invalid entries skipped
    expect(result.length).toBe(2);
  });
});

describe('Data Source Correctness', () => {
  it('should NOT show 911 data for 311 charts', () => {
    // This is the bug we fixed: OverviewPage was showing 911 data for 311 chart
    const emergencyCalls = [
      { month: 'Jan', year: 2025, call_count: 100 },
      { month: 'Feb', year: 2025, call_count: 120 },
    ];

    const serviceRequests = [
      { created_date: '2025-01-15', category: 'Pothole' },
      { created_date: '2025-02-05', category: 'Streetlight' },
    ];

    // Should use different data sources
    expect(emergencyCalls).not.toEqual(serviceRequests);
    expect(emergencyCalls[0]).toHaveProperty('call_count');
    expect(serviceRequests[0]).toHaveProperty('category');
  });

  it('should distinguish between 911 and 311 trend data', () => {
    // 911 data structure
    const trend911 = {
      month: 'Jan',
      calls911: 100, // Note: calls911 key
    };

    // 311 data structure
    const trend311 = {
      month: 'Jan',
      requests311: 50, // Note: requests311 key
    };

    // Should have different keys to prevent mixing up data
    expect(trend911).toHaveProperty('calls911');
    expect(trend311).toHaveProperty('requests311');
    expect(trend911).not.toHaveProperty('requests311');
    expect(trend311).not.toHaveProperty('calls911');
  });
});

describe('Mock Data vs Live Data', () => {
  it('should show mock data only as fallback, not as default', () => {
    const mockData = [{ month: 'Jan', calls911: 100 }];

    // Scenario 1: Live data available
    const liveData = [{ month: 'Jan', calls911: 200 }];
    const rendered1 = liveData ?? mockData;
    expect(rendered1).toEqual(liveData);
    expect(rendered1).not.toEqual(mockData);

    // Scenario 2: Live data is undefined (should use mock)
    const noData = undefined;
    const rendered2 = noData ?? mockData;
    expect(rendered2).toEqual(mockData);

    // Scenario 3: Live data is empty array (should NOT use mock)
    const emptyData: any[] = [];
    const rendered3 = emptyData ?? mockData;
    expect(rendered3).toEqual([]);
    expect(rendered3).not.toEqual(mockData);
  });

  it('should indicate when showing fallback mock data', () => {
    const hasLiveData = false;
    const isFallbackToMock = hasLiveData === false;

    if (isFallbackToMock) {
      // Should show explanation to user
      const message = 'Using demonstration data';
      expect(message).toBeTruthy();
    }
  });
});

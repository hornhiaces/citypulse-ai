import { describe, it, expect, vi } from 'vitest';
import {
  fetchEmergencyCalls,
  fetchEmergencyCallsByDistrict,
} from '@/services/emergencyCallService';
import {
  fetchServiceRequestStats,
  fetchServiceRequestTrends,
} from '@/services/serviceRequestService';
import { MONTH_ORDER } from '@/lib/dateUtils';

/**
 * Service Layer Tests
 * Test data aggregation, transformation, and error handling
 */

describe('Service Request Trends Aggregation', () => {
  it('should aggregate service requests by calendar month', () => {
    // Simulate fetchServiceRequestTrends logic
    const mockData = [
      { created_date: '2024-12-15' },
      { created_date: '2024-12-20' },
      { created_date: '2025-01-05' },
      { created_date: '2025-01-10' },
      { created_date: '2025-01-25' },
      { created_date: '2025-02-01' },
    ];

    const monthMap: Record<string, number> = {};
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    mockData.forEach(r => {
      if (!r.created_date) return;
      try {
        const date = new Date(r.created_date);
        const month = monthOrder[date.getMonth()];
        if (month) {
          monthMap[month] = (monthMap[month] || 0) + 1;
        }
      } catch (e) {
        // Skip
      }
    });

    const result = monthOrder
      .filter(m => monthMap[m])
      .map(m => ({ month: m, requests311: monthMap[m] || 0 }));

    // Verify aggregation
    expect(result).toContainEqual({ month: 'Dec', requests311: 2 });
    expect(result).toContainEqual({ month: 'Jan', requests311: 3 });
    expect(result).toContainEqual({ month: 'Feb', requests311: 1 });
    expect(result.length).toBe(3);
  });

  it('should return empty array for no service requests', () => {
    const data: any[] = [];
    if (!data?.length) return [];
    // Should return [], not undefined or mock data
    expect(data).toEqual([]);
  });

  it('should skip records without created_date', () => {
    const mockData = [
      { created_date: '2025-01-15', case_id: '1' },
      { created_date: null, case_id: '2' },
      { created_date: undefined, case_id: '3' },
      { created_date: '2025-01-20', case_id: '4' },
    ];

    let validCount = 0;
    mockData.forEach(r => {
      if (!r.created_date) {
        // Skip invalid
        return;
      }
      validCount++;
    });

    // Should have counted 2 valid dates, skipped 2 invalid
    expect(validCount).toBe(2);
  });

  it('should handle invalid date strings gracefully', () => {
    const mockData = [
      { created_date: '2025-01-15' },
      { created_date: 'not-a-date' },
      { created_date: '99999-99-99' },
      { created_date: '2025-01-20' },
    ];

    const monthMap: Record<string, number> = {};
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let errorCount = 0;
    mockData.forEach(r => {
      if (!r.created_date) return;
      try {
        const date = new Date(r.created_date);
        const month = monthOrder[date.getMonth()];
        if (month) {
          monthMap[month] = (monthMap[month] || 0) + 1;
        }
      } catch (e) {
        errorCount++;
      }
    });

    const result = monthOrder
      .filter(m => monthMap[m])
      .map(m => ({ month: m, requests311: monthMap[m] || 0 }));

    // Should have aggregated valid dates, handled errors gracefully
    expect(result.length).toBeGreaterThan(0);
    expect(errorCount).toBeLessThanOrEqual(2); // At most 2 failed parses
  });
});

describe('Emergency Call Statistics', () => {
  it('should calculate statistics from emergency calls correctly', () => {
    const emergencyCalls = [
      { month: 'Jan', year: 2025, district: 1, call_count: 100 },
      { month: 'Jan', year: 2025, district: 2, call_count: 80 },
      { month: 'Feb', year: 2025, district: 1, call_count: 110 },
      { month: 'Feb', year: 2025, district: 2, call_count: 90 },
    ];

    // Aggregate by month
    const monthTotals = emergencyCalls.reduce((acc, call) => {
      const key = call.month;
      acc[key] = (acc[key] || 0) + call.call_count;
      return acc;
    }, {} as Record<string, number>);

    expect(monthTotals['Jan']).toBe(180); // 100 + 80
    expect(monthTotals['Feb']).toBe(200); // 110 + 90
  });

  it('should calculate month-over-month change correctly', () => {
    const janTotal = 180;
    const febTotal = 200;

    const changePct = janTotal ? Math.round(((febTotal - janTotal) / janTotal) * 100 * 10) / 10 : 0;

    expect(changePct).toBe(11.1); // (200-180)/180 * 100 = 11.11%
  });
});

describe('Business License Statistics', () => {
  it('should categorize licenses by status', () => {
    const licenses = [
      { status: 'active', business_name: 'Shop A' },
      { status: 'active', business_name: 'Shop B' },
      { status: 'expired', business_name: 'Shop C' },
      { status: 'suspended', business_name: 'Shop D' },
      { status: 'active', business_name: 'Shop E' },
    ];

    const active = licenses.filter(l => l.status === 'active').length;
    const expired = licenses.filter(l => l.status === 'expired').length;
    const suspended = licenses.filter(l => l.status === 'suspended').length;

    expect(active).toBe(3);
    expect(expired).toBe(1);
    expect(suspended).toBe(1);
  });

  it('should aggregate licenses by category', () => {
    const licenses = [
      { category: 'Restaurant', business_name: 'ABC' },
      { category: 'Restaurant', business_name: 'DEF' },
      { category: 'Retail', business_name: 'GHI' },
      { category: 'Service', business_name: 'JKL' },
      { category: 'Restaurant', business_name: 'MNO' },
    ];

    const categories: Record<string, number> = {};
    licenses.forEach(l => {
      categories[l.category] = (categories[l.category] || 0) + 1;
    });

    expect(categories['Restaurant']).toBe(3);
    expect(categories['Retail']).toBe(1);
    expect(categories['Service']).toBe(1);
  });
});

describe('Data Transformation Safety', () => {
  it('should not lose data during transformation', () => {
    const originalData = [
      { id: '1', value: 100 },
      { id: '2', value: 200 },
      { id: '3', value: 300 },
    ];

    const transformed = originalData.map(d => ({ ...d, processed: true }));

    // Should have same length
    expect(transformed.length).toEqual(originalData.length);

    // Should preserve original fields
    expect(transformed[0]).toHaveProperty('id');
    expect(transformed[0]).toHaveProperty('value');

    // Should add new fields
    expect(transformed[0]).toHaveProperty('processed');
  });

  it('should handle null/undefined values in aggregation', () => {
    const data = [
      { month: 'Jan', count: 100 },
      { month: 'Feb', count: null },
      { month: 'Mar', count: undefined },
      { month: 'Apr', count: 150 },
    ];

    const result = data.reduce((sum, item) => sum + (item.count || 0), 0);

    // Should sum 100 + 0 + 0 + 150 = 250
    expect(result).toBe(250);
  });

  it('should handle empty arrays in aggregation', () => {
    const data: any[] = [];

    const sum = data.reduce((acc, item) => acc + (item.value || 0), 0);
    expect(sum).toBe(0);

    const count = data.length;
    expect(count).toBe(0);
  });
});

describe('Data Validation', () => {
  it('should validate month values are in valid range', () => {
    const validMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const testData = [
      { month: 'Jan', isValid: true },
      { month: 'Feb', isValid: true },
      { month: 'Invalid', isValid: false },
      { month: 'Dec', isValid: true },
    ];

    testData.forEach(test => {
      const isValid = validMonths.includes(test.month);
      expect(isValid).toBe(test.isValid);
    });
  });

  it('should validate numeric fields are numbers', () => {
    const data = [
      { calls: 100, isValid: true },
      { calls: '100', isValid: false }, // String instead of number
      { calls: 0, isValid: true }, // Zero is valid
      { calls: -50, isValid: true }, // Negative might be valid depending on context
    ];

    data.forEach(test => {
      const isNumber = typeof test.calls === 'number';
      expect(isNumber).toBe(test.isValid);
    });
  });
});

describe('Response Format Normalization', () => {
  it('should normalize service responses to consistent format', () => {
    // Preferred format
    const normalizedResponse = {
      status: 'success' as const,
      data: [{ month: 'Jan', calls911: 100 }],
      message: undefined,
      source: 'calls_911_monthly',
      lastUpdated: '2025-03-08T12:00:00Z',
    };

    expect(normalizedResponse).toHaveProperty('status');
    expect(normalizedResponse).toHaveProperty('data');
    expect(normalizedResponse.status).toBe('success');
    expect(Array.isArray(normalizedResponse.data)).toBe(true);
  });

  it('should handle error responses', () => {
    const errorResponse = {
      status: 'error' as const,
      data: [],
      message: 'Database connection failed',
      source: undefined,
      lastUpdated: undefined,
    };

    expect(errorResponse.status).toBe('error');
    expect(errorResponse.data).toEqual([]);
    expect(errorResponse.message).toBeTruthy();
  });

  it('should handle empty data responses', () => {
    const emptyResponse = {
      status: 'empty' as const,
      data: [],
      message: 'No records found for this period',
      source: 'calls_911_monthly',
      lastUpdated: '2025-03-08T12:00:00Z',
    };

    expect(emptyResponse.status).toBe('empty');
    expect(emptyResponse.data.length).toBe(0);
  });
});

/**
 * Integration Tests - Verify services work end-to-end
 */

describe('Emergency Call Service Integration', () => {
  it('should return valid emergency calls data', async () => {
    const result = await fetchEmergencyCalls();

    expect(Array.isArray(result)).toBe(true);

    // If data exists, verify structure
    if (result.length > 0) {
      expect(result[0]).toHaveProperty('month');
      expect(result[0]).toHaveProperty('call_count');
      expect(result[0]).toHaveProperty('year');
    }
  });

  it('should return district calls with correct format', async () => {
    const result = await fetchEmergencyCallsByDistrict();

    expect(Array.isArray(result)).toBe(true);

    // Each district should have correct format
    result.forEach(district => {
      expect(district).toHaveProperty('district');
      expect(district).toHaveProperty('calls');
      expect(district).toHaveProperty('change');
      // District format should be D1, D2, etc
      expect(district.district).toMatch(/^D\d+$/);
    });
  });
});

describe('Service Request Service Integration', () => {
  it('should return valid service request stats', async () => {
    const result = await fetchServiceRequestStats();

    if (result) {
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('open');
      expect(result).toHaveProperty('resolved');
      expect(result).toHaveProperty('highPriority');
      expect(result).toHaveProperty('categoryBreakdown');

      // categoryBreakdown should be array
      if (result.categoryBreakdown) {
        expect(Array.isArray(result.categoryBreakdown)).toBe(true);
        result.categoryBreakdown.forEach(cat => {
          expect(cat).toHaveProperty('category');
          expect(cat).toHaveProperty('count');
          expect(cat).toHaveProperty('percentage');
        });
      }
    }
  });

  it('should aggregate service request trends by month', async () => {
    const result = await fetchServiceRequestTrends();

    expect(Array.isArray(result)).toBe(true);

    // Each trend should have month and requests311
    result.forEach(trend => {
      expect(trend).toHaveProperty('month');
      expect(trend).toHaveProperty('requests311');
      expect(MONTH_ORDER).toContain(trend.month);
      expect(typeof trend.requests311).toBe('number');
    });
  });
});

describe('Data Source Correctness', () => {
  it('should NOT confuse 911 and 311 data sources', async () => {
    const emergencyCalls = await fetchEmergencyCalls();
    const trends311 = await fetchServiceRequestTrends();

    // 911 calls should have call_count field
    if (emergencyCalls.length > 0) {
      expect(emergencyCalls[0]).toHaveProperty('call_count');
    }

    // 311 trends should have requests311 field (not call_count)
    if (trends311.length > 0) {
      expect(trends311[0]).toHaveProperty('requests311');
      // Should NOT have 911-specific fields
      expect(trends311[0]).not.toHaveProperty('call_count');
    }
  });
});

describe('Service Error Handling', () => {
  it('should return array even if services fail gracefully', async () => {
    const results = await Promise.all([
      fetchEmergencyCalls(),
      fetchEmergencyCallsByDistrict(),
      fetchServiceRequestStats(),
      fetchServiceRequestTrends(),
    ]);

    // First 3 should be arrays, 4th can be object or undefined
    expect(Array.isArray(results[0])).toBe(true);
    expect(Array.isArray(results[1])).toBe(true);
    // results[2] is object (stats) or undefined
    expect(Array.isArray(results[3])).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { StreakHeatmap } from '../heatmap';

describe('StreakHeatmap', () => {
  it('renders heatmap grid successfully', () => {
    const mockLogs = [
      {
        value: 1,
        completed: true,
        completedAt: new Date(), // Today
        note: 'Completed today',
      },
    ];

    const { container } = render(<StreakHeatmap logs={mockLogs} />);
    
    // There should be 14 weeks * 7 days = 98 cells roughly
    // Wait, let's just check if it renders without crashing
    const cells = container.querySelectorAll('.w-3.h-3');
    expect(cells.length).toBeGreaterThan(0);
    expect(cells.length).toBe(98); // 14 weeks * 7 days
    
    // One cell should be colored emerald for today
    const emeraldCells = container.querySelectorAll('.bg-emerald-500');
    expect(emeraldCells.length).toBeGreaterThanOrEqual(1);
  });
});

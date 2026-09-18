import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TrajectoryList } from '../trajectory-list';

describe('TrajectoryList', () => {
  it('renders ATIF steps with visible headers and content', () => {
    render(
      <TrajectoryList
        trajectory={[
          {
            step_id: 1,
            timestamp: '2026-09-14T02:40:44.835462',
            source: 'system',
            message: 'System prompt'
          },
          {
            step_id: 2,
            timestamp: '2026-09-14T02:40:44.835462',
            source: 'agent',
            message: '',
            tool_calls: [{ function_name: 'terminal' }]
          }
        ] as any}
      />
    );

    expect(screen.getByText('System step')).toBeInTheDocument();
    expect(screen.getByText('Agent step')).toBeInTheDocument();
    expect(screen.queryByText('System prompt')).not.toBeInTheDocument();
    expect(screen.getByText('Content collapsed. Click the arrow icon in the top right to expand.')).toBeInTheDocument();
    expect(screen.getByText(/function_name/)).toBeInTheDocument();
  });
});

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
            message: 'System line 1\nSystem line 2\nSystem line 3\nSystem line 4\nSystem line 5\nSystem line 6'
          },
          {
            step_id: 2,
            timestamp: '2026-09-14T02:40:44.835462',
            source: 'agent',
            message: '',
            tool_calls: [{ function_name: 'terminal', arguments: { command: 'command 1\ncommand 2\ncommand 3\ncommand 4\ncommand 5\ncommand 6\ncommand 7\ncommand 8\ncommand 9\ncommand 10\ncommand 11' } }],
            observation: { results: [{ content: 'file 1\nfile 2\nfile 3\nfile 4\nfile 5\nfile 6\nfile 7\nfile 8\nfile 9\nfile 10\nfile 11' }] }
          },
          {
            step_id: 3,
            timestamp: '2026-09-14T02:40:44.835462',
            source: 'agent',
            message: '',
            tool_calls: [{ function_name: 'think', arguments: { thought: 'I should inspect the next file.' } }],
            observation: { results: [{ content: 'Your thought has been logged.' }] }
          }
        ] as any}
      />
    );

    expect(screen.getByText('System step #1')).toBeInTheDocument();
    expect(screen.getByText('Agent step #2')).toBeInTheDocument();
    expect(document.body.textContent).toContain('System line 1');
    expect(document.body.textContent).not.toContain('System line 6');
    expect(screen.getAllByRole('button', { name: 'Show more' })).toHaveLength(3);
    expect(document.body.textContent).toContain('terminal');
    expect(document.body.textContent).toContain('file 1');
    expect(screen.getByText('think')).toBeInTheDocument();
    expect(screen.getByText('I should inspect the next file.')).toBeInTheDocument();
  });
});

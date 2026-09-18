
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { UploadTrajectory } from '../UploadTrajectory';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('UploadTrajectory', () => {
  const mockOnUpload = vi.fn();

  beforeEach(() => {
    mockOnUpload.mockClear();
  });

  it('renders upload area with instructions', () => {
    render(<UploadTrajectory onUpload={mockOnUpload} />);

    expect(screen.getByText(/drag and drop a trajectory file here/i)).toBeInTheDocument();
    expect(screen.getByText(/only .json files are supported/i)).toBeInTheDocument();
  });

  it('shows drag active state', () => {
    render(<UploadTrajectory onUpload={mockOnUpload} />);

    const dropzone = screen.getByText(/drag and drop a trajectory file here/i).parentElement!.parentElement!;

    act(() => {
      fireEvent.dragEnter(dropzone);
    });

    expect(screen.getByText(/drag and drop a trajectory file here/i)).toBeInTheDocument();
  });

  it('handles old format correctly', async () => {
    render(<UploadTrajectory onUpload={mockOnUpload} />);

    const file = new File([
      JSON.stringify([
        {
          action: 'execute_bash',
          args: { command: 'ls' }
        }
      ])
    ], 'trajectory.json', { type: 'application/json' });

    const dropzone = screen.getByText(/drag and drop a trajectory file here/i).parentElement!.parentElement!;
    const dropEvent = createDropEvent([file]);

    await act(async () => {
      fireEvent.drop(dropzone, dropEvent);
    });

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith({
        content: {
          fileType: 'trajectory',
          trajectoryData: [
            {
              action: 'execute_bash',
              args: { command: 'ls' }
            }
          ]
        }
      });
    });
  });

  it('handles new format correctly', async () => {
    render(<UploadTrajectory onUpload={mockOnUpload} />);

    const newFormatData = {
      entries: [
        {
          id: 1,
          timestamp: '2025-03-07T17:45:00.000Z',
          type: 'message',
          content: 'Hello, I need help with my code.',
          actorType: 'User'
        },
        {
          id: 2,
          timestamp: '2025-03-07T17:45:10.000Z',
          type: 'thought',
          content: 'Let me analyze the code and identify potential issues.',
          actorType: 'Assistant'
        }
      ]
    };

    const file = new File(
      [JSON.stringify(newFormatData)],
      'trajectory.json',
      { type: 'application/json' }
    );

    const dropzone = screen.getByText(/drag and drop a trajectory file here/i).parentElement!.parentElement!;
    const dropEvent = createDropEvent([file]);

    await act(async () => {
      fireEvent.drop(dropzone, dropEvent);
    });

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith({
        content: {
          fileType: 'trajectory',
          trajectoryData: newFormatData
        }
      });
    });
  });

  it('handles ATIF trajectories correctly', async () => {
    render(<UploadTrajectory onUpload={mockOnUpload} />);

    const steps = [
      {
        step_id: 1,
        timestamp: '2026-09-14T02:40:44.835462',
        source: 'system',
        message: 'System prompt'
      },
      {
        step_id: 2,
        timestamp: '2026-09-14T02:40:44.835462',
        source: 'user',
        message: 'User request'
      }
    ];
    const file = new File(
      [JSON.stringify({ schema_version: 'ATIF-v1.5', steps })],
      'trajectory.json',
      { type: 'application/json' }
    );

    const dropzone = screen.getByText(/drag and drop a trajectory file here/i).parentElement!.parentElement!;
    await act(async () => {
      fireEvent.drop(dropzone, createDropEvent([file]));
    });

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith({
        content: {
          fileType: 'trajectory',
          trajectoryData: steps
        }
      });
    });
  });

  it('handles invalid JSON file', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<UploadTrajectory onUpload={mockOnUpload} />);

    const file = new File(['invalid json'], 'trajectory.json', { type: 'application/json' });
    const dropzone = screen.getByText(/drag and drop a trajectory file here/i).parentElement!.parentElement!;
    const dropEvent = createDropEvent([file]);

    await act(async () => {
      fireEvent.drop(dropzone, dropEvent);
    });

    await waitFor(() => {
      expect(mockOnUpload).not.toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith('Failed to parse the trajectory file. Please make sure it is a valid JSON file.');
    });

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });
});

// Helper function to create a drop event with files
function createDropEvent(files: File[]) {
  return {
    dataTransfer: {
      files,
      items: files.map(file => ({
        kind: 'file',
        type: file.type,
        getAsFile: () => file
      })),
      types: ['Files']
    }
  };
}

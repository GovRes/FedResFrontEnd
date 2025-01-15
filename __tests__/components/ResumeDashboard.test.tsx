import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ResumeDashboard from '@/app/components/profile/ResumeDashboard';
import { list } from 'aws-amplify/storage';

// Mock aws-amplify/storage
jest.mock('aws-amplify/storage', () => ({
  list: jest.fn()
}));

const mockResumes = [
  {
    path: 'resumes/123/resume1.pdf',
    lastModified: new Date('2024-01-01'),
    size: 1024,
    eTag: 'etag1'
  },
  {
    path: 'resumes/123/resume2.pdf',
    lastModified: new Date('2024-01-02'),
    size: 2048,
    eTag: 'etag2'
  }
];

describe('ResumeDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (list as jest.Mock).mockResolvedValue({ items: mockResumes });
  });

  it('renders resume list and upload button', async () => {
    await act(async () => {
      render(<ResumeDashboard />);
    });
    
    expect(screen.getByText('Upload a new resume')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(list).toHaveBeenCalledWith({
        path: expect.any(Function),
        options: {
          bucket: 'govRezUserData'
        }
      });
    });

    // Check if both resumes are rendered
    expect(screen.getByText('resume1.pdf')).toBeInTheDocument();
    expect(screen.getByText('resume2.pdf')).toBeInTheDocument();
  });

  it('shows uploader when button is clicked', async () => {
    await act(async () => {
      render(<ResumeDashboard />);
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Upload a new resume'));
    });
    
    expect(screen.getByText('Please upload your resume. It needs to be in PDF format.')).toBeInTheDocument();
  });

  it('sorts resumes by date in descending order', async () => {
    await act(async () => {
      render(<ResumeDashboard />);
    });
    
    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      // First row is header, so we start from index 1
      expect(rows[1]).toHaveTextContent('resume2.pdf'); // newer file
      expect(rows[2]).toHaveTextContent('resume1.pdf'); // older file
    });
  });

  it('refreshes list when refresh state changes', async () => {
    await act(async () => {
      render(<ResumeDashboard />);
    });
    
    // Wait for initial load
    await waitFor(() => {
      expect(list).toHaveBeenCalledTimes(1);
    });

    // Mock new data for the refresh
    const newMockResumes = [
      {
        path: 'resumes/123/resume3.pdf',
        lastModified: new Date('2024-01-03'),
        size: 3072,
        eTag: 'etag3'
      }
    ];
    (list as jest.Mock).mockResolvedValue({ items: newMockResumes });

    // Trigger refresh using the test hook
    await act(async () => {
      fireEvent.click(screen.getByTestId('refresh-trigger'));
    });

    // Verify second call and new data
    await waitFor(() => {
      expect(list).toHaveBeenCalledTimes(2);
      expect(screen.getByText('resume3.pdf')).toBeInTheDocument();
    });
  });
}); 
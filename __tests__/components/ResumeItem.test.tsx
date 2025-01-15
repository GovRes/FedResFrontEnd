import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ResumeItem from '@/app/components/profile/resumeComponents/ResumeItem';
import { getFileUrl, deleteFile } from '@/app/utils/client-utils';

// Mock the client utilities
jest.mock('@/app/utils/client-utils', () => ({
  getFileUrl: jest.fn(async () => 'https://test-url.com/resume.pdf'),
  deleteFile: jest.fn(async () => undefined)
}));

// Mock console.error to avoid polluting test output
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

const mockResume = {
  path: 'resumes/123/test-resume.pdf',
  lastModified: new Date('2024-01-01'),
  size: 1024,
  eTag: 'test-etag'
};

const mockSetRefresh = jest.fn();

describe('ResumeItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders resume item with correct filename', () => {
    render(<ResumeItem resume={mockResume} setRefresh={mockSetRefresh} />);
    expect(screen.getByText('test-resume.pdf')).toBeInTheDocument();
  });

  it('displays formatted date', () => {
    render(<ResumeItem resume={mockResume} setRefresh={mockSetRefresh} />);
    const formattedDate = mockResume.lastModified.toLocaleDateString();
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
  });

  it('shows download link when URL is loaded', async () => {
    await act(async () => {
      render(<ResumeItem resume={mockResume} setRefresh={mockSetRefresh} />);
    });
    
    await waitFor(() => {
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://test-url.com/resume.pdf');
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  it('handles URL loading error gracefully', async () => {
    (getFileUrl as jest.Mock).mockResolvedValueOnce(null);
    
    await act(async () => {
      render(<ResumeItem resume={mockResume} setRefresh={mockSetRefresh} />);
    });
    
    // Wait a bit to ensure async operations complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Should not show download link when URL is null
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('calls delete function when trash icon is clicked', async () => {
    await act(async () => {
      render(<ResumeItem resume={mockResume} setRefresh={mockSetRefresh} />);
    });
    
    // Find and click the span containing the trash icon
    const cells = screen.getAllByRole('cell');
    const lastCell = cells[cells.length - 1];
    const deleteSpan = lastCell.querySelector('span');
    expect(deleteSpan).not.toBeNull();
    
    await act(async () => {
      fireEvent.click(deleteSpan!);
    });
    
    await waitFor(() => {
      expect(deleteFile).toHaveBeenCalledWith({ path: mockResume.path });
      expect(mockSetRefresh).toHaveBeenCalledWith(true);
    });
  });
}); 
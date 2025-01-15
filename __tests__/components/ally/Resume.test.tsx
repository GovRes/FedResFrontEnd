import { render, screen, fireEvent } from '@testing-library/react';
import Resume from '@/app/components/ally/Resume';
import { AllyContext } from '@/app/providers';

// Mock the context
const mockSetResume = jest.fn();
const mockSetStep = jest.fn();

const mockContextValue = {
  setResume: mockSetResume,
  setStep: mockSetStep,
  loading: false,
  loadingText: '',
  recommendation: '',
  reviewedMetQualifications: false,
  reviewedUnmetQualifications: false,
  setLoading: jest.fn(),
  setLoadingText: jest.fn(),
  setRecommendation: jest.fn(),
  setReviewedMetQualifications: jest.fn(),
  setReviewedUnmetQualifications: jest.fn(),
  setEmail: jest.fn(),
  setJobDescription: jest.fn(),
  setKeywords: jest.fn(),
  setName: jest.fn(),
  setQualifications: jest.fn(),
  setTopics: jest.fn(),
  setUrl: jest.fn()
};

const renderWithContext = (ui: React.ReactElement) => {
  return render(
    <AllyContext.Provider value={mockContextValue}>
      {ui}
    </AllyContext.Provider>
  );
};

describe('Resume', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the resume input form', () => {
    renderWithContext(<Resume />);
    
    expect(screen.getByText(/While we work on getting the ability to directly upload resumes/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('submits resume text and updates context', async () => {
    renderWithContext(<Resume />);
    
    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /submit/i });
    const testResume = 'Test resume content';

    fireEvent.change(textarea, { target: { value: testResume } });
    fireEvent.click(submitButton);

    expect(mockSetResume).toHaveBeenCalledWith(testResume);
    expect(mockSetStep).toHaveBeenCalledWith('usa_jobs');
  });

  it('shows fade animation class on containers', () => {
    renderWithContext(<Resume />);
    
    const instructionText = screen.getByText(/While we work on getting the ability/i);
    const formContainer = screen.getByRole('textbox').closest('div[class*="userChatContainer"]');

    expect(instructionText).toHaveClass('fade');
    expect(formContainer?.className).toContain('fade');
  });

  it('has animation delay on form container', () => {
    renderWithContext(<Resume />);
    
    const formContainer = screen.getByRole('textbox').closest('div[class*="userChatContainer"]');
    expect(formContainer).toHaveStyle({ animationDelay: '1s' });
  });
}); 
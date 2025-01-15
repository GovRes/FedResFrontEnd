import { render, screen, fireEvent } from '@testing-library/react';
import WrongMetToUnmet from '@/app/components/ally/WrongMetToUnmet';
import { QualificationsType, QualificationType } from '@/app/utils/responseSchemas';

const mockQualifications: QualificationsType = {
  metQualifications: [
    { id: '1', name: 'Qualification 1', description: 'Description for qualification 1' },
    { id: '2', name: 'Qualification 2', description: 'Description for qualification 2' },
  ],
  unmetQualifications: []
};

const mockSetQualifications = jest.fn();
const mockSetReviewedMetQualifications = jest.fn();

const defaultProps = {
  qualifications: mockQualifications,
  recommendation: 'Recommend',
  setQualifications: mockSetQualifications,
  setReviewedMetQualifications: mockSetReviewedMetQualifications,
};

describe('WrongMetToUnmet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders ally statements and qualifications list', () => {
    render(<WrongMetToUnmet {...defaultProps} />);
    
    expect(screen.getByText(/Our reviewer recommends that you apply for this job/)).toBeInTheDocument();
    expect(screen.getByText(/I've reviewed your resume and job description/)).toBeInTheDocument();
    expect(screen.getByText('Qualification 1')).toBeInTheDocument();
    expect(screen.getByText('Qualification 2')).toBeInTheDocument();
  });

  it('shows different recommendation text when recommendation is "Do not recommend"', () => {
    render(<WrongMetToUnmet {...defaultProps} recommendation="Do not recommend" />);
    
    expect(screen.getByText(/Our reviewer does not recommend that you apply for this job/)).toBeInTheDocument();
  });

  it('renders checkboxes for met qualifications', () => {
    render(<WrongMetToUnmet {...defaultProps} />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    expect(screen.getByLabelText('Qualification 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Qualification 2')).toBeInTheDocument();
  });

  it('handles form submission correctly when qualifications are selected', () => {
    render(<WrongMetToUnmet {...defaultProps} />);
    
    const checkbox1 = screen.getByLabelText('Qualification 1');
    fireEvent.click(checkbox1);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    expect(mockSetReviewedMetQualifications).toHaveBeenCalledWith(true);
    expect(mockSetQualifications).toHaveBeenCalledTimes(2);
    
    // First call removes from metQualifications
    expect(mockSetQualifications).toHaveBeenNthCalledWith(1, {
      ...mockQualifications,
      metQualifications: [{ id: '2', name: 'Qualification 2', description: 'Description for qualification 2' }]
    });
    
    // Second call adds to unmetQualifications
    const updatedQualifications = {
      metQualifications: [{ id: '2', name: 'Qualification 2', description: 'Description for qualification 2' }],
      unmetQualifications: [{ id: '1', name: 'Qualification 1', description: 'Description for qualification 1' }]
    };
    expect(mockSetQualifications).toHaveBeenNthCalledWith(2, {
      ...mockQualifications,
      unmetQualifications: updatedQualifications.unmetQualifications
    });
  });

  it('applies fade animation class to elements', () => {
    render(<WrongMetToUnmet {...defaultProps} />);
    
    const qualificationsList = screen.getByRole('list');
    const formContainer = screen.getByRole('form').parentElement;
    
    expect(qualificationsList).toHaveClass('fade');
    expect(formContainer).toHaveClass('fade');
  });

  it('applies animation delays to elements', () => {
    render(<WrongMetToUnmet {...defaultProps} />);
    
    const qualificationsList = screen.getByRole('list');
    const formContainer = screen.getByRole('form').parentElement;
    
    expect(qualificationsList).toHaveStyle({ animationDelay: expect.stringMatching(/\d+(\.\d+)?s/) });
    expect(formContainer).toHaveStyle({ animationDelay: expect.stringMatching(/\d+(\.\d+)?s/) });
  });
}); 
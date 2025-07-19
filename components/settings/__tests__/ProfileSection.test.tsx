;
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileSection } from '../ProfileSection';
import { UserProfile } from '@/types/settings';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockProfile: UserProfile = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  username: 'johndoe',
  bio: 'Software developer',
  avatar: '/avatar.jpg',
  location: 'San Francisco',
  website: 'https://johndoe.com',
  github: 'johndoe',
  twitter: '@johndoe',
  linkedin: 'johndoe'
};

describe('ProfileSection', () => {
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders profile information correctly', () => {
    render(<ProfileSection profile={mockProfile} onUpdate={mockOnUpdate} />);
    
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('johndoe')).toBeInTheDocument();
  });

  it('enters edit mode when edit button is clicked', () => {
    render(<ProfileSection profile={mockProfile} onUpdate={mockOnUpdate} />);
    
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);
    
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('updates profile data when form is submitted', async () => {
    mockOnUpdate.mockResolvedValue({ success: true });
    
    render(<ProfileSection profile={mockProfile} onUpdate={mockOnUpdate} />);
    
    // Enter edit mode
    fireEvent.click(screen.getByText('Edit Profile'));
    
    // Update first name
    const firstNameInput = screen.getByDisplayValue('John');
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
    
    // Save changes
    fireEvent.click(screen.getByText('Save Changes'));
    
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: 'Jane' })
      );
    });
  });

  it('validates required fields', async () => {
    render(<ProfileSection profile={mockProfile} onUpdate={mockOnUpdate} />);
    
    // Enter edit mode
    fireEvent.click(screen.getByText('Edit Profile'));
    
    // Clear required field
    const firstNameInput = screen.getByDisplayValue('John');
    fireEvent.change(firstNameInput, { target: { value: '' } });
    
    // Try to save
    fireEvent.click(screen.getByText('Save Changes'));
    
    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(<ProfileSection profile={mockProfile} onUpdate={mockOnUpdate} />);
    
    // Enter edit mode
    fireEvent.click(screen.getByText('Edit Profile'));
    
    // Enter invalid email
    const emailInput = screen.getByDisplayValue('john@example.com');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    // Try to save
    fireEvent.click(screen.getByText('Save Changes'));
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('handles avatar upload', async () => {
    render(<ProfileSection profile={mockProfile} onUpdate={mockOnUpdate} />);
    
    // Enter edit mode
    fireEvent.click(screen.getByText('Edit Profile'));
    
    // Create a mock file
    const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/upload avatar/i);
    
    // Upload file
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('avatar.jpg')).toBeInTheDocument();
    });
  });

  it('cancels edit mode without saving changes', () => {
    render(<ProfileSection profile={mockProfile} onUpdate={mockOnUpdate} />);
    
    // Enter edit mode
    fireEvent.click(screen.getByText('Edit Profile'));
    
    // Make changes
    const firstNameInput = screen.getByDisplayValue('John');
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
    
    // Cancel
    fireEvent.click(screen.getByText('Cancel'));
    
    // Should not call onUpdate
    expect(mockOnUpdate).not.toHaveBeenCalled();
    
    // Should show original value
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
  });

  it('displays validation errors from props', () => {
    const validationErrors = [
      { field: 'email', message: 'Email already exists' }
    ];
    
    render(
      <ProfileSection 
        profile={mockProfile} 
        onUpdate={mockOnUpdate}
        validationErrors={validationErrors}
      />
    );
    
    expect(screen.getByText('Email already exists')).toBeInTheDocument();
  });

  it('shows loading state when saving', async () => {
    mockOnUpdate.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));
    
    render(<ProfileSection profile={mockProfile} onUpdate={mockOnUpdate} />);
    
    // Enter edit mode and save
    fireEvent.click(screen.getByText('Edit Profile'));
    fireEvent.click(screen.getByText('Save Changes'));
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    });
  });

  it('handles drag and drop for avatar upload', async () => {
    render(<ProfileSection profile={mockProfile} onUpdate={mockOnUpdate} />);
    
    // Enter edit mode
    fireEvent.click(screen.getByText('Edit Profile'));
    
    const dropZone = screen.getByText(/drag.*drop.*avatar/i).closest('div');
    
    // Create mock drag event
    const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
    const dragEvent = {
      dataTransfer: {
        files: [file],
        types: ['Files']
      },
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    };
    
    // Simulate drag over
    fireEvent.dragOver(dropZone!, dragEvent);
    expect(dropZone).toHaveClass('border-blue-500');
    
    // Simulate drop
    fireEvent.drop(dropZone!, dragEvent);
    
    await waitFor(() => {
      expect(screen.getByText('avatar.jpg')).toBeInTheDocument();
    });
  });
});

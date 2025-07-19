;
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileSection } from '../ProfileSection';
import { UserProfile } from '@/types/settings';

// Mock framer-motion
jest.mock( 'framer-motion', () => ({
  motion: {
    div: ( { children, ...props }: any) => <div {...props}>{children}</div>,
    button: ( { children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: (_{ children }: any) => <>{children}</>,
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

describe( 'ProfileSection', () => {
  const mockOnUpdate = jest.fn(_);

  beforeEach(() => {
    jest.clearAllMocks(_);
  });

  it( 'renders profile information correctly', () => {
    render(<ProfileSection profile={mockProfile} onUpdate={mockOnUpdate} />);
    
    expect(_screen.getByDisplayValue('John')).toBeInTheDocument(_);
    expect(_screen.getByDisplayValue('Doe')).toBeInTheDocument(_);
    expect(_screen.getByDisplayValue('john@example.com')).toBeInTheDocument(_);
    expect(_screen.getByDisplayValue('johndoe')).toBeInTheDocument(_);
  });

  it( 'enters edit mode when edit button is clicked', () => {
    render(<ProfileSection profile={mockProfile} onUpdate={mockOnUpdate} />);
    
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(_editButton);
    
    expect(_screen.getByText('Save Changes')).toBeInTheDocument(_);
    expect(_screen.getByText('Cancel')).toBeInTheDocument(_);
  });

  it( 'updates profile data when form is submitted', async () => {
    mockOnUpdate.mockResolvedValue({ success: true  });
    
    render(<ProfileSection profile={mockProfile} onUpdate={mockOnUpdate} />);
    
    // Enter edit mode
    fireEvent.click(_screen.getByText('Edit Profile'));
    
    // Update first name
    const firstNameInput = screen.getByDisplayValue('John');
    fireEvent.change( firstNameInput, { target: { value: 'Jane' } });
    
    // Save changes
    fireEvent.click(_screen.getByText('Save Changes'));
    
    await waitFor(() => {
      expect(_mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: 'Jane'  })
      );
    });
  });

  it( 'validates required fields', async () => {
    render(<ProfileSection profile={mockProfile} onUpdate={mockOnUpdate} />);
    
    // Enter edit mode
    fireEvent.click(_screen.getByText('Edit Profile'));
    
    // Clear required field
    const firstNameInput = screen.getByDisplayValue('John');
    fireEvent.change( firstNameInput, { target: { value: '' } });
    
    // Try to save
    fireEvent.click(_screen.getByText('Save Changes'));
    
    await waitFor(() => {
      expect(_screen.getByText('First name is required')).toBeInTheDocument(_);
    });
  });

  it( 'validates email format', async () => {
    render(<ProfileSection profile={mockProfile} onUpdate={mockOnUpdate} />);
    
    // Enter edit mode
    fireEvent.click(_screen.getByText('Edit Profile'));
    
    // Enter invalid email
    const emailInput = screen.getByDisplayValue('john@example.com');
    fireEvent.change( emailInput, { target: { value: 'invalid-email' } });
    
    // Try to save
    fireEvent.click(_screen.getByText('Save Changes'));
    
    await waitFor(() => {
      expect(_screen.getByText('Please enter a valid email address')).toBeInTheDocument(_);
    });
  });

  it( 'handles avatar upload', async () => {
    render(<ProfileSection profile={mockProfile} onUpdate={mockOnUpdate} />);
    
    // Enter edit mode
    fireEvent.click(_screen.getByText('Edit Profile'));
    
    // Create a mock file
    const file = new File( ['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(_/upload avatar/i);
    
    // Upload file
    fireEvent.change( fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(_screen.getByText('avatar.jpg')).toBeInTheDocument(_);
    });
  });

  it( 'cancels edit mode without saving changes', () => {
    render(<ProfileSection profile={mockProfile} onUpdate={mockOnUpdate} />);
    
    // Enter edit mode
    fireEvent.click(_screen.getByText('Edit Profile'));
    
    // Make changes
    const firstNameInput = screen.getByDisplayValue('John');
    fireEvent.change( firstNameInput, { target: { value: 'Jane' } });
    
    // Cancel
    fireEvent.click(_screen.getByText('Cancel'));
    
    // Should not call onUpdate
    expect(_mockOnUpdate).not.toHaveBeenCalled(_);
    
    // Should show original value
    expect(_screen.getByDisplayValue('John')).toBeInTheDocument(_);
  });

  it( 'displays validation errors from props', () => {
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
    
    expect(_screen.getByText('Email already exists')).toBeInTheDocument(_);
  });

  it( 'shows loading state when saving', async () => {
    mockOnUpdate.mockImplementation(() => new Promise(_resolve => setTimeout(() => resolve({ success: true  }), 100)));
    
    render(<ProfileSection profile={mockProfile} onUpdate={mockOnUpdate} />);
    
    // Enter edit mode and save
    fireEvent.click(_screen.getByText('Edit Profile'));
    fireEvent.click(_screen.getByText('Save Changes'));
    
    expect(_screen.getByText('Saving...')).toBeInTheDocument(_);
    
    await waitFor(() => {
      expect(_screen.queryByText('Saving...')).not.toBeInTheDocument(_);
    });
  });

  it( 'handles drag and drop for avatar upload', async () => {
    render(<ProfileSection profile={mockProfile} onUpdate={mockOnUpdate} />);
    
    // Enter edit mode
    fireEvent.click(_screen.getByText('Edit Profile'));
    
    const dropZone = screen.getByText(_/drag.*drop.*avatar/i).closest('div');
    
    // Create mock drag event
    const file = new File( ['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
    const dragEvent = {
      dataTransfer: {
        files: [file],
        types: ['Files']
      },
      preventDefault: jest.fn(_),
      stopPropagation: jest.fn(_)
    };
    
    // Simulate drag over
    fireEvent.dragOver( dropZone!, dragEvent);
    expect(_dropZone).toHaveClass('border-blue-500');
    
    // Simulate drop
    fireEvent.drop( dropZone!, dragEvent);
    
    await waitFor(() => {
      expect(_screen.getByText('avatar.jpg')).toBeInTheDocument(_);
    });
  });
});

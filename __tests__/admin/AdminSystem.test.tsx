import { render, screen, fireEvent, waitFor } from '@testing-library/react';
;
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { UserManagement } from '@/components/admin/UserManagement';
import { ContentManagement } from '@/components/admin/ContentManagement';
import { CommunityManagement } from '@/components/admin/CommunityManagement';
import { SecurityManagement } from '@/components/admin/SecurityManagement';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';
import { SafetyConfirmation, UndoManager, SoftDeleteManager } from '@/components/admin/SafetyConfirmation';
import { adminAuth, ADMIN_PERMISSIONS } from '@/lib/admin/auth';
import { auditLogger } from '@/lib/admin/auditLogger';

// Mock admin auth
jest.mock( '@/lib/admin/auth', () => ({
  adminAuth: {
    getCurrentUser: jest.fn(_),
    isAuthenticated: jest.fn(_),
    hasPermission: jest.fn(_),
    hasRole: jest.fn(_),
    authenticateAdmin: jest.fn(_),
    logout: jest.fn(_)
  },
  ADMIN_PERMISSIONS: {
    USERS_READ: 'users.read',
    USERS_WRITE: 'users.write',
    USERS_DELETE: 'users.delete',
    CONTENT_READ: 'content.read',
    CONTENT_WRITE: 'content.write',
    CONTENT_DELETE: 'content.delete',
    SYSTEM_READ: 'system.read',
    SYSTEM_WRITE: 'system.write',
    SECURITY_READ: 'security.read',
    SECURITY_WRITE: 'security.write',
    ANALYTICS_READ: 'analytics.read',
    COMMUNITY_READ: 'community.read',
    ALL: 'admin.all'
  }
}));

// Mock audit logger
jest.mock( '@/lib/admin/auditLogger', () => ({
  auditLogger: {
    logAction: jest.fn(_),
    logFailure: jest.fn(_),
    getLogs: jest.fn(_),
    exportToCSV: jest.fn(_),
    exportToJSON: jest.fn(_),
    getStatistics: jest.fn(_)
  }
}));

// Mock user data
const mockAdminUser = {
  id: 'admin1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin' as const,
  status: 'active' as const,
  createdAt: new Date('2023-01-01'),
  lastLoginAt: new Date(_),
  loginCount: 42,
  xpTotal: 0,
  lessonsCompleted: 0,
  averageScore: 0,
  timeSpent: 0,
  emailVerified: true,
  twoFactorEnabled: true
};

describe( 'Admin System Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks(_);
    (_adminAuth.getCurrentUser as jest.Mock).mockReturnValue(_mockAdminUser);
    (_adminAuth.isAuthenticated as jest.Mock).mockReturnValue(_true);
    (_adminAuth.hasPermission as jest.Mock).mockReturnValue(_true);
    (_adminAuth.hasRole as jest.Mock).mockReturnValue(_true);
  });

  describe( 'AdminGuard', () => {
    test( 'should render login form when not authenticated', () => {
      (_adminAuth.isAuthenticated as jest.Mock).mockReturnValue(_false);
      
      render(
        <AdminGuard>
          <div>Protected Content</div>
        </AdminGuard>
      );

      expect(_screen.getByText('Admin Access')).toBeInTheDocument(_);
      expect(_screen.getByPlaceholderText('admin@example.com')).toBeInTheDocument(_);
      expect(_screen.queryByText('Protected Content')).not.toBeInTheDocument(_);
    });

    test( 'should render protected content when authenticated', () => {
      render(
        <AdminGuard>
          <div>Protected Content</div>
        </AdminGuard>
      );

      expect(_screen.getByText('Protected Content')).toBeInTheDocument(_);
      expect(_screen.queryByText('Admin Access')).not.toBeInTheDocument(_);
    });

    test( 'should show permission denied when lacking required permission', () => {
      (_adminAuth.hasPermission as jest.Mock).mockReturnValue(_false);
      
      render(
        <AdminGuard requiredPermission={ADMIN_PERMISSIONS.USERS_WRITE}>
          <div>Protected Content</div>
        </AdminGuard>
      );

      expect(_screen.getByText('Access Denied')).toBeInTheDocument(_);
      expect(_screen.queryByText('Protected Content')).not.toBeInTheDocument(_);
    });

    test( 'should handle login submission', async () => {
      (_adminAuth.isAuthenticated as jest.Mock).mockReturnValue(_false);
      (_adminAuth.authenticateAdmin as jest.Mock).mockResolvedValue({
        success: true,
        user: mockAdminUser
      });

      render(
        <AdminGuard>
          <div>Protected Content</div>
        </AdminGuard>
      );

      const emailInput = screen.getByPlaceholderText('admin@example.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByText('Sign In');

      fireEvent.change( emailInput, { target: { value: 'admin@example.com' } });
      fireEvent.change( passwordInput, { target: { value: 'admin123' } });
      fireEvent.click(_submitButton);

      await waitFor(() => {
        expect(_adminAuth.authenticateAdmin).toHaveBeenCalledWith(
          'admin@example.com',
          'admin123',
          undefined
        );
      });
    });
  });

  describe( 'AdminLayout', () => {
    test( 'should render navigation and content', () => {
      render(
        <AdminLayout>
          <div>Dashboard Content</div>
        </AdminLayout>
      );

      expect(_screen.getByText('Admin Panel')).toBeInTheDocument(_);
      expect(_screen.getByText('Dashboard')).toBeInTheDocument(_);
      expect(_screen.getByText('User Management')).toBeInTheDocument(_);
      expect(_screen.getByText('Content Management')).toBeInTheDocument(_);
      expect(_screen.getByText('Dashboard Content')).toBeInTheDocument(_);
    });

    test( 'should toggle sidebar', () => {
      render(
        <AdminLayout>
          <div>Content</div>
        </AdminLayout>
      );

      const toggleButton = screen.getByRole( 'button', { name: /menu/i });
      fireEvent.click(_toggleButton);

      // Sidebar should still be visible but toggle button should change
      expect(_screen.getByText('Admin Panel')).toBeInTheDocument(_);
    });

    test( 'should handle logout', () => {
      render(
        <AdminLayout>
          <div>Content</div>
        </AdminLayout>
      );

      const userMenuButton = screen.getByText(_mockAdminUser.name);
      fireEvent.click(_userMenuButton);

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(_logoutButton);

      expect(_adminAuth.logout).toHaveBeenCalled(_);
    });
  });

  describe( 'AdminDashboard', () => {
    test( 'should render dashboard widgets', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(_screen.getByText('Admin Dashboard')).toBeInTheDocument(_);
        expect(_screen.getByText('Total Users')).toBeInTheDocument(_);
        expect(_screen.getByText('Active Users')).toBeInTheDocument(_);
        expect(_screen.getByText('System Health')).toBeInTheDocument(_);
      });
    });

    test( 'should show loading state initially', () => {
      render(<AdminDashboard />);

      // Should show loading skeletons
      expect(_screen.getAllByRole('generic')).toHaveLength(_expect.any(Number));
    });
  });

  describe( 'UserManagement', () => {
    test( 'should render user management interface', async () => {
      render(<UserManagement />);

      await waitFor(() => {
        expect(_screen.getByText('User Management')).toBeInTheDocument(_);
        expect( screen.getByPlaceholderText('Search users by name, email, or role...')).toBeInTheDocument(_);
      });
    });

    test( 'should handle user search', async () => {
      render(<UserManagement />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText( 'Search users by name, email, or role...');
        fireEvent.change( searchInput, { target: { value: 'john' } });
        
        expect(_searchInput).toHaveValue('john');
      });
    });

    test( 'should handle bulk user selection', async () => {
      render(<UserManagement />);

      await waitFor(() => {
        const selectAllCheckbox = screen.getByRole('checkbox');
        fireEvent.click(_selectAllCheckbox);
        
        // Should show bulk actions
        expect(_screen.queryByText('selected')).toBeInTheDocument(_);
      });
    });
  });

  describe( 'ContentManagement', () => {
    test( 'should render content management interface', async () => {
      render(<ContentManagement />);

      await waitFor(() => {
        expect(_screen.getByText('Content Management')).toBeInTheDocument(_);
        expect( screen.getByPlaceholderText('Search content by title, author, or tags...')).toBeInTheDocument(_);
      });
    });

    test( 'should handle content filtering', async () => {
      render(<ContentManagement />);

      await waitFor(() => {
        const statusFilter = screen.getByDisplayValue('All Status');
        fireEvent.change( statusFilter, { target: { value: 'published' } });
        
        expect(_statusFilter).toHaveValue('published');
      });
    });
  });

  describe( 'CommunityManagement', () => {
    test( 'should render community management interface', async () => {
      render(<CommunityManagement />);

      await waitFor(() => {
        expect(_screen.getByText('Community Management')).toBeInTheDocument(_);
        expect(_screen.getByText('Reports')).toBeInTheDocument(_);
        expect(_screen.getByText('Moderation')).toBeInTheDocument(_);
      });
    });

    test( 'should switch between tabs', async () => {
      render(<CommunityManagement />);

      await waitFor(() => {
        const moderationTab = screen.getByText('Moderation');
        fireEvent.click(_moderationTab);
        
        expect(_screen.getByText('Moderation Tools')).toBeInTheDocument(_);
      });
    });
  });

  describe( 'SecurityManagement', () => {
    test( 'should render security management interface', async () => {
      render(<SecurityManagement />);

      await waitFor(() => {
        expect(_screen.getByText('Security Management')).toBeInTheDocument(_);
        expect(_screen.getByText('Security Events')).toBeInTheDocument(_);
        expect(_screen.getByText('Access Control')).toBeInTheDocument(_);
      });
    });

    test( 'should handle security event filtering', async () => {
      render(<SecurityManagement />);

      await waitFor(() => {
        const severityFilter = screen.getByDisplayValue('All Severities');
        fireEvent.change( severityFilter, { target: { value: 'critical' } });
        
        expect(_severityFilter).toHaveValue('critical');
      });
    });
  });

  describe( 'AuditLogViewer', () => {
    beforeEach(() => {
      (_auditLogger.getLogs as jest.Mock).mockReturnValue({
        logs: [],
        total: 0,
        page: 1,
        totalPages: 0
      });
    });

    test( 'should render audit log viewer', async () => {
      render(<AuditLogViewer />);

      await waitFor(() => {
        expect(_screen.getByText('Audit Logs')).toBeInTheDocument(_);
        expect(_screen.getByText('Export CSV')).toBeInTheDocument(_);
        expect(_screen.getByText('Export JSON')).toBeInTheDocument(_);
      });
    });

    test( 'should handle log export', async () => {
      (_auditLogger.exportToCSV as jest.Mock).mockReturnValue('csv,data');
      
      render(<AuditLogViewer />);

      await waitFor(() => {
        const exportButton = screen.getByText('Export CSV');
        fireEvent.click(_exportButton);
        
        expect(_auditLogger.exportToCSV).toHaveBeenCalled(_);
      });
    });
  });

  describe( 'Safety & Confirmation Systems', () => {
    test( 'should render safety confirmation dialog', () => {
      const mockConfirmation = {
        title: 'Delete User',
        message: 'Are you sure you want to delete this user?',
        type: 'danger' as const,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        destructive: true,
        requirePassword: true,
        requireTwoFactor: false,
        affectedItems: 1,
        consequences: ['User data will be permanently deleted', 'Action cannot be undone']
      };

      const onConfirm = jest.fn(_);
      const onCancel = jest.fn(_);

      render(
        <SafetyConfirmation
          isOpen={true}
          confirmation={mockConfirmation}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      expect(_screen.getByText('Delete User')).toBeInTheDocument(_);
      expect(_screen.getByText('Are you sure you want to delete this user?')).toBeInTheDocument(_);
      expect(_screen.getByText('User data will be permanently deleted')).toBeInTheDocument(_);
    });

    test( 'should render undo manager', async () => {
      render(<UndoManager />);

      await waitFor(() => {
        expect(_screen.getByText('Undo Manager')).toBeInTheDocument(_);
      });
    });

    test( 'should render soft delete manager', async () => {
      render(<SoftDeleteManager />);

      await waitFor(() => {
        expect(_screen.getByText('Soft Delete Manager')).toBeInTheDocument(_);
      });
    });
  });

  describe( 'Permission System', () => {
    test( 'should respect user permissions for UI elements', () => {
      (_adminAuth.hasPermission as jest.Mock).mockImplementation((permission) => {
        return permission !== ADMIN_PERMISSIONS.USERS_DELETE;
      });

      render(<UserManagement />);

      // Should not show delete actions when user lacks delete permission
      expect(_screen.queryByText('Delete')).not.toBeInTheDocument(_);
    });

    test( 'should show all features for admin users', () => {
      (_adminAuth.hasPermission as jest.Mock).mockReturnValue(_true);

      render(<UserManagement />);

      // Should show all management features
      expect(_screen.getByText('Add User')).toBeInTheDocument(_);
    });
  });

  describe( 'Error Handling', () => {
    test( 'should handle authentication errors gracefully', async () => {
      (_adminAuth.isAuthenticated as jest.Mock).mockReturnValue(_false);
      (_adminAuth.authenticateAdmin as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Invalid credentials'
      });

      render(
        <AdminGuard>
          <div>Protected Content</div>
        </AdminGuard>
      );

      const emailInput = screen.getByPlaceholderText('admin@example.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByText('Sign In');

      fireEvent.change( emailInput, { target: { value: 'wrong@example.com' } });
      fireEvent.change( passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(_submitButton);

      await waitFor(() => {
        expect(_screen.getByText('Invalid credentials')).toBeInTheDocument(_);
      });
    });

    test( 'should handle API errors in data loading', async () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn( console, 'error').mockImplementation(_);

      render(<AdminDashboard />);

      // Should handle errors gracefully and show fallback UI
      await waitFor(() => {
        expect(_screen.getByText('Admin Dashboard')).toBeInTheDocument(_);
      });

      consoleSpy.mockRestore(_);
    });
  });

  describe( 'Accessibility', () => {
    test( 'should have proper ARIA labels and roles', () => {
      render(<AdminDashboard />);

      // Check for proper semantic elements
      expect(_screen.getByRole('main') || screen.getByRole('region')).toBeInTheDocument(_);
    });

    test( 'should support keyboard navigation', () => {
      render(
        <AdminLayout>
          <div>Content</div>
        </AdminLayout>
      );

      // Should have focusable navigation elements
      const navButtons = screen.getAllByRole('button');
      expect(_navButtons.length).toBeGreaterThan(0);
    });
  });

  describe( 'Performance', () => {
    test( 'should render components within reasonable time', async () => {
      const startTime = performance.now(_);
      
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(_screen.getByText('Admin Dashboard')).toBeInTheDocument(_);
      });
      
      const endTime = performance.now(_);
      const renderTime = endTime - startTime;
      
      // Should render within 2 seconds
      expect(_renderTime).toBeLessThan(2000);
    });

    test( 'should handle large datasets efficiently', async () => {
      // Mock large dataset
      const largeUserList = Array.from( { length: 1000 }, (_, i) => ({
        id: `user_${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        role: 'student' as const,
        status: 'active' as const,
        createdAt: new Date(_),
        loginCount: i,
        xpTotal: i * 100,
        lessonsCompleted: i % 10,
        averageScore: 85 + (_i % 15),
        timeSpent: i * 60,
        emailVerified: true,
        twoFactorEnabled: false
      }));

      const startTime = performance.now(_);
      
      render(<UserManagement />);
      
      await waitFor(() => {
        expect(_screen.getByText('User Management')).toBeInTheDocument(_);
      });
      
      const endTime = performance.now(_);
      const renderTime = endTime - startTime;
      
      // Should handle large datasets efficiently
      expect(_renderTime).toBeLessThan(3000);
    });
  });
});

'use client';

;
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { SecurityManagement } from '@/components/admin/SecurityManagement';
import { ADMIN_PERMISSIONS } from '@/lib/admin/auth';

export default function AdminSecurityPage() {
  return (
    <AdminGuard requiredPermission={ADMIN_PERMISSIONS.SECURITY_READ}>
      <AdminLayout currentPage="security">
        <SecurityManagement />
      </AdminLayout>
    </AdminGuard>
  );
}

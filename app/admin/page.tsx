'use client';

;
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { ADMIN_PERMISSIONS } from '@/lib/admin/auth';

export default function AdminPage() {
  return (
    <AdminGuard requiredPermission={ADMIN_PERMISSIONS.SYSTEM_READ}>
      <AdminLayout currentPage="dashboard">
        <AdminDashboard />
      </AdminLayout>
    </AdminGuard>
  );
}


'use client';

;
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';
import { ADMIN_PERMISSIONS } from '@/lib/admin/auth';

export default function AdminAuditPage() {
  return (
    <AdminGuard requiredPermission={ADMIN_PERMISSIONS.SYSTEM_READ}>
      <AdminLayout currentPage="audit">
        <AuditLogViewer />
      </AdminLayout>
    </AdminGuard>
  );
}

import { lazy, Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { LoadingState } from '@/ui_library/feedback/LoadingState';

/**
 * Route table for the signed-in app.
 *
 * Every page is lazy. Before this, a single chunk held all thirteen screens
 * plus their dependencies, so opening the login form downloaded the job
 * builder, the audit log and the roles editor too.
 *
 * Login, Register, SetPassword and MFALoginChallenge are deliberately NOT
 * lazy: they are what an unauthenticated visitor sees first, and deferring
 * them would add a round trip to the very first paint.
 */
const Dashboard = lazy(() =>
  import('@/modules/dashboard/pages/Dashboard').then((m) => ({ default: m.Dashboard }))
);
const JobBuilderSelection = lazy(() =>
  import('@/modules/jobs/pages/JobBuilderSelection').then((m) => ({
    default: m.JobBuilderSelection,
  }))
);
const JobUploadBuilder = lazy(() =>
  import('@/modules/jobs/pages/JobUploadBuilder').then((m) => ({ default: m.JobUploadBuilder }))
);
const JobManualBuilder = lazy(() =>
  import('@/modules/jobs/pages/JobManualBuilder').then((m) => ({ default: m.JobManualBuilder }))
);
const JobHistory = lazy(() =>
  import('@/modules/jobs/pages/JobHistory').then((m) => ({ default: m.JobHistory }))
);
const ConnectedCompanies = lazy(() =>
  import('@/modules/xero/pages/ConnectedCompanies').then((m) => ({
    default: m.ConnectedCompanies,
  }))
);
const Settings = lazy(() =>
  import('@/modules/settings/pages/Settings').then((m) => ({ default: m.Settings }))
);
const AuditLogPage = lazy(() =>
  import('@/modules/audit/pages/AuditLog').then((m) => ({ default: m.AuditLogPage }))
);
const RolesPermissions = lazy(() =>
  import('@/modules/rbac/pages/RolesPermissions').then((m) => ({ default: m.RolesPermissions }))
);

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingState message="Loading…" />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/jobs/new" element={<JobBuilderSelection />} />
        <Route path="/jobs/new/upload" element={<JobUploadBuilder />} />
        <Route path="/jobs/new/manual" element={<JobManualBuilder />} />
        <Route path="/history" element={<JobHistory />} />
        <Route path="/companies" element={<ConnectedCompanies />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/audit" element={<AuditLogPage />} />
        <Route path="/roles" element={<RolesPermissions />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';

// Modular Page Imports
import Dashboard from './modules/dashboard/Dashboard';
import ProjectDashboard from './modules/projects/ProjectDashboard';
import TimesheetDashboard from './modules/timesheets/TimesheetDashboard';
import DeveloperTimesheet from './modules/timesheets/DeveloperTimesheet';
import ManagerTimesheet from './modules/timesheets/ManagerTimesheet';
import FinanceDashboard from './modules/finance/FinanceDashboard';
import SecurityDashboard from './modules/iam/SecurityDashboard';
import AICopilotDashboard from './modules/ai-copilot/AICopilotDashboard';
import DigitalSignatureDashboard from './modules/pki/DigitalSignatureDashboard';
import AuditLogDashboard from './modules/sys-audit/AuditLogDashboard';
import SupportDashboard from './modules/customer-support/SupportDashboard';
import ContractDashboard from './modules/sales/ContractDashboard';
import LoginPage from './modules/iam/LoginPage';

const App: React.FC = () => {
  return (
    <BrowserRouter basename="/uiux">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Dashboard Routes */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<ProjectDashboard />} />
          
          {/* Timesheet Sub-routes */}
          <Route path="timesheets">
            <Route index element={<TimesheetDashboard />} />
            <Route path="developer" element={<DeveloperTimesheet />} />
            <Route path="manager" element={<ManagerTimesheet />} />
          </Route>

          <Route path="finance" element={<FinanceDashboard />} />
          <Route path="security" element={<SecurityDashboard />} />
          <Route path="ai-copilot" element={<AICopilotDashboard />} />
          <Route path="digital-signature" element={<DigitalSignatureDashboard />} />
          <Route path="audit-logs" element={<AuditLogDashboard />} />
          <Route path="customer-support" element={<SupportDashboard />} />
          <Route path="contracts" element={<ContractDashboard />} />
          
          {/* Default fallback inside layout */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        {/* Global fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

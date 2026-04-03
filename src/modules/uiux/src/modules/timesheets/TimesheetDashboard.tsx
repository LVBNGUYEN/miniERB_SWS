import React from 'react';
import { getCookie } from '../../utils/cookie';
import { Role } from '../../../../iam/entities/role.enum';
import DeveloperTimesheet from './DeveloperTimesheet';
import ManagerTimesheet from './ManagerTimesheet';

const TimesheetDashboard: React.FC = () => {
  const userStr = getCookie('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role;

  // Route based on role
  if (role === Role.PM || role === Role.CEO) {
    return <ManagerTimesheet />;
  }

  // Default for VENDOR, DEV, and others who might have tasks
  return <DeveloperTimesheet />;
};

export default TimesheetDashboard;

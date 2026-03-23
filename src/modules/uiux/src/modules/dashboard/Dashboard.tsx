import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '../../api';
import { getCookie } from '../../utils/cookie';
import ExecutiveDashboard from './ExecutiveDashboard';
import VendorDashboard from './VendorDashboard';
import ClientDashboard from './ClientDashboard';
import { Role } from '../../../../iam/entities/role.enum';

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = getCookie('user');
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch {}
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [projRes, alertRes] = await Promise.allSettled([
          api.post('/projects/list', {}),
          api.get('/alerts'),
        ]);
        if (projRes.status === 'fulfilled') setProjects(Array.isArray(projRes.value) ? projRes.value : []);
        if (alertRes.status === 'fulfilled') setAlerts(Array.isArray(alertRes.value) ? alertRes.value : []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
      </div>
    );
  }

  const role = user?.role || Role.VENDOR;

  // Role-based Switcher
  switch (role) {
    case Role.GLOBAL_ADMIN:
    case Role.BRANCH_PM:
    case Role.SALE:
      return (
        <ExecutiveDashboard 
          userName={user?.fullName || 'User'}
          role={user?.role || ''}
          projects={projects}
          alerts={alerts}
        />
      );
    case Role.VENDOR:
      return <VendorDashboard userName={user?.fullName || 'User'} />;
    case Role.CLIENT:
      return <ClientDashboard userName={user?.fullName || 'User'} />;
    default:
      return <VendorDashboard userName={user?.fullName || 'User'} />;
  }
};

export default Dashboard;

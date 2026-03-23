import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const DashboardLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-bg-surface text-text-primary font-inter overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-y-auto p-8 bg-bg-surface">
          {/* Outlet is where the child routes will be rendered */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuthStore } from '../../store/authStore.js';
import { Sidebar } from './Sidebar.js';
import { Header } from './Header.js';

export const AdminLayout: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAdminAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'STAFF')) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header />
        <main className="p-6 lg:px-10 lg:py-8 flex-1 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

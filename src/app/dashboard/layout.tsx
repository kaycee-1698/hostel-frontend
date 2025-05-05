// app/dashboard/layout.tsx
import React from 'react';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 p-6 overflow-y-auto">
          <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
          <div className="bg-white shadow rounded-lg p-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

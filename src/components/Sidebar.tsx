'use client';
import Link from 'next/link';
import React, { useState } from 'react';
import SidebarItem from './SidebarItem';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  return (
    <div className={`flex flex-col h-screen transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} bg-gray-800 text-white`}>
      
      {/* Toggle Button */}
      <div className="flex justify-end p-2">
        <button onClick={toggleSidebar} className="text-white hover:text-gray-400">
          {collapsed ? '➡️' : '⬅️'}
        </button>
      </div>

      {/* Sidebar Items */}
      <nav className="flex flex-col mt-4 px-2 space-y-2">
        <Link href="/dashboard">
          <div>
            <SidebarItem icon="📊" label="Admin Dashboard" collapsed={collapsed} />
          </div>
        </Link>
        <Link href="/dashboard/guests">
          <div>
            <SidebarItem icon="👥" label="Guests" collapsed={collapsed} />
          </div>
        </Link>
        <Link href="/dashboard/bookings">
          <div>
            <SidebarItem icon="📘" label="Bookings" collapsed={collapsed} />
          </div>
        </Link>
        <Link href="/dashboard/rooms">
          <div>
            <SidebarItem icon="🛏️" label="Manage Rooms" collapsed={collapsed} />
          </div>
        </Link>
        <Link href="/dashboard/rooms/calendar">
          <div>
            <SidebarItem icon="📅" label="Room Calendar" collapsed={collapsed} />
          </div>
        </Link>
        <Link href="/dashboard/rates/bulk"><SidebarItem icon="₹" label="Bulk Update Rates" collapsed={collapsed} /></Link>
        <Link href="/dashboard/extras"><SidebarItem icon="🛍️" label="Extras" collapsed={collapsed} /></Link>
        <Link href="/dashboard/invoices"><SidebarItem icon="🧾" label="Invoices" collapsed={collapsed} /></Link>
        <Link href="/dashboard/logs"><SidebarItem icon="📋" label="Activity Logs" collapsed={collapsed} /></Link>
      </nav>
    </div>
  );
}

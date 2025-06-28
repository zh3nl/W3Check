'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, FileText, BarChart3, Settings, HelpCircle } from 'lucide-react';
import Image from 'next/image';

const sidebarItems = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: Home,
    path: '/dashboard' 
  },
  { 
    id: 'results', 
    label: 'Results', 
    icon: FileText,
    path: '/results-page' 
  },
  { 
    id: 'reports', 
    label: 'Reports', 
    icon: BarChart3,
    path: '/reports' 
  },
  { 
    id: 'settings', 
    label: 'Settings', 
    icon: Settings,
    path: '/settings' 
  },
  { 
    id: 'help', 
    label: 'Help', 
    icon: HelpCircle,
    path: '/help' 
  },
];

export default function Sidenav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex flex-col w-16 h-screen fixed bg-white shadow-xl border-r border-gray-200">
      <nav className="flex flex-col flex-1 p-2 items-center">
        {/* Logo Button */}
        <button
          onClick={() => router.push('/')}
          className={`w-full flex items-center justify-center p-3 rounded-lg transition-colors group relative mb-4 mt-2 ${
            pathname === '/' 
              ? 'bg-emerald-100 text-emerald-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title="Home"
        >
          <Image
            src="/favicon.ico"
            alt="W3Check Logo"
            width={64}
            height={64}
            className="rounded-lg"
            priority
          />
          {/* Tooltip on hover */}
          <span className="absolute left-full ml-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            Home
          </span>
        </button>
        <ul className="space-y-1 w-full">
          {sidebarItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname.includes(item.path);
            return (
              <li key={item.id}>
                <button
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center justify-center p-3 rounded-lg transition-colors group relative ${
                    isActive 
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={item.label}
                >
                  <Icon className="h-5 w-5" />
                  {/* Tooltip on hover */}
                  <span className="absolute left-full ml-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

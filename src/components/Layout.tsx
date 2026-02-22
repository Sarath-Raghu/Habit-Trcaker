import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, LayoutDashboard, Moon, Sun, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Logo } from './Logo';

const SidebarContent = ({ onClose }: { onClose?: () => void }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 transition-colors duration-200">
      <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
        <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100 tracking-tight flex items-center gap-3">
          <Logo size="md" />
          Student Habit Tracker
        </h1>
        {onClose && (
          <button 
            onClick={onClose}
            className="md:hidden p-1 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" 
                  : "text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold shrink-0">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-stone-900 dark:text-stone-100">{user?.name}</p>
            <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{user?.email}</p>
          </div>
        </div>
        
        <div className="flex gap-2 px-4">
            <button
            onClick={() => {
              console.log('Toggle theme clicked');
              toggleTheme();
            }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors cursor-pointer"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={16} className="pointer-events-none" /> : <Sun size={16} className="pointer-events-none" />}
          </button>
          <button
            onClick={() => {
              console.log('Logout clicked');
              logout();
            }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-stone-500 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={16} className="pointer-events-none" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans flex transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-stone-200 dark:border-stone-800 flex-col fixed h-full z-30 hidden md:flex transition-colors duration-200">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between px-4 z-40 transition-colors duration-200">
         <div className="flex items-center gap-3">
           <button 
             onClick={() => setIsMobileMenuOpen(true)}
             className="p-2 -ml-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors"
           >
             <Menu size={24} />
           </button>
           <h1 className="text-lg font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
              <Logo size="sm" />
              Student Habit Tracker
            </h1>
         </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                console.log('Mobile toggle theme clicked');
                toggleTheme();
              }} 
              className="p-2 text-stone-500 dark:text-stone-400 cursor-pointer"
            >
              {theme === 'light' ? <Moon size={20} className="pointer-events-none" /> : <Sun size={20} className="pointer-events-none" />}
            </button>
          </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Sidebar Panel */}
          <aside className="relative w-64 h-full shadow-2xl animate-in slide-in-from-left duration-200">
            <SidebarContent onClose={() => setIsMobileMenuOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto h-screen bg-stone-50 dark:bg-stone-950 transition-colors duration-200">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Brain, Map, Shield, Wrench, DollarSign,
  Lightbulb, Menu, X, Activity, Eye, Upload
} from 'lucide-react';
import { ModeToggle } from './ModeToggle';
import { useMode } from '@/lib/modeContext';

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/briefing', label: 'AI Briefing', icon: Brain },
  { path: '/map', label: 'Intelligence Map', icon: Map },
  { path: '/safety', label: 'Public Safety', icon: Shield },
  { path: '/infrastructure', label: 'Infrastructure', icon: Wrench },
  { path: '/economic', label: 'Economic Signals', icon: DollarSign },
  { path: '/recommendations', label: 'Recommendations', icon: Lightbulb },
  { path: '/transparency', label: 'Transparency', icon: Eye },
  { path: '/upload', label: 'Data Upload', icon: Upload },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { isLeadership } = useMode();

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 glass-card rounded-none flex items-center justify-between px-4">
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-muted-foreground hover:text-foreground">
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">SafeCity AI</span>
        </Link>
        <ModeToggle />
      </header>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Link to="/" className="h-14 flex items-center gap-2.5 px-5 border-b border-sidebar-border hover:bg-sidebar-accent/50 transition-colors">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight">SafeCity AI</h1>
            <p className="text-[10px] text-muted-foreground">Montgomery, AL</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto p-1 text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors relative ${
                  isActive
                    ? 'text-sidebar-primary-foreground bg-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <ModeToggle />
          <div className="mt-3 px-3">
            <p className="text-[10px] text-muted-foreground">
              {isLeadership ? 'Executive Intelligence Mode' : 'Public Transparency Mode'}
            </p>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="lg:ml-60 pt-14 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-6 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

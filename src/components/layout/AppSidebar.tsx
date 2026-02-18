import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, CreditCard, Bot, BarChart3,
  Settings, ChevronLeft, ChevronRight, Activity, Brain, AlertTriangle,
  Receipt, HelpCircle, UserCog, User, UserPlus, Calendar, CalendarPlus, ScrollText
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { sidebarConfig } from '@/config/sidebarConfig';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Users, FileText, CreditCard, Bot, BarChart3,
  Settings, Activity, Brain, AlertTriangle, Receipt, HelpCircle, UserCog, User, UserPlus,
  Calendar, CalendarPlus, ScrollText,
};

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

const AppSidebar: React.FC<Props> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const { user } = useAuth();
  const items = user ? sidebarConfig[user.role] : [];

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen sidebar-gradient border-r border-sidebar-border transition-all duration-300 ease-in-out flex flex-col ${
        collapsed ? 'w-[68px]' : 'w-[250px]'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border/50">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg gradient-primary shadow-md">
          <Activity className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-sidebar-accent-foreground tracking-tight">
            MediBots
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = iconMap[item.icon] || LayoutDashboard;

          const link = (
            <NavLink
              key={item.path + item.title}
              to={item.path}
              className={`sidebar-item group ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-sidebar-primary' : 'group-hover:text-sidebar-primary'}`} />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </NavLink>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.path + item.title} delayDuration={0}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.title}
                </TooltipContent>
              </Tooltip>
            );
          }

          return link;
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 py-4 border-t border-sidebar-border/50">
        <button onClick={onToggle} className="sidebar-item sidebar-item-inactive w-full justify-center">
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;

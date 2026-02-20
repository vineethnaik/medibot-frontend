import React from 'react';
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="relative z-10 border-t border-border/50 py-12 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold text-foreground">MediBots</span>
        </Link>
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <span>© 2026 MediBots Inc.</span>
          <a href="#" className="hover:text-foreground transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            Terms of Service
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            HIPAA Compliance
          </a>
        </div>
      </div>
    </footer>
  );
};

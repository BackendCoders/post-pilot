import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, Home, Search, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * GOOGLIFY: Pure React Material 3 Header
 * Features: 
 * - Scroll-aware visibility (Hide on Down / Show on Up)
 * - Pure JS Breadcrumb parsing (window.location)
 * - M3 Border Radii (24px cards, 12px interactive elements)
 */

export default function GooglifyHeader() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navigate = useNavigate();

  // 1. Scroll Handler: Smooth transitions for visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show if scrolling up or at the very top; hide if scrolling down
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // 2. Dynamic Breadcrumbs using window.location
  const breadcrumbs = useMemo(() => {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    
    return segments.map((segment) => {
      // Convert 'seo-dashboard' -> 'Seo Dashboard'
      return segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    });
  }, []);

  return (
      <header 
        className={`fixed top-6 inset-x-0 z-50 px-6 transition-all duration-300 ease-in-out ${
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0'
        }`}
      >
        <div className="max-w-6xl mx-auto bg-card border border-border/60 shadow-lg shadow-black/5 rounded-[24px] px-5 py-2.5 flex items-center justify-between backdrop-blur-xl">
          
          {/* Left: Branding & Breadcrumbs */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary active:scale-95 transition-transform cursor-pointer">
              <Home size={18} />
            </div>
            
            <nav className="flex items-center text-muted-foreground tracking-tight font-medium">
              <span className="hover:text-foreground cursor-pointer transition-colors px-2">Console</span>
              
              {breadcrumbs.length > 0 && breadcrumbs.map((crumb, i) => (
                <React.Fragment key={i}>
                  <ChevronRight size={14} className="opacity-40" />
                  <span className={`px-2 transition-colors ${
                    i === breadcrumbs.length - 1 ? 'text-foreground font-semibold' : 'hover:text-foreground cursor-pointer'
                  }`}>
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Right: Actions & Tools */}
          <div className="flex items-center gap-2">
            <button className="p-2 text-muted-foreground hover:bg-muted rounded-[12px] transition-all active:scale-95">
              <Search size={20} />
            </button>
            <button className="p-2 text-muted-foreground hover:bg-muted rounded-[12px] transition-all active:scale-95">
              <Bell size={20} />
            </button>
            <div className="h-6 w-[1px] bg-border mx-1" />
            <button className="bg-primary text-primary-foreground px-5 py-2 rounded-[12px] font-medium tracking-tight hover:opacity-90 active:scale-95 transition-all shadow-sm" onClick={()=> navigate('/dashboard/home')}>
              Dashboard
            </button>
          </div>
        </div>
      </header>
  );
}
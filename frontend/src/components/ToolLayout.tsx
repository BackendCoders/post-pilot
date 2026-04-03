'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, House } from 'lucide-react';
import { cn } from "@/lib/utils"; // Standard Tailwind utility

export default function ToolLayout() {
  const location = useLocation();
  const navigation = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // 1. Scroll-to-Hide Logic: Material Design 3 Pattern
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Show if scrolling up, hide if scrolling down (past 80px)
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

  // 2. Dynamic Breadcrumb Logic: Parses /path/to/page -> Path > To > Page
  const breadcrumbs = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    return segments.map((segment) => ({
      label: segment.replace(/-/g, ' ').toUpperCase(),
      ref: `/${segment}`,
    }));
  }, [location.pathname]);


  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10">
      
      {/* GOOGLIFIED HEADER 
          - uses 24px (3xl) border-radius for the 'floating' effect
          - uses OKLCH variables: bg-card, border-border
      */}
      <header 
        className={cn(
          "fixed top-4 inset-x-0 z-50 px-6 transition-all duration-300 ease-in-out",
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-24 opacity-0"
        )}
      >
        <div className="max-w-[1700px] mx-auto bg-card/80 backdrop-blur-xl border border-border/50 shadow-sm rounded-[24px] h-14 flex items-center justify-between px-5">
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span onClick={() => navigation('/')}>
                <House className="h-4 w-4 text-muted-foreground"/>
              </span>
              <div className="h-4 w-[1px] bg-border mx-1 opacity-50" />
              <span onClick={() => navigation(-1)}>
                <div className="p-2 hover:bg-muted rounded-full transition-all active:scale-90">
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </div>
              </span>
            </div>

            {/* Dynamic Breadcrumbs */}
            <nav className="flex items-center gap-1.5 text-[12px] font-medium tracking-tight">
              <span className="text-muted-foreground/60 hover:text-foreground cursor-pointer transition-colors">
                CONSOLE
              </span>
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={i}>
                  <ChevronRight size={12} className="text-muted-foreground/30" />
                  <span className={cn(
                    "transition-colors",
                    i === breadcrumbs.length - 1 ? "text-primary" : "text-muted-foreground/60 hover:text-foreground cursor-pointer"
                  )}>
                    {crumb.label}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Contextual Action Area */}
          <div className="flex items-center gap-3">
            {location.pathname === '/post-pilot' && (
              <div className="flex items-center gap-2">
                <button className="text-muted-foreground px-4 py-2 text-sm font-medium hover:text-foreground transition-all rounded-[12px] hover:bg-muted">
                  Save Draft
                </button>
                <button className="bg-primary text-primary-foreground px-5 py-2 rounded-[12px] text-sm font-medium shadow-sm transition-all hover:opacity-90 active:scale-95">
                  Publish Post
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content: Padding-top offsets the fixed header */}
      <main className="pt-24 px-8 max-w-[1700px] mx-auto">
        <div className="bg-card border border-border/40 rounded-md min-h-[calc(100vh-120px)] shadow-sm py-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
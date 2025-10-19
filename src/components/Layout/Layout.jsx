import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../Header';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const isDetails = /^\/(movie|tv|anime)\//.test(location.pathname);
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const [isScrolled, setIsScrolled] = useState(false);
  const isHome = location.pathname === '/';
  const scrolledBgClass = isHome
    ? (isScrolled ? 'bg-black/60 backdrop-blur-md shadow-md transition-colors duration-300' : 'bg-transparent')
    : 'bg-transparent';

  const mainClasses = isAuthPage
    ? 'bg-black pt-[calc(60px+env(safe-area-inset-top))] md:pt-[calc(72px+env(safe-area-inset-top))] pb-6'
    : `flex-1 bg-black ${isHome ? 'pt-0' : (isDetails ? 'pt-0' : 'pt-[calc(96px+env(safe-area-inset-top))] md:pt-[calc(112px+env(safe-area-inset-top))]')}`;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-black text-brand-text-primary">
      {/* Main Content with single top navigation */}
      <div className="flex-1 flex flex-col lg:pr-2">
        <Header className={scrolledBgClass} onMenuClick={toggleSidebar} />
        {/**
         * Zapewnij stały odstęp pod fixed headerem na wszystkich stronach,
         * aby treść nie była zasłonięta.
         */}
        <main className={mainClasses}>
          <div className="w-full">
            <Outlet onMenuClick={toggleSidebar} />
          </div>
        </main>
        <footer className="border-t border-white/10 text-xs text-zinc-400 py-3">
          <div className="container mx-auto px-4 md:px-6 lg:px-8 flex flex-col sm:flex-row items-center sm:items-center sm:justify-between gap-1">
            <span className="text-left w-full sm:w-auto"> {new Date().getFullYear()} ChillCloud. Wszelkie prawa zastrzeżone.</span>
            <span className="text-left sm:text-right w-full sm:w-auto">creator: bloodyred</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MagnifyingGlassIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import SearchModal from './SearchModal'; // Import the new SearchModal
import TopNavBar from './TopNavBar';
import AccountDrawer from './AccountDrawer';
import ChatPanel from './ChatPanel';
import ChangePasswordModal from './ChangePasswordModal';
import HelpModal from './HelpModal';
import StreamingLoginModal from './StreamingLoginModal';
import { useAppContext } from '../context/AppContext';

const Header = ({ onMenuClick }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isStreamingModalOpen, setIsStreamingModalOpen] = useState(false);
  const { isAuthenticated, user, hasUnreadMessages } = useAppContext();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 h-16 sm:h-20 pt-[5px] bg-gradient-to-b from-black/70 via-black/40 to-transparent"
      >
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-0 h-full flex items-center justify-between bg-transparent">
          <div className="flex items-center gap-2 md:gap-3">
            <span
              className="text-2xl md:text-3xl font-bold text-white cursor-default select-none"
              style={{ WebkitTextStroke: '1px rgba(0,0,0,0.6)', textShadow: '0 1px 2px rgba(0,0,0,0.5)', letterSpacing: '0.5px' }}
            >
              ChillCloud
            </span>
            {!isAuthPage && (
              <>
                {/* Home text button next to logo */}
                <Link
                  to="/"
                  aria-label="Start"
                  className={`inline-flex items-center px-2 py-1.5 text-sm ${location.pathname === '/' ? 'text-white font-semibold' : 'text-white/70 hover:text-white'}`}
                >
                  Start
                </Link>

                {/* Primary nav next to logo, text-only */}
                <div className="flex items-center gap-2 md:gap-3 ml-1">
                  <Link
                    to="/explore/movie"
                    className={`px-1.5 py-1 text-sm ${location.pathname === '/explore/movie' ? 'text-white font-semibold' : 'text-white/70 hover:text-white'}`}
                  >
                    <span className="inline">Filmy</span>
                  </Link>
                  <Link
                    to="/explore/tv"
                    className={`px-1.5 py-1 text-sm ${location.pathname === '/explore/tv' ? 'text-white font-semibold' : 'text-white/70 hover:text-white'}`}
                  >
                    <span className="inline">Seriale</span>
                  </Link>
                </div>
              </>
            )}
          </div>
          {!isAuthPage && (
            <div className="flex items-center gap-2 md:gap-3">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => setIsAccountOpen(true)}
                  aria-label="Panel konta"
                  className="relative inline-flex items-center gap-2 px-2 py-1.5 rounded-full cursor-pointer text-white/80 hover:text-white bg-transparent border border-transparent focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  <UserCircleIcon className="h-6 w-6" />
                  {hasUnreadMessages(user?.username) && !isChatOpen && (
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500" />
                  )}
                </button>
              ) : (
                <Link
                  to="/login"
                  aria-label="Profil"
                  className="inline-flex items-center gap-2 px-2 py-1.5 rounded-full cursor-pointer text-white/80 hover:text-white bg-transparent border border-transparent focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  <UserCircleIcon className="h-6 w-6" />
                </Link>
              )}
              <button
                onClick={() => setIsSearchOpen(true)}
                className={`inline-flex items-center gap-2 px-2 py-1.5 rounded-full cursor-pointer text-white/80 hover:text-white bg-transparent border border-transparent focus:outline-none focus:ring-2 focus:ring-white/30`}
                aria-label="Szukaj"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AccountDrawer
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        onOpenChat={() => {
          setIsAccountOpen(false);
          setIsChatOpen(true);
        }}
        onOpenChangePassword={() => {
          setIsAccountOpen(false);
          setIsPasswordModalOpen(true);
        }}
        onOpenHelp={() => {
          setIsAccountOpen(false);
          setIsHelpOpen(true);
        }}
        onOpenStreamingLogins={() => {
          setIsAccountOpen(false);
          setIsStreamingModalOpen(true);
        }}
      />
      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onBack={() => {
          setIsChatOpen(false);
          setIsAccountOpen(true);
        }}
      />
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onBack={() => {
          setIsPasswordModalOpen(false);
          setIsAccountOpen(true);
        }}
      />
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onBack={() => {
          setIsHelpOpen(false);
          setIsAccountOpen(true);
        }}
      />
      <StreamingLoginModal
        isOpen={isStreamingModalOpen}
        onClose={() => setIsStreamingModalOpen(false)}
        onBack={() => {
          setIsStreamingModalOpen(false);
          setIsAccountOpen(true);
        }}
      />
    </>
  );
};

export default Header;

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, FilmIcon, TvIcon, SparklesIcon, BookmarkIcon } from '@heroicons/react/24/outline';

const items = [
  { to: '/', label: 'Home', Icon: HomeIcon },
  { to: '/explore/movie', label: 'Movies', Icon: FilmIcon },
  { to: '/explore/tv', label: 'TV Shows', Icon: TvIcon },
];

const TopNavBar = ({ inline = false, scrolled = false }) => {
  const location = useLocation();
  if (inline) {
    return (
      <div className="flex flex-wrap gap-2 md:gap-3 items-center justify-start">
        {items.map(({ to, label, Icon }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${active ? 'bg-violet-800/60 text-white' : 'text-white hover:text-zinc-200'}`}
            >
              <Icon className="w-5 h-5" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}
      </div>
    );
  }
  return (
    <nav className="w-full mt-0">
      <div className="flex flex-wrap gap-2 md:gap-3 items-center justify-start py-2">
        {items.map(({ to, label, Icon }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm md:text-base ${active ? 'bg-violet-800/60 text-white' : 'text-white hover:text-zinc-200'}`}
            >
              <Icon className="w-5 h-5" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
} 

export default TopNavBar;

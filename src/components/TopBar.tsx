import React, { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, LogOut, ArrowLeftRight } from 'lucide-react';
import type { UserSession } from '../types';

export interface NavItem {
  id: string;
  label: string;
}

interface TopBarProps {
  user: UserSession;
  navItems: NavItem[];
  activeNav: string;
  onSelectNav: (id: string) => void;
  workspaceMode: 'admin' | 'learner';
  onSwitchWorkspace?: () => void;
  pendingNotifCount?: number;
  onOpenNotifications?: () => void;
  onLogout: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  navItems,
  activeNav,
  onSelectNav,
  workspaceMode,
  onSwitchWorkspace,
  pendingNotifCount = 0,
  onOpenNotifications,
  onLogout,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handleOutside);
    return () => document.removeEventListener('click', handleOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#e2ecee]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            if (navItems[0]) onSelectNav(navItems[0].id);
          }}
          className="flex items-center gap-3 shrink-0 whitespace-nowrap focus-visible:outline-none"
        >
          <img
            src="/logo.svg"
            alt="Connecteo"
            className="h-9 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
          <span className="text-base font-black tracking-tight text-[#096475]">
            Connecteo
          </span>
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 overflow-x-auto">
          {navItems.map((item) => {
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectNav(item.id)}
                className={`relative py-5 text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'text-[#096475]'
                    : 'text-[#66757a] hover:text-[#096475]'
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-[#00afa9]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary actions (Notifications + User Menu) */}
        <div className="flex items-center gap-3 shrink-0">
          {workspaceMode === 'admin' && onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              aria-label="Demandes d'inscription"
              className="relative h-10 w-10 rounded-lg border border-[#dce7e9] bg-white hover:bg-[#f4f9f9] text-[#096475] flex items-center justify-center transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {pendingNotifCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#c0392b] text-white text-[11px] font-bold flex items-center justify-center tabular-nums">
                  {pendingNotifCount}
                </span>
              )}
            </button>
          )}

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="h-10 px-3 rounded-lg border border-[#dce7e9] bg-white hover:bg-[#f4f9f9] text-sm font-semibold text-[#243238] flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <span className="w-6 h-6 rounded-md bg-[#e4f5f4] text-[#096475] text-xs font-bold flex items-center justify-center">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span className="max-w-[120px] truncate">{user.name}</span>
              <ChevronDown
                className={`w-4 h-4 text-[#66757a] transition-transform ${
                  menuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#dce7e9] bg-white shadow-lg py-1.5 z-50">
                <div className="px-3.5 py-2 border-b border-[#edf3f4]">
                  <p className="text-xs font-bold text-[#243238] truncate">{user.name}</p>
                  <p className="text-xs text-[#6f7d81]">
                    {workspaceMode === 'admin' ? 'Espace Administration' : 'Espace Apprenant'}
                  </p>
                </div>

                {user.role === 'admin' && onSwitchWorkspace && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onSwitchWorkspace();
                    }}
                    className="w-full px-3.5 py-2 text-left text-sm font-medium text-[#243238] hover:bg-[#f4f9f9] flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowLeftRight className="w-4 h-4 text-[#096475]" />
                    <span>
                      {workspaceMode === 'admin'
                        ? "Voir l'espace apprenant"
                        : "Retour à l'administration"}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full px-3.5 py-2 text-left text-sm font-medium text-[#c0392b] hover:bg-[#fdf2f2] flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation strip */}
      <div className="md:hidden border-t border-[#edf3f4] px-4 flex items-center gap-4 overflow-x-auto">
        {navItems.map((item) => {
          const active = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectNav(item.id)}
              className={`py-2.5 text-xs font-semibold whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                active
                  ? 'border-[#00afa9] text-[#096475]'
                  : 'border-transparent text-[#66757a]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};

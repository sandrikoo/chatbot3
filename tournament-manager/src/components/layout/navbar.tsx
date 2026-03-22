'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, LayoutDashboard, Plus, History, Settings, Menu, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTournamentStore } from '@/lib/store';
import { Button } from '@/components/ui/button';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'History', href: '/history', icon: History },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { tournaments, activeTournamentId } = useTournamentStore();
  const activeTournament = tournaments.find((t) => t.id === activeTournamentId);

  return (
    <>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 border-b border-[var(--border-color)] bg-[var(--background)]/90 backdrop-blur-xl">
        <div className="flex h-full items-center justify-between px-4 max-w-7xl mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/30 group-hover:scale-105 transition-transform">
              <Trophy className="w-4 h-4 text-black" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-sm tracking-tight text-[var(--foreground)]">EA FC 26</span>
              <span className="ml-1.5 text-xs text-[var(--muted)] font-medium">TOURNAMENT</span>
            </div>
          </Link>

          {/* Active tournament breadcrumb */}
          {activeTournament && (
            <div className="hidden md:flex items-center gap-1.5 text-sm">
              <ChevronRight className="w-3.5 h-3.5 text-[var(--muted)]" />
              <Link
                href={`/tournaments/${activeTournament.id}`}
                className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors truncate max-w-40"
              >
                {activeTournament.name}
              </Link>
              <span className={cn(
                'px-1.5 py-0.5 rounded text-xs font-semibold',
                activeTournament.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                activeTournament.status === 'completed' ? 'bg-amber-500/20 text-amber-400' :
                'bg-[var(--surface-2)] text-[var(--muted)]'
              )}>
                {activeTournament.status.toUpperCase()}
              </span>
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            <nav className="hidden md:flex items-center gap-0.5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-[var(--surface-2)] text-[var(--foreground)]'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]'
                  )}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              ))}
            </nav>

            <Link href="/tournaments/new">
              <Button size="sm" className="hidden md:flex gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                New Tournament
              </Button>
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 pt-14 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <nav className="relative bg-[var(--surface)] border-b border-[var(--border-color)] p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-[var(--surface-2)] text-[var(--foreground)]'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            <Link href="/tournaments/new" onClick={() => setMobileOpen(false)}>
              <Button className="w-full mt-2" size="sm">
                <Plus className="w-4 h-4" />
                New Tournament
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}

// Tournament sub-navigation
const tournamentNavItems = [
  { label: 'Overview', path: '' },
  { label: 'Fixtures', path: '/fixtures' },
  { label: 'Standings', path: '/standings' },
  { label: 'Stats', path: '/stats' },
  { label: 'Bracket', path: '/bracket' },
];

export function TournamentNav({ tournamentId }: { tournamentId: string }) {
  const pathname = usePathname();
  const base = `/tournaments/${tournamentId}`;

  return (
    <div className="border-b border-[var(--border-color)] bg-[var(--surface)]/50">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
          {tournamentNavItems.map((item) => {
            const href = `${base}${item.path}`;
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  isActive
                    ? 'border-[var(--accent)] text-[var(--foreground)]'
                    : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

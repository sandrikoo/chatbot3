'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Plus, Target, TrendingUp, Swords, Star } from 'lucide-react';
import { useTournamentStore } from '@/lib/store';
import { AVAILABLE_TEAMS } from '@/lib/teams';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn, timeAgo } from '@/lib/utils';
import { Tournament, Fixture } from '@/lib/types';

function getFormatLabel(format: Tournament['format']): string {
  switch (format) {
    case 'round-robin': return 'Round Robin';
    case 'double-round-robin': return 'Double RR';
    case 'group-knockout': return 'Group + Knockout';
    case 'league-playoffs': return 'League + Playoffs';
  }
}

function getStatusBadgeVariant(status: Tournament['status']): 'emerald' | 'gold' | 'secondary' {
  switch (status) {
    case 'active': return 'emerald';
    case 'completed': return 'gold';
    default: return 'secondary';
  }
}

function TournamentCard({ tournament }: { tournament: Tournament }) {
  const completedFixtures = tournament.fixtures.filter((f) => f.status === 'completed');
  const totalFixtures = tournament.fixtures.length;
  const progress = totalFixtures > 0 ? Math.round((completedFixtures.length / totalFixtures) * 100) : 0;

  return (
    <Link href={`/tournaments/${tournament.id}`} className="block group">
      <Card className="card-hover border-[var(--border-color)] bg-[var(--surface)] h-full">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h3 className="font-bold text-base text-[var(--foreground)] truncate group-hover:text-[var(--accent)] transition-colors">
                {tournament.name}
              </h3>
              {tournament.season && (
                <p className="text-xs text-[var(--muted)] mt-0.5">{tournament.season}</p>
              )}
            </div>
            <Badge variant={getStatusBadgeVariant(tournament.status)} className="shrink-0">
              {tournament.status.toUpperCase()}
            </Badge>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-sm text-[var(--muted)] mb-4">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {tournament.players.length} players
            </span>
            <span className="flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5" />
              {completedFixtures.length}/{totalFixtures} matches
            </span>
          </div>

          {/* Format badge */}
          <div className="mb-4">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--border-color)]">
              {getFormatLabel(tournament.format)}
            </span>
          </div>

          {/* Progress bar */}
          {totalFixtures > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-1.5">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    tournament.status === 'completed'
                      ? 'bg-[var(--gold)]'
                      : 'bg-[var(--accent)]'
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--muted)]">
              {timeAgo(tournament.updatedAt)}
            </span>
            <span className="text-xs font-semibold text-[var(--accent)] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Enter →
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function RecentMatch({ fixture, tournaments }: { fixture: Fixture & { tournamentId: string }; tournaments: Tournament[] }) {
  const tournament = tournaments.find((t) => t.id === fixture.tournamentId);
  if (!tournament || !fixture.result) return null;

  const homePlayer = tournament.players.find((p) => p.id === fixture.homePlayerId);
  const awayPlayer = tournament.players.find((p) => p.id === fixture.awayPlayerId);
  const homeTeam = AVAILABLE_TEAMS.find((t) => t.id === homePlayer?.teamId);
  const awayTeam = AVAILABLE_TEAMS.find((t) => t.id === awayPlayer?.teamId);

  return (
    <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border-color)]">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="truncate text-[var(--foreground)] font-medium">
            {homeTeam?.emoji} {homePlayer?.name ?? 'Unknown'}
          </span>
          <span className="font-bold text-base tabular-nums text-[var(--foreground)] shrink-0 px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border-color)]">
            {fixture.result.homeScore} – {fixture.result.awayScore}
          </span>
          <span className="truncate text-[var(--foreground)] font-medium text-right">
            {awayPlayer?.name ?? 'Unknown'} {awayTeam?.emoji}
          </span>
        </div>
        <p className="text-xs text-[var(--muted)] mt-0.5">{tournament.name} · Rd {fixture.round}</p>
      </div>
      <span className="text-xs text-[var(--muted)] shrink-0">
        {timeAgo(fixture.result.enteredAt)}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { tournaments, loadDemoData } = useTournamentStore();

  useEffect(() => {
    if (tournaments.length === 0) {
      loadDemoData();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalMatches = tournaments.reduce(
    (acc, t) => acc + t.fixtures.filter((f) => f.status === 'completed').length,
    0
  );
  const totalGoals = tournaments.reduce((acc, t) => {
    return acc + t.fixtures.reduce((fa, f) => {
      if (!f.result) return fa;
      return fa + f.result.homeScore + f.result.awayScore;
    }, 0);
  }, 0);
  const activeTournaments = tournaments.filter((t) => t.status === 'active').length;

  // Collect recent completed fixtures across all tournaments
  const recentFixtures: (Fixture & { tournamentId: string })[] = [];
  for (const t of tournaments) {
    for (const f of t.fixtures) {
      if (f.status === 'completed' && f.result) {
        recentFixtures.push({ ...f, tournamentId: t.id });
      }
    }
  }
  recentFixtures.sort((a, b) =>
    new Date(b.result!.enteredAt).getTime() - new Date(a.result!.enteredAt).getTime()
  );
  const latestFixtures = recentFixtures.slice(0, 5);

  const hasNoTournaments = tournaments.length === 0;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[var(--border-color)]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[var(--accent)]/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/40 trophy-glow">
                  <Trophy className="w-5 h-5 text-black" />
                </div>
                <Badge variant="emerald" className="text-xs">EA FC 26</Badge>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
                <span className="gradient-text">Tournament Manager</span>
              </h1>
              <p className="text-[var(--muted)] text-lg leading-relaxed">
                Track standings, fixtures, stats and rivalries for your private EA FC 26 leagues.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <Link href="/tournaments/new">
                  <Button size="lg" variant="premium">
                    <Plus className="w-5 h-5" />
                    Create Tournament
                  </Button>
                </Link>
                {hasNoTournaments && (
                  <Button size="lg" variant="secondary" onClick={() => loadDemoData()}>
                    <Star className="w-5 h-5" />
                    Load Demo
                  </Button>
                )}
              </div>
            </div>

            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {[
                { label: 'Tournaments', value: tournaments.length, color: 'text-[var(--accent)]', icon: '🏆' },
                { label: 'Matches', value: totalMatches, color: 'text-blue-400', icon: '⚽' },
                { label: 'Goals', value: totalGoals, color: 'text-[var(--gold)]', icon: '🎯' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center justify-center p-4 rounded-xl bg-[var(--surface)] border border-[var(--border-color)] min-w-[80px]"
                >
                  <span className="text-xl mb-1">{stat.icon}</span>
                  <span className={cn('text-2xl font-extrabold tabular-nums', stat.color)}>{stat.value}</span>
                  <span className="text-xs text-[var(--muted)] mt-0.5">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
        {/* Tournaments grid */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[var(--accent)]" />
              Your Tournaments
            </h2>
            <Link href="/tournaments/new">
              <Button size="sm" variant="outline">
                <Plus className="w-3.5 h-3.5" />
                New
              </Button>
            </Link>
          </div>

          {hasNoTournaments ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-color)] p-16 text-center fade-up">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-lg font-semibold mb-2">No tournaments yet</h3>
              <p className="text-[var(--muted)] text-sm mb-6 max-w-xs mx-auto">
                Create your first tournament and start tracking standings, fixtures and stats.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/tournaments/new">
                  <Button variant="premium">
                    <Plus className="w-4 h-4" />
                    Create Tournament
                  </Button>
                </Link>
                <Button variant="secondary" onClick={() => loadDemoData()}>
                  <Star className="w-4 h-4" />
                  Load Demo Data
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournaments.map((t) => (
                <TournamentCard key={t.id} tournament={t} />
              ))}
            </div>
          )}
        </section>

        {/* Bottom grid: recent results + overview */}
        {latestFixtures.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent results */}
            <section>
              <h2 className="text-xl font-bold flex items-center gap-2 mb-5">
                <Swords className="w-5 h-5 text-[var(--accent)]" />
                Recent Results
              </h2>
              <div className="space-y-2">
                {latestFixtures.map((f) => (
                  <RecentMatch key={`${f.tournamentId}-${f.id}`} fixture={f} tournaments={tournaments} />
                ))}
              </div>
            </section>

            {/* Activity overview */}
            <section>
              <h2 className="text-xl font-bold flex items-center gap-2 mb-5">
                <TrendingUp className="w-5 h-5 text-[var(--accent)]" />
                Overview
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Active Tournaments', value: activeTournaments, icon: '🟢' },
                  { label: 'Completed Tournaments', value: tournaments.filter((t) => t.status === 'completed').length, icon: '🏆' },
                  { label: 'Total Matches Played', value: totalMatches, icon: '⚽' },
                  { label: 'Total Goals Scored', value: totalGoals, icon: '🎯' },
                  { label: 'Avg Goals / Match', value: totalMatches > 0 ? (totalGoals / totalMatches).toFixed(1) : '0', icon: '📊' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border-color)]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">{item.icon}</span>
                      <span className="text-sm text-[var(--muted)]">{item.label}</span>
                    </div>
                    <span className="text-base font-bold tabular-nums">{item.value}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

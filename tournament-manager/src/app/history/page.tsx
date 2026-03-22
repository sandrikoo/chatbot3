'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Trophy, Download, Filter, Calendar, Target, Users, Clock } from 'lucide-react';
import { useTournamentStore } from '@/lib/store';
import { getTeamById } from '@/lib/teams';
import { calculateStandings, calculatePlayerStats } from '@/lib/standings';
import { cn, formatDate, getTrophyEmoji } from '@/lib/utils';
import { Tournament } from '@/lib/types';

type FilterStatus = 'all' | 'active' | 'completed' | 'archived';
type SortMode = 'recent' | 'oldest' | 'most-matches';

function getFormatLabel(format: Tournament['format']): string {
  switch (format) {
    case 'round-robin': return 'Round Robin';
    case 'double-round-robin': return 'Double RR';
    case 'group-knockout': return 'Group + KO';
    case 'league-playoffs': return 'League + PO';
  }
}

function getStatusStyles(status: Tournament['status']): string {
  switch (status) {
    case 'active': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
    case 'completed': return 'bg-amber-500/15 text-amber-400 border-amber-500/25';
    case 'archived': return 'bg-slate-500/15 text-slate-400 border-slate-500/25';
    default: return 'bg-[var(--surface-2)] text-[var(--muted)] border-[var(--border-color)]';
  }
}

function TournamentCard({ tournament }: { tournament: Tournament }) {
  const completedFixtures = tournament.fixtures.filter((f) => f.status === 'completed' && f.result);
  const totalGoals = completedFixtures.reduce(
    (acc, f) => acc + (f.result?.homeScore ?? 0) + (f.result?.awayScore ?? 0),
    0,
  );
  const progress =
    tournament.fixtures.length > 0
      ? Math.round((completedFixtures.length / tournament.fixtures.length) * 100)
      : 0;

  // Winner
  const standings = calculateStandings(tournament);
  const winner = standings[0]
    ? tournament.players.find((p) => p.id === standings[0].playerId)
    : null;
  const winnerTeam = winner ? getTeamById(winner.teamId) : null;

  // Top scorer
  const playerStatsMap = calculatePlayerStats(tournament);
  const statsArray = Array.from(playerStatsMap.values()).sort((a, b) => b.goals - a.goals);
  const topScorer = statsArray[0]?.goals > 0 ? statsArray[0] : null;
  const topScorerPlayer = topScorer
    ? tournament.players.find((p) => p.id === topScorer.playerId)
    : null;

  // Duration: from createdAt to updatedAt
  const created = new Date(tournament.createdAt);
  const updated = new Date(tournament.updatedAt);
  const daysRunning = Math.max(0, Math.floor((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <Link href={`/tournaments/${tournament.id}`} className="block card-hover">
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] overflow-hidden h-full flex flex-col">
        {/* Card top accent strip */}
        <div
          className={cn(
            'h-1.5 w-full',
            tournament.status === 'active'
              ? 'bg-gradient-to-r from-[var(--accent)] to-emerald-400'
              : tournament.status === 'completed'
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
              : 'bg-[var(--surface-2)]',
          )}
        />

        <div className="p-5 flex-1 flex flex-col gap-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                tournament.status === 'completed' ? 'bg-amber-500/10' : 'bg-[var(--accent)]/10',
              )}>
                <Trophy className={cn(
                  'w-5 h-5',
                  tournament.status === 'completed' ? 'text-amber-400' : 'text-[var(--accent)]',
                )} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base truncate text-[var(--foreground)]">{tournament.name}</h3>
                {tournament.season && (
                  <p className="text-xs text-[var(--muted)]">{tournament.season}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold border', getStatusStyles(tournament.status))}>
                {tournament.status.toUpperCase()}
              </span>
              <span className="text-xs text-[var(--muted)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full border border-[var(--border-color)]">
                {getFormatLabel(tournament.format)}
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-color)]">
              <span className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-wide">Players</span>
              <span className="text-lg font-extrabold tabular-nums">{tournament.players.length}</span>
            </div>
            <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-color)]">
              <span className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-wide">Matches</span>
              <span className="text-lg font-extrabold tabular-nums">{completedFixtures.length}</span>
            </div>
            <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-color)]">
              <span className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-wide">Goals</span>
              <span className="text-lg font-extrabold tabular-nums text-[var(--accent)]">{totalGoals}</span>
            </div>
          </div>

          {/* Progress bar */}
          {tournament.fixtures.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-1.5">
                <span>Progress</span>
                <span className="font-semibold text-[var(--foreground)]">{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    tournament.status === 'completed' ? 'bg-amber-400' : 'bg-[var(--accent)]',
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Winner section */}
          {winner && (tournament.status === 'completed' || tournament.status === 'archived') && (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--gold)]/25 bg-[var(--gold)]/5">
              <span className="text-2xl">🏆</span>
              <div className="min-w-0">
                <div className="text-xs text-[var(--gold)] font-semibold uppercase tracking-wide">Champion</div>
                <div className="text-sm font-bold truncate">
                  {winnerTeam?.emoji} {winner.name}
                </div>
                {winnerTeam && <div className="text-xs text-[var(--muted)] truncate">{winnerTeam.name}</div>}
              </div>
            </div>
          )}

          {/* Active leader */}
          {winner && tournament.status === 'active' && completedFixtures.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <span className="text-2xl">📊</span>
              <div className="min-w-0">
                <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wide">Leading</div>
                <div className="text-sm font-bold truncate">
                  {winnerTeam?.emoji} {winner.name}
                </div>
                <div className="text-xs text-[var(--muted)]">{standings[0].points} pts</div>
              </div>
            </div>
          )}

          {/* Top scorer */}
          {topScorerPlayer && (
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <span>⚽</span>
              <span>Top scorer: <span className="text-[var(--foreground)] font-semibold">{topScorerPlayer.name}</span> ({topScorer!.goals}G)</span>
            </div>
          )}

          {/* Footer: dates */}
          <div className="flex items-center justify-between text-xs text-[var(--muted)] pt-1 border-t border-[var(--border-color)] mt-auto">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(tournament.createdAt)}
            </span>
            {daysRunning > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {daysRunning}d
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ filter }: { filter: FilterStatus }) {
  const messages: Record<FilterStatus, { icon: string; title: string; body: string }> = {
    all: {
      icon: '🏆',
      title: 'No tournaments yet',
      body: 'Create your first tournament to get started.',
    },
    active: {
      icon: '⚽',
      title: 'No active tournaments',
      body: 'All tournaments are completed or not started.',
    },
    completed: {
      icon: '🥇',
      title: 'No completed tournaments',
      body: 'Finish a tournament to see it here.',
    },
    archived: {
      icon: '📦',
      title: 'No archived tournaments',
      body: 'Archive completed tournaments to keep things tidy.',
    },
  };
  const msg = messages[filter];
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border-color)] py-20 text-center">
      <div className="text-5xl mb-4">{msg.icon}</div>
      <h3 className="text-lg font-semibold mb-2">{msg.title}</h3>
      <p className="text-sm text-[var(--muted)] mb-6 max-w-xs mx-auto">{msg.body}</p>
      <Link
        href="/tournaments/new"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        Create Tournament
      </Link>
    </div>
  );
}

export default function HistoryPage() {
  const { tournaments } = useTournamentStore();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [sort, setSort] = useState<SortMode>('recent');

  // Global stats
  const totalGoals = useMemo(
    () =>
      tournaments.reduce((acc, t) => {
        return (
          acc +
          t.fixtures
            .filter((f) => f.status === 'completed' && f.result)
            .reduce((s, f) => s + (f.result?.homeScore ?? 0) + (f.result?.awayScore ?? 0), 0)
        );
      }, 0),
    [tournaments],
  );
  const completedCount = tournaments.filter((t) => t.status === 'completed' || t.status === 'archived').length;
  const activeCount = tournaments.filter((t) => t.status === 'active').length;
  const totalMatchesPlayed = tournaments.reduce(
    (acc, t) => acc + t.fixtures.filter((f) => f.status === 'completed').length,
    0,
  );

  // Filter
  const filtered = useMemo(() => {
    let list = [...tournaments];
    if (filter !== 'all') {
      list = list.filter((t) => t.status === filter);
    }
    switch (sort) {
      case 'recent':
        list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case 'oldest':
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'most-matches':
        list.sort(
          (a, b) =>
            b.fixtures.filter((f) => f.status === 'completed').length -
            a.fixtures.filter((f) => f.status === 'completed').length,
        );
        break;
    }
    return list;
  }, [tournaments, filter, sort]);

  // Export JSON
  function handleExport() {
    const data = JSON.stringify(tournaments, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ea-fc-tournaments-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="border-b border-[var(--border-color)] bg-[var(--surface)]/50">
        <div className="max-w-7xl mx-auto px-4 pt-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
                <span className="text-3xl">📋</span>
                Tournament History
              </h1>
              <p className="text-sm text-[var(--muted)] mt-1">
                All your EA FC 26 tournaments in one place.
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={tournaments.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--surface)] text-sm font-medium hover:bg-[var(--surface-2)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
          </div>

          {/* Summary stats */}
          {tournaments.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                { label: 'Total Tournaments', value: tournaments.length, icon: <Trophy className="w-3.5 h-3.5 text-[var(--accent)]" /> },
                { label: 'Completed', value: completedCount, icon: <span className="text-xs">🥇</span> },
                { label: 'Total Matches', value: totalMatchesPlayed, icon: <span className="text-xs">⚽</span> },
                { label: 'Total Goals', value: totalGoals, icon: <Target className="w-3.5 h-3.5 text-[var(--gold)]" /> },
              ].map(({ label, value, icon }) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-color)]">
                  <span>{icon}</span>
                  <div>
                    <div className="text-xs text-[var(--muted)]">{label}</div>
                    <div className="text-lg font-extrabold tabular-nums">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Filters + sort */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Status filters */}
          <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border-color)] rounded-xl p-1 flex-wrap">
            {(['all', 'active', 'completed', 'archived'] as FilterStatus[]).map((f) => {
              const count = f === 'all' ? tournaments.length : tournaments.filter((t) => t.status === f).length;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize flex items-center gap-1.5',
                    filter === f
                      ? 'bg-[var(--surface-2)] text-[var(--foreground)]'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)]',
                  )}
                >
                  {f}
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full',
                    filter === f ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-[var(--surface-2)] text-[var(--muted)]',
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 ml-auto">
            <Filter className="w-3.5 h-3.5 text-[var(--muted)]" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="bg-[var(--surface)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer"
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="most-matches">Most Matches</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        ) : (
          <EmptyState filter={filter} />
        )}
      </div>
    </div>
  );
}

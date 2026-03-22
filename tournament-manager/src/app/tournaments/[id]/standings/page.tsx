'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TournamentNav } from '@/components/layout/navbar';
import { useTournamentStore } from '@/lib/store';
import { getTeamById } from '@/lib/teams';
import { calculateStandings, calculateHeadToHead } from '@/lib/standings';
import { cn, getFormColor } from '@/lib/utils';
import { StandingEntry, FormResult } from '@/lib/types';
import { Shield, Target, Trophy } from 'lucide-react';

// ─── Form Badges ──────────────────────────────────────────────────────────────

function FormBadge({ result }: { result: FormResult }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold text-white',
        getFormColor(result)
      )}
    >
      {result}
    </span>
  );
}

// ─── Zone helpers ─────────────────────────────────────────────────────────────

function getZoneBorderColor(pos: number, total: number): string {
  if (pos === 1) return 'border-l-4 border-l-yellow-400';
  if (pos <= 3) return 'border-l-4 border-l-emerald-500';
  if (pos >= total - 1) return 'border-l-4 border-l-red-500';
  return 'border-l-4 border-l-transparent';
}

// ─── H2H Matrix ───────────────────────────────────────────────────────────────

function H2HMatrix({
  playerIds,
  playerNames,
  playerColors,
  tournamentId,
}: {
  playerIds: string[];
  playerNames: Record<string, string>;
  playerColors: Record<string, string>;
  tournamentId: string;
}) {
  const { getTournamentById } = useTournamentStore();
  const tournament = getTournamentById(tournamentId);

  if (!tournament) return null;

  const maxCols = 6;
  const ids = playerIds.slice(0, maxCols);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="p-2 text-left text-[var(--muted)] font-medium w-28">Player</th>
            {ids.map((id) => (
              <th key={id} className="p-2 text-center font-medium w-10">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: playerColors[id] ?? '#64748b' }}
                  />
                  <span className="text-[var(--muted)] text-xs truncate max-w-12">
                    {playerNames[id]?.split(' ')[0] ?? '?'}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ids.map((rowId) => (
            <tr key={rowId} className="border-t border-[var(--border-color)]/50">
              <td className="p-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: playerColors[rowId] ?? '#64748b' }}
                  />
                  <span className="text-[var(--foreground)] truncate max-w-20 font-medium">
                    {playerNames[rowId]?.split(' ')[0] ?? '?'}
                  </span>
                </div>
              </td>
              {ids.map((colId) => {
                if (rowId === colId) {
                  return (
                    <td key={colId} className="p-2 text-center">
                      <div className="w-6 h-6 rounded bg-[var(--surface-2)] mx-auto" />
                    </td>
                  );
                }
                const h2h = calculateHeadToHead(tournament, rowId, colId);
                const rowWins = h2h.player1Wins;
                const colWins = h2h.player2Wins;
                const cellBg =
                  h2h.played === 0
                    ? 'bg-transparent'
                    : rowWins > colWins
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : rowWins < colWins
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-amber-500/20 text-amber-400';
                return (
                  <td key={colId} className="p-2 text-center">
                    {h2h.played > 0 ? (
                      <span
                        className={cn(
                          'inline-block w-7 h-5 rounded text-xs font-bold leading-5',
                          cellBg
                        )}
                      >
                        {h2h.player1Goals}-{h2h.player2Goals}
                      </span>
                    ) : (
                      <span className="text-[var(--muted)]">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StandingsPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;
  const { getTournamentById } = useTournamentStore();
  const tournament = getTournamentById(tournamentId);

  const standings = useMemo(
    () => (tournament ? calculateStandings(tournament) : []),
    [tournament]
  );

  const playerMeta = useMemo(() => {
    if (!tournament) return { names: {}, colors: {}, teams: {} } as {
      names: Record<string, string>;
      colors: Record<string, string>;
      teams: Record<string, string | null>;
    };
    const names: Record<string, string> = {};
    const colors: Record<string, string> = {};
    const teams: Record<string, string | null> = {};
    tournament.players.forEach((p) => {
      names[p.id] = p.name;
      colors[p.id] = p.color;
      const team = getTeamById(p.teamId);
      teams[p.id] = team ? `${team.emoji} ${team.shortName}` : null;
    });
    return { names, colors, teams };
  }, [tournament]);

  const summaryStats = useMemo(() => {
    if (!standings.length) return null;
    const highestScorer = standings.reduce((a, b) => (b.goalsFor > a.goalsFor ? b : a));
    const bestDefense = standings
      .filter((s) => s.played > 0)
      .reduce((a, b) => (b.goalsAgainst < a.goalsAgainst ? b : a));
    const mostCS = standings.reduce((a, b) => (b.cleanSheets > a.cleanSheets ? b : a));
    return { highestScorer, bestDefense, mostCS };
  }, [standings]);

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--muted)]">Tournament not found.</p>
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <TournamentNav tournamentId={tournamentId} />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-4xl mb-4">📊</p>
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">No Standings Yet</h2>
          <p className="text-[var(--muted)]">Standings will appear once matches have been played.</p>
        </div>
      </div>
    );
  }

  const total = standings.length;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <TournamentNav tournamentId={tournamentId} />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Standings</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">{tournament.name}</p>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--muted)] text-xs uppercase tracking-wider">
                  <th className="px-3 py-3 text-left w-10">Pos</th>
                  <th className="px-3 py-3 text-left min-w-36">Player</th>
                  <th className="px-3 py-3 text-left hidden sm:table-cell">Team</th>
                  <th className="px-3 py-3 text-center w-10">P</th>
                  <th className="px-3 py-3 text-center w-10">W</th>
                  <th className="px-3 py-3 text-center w-10 hidden md:table-cell">D</th>
                  <th className="px-3 py-3 text-center w-10 hidden md:table-cell">L</th>
                  <th className="px-3 py-3 text-center w-12 hidden lg:table-cell">GF</th>
                  <th className="px-3 py-3 text-center w-12 hidden lg:table-cell">GA</th>
                  <th className="px-3 py-3 text-center w-12">GD</th>
                  <th className="px-3 py-3 text-center w-12 font-bold text-[var(--foreground)]">Pts</th>
                  <th className="px-3 py-3 text-center hidden sm:table-cell">Form</th>
                  <th className="px-3 py-3 text-center w-10 hidden md:table-cell">CS</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((entry) => (
                  <tr
                    key={entry.playerId}
                    onClick={() => router.push(`/tournaments/${tournamentId}/players/${entry.playerId}`)}
                    className={cn(
                      'border-b border-[var(--border-color)]/50 hover:bg-[var(--surface-2)] transition-colors cursor-pointer',
                      getZoneBorderColor(entry.position, total)
                    )}
                  >
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          'font-bold text-sm',
                          entry.position === 1
                            ? 'text-yellow-400'
                            : entry.position <= 3
                            ? 'text-emerald-400'
                            : entry.position >= total - 1
                            ? 'text-red-400'
                            : 'text-[var(--muted)]'
                        )}
                      >
                        {entry.position}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: playerMeta.colors[entry.playerId] ?? '#64748b' }}
                        />
                        <span className="font-semibold text-[var(--foreground)] truncate max-w-28">
                          {playerMeta.names[entry.playerId] ?? '?'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[var(--muted)] hidden sm:table-cell text-xs">
                      {playerMeta.teams[entry.playerId] ?? '—'}
                    </td>
                    <td className="px-3 py-3 text-center text-[var(--muted)]">{entry.played}</td>
                    <td className="px-3 py-3 text-center text-emerald-400 font-medium">{entry.wins}</td>
                    <td className="px-3 py-3 text-center text-amber-400 hidden md:table-cell">{entry.draws}</td>
                    <td className="px-3 py-3 text-center text-red-400 hidden md:table-cell">{entry.losses}</td>
                    <td className="px-3 py-3 text-center text-[var(--muted)] hidden lg:table-cell">{entry.goalsFor}</td>
                    <td className="px-3 py-3 text-center text-[var(--muted)] hidden lg:table-cell">{entry.goalsAgainst}</td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={cn(
                          'font-medium',
                          entry.goalDifference > 0
                            ? 'text-emerald-400'
                            : entry.goalDifference < 0
                            ? 'text-red-400'
                            : 'text-[var(--muted)]'
                        )}
                      >
                        {entry.goalDifference > 0 ? '+' : ''}
                        {entry.goalDifference}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-black text-[var(--foreground)]">
                      {entry.points}
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-0.5 justify-center">
                        {entry.form.length === 0 ? (
                          <span className="text-[var(--muted)] text-xs">—</span>
                        ) : (
                          entry.form.map((r, i) => <FormBadge key={i} result={r} />)
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-[var(--muted)] hidden md:table-cell">
                      {entry.cleanSheets}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-[var(--muted)]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-4 rounded-sm border-l-2 border-l-yellow-400" />
            <span>1st place</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-4 rounded-sm border-l-2 border-l-emerald-500" />
            <span>Top 3</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-4 rounded-sm border-l-2 border-l-red-500" />
            <span>Bottom 2</span>
          </div>
        </div>

        {/* H2H Matrix */}
        {standings.length > 1 && standings.length <= 8 && (
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border-color)]">
              <h2 className="font-semibold text-[var(--foreground)]">Head-to-Head</h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Scores shown as row player vs column player
              </p>
            </div>
            <div className="p-4">
              <H2HMatrix
                playerIds={standings.map((s) => s.playerId)}
                playerNames={playerMeta.names}
                playerColors={playerMeta.colors}
                tournamentId={tournamentId}
              />
            </div>
          </div>
        )}

        {/* Summary stat cards */}
        {summaryStats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">Top Scorer</p>
                <p className="font-bold text-[var(--foreground)]">
                  {playerMeta.names[summaryStats.highestScorer.playerId]}
                </p>
                <p className="text-sm text-[var(--accent)]">
                  {summaryStats.highestScorer.goalsFor} goals
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">Best Defense</p>
                <p className="font-bold text-[var(--foreground)]">
                  {playerMeta.names[summaryStats.bestDefense.playerId]}
                </p>
                <p className="text-sm text-emerald-400">
                  {summaryStats.bestDefense.goalsAgainst} conceded
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">Most Clean Sheets</p>
                <p className="font-bold text-[var(--foreground)]">
                  {playerMeta.names[summaryStats.mostCS.playerId]}
                </p>
                <p className="text-sm text-yellow-400">
                  {summaryStats.mostCS.cleanSheets} clean sheets
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

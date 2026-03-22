'use client';
import React from 'react';
import Link from 'next/link';
import { cn, getTrophyEmoji } from '@/lib/utils';
import { StandingEntry, Tournament, FormResult } from '@/lib/types';
import { getTeamById } from '@/lib/teams';

interface StandingsTableProps {
  standings: StandingEntry[];
  tournament: Tournament;
  compact?: boolean;
  highlightPlayerId?: string;
  qualifyCount?: number;
}

export function StandingsTable({
  standings,
  tournament,
  compact = false,
  highlightPlayerId,
  qualifyCount = 3,
}: StandingsTableProps) {
  const totalPlayers = standings.length;

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border-color)] bg-[var(--surface-2)]">
            <th className="text-left px-3 py-3 text-xs font-semibold text-[var(--muted)] w-8">#</th>
            <th className="text-left px-3 py-3 text-xs font-semibold text-[var(--muted)]">Player</th>
            {!compact && (
              <th className="text-left px-3 py-3 text-xs font-semibold text-[var(--muted)] hidden sm:table-cell">Team</th>
            )}
            <th className="text-center px-2 py-3 text-xs font-semibold text-[var(--muted)]">P</th>
            <th className="text-center px-2 py-3 text-xs font-semibold text-[var(--muted)] hidden md:table-cell">W</th>
            <th className="text-center px-2 py-3 text-xs font-semibold text-[var(--muted)] hidden md:table-cell">D</th>
            <th className="text-center px-2 py-3 text-xs font-semibold text-[var(--muted)] hidden md:table-cell">L</th>
            <th className="text-center px-2 py-3 text-xs font-semibold text-[var(--muted)] hidden lg:table-cell">GF</th>
            <th className="text-center px-2 py-3 text-xs font-semibold text-[var(--muted)] hidden lg:table-cell">GA</th>
            <th className="text-center px-2 py-3 text-xs font-semibold text-[var(--muted)]">GD</th>
            <th className="text-center px-2 py-3 text-xs font-semibold text-[var(--muted)]">Pts</th>
            {!compact && (
              <>
                <th className="text-center px-2 py-3 text-xs font-semibold text-[var(--muted)] hidden xl:table-cell">CS</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-[var(--muted)] hidden lg:table-cell">Form</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {standings.map((entry, idx) => {
            const player = tournament.players.find((p) => p.id === entry.playerId);
            const team = player ? getTeamById(player.teamId) : null;
            const isHighlighted = entry.playerId === highlightPlayerId;
            const zoneClass = getZoneClass(idx + 1, totalPlayers, qualifyCount);

            return (
              <tr
                key={entry.playerId}
                className={cn(
                  'border-b border-[var(--border-color)] last:border-0 transition-colors',
                  isHighlighted ? 'bg-[var(--accent)]/5' : 'hover:bg-[var(--surface-2)]',
                  zoneClass
                )}
              >
                {/* Position */}
                <td className="px-3 py-3 text-center">
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      'font-bold text-sm',
                      idx === 0 ? 'text-yellow-400' :
                      idx < 3 ? 'text-emerald-400' :
                      idx >= totalPlayers - 2 ? 'text-red-400' :
                      'text-[var(--muted)]'
                    )}>
                      {idx + 1}
                    </span>
                  </div>
                </td>

                {/* Player */}
                <td className="px-3 py-3">
                  <Link
                    href={`/tournaments/${tournament.id}/players/${entry.playerId}`}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        backgroundColor: (player?.color ?? '#666') + '22',
                        color: player?.color ?? '#666',
                        border: `1.5px solid ${(player?.color ?? '#666')}44`,
                      }}
                    >
                      {player?.name.slice(0, 2).toUpperCase() ?? '?'}
                    </div>
                    <span className="font-medium truncate max-w-24 sm:max-w-none">
                      {player?.name ?? 'Unknown'}
                      {getTrophyEmoji(idx + 1) && (
                        <span className="ml-1">{getTrophyEmoji(idx + 1)}</span>
                      )}
                    </span>
                  </Link>
                </td>

                {/* Team */}
                {!compact && (
                  <td className="px-3 py-3 hidden sm:table-cell">
                    <span className="text-sm text-[var(--muted)]">
                      {team?.emoji} {team?.shortName}
                    </span>
                  </td>
                )}

                <td className="px-2 py-3 text-center text-sm">{entry.played}</td>
                <td className="px-2 py-3 text-center text-sm text-emerald-400 font-medium hidden md:table-cell">{entry.wins}</td>
                <td className="px-2 py-3 text-center text-sm text-amber-400 font-medium hidden md:table-cell">{entry.draws}</td>
                <td className="px-2 py-3 text-center text-sm text-red-400 font-medium hidden md:table-cell">{entry.losses}</td>
                <td className="px-2 py-3 text-center text-sm hidden lg:table-cell">{entry.goalsFor}</td>
                <td className="px-2 py-3 text-center text-sm hidden lg:table-cell">{entry.goalsAgainst}</td>
                <td className={cn(
                  'px-2 py-3 text-center text-sm font-medium',
                  entry.goalDifference > 0 ? 'text-emerald-400' :
                  entry.goalDifference < 0 ? 'text-red-400' : 'text-[var(--muted)]'
                )}>
                  {entry.goalDifference > 0 ? '+' : ''}{entry.goalDifference}
                </td>
                <td className="px-2 py-3 text-center font-bold text-base">{entry.points}</td>

                {!compact && (
                  <>
                    <td className="px-2 py-3 text-center text-sm text-[var(--muted)] hidden xl:table-cell">
                      {entry.cleanSheets}
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <FormBadges form={entry.form} />
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Zone legend */}
      {!compact && (
        <div className="px-4 py-3 bg-[var(--surface-2)] border-t border-[var(--border-color)] flex flex-wrap gap-4 text-xs text-[var(--muted)]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            Champion
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Top {qualifyCount}
          </span>
          {totalPlayers > 4 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              Bottom zone
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function getZoneClass(position: number, total: number, qualifyCount: number): string {
  if (position === 1) return 'zone-champion';
  if (position <= qualifyCount) return 'zone-qualify';
  if (total > 4 && position >= total - 1) return 'zone-relegation';
  return 'zone-none';
}

export function FormBadges({ form }: { form: FormResult[] }) {
  if (form.length === 0) return <span className="text-xs text-[var(--muted)]">-</span>;
  return (
    <div className="flex items-center gap-0.5">
      {form.map((r, i) => (
        <span
          key={i}
          className={cn(
            'w-5 h-5 rounded-sm flex items-center justify-center text-xs font-bold',
            r === 'W' ? 'form-w' : r === 'D' ? 'form-d' : 'form-l'
          )}
        >
          {r}
        </span>
      ))}
    </div>
  );
}

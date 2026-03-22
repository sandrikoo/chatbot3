'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { Fixture, Tournament } from '@/lib/types';
import { getTeamById } from '@/lib/teams';
import { Badge } from '@/components/ui/badge';

interface FixtureCardProps {
  fixture: Fixture;
  tournament: Tournament;
  onClick?: () => void;
  compact?: boolean;
}

export function FixtureCard({ fixture, tournament, onClick, compact = false }: FixtureCardProps) {
  const homePlayer = tournament.players.find((p) => p.id === fixture.homePlayerId);
  const awayPlayer = tournament.players.find((p) => p.id === fixture.awayPlayerId);
  const homeTeam = homePlayer ? getTeamById(homePlayer.teamId) : null;
  const awayTeam = awayPlayer ? getTeamById(awayPlayer.teamId) : null;

  const isCompleted = fixture.status === 'completed' && fixture.result;
  const isScheduled = fixture.status === 'scheduled';

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-[var(--border-color)] bg-[var(--surface)] transition-all',
        onClick && 'cursor-pointer card-hover',
        compact ? 'p-3' : 'p-4'
      )}
    >
      {/* Round badge */}
      {!compact && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-[var(--muted)] font-medium">
            Round {fixture.round} · Matchday {fixture.matchday}
          </span>
          <StatusBadge status={fixture.status} />
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        {/* Home */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              backgroundColor: (homePlayer?.color ?? '#666') + '22',
              color: homePlayer?.color ?? '#666',
              border: `1.5px solid ${(homePlayer?.color ?? '#666')}44`,
            }}
          >
            {homePlayer?.name.slice(0, 2).toUpperCase() ?? '??'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{homePlayer?.name ?? 'TBD'}</p>
            <p className="text-xs text-[var(--muted)] truncate">
              {homeTeam?.emoji} {homeTeam?.shortName}
            </p>
          </div>
        </div>

        {/* Score / VS */}
        <div className="flex-shrink-0 flex items-center justify-center w-20">
          {isCompleted ? (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'text-xl font-black tabular-nums',
                  fixture.result!.homeScore > fixture.result!.awayScore
                    ? 'text-[var(--foreground)]'
                    : 'text-[var(--muted)]'
                )}
              >
                {fixture.result!.homeScore}
              </span>
              <span className="text-[var(--muted)] font-medium text-sm">-</span>
              <span
                className={cn(
                  'text-xl font-black tabular-nums',
                  fixture.result!.awayScore > fixture.result!.homeScore
                    ? 'text-[var(--foreground)]'
                    : 'text-[var(--muted)]'
                )}
              >
                {fixture.result!.awayScore}
              </span>
            </div>
          ) : isScheduled ? (
            <span className="text-sm font-bold text-[var(--muted)]">VS</span>
          ) : (
            <StatusBadge status={fixture.status} />
          )}
        </div>

        {/* Away */}
        <div className="flex-1 flex items-center gap-2 justify-end min-w-0">
          <div className="text-right min-w-0">
            <p className="text-sm font-semibold truncate">{awayPlayer?.name ?? 'TBD'}</p>
            <p className="text-xs text-[var(--muted)] truncate">
              {awayTeam?.emoji} {awayTeam?.shortName}
            </p>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              backgroundColor: (awayPlayer?.color ?? '#666') + '22',
              color: awayPlayer?.color ?? '#666',
              border: `1.5px solid ${(awayPlayer?.color ?? '#666')}44`,
            }}
          >
            {awayPlayer?.name.slice(0, 2).toUpperCase() ?? '??'}
          </div>
        </div>
      </div>

      {/* Scorers preview */}
      {isCompleted && !compact && fixture.result!.goals.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
          <div className="flex flex-wrap gap-1.5">
            {fixture.result!.goals.filter((g) => !g.isOwnGoal).slice(0, 4).map((goal, i) => {
              const scorer = tournament.players.find((p) => p.id === goal.scorerId);
              return (
                <span key={i} className="text-xs text-[var(--muted)]">
                  ⚽ {scorer?.name ?? 'Unknown'}
                  {goal.assistId && (
                    <span className="opacity-60">
                      {' '}(🅰️ {tournament.players.find((p) => p.id === goal.assistId)?.name ?? ''})
                    </span>
                  )}
                </span>
              );
            })}
            {fixture.result!.goals.length > 4 && (
              <span className="text-xs text-[var(--muted)]">+{fixture.result!.goals.length - 4} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Fixture['status'] }) {
  const map: Record<Fixture['status'], { label: string; variant: any }> = {
    completed: { label: 'FT', variant: 'emerald' },
    scheduled: { label: 'SOON', variant: 'secondary' },
    live: { label: 'LIVE', variant: 'live' },
    postponed: { label: 'PPD', variant: 'amber' },
    cancelled: { label: 'CANC', variant: 'red' },
    voided: { label: 'VOID', variant: 'secondary' },
  };
  const { label, variant } = map[status] ?? { label: status, variant: 'secondary' };
  return <Badge variant={variant}>{label}</Badge>;
}

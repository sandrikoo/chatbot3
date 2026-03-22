'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { Player } from '@/lib/types';
import { Team } from '@/lib/types';

interface PlayerAvatarProps {
  player: Player;
  team?: Team;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTeam?: boolean;
  className?: string;
}

const sizeMap = {
  xs: { outer: 'w-6 h-6', text: 'text-xs', team: 'text-xs' },
  sm: { outer: 'w-8 h-8', text: 'text-sm', team: 'text-xs' },
  md: { outer: 'w-10 h-10', text: 'text-sm', team: 'text-sm' },
  lg: { outer: 'w-12 h-12', text: 'text-base', team: 'text-sm' },
  xl: { outer: 'w-16 h-16', text: 'text-xl', team: 'text-base' },
};

export function PlayerAvatar({ player, team, size = 'md', showTeam = false, className }: PlayerAvatarProps) {
  const s = sizeMap[size];
  const initials = player.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          s.outer,
          'rounded-full flex items-center justify-center font-bold flex-shrink-0 ring-2 ring-offset-1 ring-offset-[var(--background)]'
        )}
        style={{
          backgroundColor: player.color + '22',
          color: player.color,
          border: `2px solid ${player.color}44`,
        }}
      >
        <span className={s.text}>{initials}</span>
      </div>
      {showTeam && team && (
        <div>
          <p className={cn('font-semibold leading-tight', s.team)}>{player.name}</p>
          <p className={cn('text-[var(--muted)] leading-tight', size === 'xs' ? 'text-xs' : 'text-xs')}>
            {team.emoji} {team.shortName}
          </p>
        </div>
      )}
    </div>
  );
}

interface TeamBadgeProps {
  team: Team;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

export function TeamBadge({ team, size = 'md', showName = true, className }: TeamBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : 'text-3xl';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-lg flex items-center justify-center font-bold',
          size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-10 h-10' : 'w-12 h-12'
        )}
        style={{ backgroundColor: team.primaryColor + '22', border: `1px solid ${team.primaryColor}44` }}
      >
        <span className={sizeClass}>{team.emoji ?? '⚽'}</span>
      </div>
      {showName && (
        <div>
          <p className={cn('font-semibold leading-tight', size === 'sm' ? 'text-xs' : 'text-sm')}>
            {team.name}
          </p>
          {team.league && (
            <p className="text-xs text-[var(--muted)]">{team.league}</p>
          )}
        </div>
      )}
    </div>
  );
}

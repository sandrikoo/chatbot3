import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { type FormResult } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return 'TBD';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return 'TBD';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 7) return formatDate(dateStr);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export function getFormColor(result: FormResult): string {
  switch (result) {
    case 'W': return 'bg-emerald-500';
    case 'D': return 'bg-amber-500';
    case 'L': return 'bg-red-500';
  }
}

export function getFormTextColor(result: FormResult): string {
  switch (result) {
    case 'W': return 'text-emerald-400';
    case 'D': return 'text-amber-400';
    case 'L': return 'text-red-400';
  }
}

export function calculateFormPoints(form: FormResult[]): number {
  return form.reduce((acc, r) => acc + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0);
}

export function getWinRate(wins: number, played: number): number {
  if (played === 0) return 0;
  return Math.round((wins / played) * 100);
}

export function ordinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function getPositionColor(position: number, total: number): string {
  if (position === 1) return 'text-yellow-400';
  if (position <= 3) return 'text-emerald-400';
  if (position >= total - 1) return 'text-red-400';
  return 'text-slate-400';
}

export function getZoneColor(position: number, total: number, qualifiers?: number): string {
  if (position === 1) return 'border-l-yellow-400';
  if (qualifiers && position <= qualifiers) return 'border-l-emerald-500';
  if (position >= total - 1) return 'border-l-red-500';
  return 'border-l-transparent';
}

export function getTrophyEmoji(position: number): string {
  if (position === 1) return '🏆';
  if (position === 2) return '🥈';
  if (position === 3) return '🥉';
  return '';
}

export function formatScore(home: number, away: number): string {
  return `${home} - ${away}`;
}

export function getMatchOutcome(
  homeScore: number,
  awayScore: number,
  forHome: boolean
): FormResult {
  if (homeScore === awayScore) return 'D';
  if (forHome) return homeScore > awayScore ? 'W' : 'L';
  return awayScore > homeScore ? 'W' : 'L';
}

export function pluralize(count: number, word: string, plural?: string): string {
  if (count === 1) return `${count} ${word}`;
  return `${count} ${plural ?? word + 's'}`;
}

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const PLAYER_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#06b6d4', '#84cc16',
];

export function getPlayerColor(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

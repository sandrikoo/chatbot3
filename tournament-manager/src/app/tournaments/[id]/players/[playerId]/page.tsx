'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Target, Shield, Star, Zap, TrendingUp,
  Award, User, Crosshair, AlertTriangle,
} from 'lucide-react';
import { useTournamentStore } from '@/lib/store';
import { getTeamById } from '@/lib/teams';
import { calculatePlayerStats, calculateHeadToHead, calculateStandings } from '@/lib/standings';
import {
  cn, getFormColor, getWinRate, ordinalSuffix, getTrophyEmoji, formatDate,
} from '@/lib/utils';
import { TournamentNav } from '@/components/layout/navbar';
import { Fixture, FormResult } from '@/lib/types';

function FormBadge({ result }: { result: FormResult }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold',
        getFormColor(result),
        result === 'W' ? 'text-[#07100a]' : result === 'D' ? 'text-[#07100a]' : 'text-white',
      )}
    >
      {result}
    </span>
  );
}

function StatCard({
  label, value, sub, icon, accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={cn(
      'flex flex-col gap-1 p-4 rounded-xl border',
      accent
        ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30'
        : 'bg-[var(--surface)] border-[var(--border-color)]',
    )}>
      <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
        {icon}
        {label}
      </div>
      <div className={cn('text-2xl font-extrabold tabular-nums', accent ? 'text-[var(--accent)]' : 'text-[var(--foreground)]')}>
        {value}
      </div>
      {sub && <div className="text-xs text-[var(--muted)]">{sub}</div>}
    </div>
  );
}

function AchievementBadge({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold', color)}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export default function PlayerProfilePage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const playerId = params.playerId as string;

  const { getTournamentById } = useTournamentStore();
  const tournament = getTournamentById(tournamentId);

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🏆</div>
          <h2 className="text-xl font-bold mb-2">Tournament not found</h2>
          <Link href="/" className="text-[var(--accent)] text-sm hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const player = tournament.players.find((p) => p.id === playerId);
  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">👤</div>
          <h2 className="text-xl font-bold mb-2">Player not found</h2>
          <Link href={`/tournaments/${tournamentId}`} className="text-[var(--accent)] text-sm hover:underline">Back to Tournament</Link>
        </div>
      </div>
    );
  }

  const team = getTeamById(player.teamId);
  const playerStatsMap = calculatePlayerStats(tournament);
  const stats = playerStatsMap.get(playerId);
  const standings = calculateStandings(tournament);
  const standingEntry = standings.find((s) => s.playerId === playerId);
  const position = standingEntry?.position ?? 0;
  const totalPlayers = tournament.players.length;
  const winRate = stats ? getWinRate(stats.wins, stats.matchesPlayed) : 0;

  // Completed fixtures involving this player, sorted by round
  const playerFixtures = tournament.fixtures
    .filter(
      (f) =>
        f.status === 'completed' &&
        f.result &&
        (f.homePlayerId === playerId || f.awayPlayerId === playerId),
    )
    .sort((a, b) => a.round - b.round);

  // Opponents list for H2H
  const opponents = tournament.players.filter((p) => p.id !== playerId);

  // Achievements
  const achievements: { icon: string; label: string; color: string }[] = [];

  const allStats = Array.from(playerStatsMap.values());
  const isTopScorer =
    stats && allStats.length > 0 && stats.goals === Math.max(...allStats.map((s) => s.goals)) && stats.goals > 0;
  const isTopAssists =
    stats && allStats.length > 0 && stats.assists === Math.max(...allStats.map((s) => s.assists)) && stats.assists > 0;
  const isTopCleanSheets =
    stats && allStats.length > 0 && stats.cleanSheets === Math.max(...allStats.map((s) => s.cleanSheets)) && stats.cleanSheets > 0;
  const isLeader = position === 1 && (stats?.matchesPlayed ?? 0) > 0;
  const isUnbeaten = stats && stats.matchesPlayed > 0 && stats.losses === 0;
  const hasPerfectForm =
    stats && stats.form.length >= 3 && stats.form.every((r) => r === 'W');

  if (isLeader) achievements.push({ icon: '🏆', label: 'League Leader', color: 'bg-amber-500/15 border-amber-500/30 text-amber-400' });
  if (isTopScorer) achievements.push({ icon: '⚽', label: 'Top Scorer', color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' });
  if (isTopAssists) achievements.push({ icon: '🎯', label: 'Top Assists', color: 'bg-blue-500/15 border-blue-500/30 text-blue-400' });
  if (isTopCleanSheets) achievements.push({ icon: '🧤', label: 'Best Defense', color: 'bg-violet-500/15 border-violet-500/30 text-violet-400' });
  if (isUnbeaten && (stats?.matchesPlayed ?? 0) >= 3)
    achievements.push({ icon: '🛡️', label: 'Unbeaten', color: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' });
  if (hasPerfectForm)
    achievements.push({ icon: '🔥', label: 'On Fire', color: 'bg-orange-500/15 border-orange-500/30 text-orange-400' });
  if ((stats?.longestWinStreak ?? 0) >= 3)
    achievements.push({ icon: '⚡', label: `${stats!.longestWinStreak}-Game Win Streak`, color: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' });
  if ((stats?.playerOfMatchAwards ?? 0) >= 2)
    achievements.push({ icon: '⭐', label: `${stats!.playerOfMatchAwards}x POTM`, color: 'bg-pink-500/15 border-pink-500/30 text-pink-400' });

  return (
    <div className="min-h-screen">
      <TournamentNav tournamentId={tournamentId} />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Back */}
        <Link
          href={`/tournaments/${tournamentId}`}
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tournament
        </Link>

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--surface)]">
          {/* Background glow */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at top left, ${player.color}40 0%, transparent 70%)` }}
          />
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Avatar */}
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white shrink-0 shadow-xl"
                style={{ backgroundColor: player.color }}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {player.name}
                  </h1>
                  {position > 0 && (
                    <span className="text-base font-bold text-[var(--muted)]">
                      {getTrophyEmoji(position)} {ordinalSuffix(position)} place
                    </span>
                  )}
                </div>
                {team && (
                  <p className="text-[var(--muted)] mt-1 flex items-center gap-1.5 text-sm">
                    <span className="text-lg">{team.emoji}</span>
                    <span className="font-medium text-[var(--foreground)]">{team.name}</span>
                    <span>·</span>
                    <span>{team.league}</span>
                  </p>
                )}
                {tournament.season && (
                  <p className="text-xs text-[var(--muted)] mt-0.5">Season: {tournament.season}</p>
                )}
              </div>

              {/* Win rate badge */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border-color)] min-w-[80px]">
                <span className="text-2xl font-extrabold text-[var(--accent)]">{winRate}%</span>
                <span className="text-xs text-[var(--muted)] mt-0.5">Win Rate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { label: 'Played', value: stats?.matchesPlayed ?? 0, icon: <Zap className="w-3 h-3" /> },
            { label: 'W/D/L', value: `${stats?.wins ?? 0}/${stats?.draws ?? 0}/${stats?.losses ?? 0}`, icon: <TrendingUp className="w-3 h-3" /> },
            { label: 'Goals', value: stats?.goals ?? 0, icon: <Target className="w-3 h-3" />, accent: true },
            { label: 'Assists', value: stats?.assists ?? 0, icon: <Crosshair className="w-3 h-3" /> },
            { label: 'Clean Sheets', value: stats?.cleanSheets ?? 0, icon: <Shield className="w-3 h-3" /> },
            { label: 'POTM', value: stats?.playerOfMatchAwards ?? 0, icon: <Star className="w-3 h-3" /> },
          ].map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        {/* Form Guide */}
        {stats && stats.form.length > 0 && (
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] p-5">
            <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">
              Recent Form
            </h2>
            <div className="flex items-center gap-2">
              {stats.form.map((r, i) => (
                <FormBadge key={i} result={r} />
              ))}
              <span className="ml-2 text-xs text-[var(--muted)]">last {stats.form.length} matches</span>
            </div>
          </div>
        )}

        {/* Detailed Stats + Streaks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Detailed stats */}
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] p-5">
            <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award className="w-4 h-4" /> Detailed Stats
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Goal Contributions (G+A)', value: stats?.goalContributions ?? 0 },
                { label: 'Yellow Cards', value: stats?.yellowCards ?? 0 },
                { label: 'Red Cards', value: stats?.redCards ?? 0 },
                { label: 'Avg Goals Scored / Match', value: stats?.averageGoalsScored?.toFixed(1) ?? '0.0' },
                { label: 'Avg Goals Conceded / Match', value: stats?.averageGoalsConceded?.toFixed(1) ?? '0.0' },
                { label: 'Goal Difference', value: stats && stats.goalDifference > 0 ? `+${stats.goalDifference}` : stats?.goalDifference ?? 0 },
                { label: 'Points', value: stats?.points ?? 0 },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-[var(--border-color)] last:border-0">
                  <span className="text-sm text-[var(--muted)]">{row.label}</span>
                  <span className="text-sm font-bold">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Streaks */}
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] p-5">
            <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Streaks & Records
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Longest Win Streak', value: stats?.longestWinStreak ?? 0, color: 'text-emerald-400' },
                { label: 'Longest Unbeaten Run', value: stats?.longestUnbeatenStreak ?? 0, color: 'text-blue-400' },
                { label: 'Longest Losing Streak', value: stats?.longestLosingStreak ?? 0, color: 'text-red-400' },
                { label: 'Biggest Win', value: standingEntry?.biggestWin ?? '—', color: 'text-emerald-400' },
                { label: 'Biggest Loss', value: standingEntry?.biggestLoss ?? '—', color: 'text-red-400' },
                { label: 'Home Record (W/D/L)', value: standingEntry ? `${standingEntry.homeRecord.w}/${standingEntry.homeRecord.d}/${standingEntry.homeRecord.l}` : '—', color: 'text-[var(--foreground)]' },
                { label: 'Away Record (W/D/L)', value: standingEntry ? `${standingEntry.awayRecord.w}/${standingEntry.awayRecord.d}/${standingEntry.awayRecord.l}` : '—', color: 'text-[var(--foreground)]' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-[var(--border-color)] last:border-0">
                  <span className="text-sm text-[var(--muted)]">{row.label}</span>
                  <span className={cn('text-sm font-bold', row.color)}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Match History */}
        {playerFixtures.length > 0 && (
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] overflow-hidden">
            <div className="p-5 border-b border-[var(--border-color)]">
              <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" /> Match History
              </h2>
            </div>
            <div className="divide-y divide-[var(--border-color)]">
              {playerFixtures.map((fixture) => {
                const isHome = fixture.homePlayerId === playerId;
                const opponentId = isHome ? fixture.awayPlayerId : fixture.homePlayerId;
                const opponent = tournament.players.find((p) => p.id === opponentId);
                const opponentTeam = opponent ? getTeamById(opponent.teamId) : null;
                const myScore = isHome ? fixture.result!.homeScore : fixture.result!.awayScore;
                const theirScore = isHome ? fixture.result!.awayScore : fixture.result!.homeScore;
                const outcome: FormResult =
                  myScore > theirScore ? 'W' : myScore < theirScore ? 'L' : 'D';

                // Goals scored in this match by this player
                const myGoalsInMatch = fixture.result!.goals.filter(
                  (g) => g.scorerId === playerId && !g.isOwnGoal,
                ).length;
                const myAssistsInMatch = fixture.result!.goals.filter(
                  (g) => g.assistId === playerId,
                ).length;
                const isPotm = fixture.result!.playerOfMatchId === playerId;

                return (
                  <div key={fixture.id} className="flex items-center gap-4 px-5 py-3 hover:bg-[var(--surface-2)] transition-colors">
                    <FormBadge result={outcome} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-[var(--muted)] text-xs">Rd {fixture.round}</span>
                        <span className="font-medium text-[var(--foreground)] truncate">
                          {isHome ? 'vs' : '@'} {opponentTeam?.emoji} {opponent?.name ?? 'Unknown'}
                        </span>
                      </div>
                      {fixture.result!.enteredAt && (
                        <p className="text-xs text-[var(--muted)]">{formatDate(fixture.result!.enteredAt)}</p>
                      )}
                    </div>
                    {/* Score */}
                    <div className="text-sm font-bold tabular-nums px-3 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border-color)]">
                      {isHome
                        ? `${fixture.result!.homeScore}–${fixture.result!.awayScore}`
                        : `${fixture.result!.awayScore}–${fixture.result!.homeScore}`}
                    </div>
                    {/* G+A */}
                    <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--muted)]">
                      {myGoalsInMatch > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold">
                          {myGoalsInMatch}G
                        </span>
                      )}
                      {myAssistsInMatch > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-semibold">
                          {myAssistsInMatch}A
                        </span>
                      )}
                      {isPotm && <span title="Player of the Match">⭐</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Head-to-Head */}
        {opponents.length > 0 && playerFixtures.length > 0 && (
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] overflow-hidden">
            <div className="p-5 border-b border-[var(--border-color)]">
              <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">
                Head-to-Head
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-5">
              {opponents.map((opp) => {
                const h2h = calculateHeadToHead(tournament, playerId, opp.id);
                if (h2h.played === 0) return null;
                const oppTeam = getTeamById(opp.teamId);
                const dominates = h2h.player1Wins > h2h.player2Wins;
                const losing = h2h.player1Wins < h2h.player2Wins;
                return (
                  <div
                    key={opp.id}
                    className={cn(
                      'p-3 rounded-lg border',
                      dominates
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : losing
                        ? 'border-red-500/20 bg-red-500/5'
                        : 'border-[var(--border-color)] bg-[var(--surface-2)]',
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: opp.color }}
                      >
                        {opp.name.charAt(0)}
                      </div>
                      <span className="text-sm font-semibold truncate">
                        {oppTeam?.emoji} {opp.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-400">{h2h.player1Wins}W</span>
                      <span className="text-[var(--muted)]">{h2h.draws}D</span>
                      <span className="font-bold text-red-400">{h2h.player2Wins}L</span>
                      <span className="text-[var(--muted)]">{h2h.player1Goals}–{h2h.player2Goals}</span>
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </div>
        )}

        {/* Achievement Badges */}
        {achievements.length > 0 && (
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] p-5">
            <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Star className="w-4 h-4" /> Achievements
            </h2>
            <div className="flex flex-wrap gap-2">
              {achievements.map((a, i) => (
                <AchievementBadge key={i} {...a} />
              ))}
            </div>
          </div>
        )}

        {playerFixtures.length === 0 && (
          <div className="rounded-xl border border-dashed border-[var(--border-color)] p-12 text-center">
            <div className="text-4xl mb-3">⚽</div>
            <h3 className="font-semibold mb-1">No matches played yet</h3>
            <p className="text-sm text-[var(--muted)]">Stats will appear once matches are completed.</p>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Shield, Target, TrendingUp, Zap, Award } from 'lucide-react';
import { useTournamentStore } from '@/lib/store';
import { getTeamById } from '@/lib/teams';
import { calculatePlayerStats, calculateStandings } from '@/lib/standings';
import { cn, getFormColor, formatDate } from '@/lib/utils';
import { TournamentNav } from '@/components/layout/navbar';
import { FormResult, Fixture } from '@/lib/types';

function FormBadge({ result }: { result: FormResult }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold',
        getFormColor(result),
        result === 'L' ? 'text-white' : 'text-[#07100a]',
      )}
    >
      {result}
    </span>
  );
}

function StatRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--border-color)] last:border-0">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className={cn('text-sm font-bold', color ?? 'text-[var(--foreground)]')}>{value}</span>
    </div>
  );
}

export default function TeamProfilePage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const teamId = params.teamId as string;

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

  const team = getTeamById(teamId);
  const player = tournament.players.find((p) => p.teamId === teamId);

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🏳️</div>
          <h2 className="text-xl font-bold mb-2">Team not found</h2>
          <Link href={`/tournaments/${tournamentId}`} className="text-[var(--accent)] text-sm hover:underline">
            Back to Tournament
          </Link>
        </div>
      </div>
    );
  }

  // Fixtures involving this team's player
  const completedFixtures: Fixture[] = player
    ? tournament.fixtures.filter(
        (f) =>
          f.status === 'completed' &&
          f.result &&
          (f.homePlayerId === player.id || f.awayPlayerId === player.id),
      )
    : [];

  const allFixtures: Fixture[] = player
    ? tournament.fixtures.filter(
        (f) => f.homePlayerId === player.id || f.awayPlayerId === player.id,
      )
    : [];

  // Match record
  let wins = 0, draws = 0, losses = 0, gf = 0, ga = 0, cleanSheets = 0;
  completedFixtures.forEach((f) => {
    const isHome = f.homePlayerId === player?.id;
    const myScore = isHome ? f.result!.homeScore : f.result!.awayScore;
    const theirScore = isHome ? f.result!.awayScore : f.result!.homeScore;
    gf += myScore;
    ga += theirScore;
    if (myScore > theirScore) wins++;
    else if (myScore === theirScore) draws++;
    else losses++;
    if (isHome && f.result!.homeCleanSheet) cleanSheets++;
    if (!isHome && f.result!.awayCleanSheet) cleanSheets++;
  });
  const played = completedFixtures.length;
  const gd = gf - ga;

  // Form (last 5)
  const form: FormResult[] = completedFixtures.slice(-5).map((f) => {
    const isHome = f.homePlayerId === player?.id;
    const myScore = isHome ? f.result!.homeScore : f.result!.awayScore;
    const theirScore = isHome ? f.result!.awayScore : f.result!.homeScore;
    return myScore > theirScore ? 'W' : myScore < theirScore ? 'L' : 'D';
  });

  // Top scorer with this team (player of match awards)
  const playerStatsMap = player ? calculatePlayerStats(tournament) : null;
  const playerStats = playerStatsMap?.get(player?.id ?? '');

  // Best result: biggest win margin
  let bestResultFixture: Fixture | null = null;
  let biggestMargin = 0;
  let biggestWinScore = '';
  completedFixtures.forEach((f) => {
    const isHome = f.homePlayerId === player?.id;
    const myScore = isHome ? f.result!.homeScore : f.result!.awayScore;
    const theirScore = isHome ? f.result!.awayScore : f.result!.homeScore;
    const margin = myScore - theirScore;
    if (margin > biggestMargin) {
      biggestMargin = margin;
      bestResultFixture = f;
      biggestWinScore = `${myScore}–${theirScore}`;
    }
  });

  // Standing position
  const standings = player ? calculateStandings(tournament) : [];
  const standingEntry = standings.find((s) => s.playerId === player?.id);

  return (
    <div className="min-h-screen">
      <TournamentNav tournamentId={tournamentId} />

      {/* Team Header */}
      <div
        className="relative overflow-hidden border-b border-[var(--border-color)]"
        style={{
          background: `linear-gradient(135deg, ${team.primaryColor}22 0%, ${team.secondaryColor}11 100%)`,
        }}
      >
        {/* Decorative gradient blobs */}
        <div
          className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10 pointer-events-none blur-3xl"
          style={{ backgroundColor: team.primaryColor }}
        />
        <div
          className="absolute bottom-0 right-0 w-48 h-48 rounded-full opacity-10 pointer-events-none blur-3xl"
          style={{ backgroundColor: team.secondaryColor }}
        />

        <div className="relative max-w-5xl mx-auto px-4 pt-6 pb-8">
          <Link
            href={`/tournaments/${tournamentId}`}
            className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tournament
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Team color badge */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-2xl shrink-0 border-2"
              style={{
                backgroundColor: team.primaryColor,
                borderColor: team.secondaryColor,
              }}
            >
              {team.emoji ?? '🏳️'}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
                  {team.name}
                </h1>
                <span
                  className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide"
                  style={{ backgroundColor: `${team.primaryColor}33`, color: team.primaryColor }}
                >
                  {team.shortName}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap text-sm text-[var(--muted)]">
                {team.league && <span>{team.league}</span>}
                {team.country && <><span>·</span><span>{team.country}</span></>}
                {team.rating && <><span>·</span><span>⭐ {team.rating} OVR</span></>}
              </div>
              {player && (
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    Managed by <Link href={`/tournaments/${tournamentId}/players/${player.id}`} className="text-[var(--accent)] hover:underline">{player.name}</Link>
                  </span>
                  {standingEntry && (
                    <span className="text-xs text-[var(--muted)]">
                      · {standingEntry.position}{ordSuffix(standingEntry.position)} place
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Color swatches */}
            <div className="flex gap-2 shrink-0">
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-lg border border-white/20 shadow" style={{ backgroundColor: team.primaryColor }} />
                <span className="text-[10px] text-[var(--muted)]">Primary</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-lg border border-white/20 shadow" style={{ backgroundColor: team.secondaryColor }} />
                <span className="text-[10px] text-[var(--muted)]">Secondary</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Match Record */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {[
            { label: 'P', value: played, color: '' },
            { label: 'W', value: wins, color: 'text-emerald-400' },
            { label: 'D', value: draws, color: 'text-amber-400' },
            { label: 'L', value: losses, color: 'text-red-400' },
            { label: 'GF', value: gf, color: '' },
            { label: 'GA', value: ga, color: '' },
            { label: 'GD', value: gd >= 0 ? `+${gd}` : `${gd}`, color: gd >= 0 ? 'text-emerald-400' : 'text-red-400' },
            { label: 'CS', value: cleanSheets, color: 'text-blue-400' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border-color)]"
            >
              <span className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wide">{label}</span>
              <span className={cn('text-2xl font-extrabold tabular-nums', color || 'text-[var(--foreground)]')}>{value}</span>
            </div>
          ))}
        </div>

        {/* Form Guide */}
        {form.length > 0 && (
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] p-5">
            <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Recent Form
            </h2>
            <div className="flex items-center gap-2">
              {form.map((r, i) => <FormBadge key={i} result={r} />)}
              <span className="ml-2 text-xs text-[var(--muted)]">last {form.length} matches</span>
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Team Stats */}
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] p-5">
            <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Team Stats
            </h2>
            <div className="space-y-0">
              <StatRow label="Matches Played" value={played} />
              <StatRow label="Win Rate" value={played > 0 ? `${Math.round((wins / played) * 100)}%` : '0%'} color="text-emerald-400" />
              <StatRow label="Goals Scored" value={gf} color="text-emerald-400" />
              <StatRow label="Goals Conceded" value={ga} color={ga > gf ? 'text-red-400' : 'text-[var(--foreground)]'} />
              <StatRow label="Goal Difference" value={gd >= 0 ? `+${gd}` : `${gd}`} color={gd >= 0 ? 'text-emerald-400' : 'text-red-400'} />
              <StatRow label="Clean Sheets" value={cleanSheets} color="text-blue-400" />
              <StatRow label="Avg Goals Scored" value={played > 0 ? (gf / played).toFixed(1) : '0.0'} />
              <StatRow label="Avg Goals Conceded" value={played > 0 ? (ga / played).toFixed(1) : '0.0'} />
            </div>
          </div>

          {/* Player Stats with this team */}
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] p-5">
            <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Target className="w-4 h-4" /> Player Stats
            </h2>
            {playerStats ? (
              <div className="space-y-0">
                <StatRow label="Goals" value={playerStats.goals} color="text-emerald-400" />
                <StatRow label="Assists" value={playerStats.assists} color="text-blue-400" />
                <StatRow label="Goal Contributions" value={playerStats.goalContributions} color="text-[var(--accent)]" />
                <StatRow label="POTM Awards" value={playerStats.playerOfMatchAwards} color="text-amber-400" />
                <StatRow label="Yellow Cards" value={playerStats.yellowCards} color="text-yellow-400" />
                <StatRow label="Red Cards" value={playerStats.redCards} color="text-red-400" />
                <StatRow label="Longest Win Streak" value={playerStats.longestWinStreak} color="text-emerald-400" />
                <StatRow label="Longest Unbeaten" value={playerStats.longestUnbeatenStreak} color="text-blue-400" />
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">No player assigned to this team.</p>
            )}
          </div>
        </div>

        {/* Best Result */}
        {biggestWinScore && bestResultFixture && player && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
            <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" /> Best Result
            </h2>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-extrabold text-emerald-400 tabular-nums">{biggestWinScore}</div>
              <div className="text-sm text-[var(--muted)]">
                {(() => {
                  const f = bestResultFixture as Fixture;
                  const isHome = f.homePlayerId === player.id;
                  const oppId = isHome ? f.awayPlayerId : f.homePlayerId;
                  const opp = tournament.players.find((p) => p.id === oppId);
                  const oppTeam = opp ? getTeamById(opp.teamId) : null;
                  return opp ? (
                    <span>vs {oppTeam?.emoji} {opp.name} · Round {f.round}</span>
                  ) : null;
                })()}
              </div>
            </div>
          </div>
        )}

        {/* All Fixtures */}
        {allFixtures.length > 0 && (
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] overflow-hidden">
            <div className="p-5 border-b border-[var(--border-color)]">
              <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4" /> All Fixtures
              </h2>
            </div>
            <div className="divide-y divide-[var(--border-color)]">
              {allFixtures.map((fixture) => {
                if (!player) return null;
                const isHome = fixture.homePlayerId === player.id;
                const oppId = isHome ? fixture.awayPlayerId : fixture.homePlayerId;
                const opp = tournament.players.find((p) => p.id === oppId);
                const oppTeam = opp ? getTeamById(opp.teamId) : null;
                const hasResult = fixture.status === 'completed' && fixture.result;

                let outcome: FormResult | null = null;
                let scoreStr = 'vs';
                if (hasResult) {
                  const myScore = isHome ? fixture.result!.homeScore : fixture.result!.awayScore;
                  const theirScore = isHome ? fixture.result!.awayScore : fixture.result!.homeScore;
                  outcome = myScore > theirScore ? 'W' : myScore < theirScore ? 'L' : 'D';
                  scoreStr = `${myScore}–${theirScore}`;
                }

                return (
                  <div key={fixture.id} className="flex items-center gap-4 px-5 py-3 hover:bg-[var(--surface-2)] transition-colors">
                    {outcome ? (
                      <FormBadge result={outcome} />
                    ) : (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold bg-[var(--surface-2)] border border-[var(--border-color)] text-[var(--muted)]">
                        —
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-[var(--muted)] text-xs">Rd {fixture.round}</span>
                        <span className="font-medium text-[var(--foreground)] truncate">
                          {isHome ? 'vs' : '@'} {oppTeam?.emoji} {opp?.name ?? 'Unknown'}
                        </span>
                      </div>
                      {hasResult && fixture.result!.enteredAt && (
                        <p className="text-xs text-[var(--muted)]">{formatDate(fixture.result!.enteredAt)}</p>
                      )}
                    </div>
                    <div className={cn(
                      'text-sm font-bold tabular-nums px-3 py-1 rounded-lg border',
                      hasResult
                        ? 'bg-[var(--surface-2)] border-[var(--border-color)]'
                        : 'bg-[var(--surface-2)] border-[var(--border-color)] text-[var(--muted)]'
                    )}>
                      {scoreStr}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {allFixtures.length === 0 && !player && (
          <div className="rounded-xl border border-dashed border-[var(--border-color)] p-12 text-center">
            <div className="text-4xl mb-3">{team.emoji ?? '🏳️'}</div>
            <h3 className="font-semibold mb-1">No player assigned</h3>
            <p className="text-sm text-[var(--muted)]">This team hasn&apos;t been assigned to a player in this tournament.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ordSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

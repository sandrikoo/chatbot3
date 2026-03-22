'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Users, Target, Calendar, TrendingUp, ChevronRight, Star } from 'lucide-react';
import { useTournamentStore } from '@/lib/store';
import { AVAILABLE_TEAMS } from '@/lib/teams';
import { calculateStandings, calculatePlayerStats, generateInsights, buildLeaderboards } from '@/lib/standings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TournamentNav } from '@/components/layout/navbar';
import { cn, timeAgo, getFormColor, getTrophyEmoji } from '@/lib/utils';
import { Tournament, Fixture, StandingEntry } from '@/lib/types';

// ---- Helpers ----

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

function getZoneClass(pos: number, total: number): string {
  if (pos === 1) return 'zone-champion';
  if (pos <= Math.ceil(total / 2)) return 'zone-qualify';
  if (pos >= total - 1) return 'zone-relegation';
  return 'zone-none';
}

function insightColor(color?: string): string {
  switch (color) {
    case 'emerald': return 'border-emerald-500/40 bg-emerald-500/5';
    case 'yellow': return 'border-yellow-500/40 bg-yellow-500/5';
    case 'orange': return 'border-orange-500/40 bg-orange-500/5';
    case 'purple': return 'border-purple-500/40 bg-purple-500/5';
    default: return 'border-[var(--border-color)] bg-[var(--surface-2)]';
  }
}

// ---- Sub-components ----

function StatCard({ label, value, icon, accent }: { label: string; value: string | number; icon: React.ReactNode; accent?: string }) {
  return (
    <Card className="border-[var(--border-color)]">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-[var(--muted)] font-medium uppercase tracking-wide">{label}</span>
          <span className={cn('p-1.5 rounded-lg bg-[var(--surface-2)]', accent)}>{icon}</span>
        </div>
        <div className="text-3xl font-extrabold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

function FixtureRow({ fixture, tournament }: { fixture: Fixture; tournament: Tournament }) {
  if (!fixture.result) return null;

  const homePlayer = tournament.players.find((p) => p.id === fixture.homePlayerId);
  const awayPlayer = tournament.players.find((p) => p.id === fixture.awayPlayerId);
  const homeTeam = AVAILABLE_TEAMS.find((t) => t.id === homePlayer?.teamId);
  const awayTeam = AVAILABLE_TEAMS.find((t) => t.id === awayPlayer?.teamId);

  const homeWon = fixture.result.homeScore > fixture.result.awayScore;
  const awayWon = fixture.result.awayScore > fixture.result.homeScore;

  return (
    <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border-color)]">
      {/* Home */}
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        <span className={cn('text-sm font-semibold truncate', homeWon ? 'text-[var(--foreground)]' : 'text-[var(--muted)]')}>
          {homePlayer?.name ?? '?'}
        </span>
        <span className="text-base shrink-0">{homeTeam?.emoji ?? '🏳'}</span>
      </div>
      {/* Score */}
      <div className="flex items-center gap-1 shrink-0">
        <span className={cn('text-lg font-extrabold tabular-nums w-6 text-center', homeWon ? 'text-[var(--foreground)]' : 'text-[var(--muted)]')}>
          {fixture.result.homeScore}
        </span>
        <span className="text-[var(--muted)] text-sm">–</span>
        <span className={cn('text-lg font-extrabold tabular-nums w-6 text-center', awayWon ? 'text-[var(--foreground)]' : 'text-[var(--muted)]')}>
          {fixture.result.awayScore}
        </span>
      </div>
      {/* Away */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-base shrink-0">{awayTeam?.emoji ?? '🏳'}</span>
        <span className={cn('text-sm font-semibold truncate', awayWon ? 'text-[var(--foreground)]' : 'text-[var(--muted)]')}>
          {awayPlayer?.name ?? '?'}
        </span>
      </div>
      <span className="text-xs text-[var(--muted)] shrink-0 ml-1">{timeAgo(fixture.result.enteredAt)}</span>
    </div>
  );
}

function UpcomingFixtureRow({ fixture, tournament }: { fixture: Fixture; tournament: Tournament }) {
  const homePlayer = tournament.players.find((p) => p.id === fixture.homePlayerId);
  const awayPlayer = tournament.players.find((p) => p.id === fixture.awayPlayerId);
  const homeTeam = AVAILABLE_TEAMS.find((t) => t.id === homePlayer?.teamId);
  const awayTeam = AVAILABLE_TEAMS.find((t) => t.id === awayPlayer?.teamId);

  return (
    <div className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border-color)]">
      <span className="text-xs text-[var(--muted)] w-14 shrink-0">Rd {fixture.round}</span>
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        <span className="text-sm font-medium truncate">{homePlayer?.name ?? '?'}</span>
        <span className="text-base">{homeTeam?.emoji ?? '🏳'}</span>
      </div>
      <span className="text-xs text-[var(--muted)] px-2 shrink-0">vs</span>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-base">{awayTeam?.emoji ?? '🏳'}</span>
        <span className="text-sm font-medium truncate">{awayPlayer?.name ?? '?'}</span>
      </div>
    </div>
  );
}

function StandingsRow({ entry, tournament, position }: { entry: StandingEntry; tournament: Tournament; position: number }) {
  const player = tournament.players.find((p) => p.id === entry.playerId);
  const team = AVAILABLE_TEAMS.find((t) => t.id === player?.teamId);
  const total = tournament.players.length;

  return (
    <div className={cn('flex items-center gap-3 py-2.5 px-4 rounded-lg border-l-2 pl-3', getZoneClass(position, total))}>
      <span className="text-sm font-bold w-5 text-center tabular-nums text-[var(--muted)]">{position}</span>
      <span className="text-base">{team?.emoji ?? '🏳'}</span>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold truncate block">{player?.name ?? 'Unknown'}</span>
      </div>
      {/* Form dots */}
      <div className="hidden sm:flex gap-1">
        {entry.form.slice(-5).map((r, i) => (
          <span
            key={i}
            className={cn('w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white', getFormColor(r))}
          >
            {r}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3 text-xs tabular-nums text-[var(--muted)] shrink-0">
        <span>{entry.played}</span>
        <span>{entry.wins}/{entry.draws}/{entry.losses}</span>
        <span className={entry.goalDifference >= 0 ? 'text-emerald-400' : 'text-red-400'}>
          {entry.goalDifference >= 0 ? '+' : ''}{entry.goalDifference}
        </span>
        <span className="text-[var(--foreground)] font-bold text-sm">{entry.points}</span>
      </div>
    </div>
  );
}

// ---- Main Page ----

export default function TournamentOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const tournament = useTournamentStore((state) =>
    state.tournaments.find((t) => t.id === id)
  );

  if (!tournament) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-6xl">🏆</div>
        <h1 className="text-2xl font-bold">Tournament Not Found</h1>
        <p className="text-[var(--muted)] text-sm">This tournament does not exist or has been deleted.</p>
        <Button variant="secondary" onClick={() => router.push('/')}>
          Go Home
        </Button>
      </div>
    );
  }

  const completedFixtures = tournament.fixtures.filter((f) => f.status === 'completed' && f.result);
  const scheduledFixtures = tournament.fixtures.filter((f) => f.status === 'scheduled');
  const totalGoals = completedFixtures.reduce(
    (acc, f) => acc + (f.result?.homeScore ?? 0) + (f.result?.awayScore ?? 0),
    0
  );

  // Recent results (last 5)
  const recentResults = [...completedFixtures]
    .sort((a, b) => new Date(b.result!.enteredAt).getTime() - new Date(a.result!.enteredAt).getTime())
    .slice(0, 5);

  // Upcoming fixtures (next 3)
  const upcomingFixtures = scheduledFixtures.slice(0, 3);

  // Standings
  const standings = calculateStandings(tournament);

  // Leaderboards
  const leaderboards = buildLeaderboards(tournament);
  const topScorers = leaderboards.topScorers.slice(0, 3);

  // Insights
  const insights = generateInsights(tournament);

  const progress =
    tournament.fixtures.length > 0
      ? Math.round((completedFixtures.length / tournament.fixtures.length) * 100)
      : 0;

  return (
    <div className="min-h-screen">
      {/* Tournament Header */}
      <div className="border-b border-[var(--border-color)] bg-[var(--surface)]/50">
        <div className="max-w-7xl mx-auto px-4 pt-6 pb-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] mb-4">
            <Link href="/" className="hover:text-[var(--foreground)] transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[var(--foreground)]">{tournament.name}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent)] to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/30 shrink-0">
                <Trophy className="w-6 h-6 text-black" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">{tournament.name}</h1>
                  <Badge variant={getStatusBadgeVariant(tournament.status)}>
                    {tournament.status.toUpperCase()}
                  </Badge>
                  <Badge variant="secondary">{getFormatLabel(tournament.format)}</Badge>
                </div>
                {tournament.season && (
                  <p className="text-sm text-[var(--muted)] mt-0.5">{tournament.season}</p>
                )}
              </div>
            </div>

            {/* Progress */}
            {tournament.fixtures.length > 0 && (
              <div className="sm:text-right min-w-[140px]">
                <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-[var(--muted)] mb-1.5">
                  <span>Progress</span>
                  <span className="font-semibold text-[var(--foreground)]">{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', tournament.status === 'completed' ? 'bg-[var(--gold)]' : 'bg-[var(--accent)]')}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {completedFixtures.length} of {tournament.fixtures.length} matches
                </p>
              </div>
            )}
          </div>
        </div>

        <TournamentNav tournamentId={tournament.id} />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Players"
            value={tournament.players.length}
            icon={<Users className="w-4 h-4 text-blue-400" />}
          />
          <StatCard
            label="Matches Played"
            value={completedFixtures.length}
            icon={<span className="text-base">⚽</span>}
            accent="text-[var(--accent)]"
          />
          <StatCard
            label="Total Goals"
            value={totalGoals}
            icon={<Target className="w-4 h-4 text-[var(--gold)]" />}
          />
          <StatCard
            label={tournament.totalRounds > 0 ? `Round ${tournament.currentRound}/${tournament.totalRounds}` : 'Rounds'}
            value={tournament.totalRounds > 0 ? `${tournament.currentRound}/${tournament.totalRounds}` : '—'}
            icon={<Calendar className="w-4 h-4 text-purple-400" />}
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left col: standings + top scorers */}
          <div className="lg:col-span-2 space-y-6">
            {/* Standings */}
            {standings.length > 0 && (
              <Card className="border-[var(--border-color)]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
                      Standings
                    </CardTitle>
                    <Link href={`/tournaments/${tournament.id}/standings`}>
                      <Button size="sm" variant="ghost" className="text-xs">
                        Full table <ChevronRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                  {/* Column headers */}
                  <div className="flex items-center gap-3 text-xs text-[var(--muted)] mt-2 px-4">
                    <span className="w-5" />
                    <span className="flex-1">Player</span>
                    <span className="hidden sm:block w-24 text-right">Form</span>
                    <div className="flex items-center gap-3 text-xs text-right shrink-0">
                      <span>P</span><span>W/D/L</span><span>GD</span><span className="w-5">Pts</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-2 space-y-1">
                  {standings.slice(0, 5).map((entry) => (
                    <StandingsRow
                      key={entry.playerId}
                      entry={entry}
                      tournament={tournament}
                      position={entry.position}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recent Results */}
            {recentResults.length > 0 && (
              <Card className="border-[var(--border-color)]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-base">⚽</span>
                      Recent Results
                    </CardTitle>
                    <Link href={`/tournaments/${tournament.id}/fixtures`}>
                      <Button size="sm" variant="ghost" className="text-xs">
                        All fixtures <ChevronRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-2 space-y-2">
                  {recentResults.map((f) => (
                    <FixtureRow key={f.id} fixture={f} tournament={tournament} />
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right col: upcoming + insights + top scorers */}
          <div className="space-y-6">
            {/* Top Scorers */}
            {topScorers.length > 0 && topScorers[0].value > 0 && (
              <Card className="border-[var(--border-color)]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-base">🥅</span>
                    Top Scorers
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-2 space-y-2">
                  {topScorers.map((entry, idx) => {
                    const player = tournament.players.find((p) => p.id === entry.playerId);
                    const team = AVAILABLE_TEAMS.find((t) => t.id === entry.teamId);
                    return (
                      <div key={entry.playerId} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-color)]">
                        <span className="text-sm font-bold w-4 tabular-nums text-[var(--muted)]">{idx + 1}</span>
                        <span className="text-base">{team?.emoji ?? '🏳'}</span>
                        <span className="flex-1 text-sm font-semibold truncate">{player?.name ?? 'Unknown'}</span>
                        <div className="text-right">
                          <span className="text-lg font-extrabold text-[var(--foreground)] tabular-nums">{entry.value}</span>
                          {entry.secondary !== undefined && (
                            <span className="text-xs text-[var(--muted)] ml-1">({entry.secondary}a)</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Upcoming Fixtures */}
            {upcomingFixtures.length > 0 && (
              <Card className="border-[var(--border-color)]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[var(--accent)]" />
                      Upcoming
                    </CardTitle>
                    <Link href={`/tournaments/${tournament.id}/fixtures`}>
                      <Button size="sm" variant="ghost" className="text-xs">
                        View all <ChevronRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-2 space-y-2">
                  {upcomingFixtures.map((f) => (
                    <UpcomingFixtureRow key={f.id} fixture={f} tournament={tournament} />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Insights */}
            {insights.length > 0 && (
              <Card className="border-[var(--border-color)]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-[var(--gold)]" />
                    Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-2 space-y-2">
                  {insights.slice(0, 4).map((insight) => {
                    const player = insight.playerId
                      ? tournament.players.find((p) => p.id === insight.playerId)
                      : null;
                    const team = player
                      ? AVAILABLE_TEAMS.find((t) => t.id === player.teamId)
                      : null;
                    return (
                      <div
                        key={insight.id}
                        className={cn('p-3 rounded-xl border', insightColor(insight.color ?? undefined))}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg shrink-0">{insight.icon}</span>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold">{insight.title}</div>
                            <div className="text-xs text-[var(--muted)] mt-0.5">{insight.description}</div>
                            {player && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-sm">{team?.emoji}</span>
                                <span className="text-xs font-medium text-[var(--foreground)]">{player.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Winner card */}
            {tournament.status === 'completed' && tournament.winnerId && (
              <Card className="border-[var(--gold)]/40 bg-[var(--gold)]/5">
                <CardContent className="p-5 text-center">
                  <div className="text-5xl mb-3 trophy-glow">🏆</div>
                  <div className="text-xs text-[var(--gold)] font-semibold uppercase tracking-wider mb-1">Champion</div>
                  {(() => {
                    const winner = tournament.players.find((p) => p.id === tournament.winnerId);
                    const winnerTeam = AVAILABLE_TEAMS.find((t) => t.id === winner?.teamId);
                    return winner ? (
                      <div>
                        <div className="text-xl font-extrabold">{winnerTeam?.emoji} {winner.name}</div>
                        <div className="text-sm text-[var(--muted)] mt-0.5">{winnerTeam?.name}</div>
                      </div>
                    ) : null;
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Empty state */}
        {tournament.fixtures.length === 0 && (
          <div className="text-center py-16 rounded-2xl border border-dashed border-[var(--border-color)]">
            <div className="text-5xl mb-4">⚽</div>
            <h3 className="text-lg font-semibold mb-2">No fixtures yet</h3>
            <p className="text-[var(--muted)] text-sm">
              The tournament is set up but fixtures haven&apos;t been generated yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

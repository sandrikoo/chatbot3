'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { TournamentNav } from '@/components/layout/navbar';
import { useTournamentStore } from '@/lib/store';
import { getTeamById } from '@/lib/teams';
import { buildLeaderboards, generateInsights, calculatePlayerStats } from '@/lib/standings';
import { cn, getTrophyEmoji } from '@/lib/utils';
import { LeaderboardEntry, Tournament, PlayerStats } from '@/lib/types';
import {
  Trophy,
  Target,
  Shield,
  TrendingUp,
  Zap,
  BarChart2,
  Star,
  Flame,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// ─── Chart component (recharts must be in a client component) ─────────────────

function GoalsBarChart({
  data,
}: {
  data: { name: string; goals: number; color: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--surface, #1e293b)',
            border: '1px solid var(--border-color, #334155)',
            borderRadius: '8px',
            fontSize: 12,
          }}
          labelStyle={{ color: 'var(--foreground, #f8fafc)' }}
          itemStyle={{ color: 'var(--accent, #16c05d)' }}
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
        />
        <Bar dataKey="goals" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Medal / rank display ─────────────────────────────────────────────────────

function RankDisplay({ rank }: { rank: number }) {
  const emoji = getTrophyEmoji(rank);
  if (emoji) return <span className="text-lg w-8 text-center">{emoji}</span>;
  return (
    <span className="w-8 text-center font-bold text-sm text-[var(--muted)]">{rank}</span>
  );
}

// ─── Leaderboard section ──────────────────────────────────────────────────────

function LeaderboardSection({
  title,
  icon,
  entries,
  tournament,
  valueLabel,
  secondaryLabel,
  suffix = '',
  isDecimal = false,
}: {
  title: string;
  icon: string;
  entries: LeaderboardEntry[];
  tournament: Tournament;
  valueLabel: string;
  secondaryLabel?: string;
  suffix?: string;
  isDecimal?: boolean;
}) {
  const maxVal = entries[0]?.value ?? 1;

  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--muted)] mb-3 uppercase tracking-wide flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h3>
      {entries.length === 0 ? (
        <p className="text-sm text-[var(--muted)] py-4 text-center">No data yet.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => {
            const player = tournament.players.find((p) => p.id === entry.playerId);
            const team = player ? getTeamById(player.teamId) : null;
            const pct = maxVal > 0 ? (entry.value / maxVal) * 100 : 0;

            return (
              <div
                key={entry.playerId}
                className="flex items-center gap-3 p-3 bg-[var(--surface)] border border-[var(--border-color)] rounded-xl"
              >
                <RankDisplay rank={i + 1} />
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    backgroundColor: (player?.color ?? '#666') + '22',
                    color: player?.color ?? '#666',
                  }}
                >
                  {player?.name.slice(0, 2).toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{player?.name ?? 'Unknown'}</p>
                    {team && (
                      <span className="text-xs text-[var(--muted)] shrink-0">
                        {team.emoji} {team.shortName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: player?.color ?? 'var(--accent)' }}
                      />
                    </div>
                    {secondaryLabel && entry.secondary !== undefined && (
                      <span className="text-xs text-[var(--muted)] shrink-0">
                        {entry.secondary} {secondaryLabel.toLowerCase()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-lg">
                    {isDecimal ? entry.value.toFixed(1) : entry.value}
                    {suffix}
                  </span>
                  <p className="text-xs text-[var(--muted)]">{valueLabel}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Streak row ───────────────────────────────────────────────────────────────

function StreakRow({
  rank,
  playerId,
  tournament,
  value,
  label,
  accentColor,
}: {
  rank: number;
  playerId: string;
  tournament: Tournament;
  value: number;
  label: string;
  accentColor: string;
}) {
  const player = tournament.players.find((p) => p.id === playerId);
  const team = player ? getTeamById(player.teamId) : null;
  return (
    <div className="flex items-center gap-3 p-3 bg-[var(--surface)] border border-[var(--border-color)] rounded-xl">
      <RankDisplay rank={rank} />
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{
          backgroundColor: (player?.color ?? '#666') + '22',
          color: player?.color ?? '#666',
        }}
      >
        {player?.name.slice(0, 2).toUpperCase() ?? '?'}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">{player?.name ?? 'Unknown'}</p>
        {team && (
          <p className="text-xs text-[var(--muted)]">
            {team.emoji} {team.shortName}
          </p>
        )}
      </div>
      <div className="text-right">
        <span className="font-bold text-lg" style={{ color: accentColor }}>
          {value}
        </span>
        <p className="text-xs text-[var(--muted)]">{label}</p>
      </div>
    </div>
  );
}

// ─── Tab: Scoring ─────────────────────────────────────────────────────────────

function ScoringTab({
  lb,
  tournament,
}: {
  lb: ReturnType<typeof buildLeaderboards>;
  tournament: Tournament;
}) {
  return (
    <div className="space-y-6">
      <LeaderboardSection
        title="Top Scorers"
        icon="⚽"
        entries={lb.topScorers.slice(0, 8)}
        tournament={tournament}
        valueLabel="Goals"
        secondaryLabel="Assists"
      />
      <LeaderboardSection
        title="Top Assists"
        icon="🅰️"
        entries={lb.topAssists.slice(0, 8)}
        tournament={tournament}
        valueLabel="Assists"
        secondaryLabel="Goals"
      />
      <LeaderboardSection
        title="Goal Contributions (G+A)"
        icon="🎯"
        entries={lb.topContributions.slice(0, 8)}
        tournament={tournament}
        valueLabel="G+A"
        secondaryLabel="Goals"
      />
    </div>
  );
}

// ─── Tab: Defensive ───────────────────────────────────────────────────────────

function DefensiveTab({
  lb,
  tournament,
}: {
  lb: ReturnType<typeof buildLeaderboards>;
  tournament: Tournament;
}) {
  return (
    <div className="space-y-6">
      <LeaderboardSection
        title="Clean Sheets"
        icon="🧤"
        entries={lb.cleanSheets.slice(0, 8)}
        tournament={tournament}
        valueLabel="CS"
      />
      <LeaderboardSection
        title="Best Defense (Avg Goals Conceded)"
        icon="🛡️"
        entries={lb.bestDefense.slice(0, 8)}
        tournament={tournament}
        valueLabel="Avg Conceded"
        secondaryLabel="Total GA"
        isDecimal
      />
    </div>
  );
}

// ─── Tab: Performance ────────────────────────────────────────────────────────

function PerformanceTab({
  lb,
  tournament,
}: {
  lb: ReturnType<typeof buildLeaderboards>;
  tournament: Tournament;
}) {
  return (
    <div className="space-y-6">
      <LeaderboardSection
        title="Win Rate"
        icon="📈"
        entries={lb.winRate.slice(0, 8)}
        tournament={tournament}
        valueLabel="Win %"
        secondaryLabel="Wins"
        suffix="%"
      />
      <LeaderboardSection
        title="Player of the Match Awards"
        icon="🏅"
        entries={lb.potm.slice(0, 8)}
        tournament={tournament}
        valueLabel="POTM"
      />
    </div>
  );
}

// ─── Tab: Records ─────────────────────────────────────────────────────────────

function RecordsTab({
  lb,
  tournament,
  playerStats,
}: {
  lb: ReturnType<typeof buildLeaderboards>;
  tournament: Tournament;
  playerStats: Map<string, PlayerStats>;
}) {
  const sortedByWinStreak = [...tournament.players]
    .map((p) => ({ playerId: p.id, value: playerStats.get(p.id)?.longestWinStreak ?? 0 }))
    .sort((a, b) => b.value - a.value);

  const sortedByUnbeaten = [...tournament.players]
    .map((p) => ({ playerId: p.id, value: playerStats.get(p.id)?.longestUnbeatenStreak ?? 0 }))
    .sort((a, b) => b.value - a.value);

  const sortedByLosing = [...tournament.players]
    .map((p) => ({ playerId: p.id, value: playerStats.get(p.id)?.longestLosingStreak ?? 0 }))
    .sort((a, b) => b.value - a.value);

  const biggestWins = lb.standings
    .filter((s) => s.biggestWin)
    .sort((a, b) => {
      const [ag, al] = (a.biggestWin ?? '0-0').split('-').map(Number);
      const [bg, bl] = (b.biggestWin ?? '0-0').split('-').map(Number);
      return (bg - bl) - (ag - al);
    });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-[var(--muted)] mb-3 uppercase tracking-wide flex items-center gap-2">
          <Zap className="w-4 h-4" /> Longest Win Streak
        </h3>
        <div className="space-y-2">
          {sortedByWinStreak.map((item, i) => (
            <StreakRow
              key={item.playerId}
              rank={i + 1}
              playerId={item.playerId}
              tournament={tournament}
              value={item.value}
              label="game win streak"
              accentColor="#16c05d"
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[var(--muted)] mb-3 uppercase tracking-wide flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Longest Unbeaten Streak
        </h3>
        <div className="space-y-2">
          {sortedByUnbeaten.map((item, i) => (
            <StreakRow
              key={item.playerId}
              rank={i + 1}
              playerId={item.playerId}
              tournament={tournament}
              value={item.value}
              label="game unbeaten"
              accentColor="#f0b429"
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[var(--muted)] mb-3 uppercase tracking-wide flex items-center gap-2">
          <Flame className="w-4 h-4" /> Longest Losing Streak
        </h3>
        <div className="space-y-2">
          {sortedByLosing.map((item, i) => (
            <StreakRow
              key={item.playerId}
              rank={i + 1}
              playerId={item.playerId}
              tournament={tournament}
              value={item.value}
              label="game losing streak"
              accentColor="#ef4444"
            />
          ))}
        </div>
      </div>

      {biggestWins.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--muted)] mb-3 uppercase tracking-wide flex items-center gap-2">
            🏆 Biggest Wins
          </h3>
          <div className="space-y-2">
            {biggestWins.map((standing, i) => {
              const player = tournament.players.find((p) => p.id === standing.playerId);
              const team = player ? getTeamById(player.teamId) : null;
              return (
                <div
                  key={standing.playerId}
                  className="flex items-center gap-3 p-3 bg-[var(--surface)] border border-[var(--border-color)] rounded-xl"
                >
                  <RankDisplay rank={i + 1} />
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      backgroundColor: (player?.color ?? '#666') + '22',
                      color: player?.color ?? '#666',
                    }}
                  >
                    {player?.name.slice(0, 2).toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{player?.name ?? 'Unknown'}</p>
                    {team && (
                      <p className="text-xs text-[var(--muted)]">
                        {team.emoji} {team.shortName}
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-emerald-400">{standing.biggestWin}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Insight card ─────────────────────────────────────────────────────────────

function insightBorderClass(color?: string): string {
  switch (color) {
    case 'emerald': return 'border-emerald-500/20 bg-emerald-500/5';
    case 'yellow': return 'border-yellow-500/20 bg-yellow-500/5';
    case 'orange': return 'border-orange-500/20 bg-orange-500/5';
    case 'purple': return 'border-purple-500/20 bg-purple-500/5';
    default: return 'border-[var(--border-color)] bg-[var(--surface)]';
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type TabId = 'scoring' | 'defensive' | 'performance' | 'records';

const tabList: { id: TabId; label: string; iconChar: string }[] = [
  { id: 'scoring', label: 'Scoring', iconChar: '⚽' },
  { id: 'defensive', label: 'Defensive', iconChar: '🛡️' },
  { id: 'performance', label: 'Performance', iconChar: '📈' },
  { id: 'records', label: 'Records', iconChar: '⚡' },
];

export default function StatsPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const { getTournamentById } = useTournamentStore();
  const tournament = getTournamentById(tournamentId);

  const [activeTab, setActiveTab] = useState<TabId>('scoring');

  const lb = useMemo(
    () => (tournament ? buildLeaderboards(tournament) : null),
    [tournament]
  );

  const playerStats = useMemo(
    () => (tournament ? calculatePlayerStats(tournament) : null),
    [tournament]
  );

  const insights = useMemo(
    () => (tournament ? generateInsights(tournament) : []),
    [tournament]
  );

  const completedFixtures = useMemo(
    () => tournament?.fixtures.filter((f) => f.status === 'completed' && f.result) ?? [],
    [tournament]
  );

  const summaryStats = useMemo(() => {
    if (!tournament) return null;
    const played = completedFixtures.length;
    const totalGoals = completedFixtures.reduce(
      (sum, f) => sum + (f.result?.homeScore ?? 0) + (f.result?.awayScore ?? 0),
      0
    );
    const avgGoals = played > 0 ? (totalGoals / played).toFixed(1) : '0.0';

    const resultCount: Record<string, number> = {};
    completedFixtures.forEach((f) => {
      const key = `${f.result!.homeScore}-${f.result!.awayScore}`;
      resultCount[key] = (resultCount[key] ?? 0) + 1;
    });
    const mostCommon =
      Object.entries(resultCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

    const totalCards = completedFixtures.reduce(
      (sum, f) =>
        sum +
        (f.result?.homeCards.length ?? 0) +
        (f.result?.awayCards.length ?? 0),
      0
    );

    return { played, totalGoals, avgGoals, mostCommon, totalCards };
  }, [tournament, completedFixtures]);

  const chartData = useMemo(() => {
    if (!tournament || !playerStats) return [];
    return tournament.players
      .map((p) => ({
        name: p.name.split(' ')[0],
        goals: playerStats.get(p.id)?.goals ?? 0,
        color: p.color,
      }))
      .sort((a, b) => b.goals - a.goals);
  }, [tournament, playerStats]);

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">📊</p>
          <h2 className="text-xl font-bold text-[var(--foreground)]">Tournament not found</h2>
        </div>
      </div>
    );
  }

  const noData = !lb || completedFixtures.length === 0;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <TournamentNav tournamentId={tournamentId} />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Stats &amp; Leaderboards
          </h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">{tournament.name}</p>
        </div>

        {/* Summary cards */}
        {summaryStats && summaryStats.played > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Matches Played', value: summaryStats.played, icon: '⚽' },
              { label: 'Total Goals', value: summaryStats.totalGoals, icon: '🥅' },
              { label: 'Avg Goals/Game', value: summaryStats.avgGoals, icon: '📊' },
              { label: 'Common Score', value: summaryStats.mostCommon, icon: '🔢' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-[var(--surface)] border border-[var(--border-color)] rounded-xl p-4"
              >
                <p className="text-2xl mb-1">{stat.icon}</p>
                <p className="text-2xl font-black text-[var(--foreground)]">{stat.value}</p>
                <p className="text-xs text-[var(--muted)]">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-[var(--muted)] mb-3 uppercase tracking-wide">
              Insights
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {insights.map((insight) => {
                const player = insight.playerId
                  ? tournament.players.find((p) => p.id === insight.playerId)
                  : null;
                const team = player ? getTeamById(player.teamId) : null;
                return (
                  <div
                    key={insight.id}
                    className={cn(
                      'rounded-xl border p-4 flex items-start gap-3',
                      insightBorderClass(insight.color)
                    )}
                  >
                    <span className="text-2xl shrink-0">{insight.icon}</span>
                    <div>
                      <p className="font-semibold text-sm text-[var(--foreground)]">
                        {insight.title}
                      </p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">{insight.description}</p>
                      {player && (
                        <p
                          className="text-xs font-semibold mt-1"
                          style={{ color: player.color }}
                        >
                          {player.name} {team?.emoji}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {noData ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📈</p>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">No Stats Yet</h2>
            <p className="text-[var(--muted)]">Stats will appear once matches have been played.</p>
          </div>
        ) : (
          <>
            {/* Goals bar chart */}
            {chartData.some((d) => d.goals > 0) && (
              <div className="bg-[var(--surface)] border border-[var(--border-color)] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="w-4 h-4 text-[var(--accent)]" />
                  <h2 className="font-semibold text-[var(--foreground)]">Goals by Player</h2>
                </div>
                <GoalsBarChart data={chartData} />
              </div>
            )}

            {/* Tab nav */}
            <div className="flex gap-1 flex-wrap bg-[var(--surface-2)] p-1 rounded-xl">
              {tabList.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors min-w-16',
                    activeTab === t.id
                      ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                  )}
                >
                  <span className="hidden sm:inline">{t.iconChar}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div>
              {activeTab === 'scoring' && <ScoringTab lb={lb!} tournament={tournament} />}
              {activeTab === 'defensive' && <DefensiveTab lb={lb!} tournament={tournament} />}
              {activeTab === 'performance' && <PerformanceTab lb={lb!} tournament={tournament} />}
              {activeTab === 'records' && (
                <RecordsTab lb={lb!} tournament={tournament} playerStats={playerStats!} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

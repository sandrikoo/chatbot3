'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Trophy, TrendingUp, Users } from 'lucide-react';
import { useTournamentStore } from '@/lib/store';
import { getTeamById } from '@/lib/teams';
import { calculateStandings } from '@/lib/standings';
import { cn, getTrophyEmoji, ordinalSuffix } from '@/lib/utils';
import { TournamentNav } from '@/components/layout/navbar';
import { Player, StandingEntry } from '@/lib/types';

// ---- Types ----
interface BracketPlayer {
  player: Player;
  standing: StandingEntry;
  seed: number;
}

interface MatchupProps {
  top: BracketPlayer | null;
  bottom: BracketPlayer | null;
  label: string;
  winner?: BracketPlayer | null;
  isChampion?: boolean;
}

// ---- Semi-final matchup card ----
function BracketMatchup({ top, bottom, label, winner, isChampion }: MatchupProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2 text-center">{label}</div>
      <div className="rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--surface)] w-56">
        {/* Top slot */}
        <BracketSlot bp={top} isWinner={winner?.player.id === top?.player.id} />
        <div className="h-px bg-[var(--border-color)]" />
        {/* Bottom slot */}
        <BracketSlot bp={bottom} isWinner={winner?.player.id === bottom?.player.id} />
      </div>
    </div>
  );
}

function BracketSlot({ bp, isWinner }: { bp: BracketPlayer | null; isWinner?: boolean }) {
  if (!bp) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-[var(--surface-2)] opacity-40">
        <div className="w-7 h-7 rounded-lg bg-[var(--border-color)]" />
        <div className="flex-1">
          <div className="h-2.5 w-24 rounded bg-[var(--border-color)]" />
          <div className="h-2 w-16 rounded bg-[var(--border-color)] mt-1.5" />
        </div>
        <span className="text-xs text-[var(--muted)]">TBD</span>
      </div>
    );
  }

  const team = getTeamById(bp.player.teamId);

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 transition-colors',
      isWinner
        ? 'bg-[var(--accent)]/10 border-l-2 border-l-[var(--accent)]'
        : 'bg-[var(--surface)] border-l-2 border-l-transparent',
    )}>
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ backgroundColor: bp.player.color }}
      >
        {bp.player.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn('text-sm font-semibold truncate', isWinner ? 'text-[var(--accent)]' : 'text-[var(--foreground)]')}>
          {bp.player.name}
        </div>
        <div className="text-xs text-[var(--muted)] truncate">
          {team?.emoji} {team?.shortName ?? 'Unknown'}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs font-bold text-[var(--muted)]">#{bp.seed}</div>
        <div className="text-xs text-[var(--muted)]">{bp.standing.points}pts</div>
      </div>
    </div>
  );
}

function ChampionCard({ bp }: { bp: BracketPlayer | null }) {
  if (!bp) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-dashed border-[var(--gold)]/30 bg-[var(--gold)]/5 w-56">
        <div className="text-4xl opacity-40">🏆</div>
        <div className="text-sm font-semibold text-[var(--muted)]">Champion TBD</div>
      </div>
    );
  }

  const team = getTeamById(bp.player.teamId);

  return (
    <div className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-[var(--gold)]/40 bg-[var(--gold)]/5 w-56 shadow-lg shadow-amber-900/20">
      <div className="text-5xl trophy-glow">🏆</div>
      <div className="text-xs font-bold text-[var(--gold)] uppercase tracking-wider">Champion</div>
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black text-white shadow-xl"
        style={{ backgroundColor: bp.player.color }}
      >
        {bp.player.name.charAt(0)}
      </div>
      <div className="text-center">
        <div className="text-lg font-extrabold text-[var(--foreground)]">{bp.player.name}</div>
        <div className="text-sm text-[var(--muted)] mt-0.5">{team?.emoji} {team?.name}</div>
        <div className="text-xs text-[var(--gold)] mt-1">{bp.standing.points} pts · Seed #{bp.seed}</div>
      </div>
    </div>
  );
}

// ---- Connector line (SVG) ----
function BracketConnector({ direction }: { direction: 'up' | 'down' }) {
  return (
    <div className={cn('flex items-center justify-center w-8', direction === 'up' ? 'self-end mb-8' : 'self-start mt-8')}>
      <div className="w-full h-0.5 bg-[var(--border-color)]" />
    </div>
  );
}

function VerticalConnector() {
  return (
    <div className="flex flex-col items-start w-8">
      <div className="w-0.5 h-full bg-[var(--border-color)] mx-auto min-h-16" />
    </div>
  );
}

// ---- Standings mini-table ----
function StandingsMiniRow({ entry, tournament, index }: {
  entry: StandingEntry;
  tournament: ReturnType<typeof useTournamentStore.getState>['tournaments'][number];
  index: number;
}) {
  const player = tournament.players.find((p) => p.id === entry.playerId);
  const team = player ? getTeamById(player.teamId) : null;
  const isTop4 = index < 4;

  return (
    <div className={cn(
      'flex items-center gap-3 py-2.5 px-4 rounded-lg border-l-2',
      index === 0 ? 'border-l-amber-400' :
      isTop4 ? 'border-l-emerald-500' :
      'border-l-transparent',
    )}>
      <span className={cn(
        'text-sm font-bold w-5 text-center tabular-nums',
        index === 0 ? 'text-amber-400' : isTop4 ? 'text-emerald-400' : 'text-[var(--muted)]',
      )}>
        {getTrophyEmoji(index + 1) || index + 1}
      </span>
      <span className="text-base">{team?.emoji ?? '🏳️'}</span>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold truncate block">{player?.name ?? 'Unknown'}</span>
        <span className="text-xs text-[var(--muted)]">{team?.shortName}</span>
      </div>
      <div className="flex items-center gap-3 text-xs tabular-nums text-[var(--muted)] shrink-0">
        <span>{entry.played}</span>
        <span>{entry.wins}/{entry.draws}/{entry.losses}</span>
        <span className={entry.goalDifference >= 0 ? 'text-emerald-400' : 'text-red-400'}>
          {entry.goalDifference >= 0 ? '+' : ''}{entry.goalDifference}
        </span>
        <span className="text-[var(--foreground)] font-bold text-sm w-6 text-right">{entry.points}</span>
      </div>
    </div>
  );
}

// ---- Main Page ----
export default function BracketPage() {
  const params = useParams();
  const id = params.id as string;

  const tournament = useTournamentStore((state) =>
    state.tournaments.find((t) => t.id === id)
  );

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

  const standings = calculateStandings(tournament);
  const isRoundRobin = tournament.format === 'round-robin' || tournament.format === 'double-round-robin';

  // For non-knockout formats, show standings only
  if (isRoundRobin) {
    return (
      <div className="min-h-screen">
        <TournamentNav tournamentId={id} />
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* Header */}
          <div className="text-center py-10 rounded-2xl border border-[var(--border-color)] bg-[var(--surface)]">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-xl font-bold mb-2">No Knockout Stage</h2>
            <p className="text-[var(--muted)] text-sm max-w-sm mx-auto">
              This tournament uses a <strong>{tournament.format === 'round-robin' ? 'Round Robin' : 'Double Round Robin'}</strong> format — the winner is determined by final standings.
            </p>
          </div>

          {/* Standings summary */}
          {standings.length > 0 && (
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] overflow-hidden">
              <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
                  Current Standings
                </h2>
                <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
                  <span>P</span><span>W/D/L</span><span>GD</span><span>Pts</span>
                </div>
              </div>
              <div className="p-3 space-y-1">
                {standings.map((entry, i) => (
                  <StandingsMiniRow key={entry.playerId} entry={entry} tournament={tournament} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Winner announcement if completed */}
          {tournament.status === 'completed' && standings[0] && (() => {
            const winner = tournament.players.find((p) => p.id === standings[0].playerId);
            const winnerTeam = winner ? getTeamById(winner.teamId) : null;
            return winner ? (
              <div className="rounded-2xl border border-[var(--gold)]/40 bg-[var(--gold)]/5 p-8 text-center">
                <div className="text-6xl mb-4 trophy-glow">🏆</div>
                <div className="text-xs font-bold text-[var(--gold)] uppercase tracking-widest mb-2">Tournament Champion</div>
                <div className="text-2xl font-extrabold">{winnerTeam?.emoji} {winner.name}</div>
                <div className="text-sm text-[var(--muted)] mt-1">{winnerTeam?.name} · {standings[0].points} points</div>
              </div>
            ) : null;
          })()}
        </div>
      </div>
    );
  }

  // For league-playoffs / group-knockout: show simulated playoff bracket with top 4
  const completedCount = tournament.fixtures.filter((f) => f.status === 'completed').length;
  const top4: BracketPlayer[] = standings.slice(0, 4).map((entry, i) => ({
    player: tournament.players.find((p) => p.id === entry.playerId)!,
    standing: entry,
    seed: i + 1,
  })).filter((bp) => bp.player != null);

  // Simulated matchups: 1v4, 2v3
  const sf1top = top4[0] ?? null;
  const sf1bottom = top4[3] ?? null;
  const sf2top = top4[1] ?? null;
  const sf2bottom = top4[2] ?? null;

  // Determine simulated winners (based on standing position / points)
  // In a real scenario these would be actual results; here we indicate TBD unless we have real bracket data
  const hasBracket = !!(tournament.knockoutBracket && tournament.knockoutBracket.length > 0);

  // For simulated: no real winner yet, show TBD final
  const finalWinner: BracketPlayer | null = null; // always TBD for simulated

  return (
    <div className="min-h-screen">
      <TournamentNav tournamentId={id} />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-3">
              <Trophy className="w-6 h-6 text-[var(--gold)]" />
              Playoff Bracket
            </h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              {hasBracket ? 'Knockout stage bracket' : 'Simulated playoff based on current standings'}
            </p>
          </div>
          {top4.length < 4 && (
            <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              ⚠️ Need at least 4 players to display bracket
            </div>
          )}
        </div>

        {top4.length >= 4 ? (
          <>
            {/* Bracket visualization */}
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-6 sm:p-8 overflow-x-auto">
              <div className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-6 text-center">
                Simulated Playoff — Top 4 from Standings
              </div>

              {/* Desktop bracket */}
              <div className="hidden sm:flex items-center justify-center gap-0">
                {/* Semi-finals column */}
                <div className="flex flex-col gap-16">
                  <BracketMatchup
                    top={sf1top}
                    bottom={sf1bottom}
                    label="Semi-Final 1"
                    winner={null}
                  />
                  <BracketMatchup
                    top={sf2top}
                    bottom={sf2bottom}
                    label="Semi-Final 2"
                    winner={null}
                  />
                </div>

                {/* Connectors */}
                <div className="flex flex-col items-stretch self-stretch w-12 relative my-8">
                  {/* Top connector line */}
                  <div className="flex-1 flex flex-col justify-end">
                    <div className="h-0.5 bg-[var(--border-color)] w-full" />
                  </div>
                  {/* Vertical bar */}
                  <div className="self-center w-0.5 bg-[var(--border-color)] flex-1 -mt-0.5 -mb-0.5" />
                  {/* Bottom connector line */}
                  <div className="flex-1 flex flex-col justify-start">
                    <div className="h-0.5 bg-[var(--border-color)] w-full" />
                  </div>
                </div>

                {/* Final */}
                <div className="flex flex-col gap-3 items-center justify-center">
                  <div className="text-xs font-semibold text-[var(--gold)] uppercase tracking-wider text-center mb-2">Final</div>
                  <div className="rounded-xl overflow-hidden border border-[var(--gold)]/30 bg-[var(--gold)]/5 w-56">
                    {/* Final top slot */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-color)]">
                      <div className="w-7 h-7 rounded-lg bg-[var(--surface-2)] border border-[var(--border-color)] flex items-center justify-center">
                        <span className="text-xs text-[var(--muted)]">—</span>
                      </div>
                      <span className="text-sm text-[var(--muted)]">SF1 Winner</span>
                    </div>
                    {/* Final bottom slot */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="w-7 h-7 rounded-lg bg-[var(--surface-2)] border border-[var(--border-color)] flex items-center justify-center">
                        <span className="text-xs text-[var(--muted)]">—</span>
                      </div>
                      <span className="text-sm text-[var(--muted)]">SF2 Winner</span>
                    </div>
                  </div>
                </div>

                {/* Connector to champion */}
                <div className="flex items-center w-10">
                  <div className="h-0.5 bg-[var(--border-color)] w-full" />
                </div>

                {/* Champion */}
                <ChampionCard bp={finalWinner} />
              </div>

              {/* Mobile bracket (stacked) */}
              <div className="sm:hidden space-y-6">
                <div className="space-y-4">
                  <BracketMatchup top={sf1top} bottom={sf1bottom} label="Semi-Final 1 (1 vs 4)" winner={null} />
                  <BracketMatchup top={sf2top} bottom={sf2bottom} label="Semi-Final 2 (2 vs 3)" winner={null} />
                </div>

                <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
                  <div className="flex-1 h-px bg-[var(--border-color)]" />
                  <span>Final</span>
                  <div className="flex-1 h-px bg-[var(--border-color)]" />
                </div>

                <div className="rounded-xl overflow-hidden border border-[var(--gold)]/30 bg-[var(--gold)]/5">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-color)]">
                    <div className="w-7 h-7 rounded-lg bg-[var(--surface-2)] border border-[var(--border-color)] flex items-center justify-center text-xs text-[var(--muted)]">—</div>
                    <span className="text-sm text-[var(--muted)]">SF1 Winner</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-7 h-7 rounded-lg bg-[var(--surface-2)] border border-[var(--border-color)] flex items-center justify-center text-xs text-[var(--muted)]">—</div>
                    <span className="text-sm text-[var(--muted)]">SF2 Winner</span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ChampionCard bp={finalWinner} />
                </div>
              </div>
            </div>

            {/* Seedings table */}
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] overflow-hidden">
              <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--accent)]" />
                  Playoff Seeds
                </h2>
                <span className="text-xs text-[var(--muted)]">Based on standings</span>
              </div>
              <div className="p-3 space-y-1">
                {top4.map((bp, i) => {
                  const team = getTeamById(bp.player.teamId);
                  const matchLabel = i < 2 ? (i === 0 ? 'SF1 (vs #4)' : 'SF2 (vs #3)') : (i === 2 ? 'SF2 (vs #2)' : 'SF1 (vs #1)');
                  return (
                    <div key={bp.player.id} className={cn(
                      'flex items-center gap-3 py-2.5 px-4 rounded-lg border-l-2',
                      i === 0 ? 'border-l-amber-400 bg-amber-500/5' :
                      'border-l-emerald-500 bg-emerald-500/5',
                    )}>
                      <span className="text-sm font-black text-[var(--gold)] w-5">#{i + 1}</span>
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: bp.player.color }}
                      >
                        {bp.player.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">
                          <Link href={`/tournaments/${id}/players/${bp.player.id}`} className="hover:text-[var(--accent)] transition-colors">
                            {bp.player.name}
                          </Link>
                        </div>
                        <div className="text-xs text-[var(--muted)]">{team?.emoji} {team?.name}</div>
                      </div>
                      <div className="text-right text-xs text-[var(--muted)] shrink-0">
                        <div className="font-bold text-[var(--foreground)]">{bp.standing.points} pts</div>
                        <div>{matchLabel}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current standings for context */}
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] overflow-hidden">
              <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
                  Full Standings
                </h2>
                <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
                  <span>P</span><span>W/D/L</span><span>GD</span><span>Pts</span>
                </div>
              </div>
              <div className="p-3 space-y-1">
                {standings.map((entry, i) => (
                  <StandingsMiniRow key={entry.playerId} entry={entry} tournament={tournament} index={i} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--border-color)] p-12 text-center">
            <div className="text-5xl mb-4">🏟️</div>
            <h3 className="font-semibold mb-2">Not enough players for bracket</h3>
            <p className="text-sm text-[var(--muted)]">
              At least 4 players with completed matches are required to display a playoff bracket.
            </p>
            {standings.length > 0 && (
              <div className="mt-8 max-w-sm mx-auto text-left space-y-1">
                {standings.map((entry, i) => (
                  <StandingsMiniRow key={entry.playerId} entry={entry} tournament={tournament} index={i} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

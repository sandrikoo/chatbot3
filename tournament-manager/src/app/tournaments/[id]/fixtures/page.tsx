'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { TournamentNav } from '@/components/layout/navbar';
import { useTournamentStore } from '@/lib/store';
import { getTeamById } from '@/lib/teams';
import { cn, generateId } from '@/lib/utils';
import {
  Fixture,
  Tournament,
  MatchResult,
  GoalEvent,
  GoalType,
  Player,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Trophy,
  Edit2,
  Eye,
  Target,
} from 'lucide-react';

// ─── Status helpers ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Fixture['status'] }) {
  const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    completed: {
      label: 'Completed',
      className: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    scheduled: {
      label: 'Scheduled',
      className: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
      icon: <Clock className="w-3 h-3" />,
    },
    postponed: {
      label: 'Postponed',
      className: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      icon: <AlertTriangle className="w-3 h-3" />,
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-red-500/20 text-red-400 border border-red-500/30',
      icon: <XCircle className="w-3 h-3" />,
    },
    live: {
      label: 'Live',
      className: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse',
      icon: <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />,
    },
    voided: {
      label: 'Voided',
      className: 'bg-red-500/20 text-red-400 border border-red-500/30',
      icon: <XCircle className="w-3 h-3" />,
    },
  };
  const c = config[status] ?? config.scheduled;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold', c.className)}>
      {c.icon}
      {c.label}
    </span>
  );
}

// ─── Match Detail Modal ───────────────────────────────────────────────────────

function MatchDetailModal({
  fixture,
  tournament,
  onClose,
  onEdit,
}: {
  fixture: Fixture;
  tournament: Tournament;
  onClose: () => void;
  onEdit: () => void;
}) {
  const result = fixture.result!;
  const homePl = tournament.players.find((p) => p.id === fixture.homePlayerId);
  const awayPl = tournament.players.find((p) => p.id === fixture.awayPlayerId);
  const homeTeam = homePl ? getTeamById(homePl.teamId) : null;
  const awayTeam = awayPl ? getTeamById(awayPl.teamId) : null;
  const potm = tournament.players.find((p) => p.id === result.playerOfMatchId);

  const getPlayerName = (id: string) =>
    tournament.players.find((p) => p.id === id)?.name ?? 'Unknown';

  const goalTypeLabel: Record<GoalType, string> = {
    normal: '',
    penalty: '(P)',
    'own-goal': '(OG)',
    'free-kick': '(FK)',
    header: '(H)',
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Match Details</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2 space-y-6">
          {/* Score */}
          <div className="flex items-center justify-center gap-6 py-4">
            <div className="flex flex-col items-center gap-2 flex-1">
              {homeTeam && (
                <span className="text-3xl">{homeTeam.emoji}</span>
              )}
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: homePl?.color ?? '#64748b' }}
              />
              <span className="font-semibold text-sm text-[var(--foreground)]">
                {homePl?.name ?? 'Home'}
              </span>
              <span className="text-xs text-[var(--muted)]">{homeTeam?.shortName}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-3">
                <span className="text-5xl font-black text-[var(--foreground)]">{result.homeScore}</span>
                <span className="text-2xl text-[var(--muted)]">-</span>
                <span className="text-5xl font-black text-[var(--foreground)]">{result.awayScore}</span>
              </div>
              <StatusBadge status="completed" />
            </div>
            <div className="flex flex-col items-center gap-2 flex-1">
              {awayTeam && (
                <span className="text-3xl">{awayTeam.emoji}</span>
              )}
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: awayPl?.color ?? '#64748b' }}
              />
              <span className="font-semibold text-sm text-[var(--foreground)]">
                {awayPl?.name ?? 'Away'}
              </span>
              <span className="text-xs text-[var(--muted)]">{awayTeam?.shortName}</span>
            </div>
          </div>

          {/* Goal scorers */}
          {result.goals.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                Goals
              </h4>
              <div className="space-y-1.5">
                {result.goals.map((g) => (
                  <div key={g.id} className="flex items-center gap-2 text-sm">
                    <Target className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                    <span className="text-[var(--foreground)]">
                      {getPlayerName(g.scorerId)}
                      {g.type !== 'normal' && (
                        <span className="text-[var(--muted)] ml-1">{goalTypeLabel[g.type]}</span>
                      )}
                    </span>
                    {g.assistId && (
                      <span className="text-[var(--muted)] text-xs">
                        (assist: {getPlayerName(g.assistId)})
                      </span>
                    )}
                    {g.minute && (
                      <span className="ml-auto text-[var(--muted)] text-xs">{g.minute}&apos;</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cards */}
          {(result.homeCards.length > 0 || result.awayCards.length > 0) && (
            <div>
              <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                Cards
              </h4>
              <div className="space-y-1.5">
                {[...result.homeCards, ...result.awayCards].map((c) => (
                  <div key={c.id} className="flex items-center gap-2 text-sm">
                    <span
                      className={cn(
                        'w-3 h-4 rounded-sm shrink-0',
                        c.type === 'yellow' ? 'bg-yellow-400' :
                        c.type === 'red' ? 'bg-red-500' :
                        'bg-orange-500'
                      )}
                    />
                    <span className="text-[var(--foreground)]">{getPlayerName(c.playerId)}</span>
                    {c.minute && (
                      <span className="ml-auto text-[var(--muted)] text-xs">{c.minute}&apos;</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* POTM */}
          {potm && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)]">
              <Trophy className="w-4 h-4 text-[var(--gold)] shrink-0" />
              <div>
                <p className="text-xs text-[var(--muted)]">Player of the Match</p>
                <p className="font-semibold text-sm">{potm.name}</p>
              </div>
            </div>
          )}

          {/* Clean sheets */}
          {(result.homeCleanSheet || result.awayCleanSheet) && (
            <div className="flex gap-2 flex-wrap">
              {result.homeCleanSheet && (
                <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {homePl?.name} — Clean Sheet
                </span>
              )}
              {result.awayCleanSheet && (
                <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {awayPl?.name} — Clean Sheet
                </span>
              )}
            </div>
          )}

          {/* Notes */}
          {result.notes && (
            <div>
              <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">
                Notes
              </h4>
              <p className="text-sm text-[var(--foreground)] italic">{result.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="secondary" size="sm" onClick={onEdit}>
            <Edit2 className="w-3.5 h-3.5" />
            Edit Result
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Match Result Modal ───────────────────────────────────────────────────────

interface GoalEntry {
  id: string;
  scorerId: string;
  assistId: string;
  type: GoalType;
  minute: string;
}

function MatchResultModal({
  fixture,
  tournament,
  onClose,
  onSave,
}: {
  fixture: Fixture;
  tournament: Tournament;
  onClose: () => void;
  onSave: (result: MatchResult) => void;
}) {
  const homePl = tournament.players.find((p) => p.id === fixture.homePlayerId);
  const awayPl = tournament.players.find((p) => p.id === fixture.awayPlayerId);
  const homeTeam = homePl ? getTeamById(homePl.teamId) : null;
  const awayTeam = awayPl ? getTeamById(awayPl.teamId) : null;

  const existingResult = fixture.result;

  const [homeScore, setHomeScore] = useState(
    existingResult ? String(existingResult.homeScore) : '0'
  );
  const [awayScore, setAwayScore] = useState(
    existingResult ? String(existingResult.awayScore) : '0'
  );
  const [goals, setGoals] = useState<GoalEntry[]>(() => {
    if (!existingResult) return [];
    return existingResult.goals.map((g) => ({
      id: g.id,
      scorerId: g.scorerId,
      assistId: g.assistId ?? '',
      type: g.type,
      minute: g.minute ? String(g.minute) : '',
    }));
  });
  const [potmId, setPotmId] = useState(existingResult?.playerOfMatchId ?? '');
  const [homeCleanSheet, setHomeCleanSheet] = useState(existingResult?.homeCleanSheet ?? false);
  const [awayCleanSheet, setAwayCleanSheet] = useState(existingResult?.awayCleanSheet ?? false);
  const [notes, setNotes] = useState(existingResult?.notes ?? '');
  const [saving, setSaving] = useState(false);

  const allPlayers = tournament.players;

  const addGoal = () => {
    setGoals((prev) => [
      ...prev,
      { id: generateId(), scorerId: fixture.homePlayerId, assistId: '', type: 'normal', minute: '' },
    ]);
  };

  const removeGoal = (id: string) => setGoals((prev) => prev.filter((g) => g.id !== id));

  const updateGoal = (id: string, field: keyof GoalEntry, value: string) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  };

  const handleSave = () => {
    setSaving(true);
    const hs = parseInt(homeScore) || 0;
    const as_ = parseInt(awayScore) || 0;

    const goalEvents: GoalEvent[] = goals.map((g) => ({
      id: g.id,
      scorerId: g.scorerId,
      assistId: g.assistId || undefined,
      minute: g.minute ? parseInt(g.minute) : undefined,
      type: g.type,
      isOwnGoal: g.type === 'own-goal',
    }));

    const result: MatchResult = {
      homeScore: hs,
      awayScore: as_,
      goals: goalEvents,
      homeCards: existingResult?.homeCards ?? [],
      awayCards: existingResult?.awayCards ?? [],
      playerOfMatchId: potmId || undefined,
      notes: notes || undefined,
      extraTime: false,
      homeCleanSheet: homeCleanSheet || as_ === 0,
      awayCleanSheet: awayCleanSheet || hs === 0,
      enteredAt: existingResult?.enteredAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(result);
  };

  const goalTypeOptions: { value: GoalType; label: string }[] = [
    { value: 'normal', label: 'Normal' },
    { value: 'penalty', label: 'Penalty' },
    { value: 'free-kick', label: 'Free Kick' },
    { value: 'header', label: 'Header' },
    { value: 'own-goal', label: 'Own Goal' },
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {existingResult ? 'Edit Result' : 'Enter Result'}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2 space-y-6 overflow-y-auto">
          {/* Score inputs */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className="flex items-center gap-2">
                {homeTeam && <span>{homeTeam.emoji}</span>}
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: homePl?.color ?? '#64748b' }}
                />
                <span className="font-semibold text-sm">{homePl?.name}</span>
              </div>
              <input
                type="number"
                min={0}
                max={99}
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className="w-24 h-16 text-center text-4xl font-black rounded-xl border border-[var(--border-color)] bg-[var(--surface-2)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <div className="text-2xl text-[var(--muted)] font-bold">—</div>
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className="flex items-center gap-2">
                {awayTeam && <span>{awayTeam.emoji}</span>}
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: awayPl?.color ?? '#64748b' }}
                />
                <span className="font-semibold text-sm">{awayPl?.name}</span>
              </div>
              <input
                type="number"
                min={0}
                max={99}
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className="w-24 h-16 text-center text-4xl font-black rounded-xl border border-[var(--border-color)] bg-[var(--surface-2)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
          </div>

          {/* Goal scorers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-[var(--foreground)]">Goal Scorers</h4>
              <Button variant="outline" size="sm" onClick={addGoal}>
                <Plus className="w-3.5 h-3.5" />
                Add Goal
              </Button>
            </div>
            {goals.length === 0 ? (
              <p className="text-sm text-[var(--muted)] text-center py-4">
                No goals added yet. Click &quot;Add Goal&quot; to record scorers.
              </p>
            ) : (
              <div className="space-y-3">
                {goals.map((g, i) => (
                  <div key={g.id} className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-color)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[var(--muted)]">Goal {i + 1}</span>
                      <button
                        onClick={() => removeGoal(g.id)}
                        className="text-[var(--muted)] hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-[var(--muted)] mb-1 block">Scorer</label>
                        <select
                          value={g.scorerId}
                          onChange={(e) => updateGoal(g.id, 'scorerId', e.target.value)}
                          className="w-full h-9 px-2 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        >
                          {allPlayers.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-[var(--muted)] mb-1 block">Assist (optional)</label>
                        <select
                          value={g.assistId}
                          onChange={(e) => updateGoal(g.id, 'assistId', e.target.value)}
                          className="w-full h-9 px-2 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        >
                          <option value="">None</option>
                          {allPlayers.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-[var(--muted)] mb-1 block">Type</label>
                        <select
                          value={g.type}
                          onChange={(e) => updateGoal(g.id, 'type', e.target.value)}
                          className="w-full h-9 px-2 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        >
                          {goalTypeOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-[var(--muted)] mb-1 block">Minute (optional)</label>
                        <input
                          type="number"
                          min={1}
                          max={120}
                          placeholder="e.g. 45"
                          value={g.minute}
                          onChange={(e) => updateGoal(g.id, 'minute', e.target.value)}
                          className="w-full h-9 px-2 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* POTM */}
          <div>
            <label className="text-sm font-semibold text-[var(--foreground)] block mb-2">
              Player of the Match
            </label>
            <select
              value={potmId}
              onChange={(e) => setPotmId(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--surface-2)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="">None</option>
              {allPlayers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Clean sheets */}
          <div>
            <label className="text-sm font-semibold text-[var(--foreground)] block mb-2">
              Clean Sheets
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={homeCleanSheet}
                  onChange={(e) => setHomeCleanSheet(e.target.checked)}
                  className="w-4 h-4 rounded accent-[var(--accent)]"
                />
                <span className="text-sm">{homePl?.name} clean sheet</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={awayCleanSheet}
                  onChange={(e) => setAwayCleanSheet(e.target.checked)}
                  className="w-4 h-4 rounded accent-[var(--accent)]"
                />
                <span className="text-sm">{awayPl?.name} clean sheet</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-semibold text-[var(--foreground)] block mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any notes about this match..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--surface-2)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Result'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Fixture Card ─────────────────────────────────────────────────────────────

function FixtureCard({
  fixture,
  tournament,
  onEnterResult,
  onViewDetails,
}: {
  fixture: Fixture;
  tournament: Tournament;
  onEnterResult: (f: Fixture) => void;
  onViewDetails: (f: Fixture) => void;
}) {
  const homePl = tournament.players.find((p) => p.id === fixture.homePlayerId);
  const awayPl = tournament.players.find((p) => p.id === fixture.awayPlayerId);
  const homeTeam = homePl ? getTeamById(homePl.teamId) : null;
  const awayTeam = awayPl ? getTeamById(awayPl.teamId) : null;

  const isCompleted = fixture.status === 'completed' && fixture.result;

  return (
    <div
      className={cn(
        'rounded-xl border bg-[var(--surface)] transition-all hover:border-[var(--accent)]/40',
        isCompleted ? 'border-[var(--border-color)]' : 'border-[var(--border-color)]/60'
      )}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Home player */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: homePl?.color ?? '#64748b' }}
            />
            <div className="min-w-0">
              <p className="font-semibold text-sm text-[var(--foreground)] truncate">
                {homePl?.name ?? 'TBD'}
              </p>
              {homeTeam && (
                <p className="text-xs text-[var(--muted)]">
                  {homeTeam.emoji} {homeTeam.shortName}
                </p>
              )}
            </div>
          </div>

          {/* Score or vs */}
          <div className="flex flex-col items-center gap-1 px-2 shrink-0">
            {isCompleted ? (
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-[var(--foreground)]">
                  {fixture.result!.homeScore}
                </span>
                <span className="text-[var(--muted)] text-sm">-</span>
                <span className="text-3xl font-black text-[var(--foreground)]">
                  {fixture.result!.awayScore}
                </span>
              </div>
            ) : (
              <span className="text-lg font-semibold text-[var(--muted)]">vs</span>
            )}
            <StatusBadge status={fixture.status} />
          </div>

          {/* Away player */}
          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end text-right">
            <div className="min-w-0">
              <p className="font-semibold text-sm text-[var(--foreground)] truncate">
                {awayPl?.name ?? 'TBD'}
              </p>
              {awayTeam && (
                <p className="text-xs text-[var(--muted)]">
                  {awayTeam.shortName} {awayTeam.emoji}
                </p>
              )}
            </div>
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: awayPl?.color ?? '#64748b' }}
            />
          </div>
        </div>

        {/* POTM */}
        {isCompleted && fixture.result?.playerOfMatchId && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--gold)]">
            <Trophy className="w-3 h-3" />
            <span>
              POTM: {tournament.players.find((p) => p.id === fixture.result?.playerOfMatchId)?.name}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-3 flex items-center justify-end gap-2">
        {isCompleted ? (
          <>
            <Button variant="ghost" size="sm" onClick={() => onViewDetails(fixture)}>
              <Eye className="w-3.5 h-3.5" />
              View Details
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onEnterResult(fixture)}>
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </Button>
          </>
        ) : fixture.status === 'scheduled' ? (
          <Button size="sm" onClick={() => onEnterResult(fixture)}>
            <Plus className="w-3.5 h-3.5" />
            Enter Result
          </Button>
        ) : null}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type FilterType = 'all' | 'completed' | 'upcoming';

export default function FixturesPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const { getTournamentById, updateFixtureResult } = useTournamentStore();
  const tournament = getTournamentById(tournamentId);

  const [selectedRound, setSelectedRound] = useState(1);
  const [filter, setFilter] = useState<FilterType>('all');
  const [resultModalFixture, setResultModalFixture] = useState<Fixture | null>(null);
  const [detailModalFixture, setDetailModalFixture] = useState<Fixture | null>(null);

  const rounds = useMemo(() => {
    if (!tournament) return [];
    const roundSet = new Set(tournament.fixtures.map((f) => f.round));
    return Array.from(roundSet).sort((a, b) => a - b);
  }, [tournament]);

  const filteredFixtures = useMemo(() => {
    if (!tournament) return [];
    return tournament.fixtures.filter((f) => {
      if (f.round !== selectedRound) return false;
      if (filter === 'completed') return f.status === 'completed';
      if (filter === 'upcoming') return f.status === 'scheduled' || f.status === 'postponed';
      return true;
    });
  }, [tournament, selectedRound, filter]);

  const stats = useMemo(() => {
    if (!tournament) return { played: 0, total: 0 };
    return {
      played: tournament.fixtures.filter((f) => f.status === 'completed').length,
      total: tournament.fixtures.length,
    };
  }, [tournament]);

  const roundProgress = useMemo(() => {
    if (!tournament) return 0;
    const roundFixtures = tournament.fixtures.filter((f) => f.round === selectedRound);
    if (roundFixtures.length === 0) return 0;
    const completed = roundFixtures.filter((f) => f.status === 'completed').length;
    return Math.round((completed / roundFixtures.length) * 100);
  }, [tournament, selectedRound]);

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--muted)]">Tournament not found.</p>
      </div>
    );
  }

  if (tournament.fixtures.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <TournamentNav tournamentId={tournamentId} />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-4xl mb-4">📅</p>
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">No Fixtures Yet</h2>
          <p className="text-[var(--muted)]">
            Fixtures will appear here once the tournament has started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <TournamentNav tournamentId={tournamentId} />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header stats */}
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Fixtures</h1>
            <p className="text-sm text-[var(--muted)] mt-0.5">
              {tournament.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center px-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border-color)]">
              <p className="text-xs text-[var(--muted)]">Played</p>
              <p className="text-xl font-black text-[var(--foreground)]">
                {stats.played}
                <span className="text-sm font-normal text-[var(--muted)]">/{stats.total}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'completed', 'upcoming'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize',
                filter === f
                  ? 'bg-[var(--accent)] text-black'
                  : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border-color)] hover:text-[var(--foreground)]'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Round selector */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setSelectedRound((r) => Math.max(rounds[0] ?? 1, r - 1))}
              disabled={selectedRound <= (rounds[0] ?? 1)}
              className="p-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border-color)] text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1">
              {rounds.map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRound(r)}
                  className={cn(
                    'shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    selectedRound === r
                      ? 'bg-[var(--accent)] text-black'
                      : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border-color)] hover:text-[var(--foreground)]'
                  )}
                >
                  Round {r}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSelectedRound((r) => Math.min(rounds[rounds.length - 1] ?? 1, r + 1))}
              disabled={selectedRound >= (rounds[rounds.length - 1] ?? 1)}
              className="p-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border-color)] text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Round progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                style={{ width: `${roundProgress}%` }}
              />
            </div>
            <span className="text-xs text-[var(--muted)] shrink-0">{roundProgress}% done</span>
          </div>
        </div>

        {/* Fixtures list */}
        <div className="space-y-3">
          {filteredFixtures.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--muted)]">No fixtures match this filter.</p>
            </div>
          ) : (
            filteredFixtures.map((fixture) => (
              <FixtureCard
                key={fixture.id}
                fixture={fixture}
                tournament={tournament}
                onEnterResult={(f) => setResultModalFixture(f)}
                onViewDetails={(f) => setDetailModalFixture(f)}
              />
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      {resultModalFixture && (
        <MatchResultModal
          fixture={resultModalFixture}
          tournament={tournament}
          onClose={() => setResultModalFixture(null)}
          onSave={(result) => {
            updateFixtureResult(tournamentId, resultModalFixture.id, result);
            setResultModalFixture(null);
          }}
        />
      )}

      {detailModalFixture && !resultModalFixture && (
        <MatchDetailModal
          fixture={detailModalFixture}
          tournament={tournament}
          onClose={() => setDetailModalFixture(null)}
          onEdit={() => {
            setResultModalFixture(detailModalFixture);
            setDetailModalFixture(null);
          }}
        />
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Check, ChevronRight, ChevronLeft, Trophy } from 'lucide-react';
import { useTournamentStore } from '@/lib/store';
import { AVAILABLE_TEAMS } from '@/lib/teams';
import { PLAYER_COLORS, generateId, getPlayerColor, cn } from '@/lib/utils';
import { TournamentFormat, TiebreakerType, Tournament, Player, Team } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ---- Types ----

interface WizardPlayer {
  id: string;
  name: string;
  color: string;
  teamId: string;
}

interface WizardState {
  name: string;
  season: string;
  description: string;
  format: TournamentFormat;
  players: WizardPlayer[];
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  tiebreakers: TiebreakerType[];
  allowDuplicateTeams: boolean;
  twoLeggedKnockout: boolean;
  hasThirdPlace: boolean;
}

const FORMAT_OPTIONS: { value: TournamentFormat; label: string; description: string; icon: string }[] = [
  {
    value: 'round-robin',
    label: 'Round Robin',
    description: 'Each player faces every other player once. Classic league format.',
    icon: '🔄',
  },
  {
    value: 'double-round-robin',
    label: 'Double Round Robin',
    description: 'Home & away legs for each matchup. Most comprehensive format.',
    icon: '🔁',
  },
  {
    value: 'group-knockout',
    label: 'Group + Knockout',
    description: 'Group stage followed by knockout rounds. World Cup style.',
    icon: '⚡',
  },
  {
    value: 'league-playoffs',
    label: 'League + Playoffs',
    description: 'Full season followed by playoff bracket for top finishers.',
    icon: '🏆',
  },
];

const TIEBREAKER_OPTIONS: { value: TiebreakerType; label: string }[] = [
  { value: 'points', label: 'Points' },
  { value: 'goalDifference', label: 'Goal Difference' },
  { value: 'goalsFor', label: 'Goals Scored' },
  { value: 'headToHead', label: 'Head to Head' },
  { value: 'headToHeadGoalDiff', label: 'H2H Goal Difference' },
  { value: 'wins', label: 'Wins' },
];

const STEP_LABELS = ['Basic Info', 'Players', 'Teams', 'Settings'];

// ---- Step indicator ----

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <React.Fragment key={i}>
          <div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all',
              i < step
                ? 'bg-[var(--accent)] text-black'
                : i === step
                ? 'bg-[var(--accent)] text-black ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--background)]'
                : 'bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--border-color)]'
            )}
          >
            {i < step ? <Check className="w-4 h-4" /> : i + 1}
          </div>
          <div className="flex flex-col min-w-0">
            <span className={cn('text-xs font-medium leading-none', i === step ? 'text-[var(--foreground)]' : 'text-[var(--muted)]')}>
              {STEP_LABELS[i]}
            </span>
          </div>
          {i < total - 1 && (
            <div className={cn('flex-1 h-px transition-colors', i < step ? 'bg-[var(--accent)]' : 'bg-[var(--border-color)]')} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ---- Step 1: Basic Info ----

function StepBasicInfo({ state, onChange }: { state: WizardState; onChange: (updates: Partial<WizardState>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Tournament Details</h2>
        <p className="text-[var(--muted)] text-sm">Set up the basics of your tournament.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Tournament Name <span className="text-red-400">*</span></label>
          <Input
            placeholder="e.g. Friday Night League"
            value={state.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Season</label>
          <Input
            placeholder="e.g. Season 1 · 2026"
            value={state.season}
            onChange={(e) => onChange({ season: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <textarea
            className="flex w-full rounded-lg border border-[var(--border-color)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] min-h-[80px] resize-none"
            placeholder="Optional description..."
            value={state.description}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-3">Format <span className="text-red-400">*</span></label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ format: opt.value })}
              className={cn(
                'flex items-start gap-3 p-4 rounded-xl border text-left transition-all',
                state.format === opt.value
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]'
                  : 'border-[var(--border-color)] bg-[var(--surface)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)]'
              )}
            >
              <span className="text-2xl shrink-0">{opt.icon}</span>
              <div>
                <div className="font-semibold text-sm text-[var(--foreground)]">{opt.label}</div>
                <div className="text-xs text-[var(--muted)] mt-0.5 leading-relaxed">{opt.description}</div>
              </div>
              {state.format === opt.value && (
                <Check className="w-4 h-4 text-[var(--accent)] ml-auto shrink-0 mt-0.5" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Step 2: Players ----

function StepPlayers({ state, onChange }: { state: WizardState; onChange: (updates: Partial<WizardState>) => void }) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(getPlayerColor(state.players.length));

  function addPlayer() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (state.players.length >= 10) return;
    const player: WizardPlayer = {
      id: generateId(),
      name: trimmed,
      color: newColor,
      teamId: '',
    };
    const nextColor = getPlayerColor(state.players.length + 1);
    onChange({ players: [...state.players, player] });
    setNewName('');
    setNewColor(nextColor);
  }

  function removePlayer(id: string) {
    onChange({ players: state.players.filter((p) => p.id !== id) });
  }

  function updatePlayerName(id: string, name: string) {
    onChange({
      players: state.players.map((p) => (p.id === id ? { ...p, name } : p)),
    });
  }

  function updatePlayerColor(id: string, color: string) {
    onChange({
      players: state.players.map((p) => (p.id === id ? { ...p, color } : p)),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Add Players</h2>
        <p className="text-[var(--muted)] text-sm">Add 2–10 players. Each needs a unique name and color.</p>
      </div>

      {/* Add player form */}
      <Card className="border-[var(--border-color)]">
        <CardContent className="p-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Player Name</label>
              <Input
                placeholder="Enter name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Color</label>
              <div className="flex gap-1.5 flex-wrap w-[180px]">
                {PLAYER_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={cn(
                      'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                      newColor === c ? 'border-white scale-110' : 'border-transparent'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <Button
              type="button"
              onClick={addPlayer}
              disabled={!newName.trim() || state.players.length >= 10}
              className="shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Player list */}
      {state.players.length > 0 ? (
        <div className="space-y-2">
          {state.players.map((player, idx) => (
            <div
              key={player.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border-color)]"
            >
              <span className="w-6 h-6 rounded-full shrink-0 border-2 border-white/20" style={{ backgroundColor: player.color }} />
              <span className="text-sm text-[var(--muted)] w-5 shrink-0">{idx + 1}</span>
              <Input
                value={player.name}
                onChange={(e) => updatePlayerName(player.id, e.target.value)}
                className="flex-1 h-8 text-sm"
              />
              <div className="flex gap-1 flex-wrap w-[100px] shrink-0">
                {PLAYER_COLORS.slice(0, 8).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updatePlayerColor(player.id, c)}
                    className={cn(
                      'w-4 h-4 rounded-full border transition-transform hover:scale-110',
                      player.color === c ? 'border-white scale-110' : 'border-transparent'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => removePlayer(player.id)}
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 rounded-xl border border-dashed border-[var(--border-color)]">
          <p className="text-[var(--muted)] text-sm">No players added yet. Add at least 2 to continue.</p>
        </div>
      )}

      <p className="text-xs text-[var(--muted)]">{state.players.length}/10 players added</p>
    </div>
  );
}

// ---- Step 3: Teams ----

function StepTeams({ state, onChange }: { state: WizardState; onChange: (updates: Partial<WizardState>) => void }) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(state.players[0]?.id ?? '');

  const selectedPlayer = state.players.find((p) => p.id === selectedPlayerId);
  const assignedTeamIds = state.players
    .filter((p) => p.id !== selectedPlayerId)
    .map((p) => p.teamId)
    .filter(Boolean);

  function assignTeam(teamId: string) {
    onChange({
      players: state.players.map((p) =>
        p.id === selectedPlayerId ? { ...p, teamId } : p
      ),
    });
    // Auto-advance to next player without a team
    const nextPlayer = state.players.find(
      (p) => p.id !== selectedPlayerId && !p.teamId
    );
    if (nextPlayer) setSelectedPlayerId(nextPlayer.id);
  }

  const clubs = AVAILABLE_TEAMS.filter((t) => t.type === 'club');
  const nationals = AVAILABLE_TEAMS.filter((t) => t.type === 'national');

  function TeamGrid({ teams, title }: { teams: Team[]; title: string }) {
    return (
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">{title}</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {teams.map((team) => {
            const isAssigned = assignedTeamIds.includes(team.id);
            const isSelected = selectedPlayer?.teamId === team.id;
            return (
              <button
                key={team.id}
                type="button"
                disabled={isAssigned}
                onClick={() => assignTeam(team.id)}
                className={cn(
                  'flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all text-sm',
                  isSelected
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]'
                    : isAssigned
                    ? 'border-[var(--border-color)] bg-[var(--surface)] opacity-40 cursor-not-allowed'
                    : 'border-[var(--border-color)] bg-[var(--surface)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)]'
                )}
              >
                <span className="text-xl shrink-0">{team.emoji}</span>
                <div className="min-w-0">
                  <div className="font-medium text-xs truncate">{team.name}</div>
                  <div className="text-xs text-[var(--muted)] truncate">{team.league ?? team.country}</div>
                </div>
                {isSelected && <Check className="w-3 h-3 text-[var(--accent)] shrink-0 ml-auto" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Assign Teams</h2>
        <p className="text-[var(--muted)] text-sm">Select one team per player.</p>
      </div>

      {/* Player selector */}
      <div className="flex flex-wrap gap-2">
        {state.players.map((player) => (
          <button
            key={player.id}
            type="button"
            onClick={() => setSelectedPlayerId(player.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all',
              selectedPlayerId === player.id
                ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--foreground)]'
                : 'border-[var(--border-color)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]'
            )}
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: player.color }} />
            {player.name}
            {player.teamId && (
              <span className="text-xs ml-1">
                {AVAILABLE_TEAMS.find((t) => t.id === player.teamId)?.emoji}
              </span>
            )}
          </button>
        ))}
      </div>

      {selectedPlayer && (
        <div className="text-sm text-[var(--muted)]">
          Selecting team for:{' '}
          <span className="font-semibold text-[var(--foreground)]">{selectedPlayer.name}</span>
          {selectedPlayer.teamId ? (
            <span className="ml-2 text-[var(--accent)]">
              ✓ {AVAILABLE_TEAMS.find((t) => t.id === selectedPlayer.teamId)?.name}
            </span>
          ) : (
            <span className="ml-2 text-amber-400">— No team selected</span>
          )}
        </div>
      )}

      <div className="max-h-[420px] overflow-y-auto pr-1">
        <TeamGrid teams={clubs} title="Club Teams" />
        <TeamGrid teams={nationals} title="National Teams" />
      </div>
    </div>
  );
}

// ---- Step 4: Settings ----

function StepSettings({ state, onChange }: { state: WizardState; onChange: (updates: Partial<WizardState>) => void }) {
  function toggleTiebreaker(tb: TiebreakerType) {
    if (state.tiebreakers.includes(tb)) {
      onChange({ tiebreakers: state.tiebreakers.filter((t) => t !== tb) });
    } else {
      onChange({ tiebreakers: [...state.tiebreakers, tb] });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Settings</h2>
        <p className="text-[var(--muted)] text-sm">Configure points and tiebreaker rules.</p>
      </div>

      {/* Points system */}
      <Card className="border-[var(--border-color)]">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-sm">Points System</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Win', key: 'pointsWin' as const, defaultVal: 3 },
              { label: 'Draw', key: 'pointsDraw' as const, defaultVal: 1 },
              { label: 'Loss', key: 'pointsLoss' as const, defaultVal: 0 },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs text-[var(--muted)] mb-1.5">{label}</label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={state[key]}
                  onChange={(e) => onChange({ [key]: parseInt(e.target.value) || 0 })}
                  className="text-center"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tiebreakers */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Tiebreakers <span className="text-[var(--muted)] font-normal">(order matters)</span></h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TIEBREAKER_OPTIONS.map((opt) => {
            const isActive = state.tiebreakers.includes(opt.value);
            const idx = state.tiebreakers.indexOf(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleTiebreaker(opt.value)}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-medium transition-all',
                  isActive
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--foreground)]'
                    : 'border-[var(--border-color)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)]/50'
                )}
              >
                <span>{opt.label}</span>
                {isActive && (
                  <span className="w-5 h-5 rounded-full bg-[var(--accent)] text-black text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Options */}
      <Card className="border-[var(--border-color)]">
        <CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-sm mb-2">Options</h3>
          {[
            { key: 'allowDuplicateTeams' as const, label: 'Allow duplicate teams', description: 'Multiple players can use the same team' },
            { key: 'twoLeggedKnockout' as const, label: 'Two-legged knockout', description: 'Knockout ties played home & away' },
            { key: 'hasThirdPlace' as const, label: 'Third place match', description: 'Play a match for 3rd/4th place' },
          ].map(({ key, label, description }) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer">
              <div
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                  state[key]
                    ? 'bg-[var(--accent)] border-[var(--accent)]'
                    : 'border-[var(--border-color)] bg-[var(--surface-2)]'
                )}
                onClick={() => onChange({ [key]: !state[key] })}
              >
                {state[key] && <Check className="w-3 h-3 text-black" />}
              </div>
              <div>
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs text-[var(--muted)]">{description}</div>
              </div>
            </label>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Summary ----

function SummaryStep({ state }: { state: WizardState }) {
  const formatOpt = FORMAT_OPTIONS.find((f) => f.value === state.format);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold mb-1">Ready to create!</h2>
        <p className="text-[var(--muted)] text-sm">Review your tournament settings.</p>
      </div>
      <Card className="border-[var(--border-color)]">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-emerald-600 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{state.name}</h3>
              {state.season && <p className="text-sm text-[var(--muted)]">{state.season}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-color)]">
              <div className="text-xs text-[var(--muted)] mb-1">Format</div>
              <div className="text-sm font-semibold">{formatOpt?.icon} {formatOpt?.label}</div>
            </div>
            <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-color)]">
              <div className="text-xs text-[var(--muted)] mb-1">Players</div>
              <div className="text-sm font-semibold">{state.players.length} players</div>
            </div>
            <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-color)]">
              <div className="text-xs text-[var(--muted)] mb-1">Points (W/D/L)</div>
              <div className="text-sm font-semibold">{state.pointsWin} / {state.pointsDraw} / {state.pointsLoss}</div>
            </div>
            <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-color)]">
              <div className="text-xs text-[var(--muted)] mb-1">Tiebreakers</div>
              <div className="text-sm font-semibold">{state.tiebreakers.length} rules</div>
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--muted)] mb-2">Players & Teams</div>
            <div className="space-y-1.5">
              {state.players.map((p) => {
                const team = AVAILABLE_TEAMS.find((t) => t.id === p.teamId);
                return (
                  <div key={p.id} className="flex items-center gap-2 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="font-medium">{p.name}</span>
                    {team ? (
                      <span className="text-[var(--muted)]">— {team.emoji} {team.name}</span>
                    ) : (
                      <Badge variant="amber" className="text-xs">No team</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Main Wizard ----

const DEFAULT_STATE: WizardState = {
  name: '',
  season: '',
  description: '',
  format: 'round-robin',
  players: [],
  pointsWin: 3,
  pointsDraw: 1,
  pointsLoss: 0,
  tiebreakers: ['points', 'goalDifference', 'goalsFor', 'headToHead'],
  allowDuplicateTeams: false,
  twoLeggedKnockout: false,
  hasThirdPlace: false,
};

export default function NewTournamentPage() {
  const router = useRouter();
  const { addTournament, startTournament } = useTournamentStore();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(DEFAULT_STATE);
  const [error, setError] = useState('');

  function updateState(updates: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...updates }));
    setError('');
  }

  function validateStep(s: number): string {
    if (s === 0) {
      if (!state.name.trim()) return 'Tournament name is required.';
    }
    if (s === 1) {
      if (state.players.length < 2) return 'Add at least 2 players.';
      const names = state.players.map((p) => p.name.trim().toLowerCase());
      if (new Set(names).size !== names.length) return 'Player names must be unique.';
    }
    if (s === 2) {
      const missing = state.players.filter((p) => !p.teamId);
      if (missing.length > 0) return `Assign a team to: ${missing.map((p) => p.name).join(', ')}`;
    }
    return '';
  }

  function next() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setStep((s) => Math.min(s + 1, STEP_LABELS.length));
  }

  function back() {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleCreate() {
    const err = validateStep(step);
    if (err) { setError(err); return; }

    const now = new Date().toISOString();
    const players: Player[] = state.players.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      teamId: p.teamId,
      joinedAt: now,
    }));

    const tournament: Tournament = {
      id: generateId(),
      name: state.name.trim(),
      season: state.season.trim() || undefined,
      description: state.description.trim() || undefined,
      format: state.format,
      status: 'setup',
      createdAt: now,
      updatedAt: now,
      players,
      fixtures: [],
      currentRound: 0,
      totalRounds: 0,
      settings: {
        allowDuplicateTeams: state.allowDuplicateTeams,
        pointsWin: state.pointsWin,
        pointsDraw: state.pointsDraw,
        pointsLoss: state.pointsLoss,
        tiebreakers: state.tiebreakers,
        awayGoals: false,
        twoLeggedKnockout: state.twoLeggedKnockout,
        playersCount: players.length,
        teamsPool: players
          .map((p) => AVAILABLE_TEAMS.find((t) => t.id === p.teamId))
          .filter((t): t is NonNullable<typeof t> => Boolean(t)),
        hasThirdPlace: state.hasThirdPlace,
      },
    };

    addTournament(tournament);
    startTournament(tournament.id);
    router.push(`/tournaments/${tournament.id}`);
  }

  const isFinalStep = step === STEP_LABELS.length - 1;
  const isSummary = step === STEP_LABELS.length;

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[var(--muted)] text-sm mb-4">
          <button type="button" onClick={() => router.push('/')} className="hover:text-[var(--foreground)] transition-colors">
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[var(--foreground)]">New Tournament</span>
        </div>
        <StepIndicator step={isSummary ? STEP_LABELS.length : step} total={STEP_LABELS.length} />
      </div>

      <div className="fade-up">
        {step === 0 && <StepBasicInfo state={state} onChange={updateState} />}
        {step === 1 && <StepPlayers state={state} onChange={updateState} />}
        {step === 2 && <StepTeams state={state} onChange={updateState} />}
        {step === 3 && <StepSettings state={state} onChange={updateState} />}
        {isSummary && <SummaryStep state={state} />}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border-color)]">
        <Button
          type="button"
          variant="ghost"
          onClick={step === 0 ? () => router.push('/') : back}
        >
          <ChevronLeft className="w-4 h-4" />
          {step === 0 ? 'Cancel' : 'Back'}
        </Button>

        {isSummary ? (
          <Button type="button" variant="premium" size="lg" onClick={handleCreate}>
            <Trophy className="w-5 h-5" />
            Create Tournament
          </Button>
        ) : (
          <Button type="button" onClick={isFinalStep ? next : next}>
            {isFinalStep ? 'Review' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

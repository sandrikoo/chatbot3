'use client';

import React, { useState, useRef } from 'react';
import {
  Settings, Download, Upload, Trash2, Info, Sun, Moon, Monitor,
  Check, AlertTriangle, RefreshCw, Shield,
} from 'lucide-react';
import { useTournamentStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// ---- Helpers ----

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <h2 className="text-base font-bold text-[var(--foreground)]">{title}</h2>
        {description && <p className="text-sm text-[var(--muted)] mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-6', className)}>
      {children}
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  description,
  color,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  description?: string;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className={cn('text-sm font-semibold', color ?? 'text-[var(--foreground)]')}>{label}</div>
        {description && <div className="text-xs text-[var(--muted)] mt-0.5">{description}</div>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onChange(Math.max(min ?? 0, value - 1))}
          className="w-7 h-7 rounded-lg bg-[var(--surface-2)] border border-[var(--border-color)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border-color)] transition-colors text-base font-bold leading-none"
          aria-label="Decrease"
        >
          −
        </button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            if (!isNaN(v)) onChange(Math.max(min ?? 0, Math.min(max ?? 99, v)));
          }}
          className="w-14 text-center bg-[var(--surface-2)] border border-[var(--border-color)] rounded-lg px-2 py-1.5 text-sm font-bold text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
        <button
          onClick={() => onChange(Math.min(max ?? 99, value + 1))}
          className="w-7 h-7 rounded-lg bg-[var(--surface-2)] border border-[var(--border-color)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border-color)] transition-colors text-base font-bold leading-none"
          aria-label="Increase"
        >
          +
        </button>
      </div>
    </div>
  );
}

type ThemeOption = 'dark' | 'light' | 'system';

function ThemeButton({
  value,
  current,
  icon,
  label,
  onClick,
}: {
  value: ThemeOption;
  current: ThemeOption;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  const isActive = value === current;
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all flex-1 min-w-[80px]',
        isActive
          ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
          : 'border-[var(--border-color)] bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--muted)]',
      )}
    >
      {icon}
      <span className="text-xs font-semibold">{label}</span>
      {isActive && <Check className="w-3.5 h-3.5" />}
    </button>
  );
}

// ---- Tiebreaker options ----
const TIEBREAKER_OPTIONS = [
  { id: 'points', label: 'Points', description: 'Total accumulated points' },
  { id: 'goalDifference', label: 'Goal Difference', description: 'GF minus GA' },
  { id: 'goalsFor', label: 'Goals Scored', description: 'Total goals scored' },
  { id: 'wins', label: 'Number of Wins', description: 'Most wins wins tiebreaker' },
  { id: 'headToHead', label: 'Head-to-Head Points', description: 'H2H record between tied players' },
  { id: 'headToHeadGoalDiff', label: 'H2H Goal Difference', description: 'Goal diff in H2H matches' },
] as const;

// ---- Reset Dialog ----
function ResetDialog({
  open,
  onConfirm,
  onCancel,
  tournamentCount,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  tournamentCount: number;
}) {
  const [inputValue, setInputValue] = useState('');
  const isValid = inputValue === 'RESET';

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 rounded-2xl border border-red-500/30 bg-[var(--surface)] p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-red-400">Reset All Data</h3>
        </div>
        <p className="text-sm text-[var(--muted)] mb-4">
          This will permanently delete{' '}
          <strong className="text-[var(--foreground)]">
            all {tournamentCount} tournament{tournamentCount !== 1 ? 's' : ''} and all match data
          </strong>
          . This action cannot be undone.
        </p>
        <p className="text-xs text-[var(--muted)] mb-3">
          Type <strong className="text-red-400 font-mono">RESET</strong> to confirm:
        </p>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="RESET"
          autoFocus
          className="w-full bg-[var(--surface-2)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm font-mono text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-red-500 mb-4 placeholder:text-[var(--muted)]"
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-[var(--border-color)] text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { if (isValid) onConfirm(); }}
            disabled={!isValid}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Delete Everything
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Main Page ----
export default function SettingsPage() {
  const { tournaments, loadDemoData } = useTournamentStore();
  const deleteTournament = useTournamentStore((s) => s.deleteTournament);
  const setActiveTournament = useTournamentStore((s) => s.setActiveTournament);

  // Local state
  const [defaultPoints, setDefaultPoints] = useState({ win: 3, draw: 1, loss: 0 });
  const [tiebreakers, setTiebreakers] = useState<string[]>([
    'points', 'goalDifference', 'goalsFor', 'headToHead',
  ]);
  const [theme, setTheme] = useState<ThemeOption>('dark');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global storage stats
  const totalFixtures = tournaments.reduce((sum, t) => sum + t.fixtures.length, 0);
  const completedFixtures = tournaments.reduce(
    (sum, t) => sum + t.fixtures.filter((f) => f.status === 'completed').length,
    0,
  );

  function handleExport() {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      tournaments,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ea-fc-tournaments-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2500);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        // Support both array format and {tournaments: [...]} format
        const list = Array.isArray(parsed) ? parsed : parsed?.tournaments;
        if (!Array.isArray(list)) throw new Error('Invalid format: expected an array of tournaments');
        list.forEach((t: unknown) => {
          if (typeof t !== 'object' || t === null || !('id' in t) || !('name' in t)) {
            throw new Error('Invalid tournament object in file');
          }
        });
        // Import by adding each tournament via store
        const addTournament = useTournamentStore.getState().addTournament;
        list.forEach((t: Parameters<typeof addTournament>[0]) => addTournament(t));
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
      } catch (err) {
        setImportError((err as Error).message ?? 'Failed to parse file');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleReset() {
    const ids = tournaments.map((t) => t.id);
    ids.forEach((id) => deleteTournament(id));
    setActiveTournament(null);
    setShowResetDialog(false);
  }

  function handleThemeChange(t: ThemeOption) {
    setTheme(t);
    if (t === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else if (t === 'dark') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      // System: check prefers-color-scheme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    }
  }

  function toggleTiebreaker(id: string) {
    setTiebreakers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="border-b border-[var(--border-color)] bg-[var(--surface)]/50">
        <div className="max-w-3xl mx-auto px-4 pt-8 pb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Settings className="w-7 h-7 text-[var(--accent)]" />
            Settings
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">Configure your EA FC 26 Tournament Manager.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Default Points System */}
        <Card>
          <SectionHeader
            icon={<span className="text-base">🏆</span>}
            title="Default Points System"
            description="Points awarded per match outcome when creating new tournaments."
          />
          <div className="space-y-4">
            <NumberInput
              label="Win"
              value={defaultPoints.win}
              onChange={(v) => setDefaultPoints((p) => ({ ...p, win: v }))}
              min={0}
              max={10}
              description="Points awarded for a win"
              color="text-emerald-400"
            />
            <div className="h-px bg-[var(--border-color)]" />
            <NumberInput
              label="Draw"
              value={defaultPoints.draw}
              onChange={(v) => setDefaultPoints((p) => ({ ...p, draw: v }))}
              min={0}
              max={10}
              description="Points awarded for a draw"
              color="text-amber-400"
            />
            <div className="h-px bg-[var(--border-color)]" />
            <NumberInput
              label="Loss"
              value={defaultPoints.loss}
              onChange={(v) => setDefaultPoints((p) => ({ ...p, loss: v }))}
              min={0}
              max={10}
              description="Points awarded for a loss (usually 0)"
              color="text-red-400"
            />
          </div>
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={() => setDefaultPoints({ win: 3, draw: 1, loss: 0 })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-color)] text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Reset to 3-1-0
            </button>
            <span className="text-xs text-[var(--muted)]">
              Current: {defaultPoints.win}W / {defaultPoints.draw}D / {defaultPoints.loss}L
            </span>
          </div>
        </Card>

        {/* Default Tiebreakers */}
        <Card>
          <SectionHeader
            icon={<span className="text-base">⚖️</span>}
            title="Default Tiebreakers"
            description="Criteria used to break ties when standings are equal. Click to toggle."
          />
          <div className="space-y-2">
            {TIEBREAKER_OPTIONS.map((opt) => {
              const isActive = tiebreakers.includes(opt.id);
              const order = tiebreakers.indexOf(opt.id);
              return (
                <div
                  key={opt.id}
                  role="checkbox"
                  aria-checked={isActive}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') toggleTiebreaker(opt.id); }}
                  className={cn(
                    'flex items-center gap-3 p-3.5 rounded-xl border transition-colors cursor-pointer select-none',
                    isActive
                      ? 'border-[var(--accent)]/40 bg-[var(--accent)]/5'
                      : 'border-[var(--border-color)] bg-[var(--surface-2)] opacity-50',
                  )}
                  onClick={() => toggleTiebreaker(opt.id)}
                >
                  <div className={cn(
                    'w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
                    isActive
                      ? 'bg-[var(--accent)] text-black'
                      : 'bg-[var(--surface)] border border-[var(--border-color)] text-[var(--muted)]',
                  )}>
                    {isActive ? order + 1 : ''}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{opt.label}</div>
                    <div className="text-xs text-[var(--muted)]">{opt.description}</div>
                  </div>
                  <div className={cn(
                    'w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0',
                    isActive
                      ? 'bg-[var(--accent)] border-[var(--accent)] text-black'
                      : 'border-[var(--border-color)]',
                  )}>
                    {isActive && <Check className="w-3 h-3" />}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-[var(--muted)] mt-3">
            Active tiebreakers are applied in numbered order. These are defaults for new tournaments.
          </p>
        </Card>

        {/* Appearance */}
        <Card>
          <SectionHeader
            icon={<span className="text-base">🎨</span>}
            title="Appearance"
            description="Choose your preferred color theme."
          />
          <div className="flex gap-3">
            <ThemeButton
              value="dark"
              current={theme}
              icon={<Moon className="w-5 h-5" />}
              label="Dark"
              onClick={() => handleThemeChange('dark')}
            />
            <ThemeButton
              value="light"
              current={theme}
              icon={<Sun className="w-5 h-5" />}
              label="Light"
              onClick={() => handleThemeChange('light')}
            />
            <ThemeButton
              value="system"
              current={theme}
              icon={<Monitor className="w-5 h-5" />}
              label="System"
              onClick={() => handleThemeChange('system')}
            />
          </div>
          <p className="text-xs text-[var(--muted)] mt-4">
            The dark &quot;pitch night mode&quot; is the recommended theme for the best football experience.
          </p>
        </Card>

        {/* Storage info */}
        <Card>
          <SectionHeader
            icon={<Shield className="w-4 h-4 text-[var(--accent)]" />}
            title="Storage"
            description="All data is stored locally in your browser."
          />
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Tournaments', value: tournaments.length },
              { label: 'Total Fixtures', value: totalFixtures },
              { label: 'Completed', value: completedFixtures },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col gap-0.5 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-color)] text-center">
                <span className="text-2xl font-extrabold tabular-nums">{stat.value}</span>
                <span className="text-xs text-[var(--muted)]">{stat.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="emerald">localStorage</Badge>
            <span className="text-xs text-[var(--muted)]">No server · Fully offline</span>
          </div>
        </Card>

        {/* Data Management */}
        <Card>
          <SectionHeader
            icon={<span className="text-base">💾</span>}
            title="Data Management"
            description="Export, import, or reset your tournament data."
          />

          <div className="space-y-3">
            {/* Export */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border-color)]">
              <div className="min-w-0">
                <div className="text-sm font-semibold">Export All Data</div>
                <div className="text-xs text-[var(--muted)] mt-0.5">
                  Download all {tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''} as a JSON file.
                </div>
              </div>
              <button
                onClick={handleExport}
                disabled={tournaments.length === 0}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shrink-0',
                  exportSuccess
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                    : 'bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--accent)]/20',
                  tournaments.length === 0 && 'opacity-40 cursor-not-allowed',
                )}
              >
                {exportSuccess ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                {exportSuccess ? 'Exported!' : 'Export'}
              </button>
            </div>

            {/* Import */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border-color)]">
              <div className="min-w-0">
                <div className="text-sm font-semibold">Import Data</div>
                <div className="text-xs text-[var(--muted)] mt-0.5">Load tournaments from a JSON backup file.</div>
                {importError && (
                  <div className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" /> {importError}
                  </div>
                )}
                {importSuccess && (
                  <div className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1">
                    <Check className="w-3 h-3 shrink-0" /> Imported successfully!
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border-color)] text-sm font-semibold text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors shrink-0"
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportFile}
              />
            </div>

            {/* Load Demo */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border-color)]">
              <div className="min-w-0">
                <div className="text-sm font-semibold">Load Demo Data</div>
                <div className="text-xs text-[var(--muted)] mt-0.5">
                  Add a sample tournament with players and results to explore the app.
                </div>
              </div>
              <button
                onClick={loadDemoData}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border-color)] text-sm font-semibold text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
                Load Demo
              </button>
            </div>

            {/* Reset */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-red-400">Reset All Data</div>
                <div className="text-xs text-[var(--muted)] mt-0.5">
                  Permanently delete all tournaments. Cannot be undone.
                </div>
              </div>
              <button
                onClick={() => setShowResetDialog(true)}
                disabled={tournaments.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </Card>

        {/* About */}
        <Card>
          <SectionHeader
            icon={<Info className="w-4 h-4 text-[var(--accent)]" />}
            title="About"
          />
          <div className="space-y-0">
            {[
              { label: 'App', value: 'EA FC 26 Tournament Manager' },
              { label: 'Version', value: '1.0.0' },
              { label: 'Stack', value: 'Next.js · TypeScript · Tailwind CSS v4 · Zustand' },
              { label: 'Storage', value: 'Local browser storage (localStorage)' },
              { label: 'Offline', value: 'Fully offline — no server required' },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-start gap-4 py-2.5 border-b border-[var(--border-color)] last:border-0"
              >
                <span className="text-sm text-[var(--muted)] w-20 shrink-0">{label}</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 p-4 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 text-center">
            <div className="text-3xl mb-2">⚽</div>
            <p className="text-xs text-[var(--muted)]">
              Built for EA FC 26 local tournaments. Track every goal, every assist, every glory moment.
            </p>
          </div>
        </Card>

      </div>

      <ResetDialog
        open={showResetDialog}
        onConfirm={handleReset}
        onCancel={() => setShowResetDialog(false)}
        tournamentCount={tournaments.length}
      />
    </div>
  );
}

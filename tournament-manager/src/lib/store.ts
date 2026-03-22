'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Tournament, Fixture, MatchResult, Player, TournamentStatus } from './types';
import { generateId } from './utils';
import { createDemoTournament } from './demo-data';
import { generateFixtures, getTotalRounds } from './fixtures';

interface TournamentStore {
  tournaments: Tournament[];
  activeTournamentId: string | null;

  // Tournament CRUD
  addTournament: (tournament: Tournament) => void;
  updateTournament: (id: string, updates: Partial<Tournament>) => void;
  deleteTournament: (id: string) => void;
  setActiveTournament: (id: string | null) => void;
  getTournamentById: (id: string) => Tournament | undefined;

  // Players
  addPlayer: (tournamentId: string, player: Player) => void;
  updatePlayer: (tournamentId: string, playerId: string, updates: Partial<Player>) => void;
  removePlayer: (tournamentId: string, playerId: string) => void;

  // Fixtures
  generateTournamentFixtures: (tournamentId: string) => void;
  updateFixtureResult: (tournamentId: string, fixtureId: string, result: MatchResult) => void;
  updateFixtureStatus: (tournamentId: string, fixtureId: string, status: Fixture['status']) => void;
  clearFixtureResult: (tournamentId: string, fixtureId: string) => void;

  // Tournament lifecycle
  startTournament: (tournamentId: string) => void;
  completeTournament: (tournamentId: string) => void;
  archiveTournament: (tournamentId: string) => void;
  resetTournament: (tournamentId: string) => void;

  // Demo
  loadDemoData: () => void;
  hasLoadedDemo: boolean;
}

export const useTournamentStore = create<TournamentStore>()(
  persist(
    (set, get) => ({
      tournaments: [],
      activeTournamentId: null,
      hasLoadedDemo: false,

      addTournament: (tournament) =>
        set((state) => ({
          tournaments: [tournament, ...state.tournaments],
          activeTournamentId: tournament.id,
        })),

      updateTournament: (id, updates) =>
        set((state) => ({
          tournaments: state.tournaments.map((t) =>
            t.id === id
              ? { ...t, ...updates, updatedAt: new Date().toISOString() }
              : t
          ),
        })),

      deleteTournament: (id) =>
        set((state) => ({
          tournaments: state.tournaments.filter((t) => t.id !== id),
          activeTournamentId:
            state.activeTournamentId === id ? null : state.activeTournamentId,
        })),

      setActiveTournament: (id) => set({ activeTournamentId: id }),

      getTournamentById: (id) => get().tournaments.find((t) => t.id === id),

      addPlayer: (tournamentId, player) =>
        set((state) => ({
          tournaments: state.tournaments.map((t) =>
            t.id === tournamentId
              ? {
                  ...t,
                  players: [...t.players, player],
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        })),

      updatePlayer: (tournamentId, playerId, updates) =>
        set((state) => ({
          tournaments: state.tournaments.map((t) =>
            t.id === tournamentId
              ? {
                  ...t,
                  players: t.players.map((p) =>
                    p.id === playerId ? { ...p, ...updates } : p
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        })),

      removePlayer: (tournamentId, playerId) =>
        set((state) => ({
          tournaments: state.tournaments.map((t) =>
            t.id === tournamentId
              ? {
                  ...t,
                  players: t.players.filter((p) => p.id !== playerId),
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        })),

      generateTournamentFixtures: (tournamentId) => {
        const tournament = get().getTournamentById(tournamentId);
        if (!tournament) return;
        const fixtures = generateFixtures(
          tournamentId,
          tournament.players,
          tournament.format
        );
        const totalRounds = getTotalRounds(tournament.players, tournament.format);
        set((state) => ({
          tournaments: state.tournaments.map((t) =>
            t.id === tournamentId
              ? {
                  ...t,
                  fixtures,
                  totalRounds,
                  currentRound: 1,
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        }));
      },

      updateFixtureResult: (tournamentId, fixtureId, result) =>
        set((state) => ({
          tournaments: state.tournaments.map((t) => {
            if (t.id !== tournamentId) return t;
            return {
              ...t,
              fixtures: t.fixtures.map((f) =>
                f.id === fixtureId
                  ? { ...f, result, status: 'completed' as const }
                  : f
              ),
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      updateFixtureStatus: (tournamentId, fixtureId, status) =>
        set((state) => ({
          tournaments: state.tournaments.map((t) => {
            if (t.id !== tournamentId) return t;
            return {
              ...t,
              fixtures: t.fixtures.map((f) =>
                f.id === fixtureId ? { ...f, status } : f
              ),
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      clearFixtureResult: (tournamentId, fixtureId) =>
        set((state) => ({
          tournaments: state.tournaments.map((t) => {
            if (t.id !== tournamentId) return t;
            return {
              ...t,
              fixtures: t.fixtures.map((f) =>
                f.id === fixtureId
                  ? { ...f, result: undefined, status: 'scheduled' as const }
                  : f
              ),
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      startTournament: (tournamentId) => {
        const tournament = get().getTournamentById(tournamentId);
        if (!tournament) return;
        if (tournament.fixtures.length === 0) {
          get().generateTournamentFixtures(tournamentId);
        }
        get().updateTournament(tournamentId, { status: 'active' });
      },

      completeTournament: (tournamentId) =>
        get().updateTournament(tournamentId, {
          status: 'completed',
          updatedAt: new Date().toISOString(),
        }),

      archiveTournament: (tournamentId) =>
        get().updateTournament(tournamentId, {
          status: 'archived',
          updatedAt: new Date().toISOString(),
        }),

      resetTournament: (tournamentId) =>
        set((state) => ({
          tournaments: state.tournaments.map((t) =>
            t.id === tournamentId
              ? {
                  ...t,
                  fixtures: t.fixtures.map((f) => ({
                    ...f,
                    result: undefined,
                    status: 'scheduled' as const,
                  })),
                  status: 'active' as TournamentStatus,
                  currentRound: 1,
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        })),

      loadDemoData: () => {
        if (get().hasLoadedDemo) return;
        const demo = createDemoTournament();
        set((state) => ({
          tournaments: [demo, ...state.tournaments],
          activeTournamentId: demo.id,
          hasLoadedDemo: true,
        }));
      },
    }),
    {
      name: 'ea-fc-tournament-manager',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

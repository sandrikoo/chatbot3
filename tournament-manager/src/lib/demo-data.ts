import { Tournament, Player, Fixture, MatchResult, GoalEvent } from './types';
import { generateId, getPlayerColor } from './utils';
import { generateFixtures } from './fixtures';

// Demo players
const demoPlayers: Player[] = [
  { id: 'p1', name: 'Marco', avatar: undefined, color: '#ef4444', teamId: 'real-madrid', joinedAt: new Date().toISOString() },
  { id: 'p2', name: 'Lucas', avatar: undefined, color: '#3b82f6', teamId: 'man-city', joinedAt: new Date().toISOString() },
  { id: 'p3', name: 'David', avatar: undefined, color: '#22c55e', teamId: 'psg', joinedAt: new Date().toISOString() },
  { id: 'p4', name: 'Alex', avatar: undefined, color: '#f97316', teamId: 'liverpool', joinedAt: new Date().toISOString() },
  { id: 'p5', name: 'Chris', avatar: undefined, color: '#8b5cf6', teamId: 'barcelona', joinedAt: new Date().toISOString() },
  { id: 'p6', name: 'Jordan', avatar: undefined, color: '#eab308', teamId: 'inter-milan', joinedAt: new Date().toISOString() },
];

function makeResult(
  homeScore: number,
  awayScore: number,
  homePlayerId: string,
  awayPlayerId: string,
  potmId?: string,
  goals?: Array<{ scorerId: string; assistId?: string; type?: GoalEvent['type'] }>
): MatchResult {
  const goalEvents: GoalEvent[] = (goals ?? []).map((g, i) => ({
    id: `goal-${i}-${generateId()}`,
    scorerId: g.scorerId,
    assistId: g.assistId,
    type: g.type ?? 'normal',
  }));

  return {
    homeScore,
    awayScore,
    goals: goalEvents,
    homeCards: [],
    awayCards: [],
    playerOfMatchId: potmId ?? (homeScore > awayScore ? homePlayerId : awayPlayerId),
    notes: '',
    extraTime: false,
    homeCleanSheet: awayScore === 0,
    awayCleanSheet: homeScore === 0,
    enteredAt: new Date().toISOString(),
  };
}

export function createDemoTournament(): Tournament {
  const id = 'demo-tournament-1';
  const players = demoPlayers;

  const settings = {
    allowDuplicateTeams: false,
    pointsWin: 3,
    pointsDraw: 1,
    pointsLoss: 0,
    tiebreakers: ['points', 'goalDifference', 'goalsFor', 'headToHead'] as any,
    awayGoals: false,
    twoLeggedKnockout: false,
    playersCount: 6,
    teamsPool: [],
  };

  const allFixtures = generateFixtures(id, players, 'round-robin');

  // Add pre-filled results for demo (rounds 1-4 completed, round 5 upcoming)
  const completedResults: Record<string, MatchResult> = {
    [allFixtures.find(f => f.homePlayerId === 'p1' && f.awayPlayerId === 'p2')?.id ?? '']: makeResult(3, 1, 'p1', 'p2', 'p1', [
      { scorerId: 'p1', assistId: 'p3', type: 'normal' },
      { scorerId: 'p1', type: 'penalty' },
      { scorerId: 'p1', type: 'normal' },
    ]),
    [allFixtures.find(f => f.homePlayerId === 'p3' && f.awayPlayerId === 'p4')?.id ?? '']: makeResult(2, 2, 'p3', 'p4', 'p4', [
      { scorerId: 'p3', assistId: 'p5' },
      { scorerId: 'p3' },
      { scorerId: 'p4', assistId: 'p2' },
      { scorerId: 'p4' },
    ]),
    [allFixtures.find(f => f.homePlayerId === 'p5' && f.awayPlayerId === 'p6')?.id ?? '']: makeResult(1, 0, 'p5', 'p6', 'p5', [
      { scorerId: 'p5', assistId: 'p1' },
    ]),
    [allFixtures.find(f => f.homePlayerId === 'p2' && f.awayPlayerId === 'p5')?.id ?? '']: makeResult(0, 2, 'p2', 'p5', 'p5', [
      { scorerId: 'p5', assistId: 'p3' },
      { scorerId: 'p5' },
    ]),
    [allFixtures.find(f => f.homePlayerId === 'p4' && f.awayPlayerId === 'p1')?.id ?? '']: makeResult(1, 2, 'p4', 'p1', 'p1', [
      { scorerId: 'p4', assistId: 'p6' },
      { scorerId: 'p1', assistId: 'p3' },
      { scorerId: 'p1' },
    ]),
    [allFixtures.find(f => f.homePlayerId === 'p6' && f.awayPlayerId === 'p3')?.id ?? '']: makeResult(0, 3, 'p6', 'p3', 'p3', [
      { scorerId: 'p3', assistId: 'p5' },
      { scorerId: 'p3', assistId: 'p4' },
      { scorerId: 'p3' },
    ]),
    [allFixtures.find(f => f.homePlayerId === 'p1' && f.awayPlayerId === 'p5')?.id ?? '']: makeResult(3, 2, 'p1', 'p5', 'p1', [
      { scorerId: 'p1', assistId: 'p6' },
      { scorerId: 'p1', assistId: 'p3' },
      { scorerId: 'p1' },
      { scorerId: 'p5', assistId: 'p4' },
      { scorerId: 'p5' },
    ]),
    [allFixtures.find(f => f.homePlayerId === 'p2' && f.awayPlayerId === 'p3')?.id ?? '']: makeResult(1, 1, 'p2', 'p3', 'p2', [
      { scorerId: 'p2', assistId: 'p6' },
      { scorerId: 'p3', assistId: 'p5' },
    ]),
    [allFixtures.find(f => f.homePlayerId === 'p4' && f.awayPlayerId === 'p6')?.id ?? '']: makeResult(2, 0, 'p4', 'p6', 'p4', [
      { scorerId: 'p4', assistId: 'p1' },
      { scorerId: 'p4' },
    ]),
    [allFixtures.find(f => f.homePlayerId === 'p5' && f.awayPlayerId === 'p4')?.id ?? '']: makeResult(2, 1, 'p5', 'p4', 'p5', [
      { scorerId: 'p5', assistId: 'p2' },
      { scorerId: 'p5' },
      { scorerId: 'p4', assistId: 'p6' },
    ]),
    [allFixtures.find(f => f.homePlayerId === 'p6' && f.awayPlayerId === 'p2')?.id ?? '']: makeResult(1, 2, 'p6', 'p2', 'p2', [
      { scorerId: 'p6' },
      { scorerId: 'p2', assistId: 'p3' },
      { scorerId: 'p2' },
    ]),
    [allFixtures.find(f => f.homePlayerId === 'p3' && f.awayPlayerId === 'p1')?.id ?? '']: makeResult(0, 2, 'p3', 'p1', 'p1', [
      { scorerId: 'p1', assistId: 'p4' },
      { scorerId: 'p1' },
    ]),
  };

  const fixtures = allFixtures.map((f) => {
    const result = completedResults[f.id];
    if (result) {
      return { ...f, result, status: 'completed' as const };
    }
    return f;
  });

  return {
    id,
    name: 'Friends League Season 1',
    format: 'round-robin',
    status: 'active',
    season: '2025/26',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    settings,
    players,
    fixtures,
    currentRound: 4,
    totalRounds: allFixtures.reduce((max, f) => Math.max(max, f.round), 0),
    description: 'Monthly EA FC 26 mini-league between friends. Best of luck to all!',
    tags: ['ea-fc-26', 'friends', 'season-1'],
  };
}

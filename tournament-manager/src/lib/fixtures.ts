import { Fixture, TournamentFormat, Player } from './types';
import { generateId } from './utils';

/**
 * Generate a round-robin schedule using the circle method.
 * Returns fixtures grouped by round.
 */
function generateRoundRobinRounds(playerIds: string[]): { homeId: string; awayId: string }[][] {
  const ids = [...playerIds];
  const n = ids.length;
  const hasBye = n % 2 !== 0;
  if (hasBye) ids.push('BYE');
  const half = ids.length / 2;
  const rounds: { homeId: string; awayId: string }[][] = [];

  for (let round = 0; round < ids.length - 1; round++) {
    const roundFixtures: { homeId: string; awayId: string }[] = [];
    for (let match = 0; match < half; match++) {
      const home = ids[match];
      const away = ids[ids.length - 1 - match];
      if (home !== 'BYE' && away !== 'BYE') {
        // Alternate home/away for balance
        if (round % 2 === 0) {
          roundFixtures.push({ homeId: home, awayId: away });
        } else {
          roundFixtures.push({ homeId: away, awayId: home });
        }
      }
    }
    rounds.push(roundFixtures);
    // Rotate: fix ids[0], rotate rest
    const last = ids.pop()!;
    ids.splice(1, 0, last);
  }
  return rounds;
}

export function generateFixtures(
  tournamentId: string,
  players: Player[],
  format: TournamentFormat
): Fixture[] {
  const playerIds = players.map((p) => p.id);
  const fixtures: Fixture[] = [];

  if (format === 'round-robin' || format === 'double-round-robin') {
    const rounds = generateRoundRobinRounds(playerIds);
    let matchday = 1;

    rounds.forEach((round, roundIndex) => {
      round.forEach((pair) => {
        fixtures.push({
          id: generateId(),
          tournamentId,
          round: roundIndex + 1,
          matchday,
          homePlayerId: pair.homeId,
          awayPlayerId: pair.awayId,
          status: 'scheduled',
        });
      });
      matchday++;
    });

    if (format === 'double-round-robin') {
      const firstLeg = [...fixtures];
      const totalRounds = rounds.length;
      firstLeg.forEach((f) => {
        fixtures.push({
          id: generateId(),
          tournamentId,
          round: f.round + totalRounds,
          matchday: f.matchday + totalRounds,
          homePlayerId: f.awayPlayerId, // swap home/away
          awayPlayerId: f.homePlayerId,
          status: 'scheduled',
          leg: 2,
          parentFixtureId: f.id,
        });
      });
      // Mark first leg fixtures
      firstLeg.forEach((f) => {
        f.leg = 1;
      });
    }
  } else if (format === 'group-knockout' || format === 'league-playoffs') {
    // Group stage - same as round-robin per group
    // For simplicity, use all players in one group for now
    const rounds = generateRoundRobinRounds(playerIds);
    rounds.forEach((round, roundIndex) => {
      round.forEach((pair) => {
        fixtures.push({
          id: generateId(),
          tournamentId,
          round: roundIndex + 1,
          matchday: roundIndex + 1,
          homePlayerId: pair.homeId,
          awayPlayerId: pair.awayId,
          status: 'scheduled',
          groupId: 'group-a',
        });
      });
    });
    // Knockout fixtures will be generated later when group stage completes
  }

  return fixtures;
}

export function getTotalRounds(players: Player[], format: TournamentFormat): number {
  const n = players.length;
  const adjusted = n % 2 === 0 ? n : n + 1;
  const rrRounds = adjusted - 1;
  if (format === 'double-round-robin') return rrRounds * 2;
  if (format === 'round-robin') return rrRounds;
  return rrRounds; // group stage rounds only for now
}

export function getMatchday(fixtures: Fixture[]): number {
  const completed = fixtures.filter((f) => f.status === 'completed').length;
  const total = fixtures.length;
  if (completed === 0) return 1;
  if (completed === total) return total;

  // Find the max round with at least one completed match
  const completedRounds = fixtures
    .filter((f) => f.status === 'completed')
    .map((f) => f.round);
  return Math.max(...completedRounds);
}

export function getUpcomingFixtures(fixtures: Fixture[], limit = 5): Fixture[] {
  return fixtures
    .filter((f) => f.status === 'scheduled')
    .slice(0, limit);
}

export function getRecentResults(fixtures: Fixture[], limit = 5): Fixture[] {
  return fixtures
    .filter((f) => f.status === 'completed')
    .slice(-limit)
    .reverse();
}

export function getFixturesByRound(fixtures: Fixture[]): Map<number, Fixture[]> {
  const map = new Map<number, Fixture[]>();
  fixtures.forEach((f) => {
    const arr = map.get(f.round) ?? [];
    arr.push(f);
    map.set(f.round, arr);
  });
  return map;
}

export function getHeadToHeadFixtures(
  fixtures: Fixture[],
  player1Id: string,
  player2Id: string
): Fixture[] {
  return fixtures.filter(
    (f) =>
      (f.homePlayerId === player1Id && f.awayPlayerId === player2Id) ||
      (f.homePlayerId === player2Id && f.awayPlayerId === player1Id)
  );
}

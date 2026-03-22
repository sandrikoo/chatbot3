import {
  Tournament,
  Fixture,
  StandingEntry,
  PlayerStats,
  TiebreakerType,
  FormResult,
  HeadToHead,
  LeaderboardEntry,
} from './types';
import { getMatchOutcome } from './utils';

export function calculateStandings(tournament: Tournament): StandingEntry[] {
  const { players, fixtures, settings } = tournament;

  const map = new Map<string, StandingEntry>();

  players.forEach((player) => {
    map.set(player.id, {
      playerId: player.id,
      position: 0,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [],
      cleanSheets: 0,
      homeRecord: { w: 0, d: 0, l: 0, gf: 0, ga: 0 },
      awayRecord: { w: 0, d: 0, l: 0, gf: 0, ga: 0 },
      streak: { type: null, count: 0 },
    });
  });

  const completedFixtures = fixtures.filter((f) => f.status === 'completed' && f.result);

  completedFixtures.forEach((fixture) => {
    const result = fixture.result!;
    const home = map.get(fixture.homePlayerId);
    const away = map.get(fixture.awayPlayerId);
    if (!home || !away) return;

    const homeGoals = result.homeScore;
    const awayGoals = result.awayScore;
    const outcome = homeGoals > awayGoals ? 'W' : homeGoals < awayGoals ? 'L' : 'D';

    // Update home player
    home.played++;
    home.goalsFor += homeGoals;
    home.goalsAgainst += awayGoals;
    if (outcome === 'W') {
      home.wins++;
      home.points += settings.pointsWin;
      home.homeRecord.w++;
      away.losses++;
      away.points += settings.pointsLoss;
      away.awayRecord.l++;
    } else if (outcome === 'D') {
      home.draws++;
      home.points += settings.pointsDraw;
      home.homeRecord.d++;
      away.draws++;
      away.points += settings.pointsDraw;
      away.awayRecord.d++;
    } else {
      home.losses++;
      home.points += settings.pointsLoss;
      home.homeRecord.l++;
      away.wins++;
      away.points += settings.pointsWin;
      away.awayRecord.w++;
    }
    home.homeRecord.gf += homeGoals;
    home.homeRecord.ga += awayGoals;
    if (result.homeCleanSheet) home.cleanSheets++;

    // Update away player
    away.played++;
    away.goalsFor += awayGoals;
    away.goalsAgainst += homeGoals;
    away.awayRecord.gf += awayGoals;
    away.awayRecord.ga += homeGoals;
    if (result.awayCleanSheet) away.cleanSheets++;
  });

  // Calculate goal difference
  map.forEach((entry) => {
    entry.goalDifference = entry.goalsFor - entry.goalsAgainst;
  });

  // Calculate form (last 5 results)
  players.forEach((player) => {
    const entry = map.get(player.id)!;
    const playerFixtures = completedFixtures
      .filter(
        (f) => f.homePlayerId === player.id || f.awayPlayerId === player.id
      )
      .slice(-5);

    entry.form = playerFixtures.map((f) => {
      const isHome = f.homePlayerId === player.id;
      return getMatchOutcome(f.result!.homeScore, f.result!.awayScore, isHome);
    });

    // Calculate current streak
    const allFixtures = completedFixtures.filter(
      (f) => f.homePlayerId === player.id || f.awayPlayerId === player.id
    );
    let streakType: FormResult | null = null;
    let streakCount = 0;
    for (let i = allFixtures.length - 1; i >= 0; i--) {
      const f = allFixtures[i];
      const isHome = f.homePlayerId === player.id;
      const result = getMatchOutcome(f.result!.homeScore, f.result!.awayScore, isHome);
      if (i === allFixtures.length - 1) {
        streakType = result;
        streakCount = 1;
      } else if (result === streakType) {
        streakCount++;
      } else {
        break;
      }
    }
    entry.streak = { type: streakType, count: streakCount };

    // Biggest win/loss
    const playerCompletedFixtures = completedFixtures.filter(
      (f) => f.homePlayerId === player.id || f.awayPlayerId === player.id
    );
    let biggestWinDiff = 0;
    let biggestLossDiff = 0;
    playerCompletedFixtures.forEach((f) => {
      const isHome = f.homePlayerId === player.id;
      const gf = isHome ? f.result!.homeScore : f.result!.awayScore;
      const ga = isHome ? f.result!.awayScore : f.result!.homeScore;
      const diff = gf - ga;
      if (diff > biggestWinDiff) {
        biggestWinDiff = diff;
        entry.biggestWin = `${gf}-${ga}`;
      }
      if (diff < -biggestLossDiff) {
        biggestLossDiff = -diff;
        entry.biggestLoss = `${gf}-${ga}`;
      }
    });
  });

  // Sort by tiebreakers
  const entries = Array.from(map.values());
  const sorted = sortByTiebreakers(entries, settings.tiebreakers, completedFixtures);

  sorted.forEach((entry, i) => {
    entry.position = i + 1;
  });

  return sorted;
}

function sortByTiebreakers(
  entries: StandingEntry[],
  tiebreakers: TiebreakerType[],
  fixtures: Fixture[]
): StandingEntry[] {
  return [...entries].sort((a, b) => {
    for (const tb of tiebreakers) {
      let diff = 0;
      switch (tb) {
        case 'points':
          diff = b.points - a.points;
          break;
        case 'goalDifference':
          diff = b.goalDifference - a.goalDifference;
          break;
        case 'goalsFor':
          diff = b.goalsFor - a.goalsFor;
          break;
        case 'wins':
          diff = b.wins - a.wins;
          break;
        case 'headToHead': {
          // Compare head-to-head points
          const h2hA = getHeadToHeadPoints(a.playerId, b.playerId, fixtures);
          const h2hB = getHeadToHeadPoints(b.playerId, a.playerId, fixtures);
          diff = h2hB - h2hA;
          break;
        }
        case 'headToHeadGoalDiff': {
          const gdA = getHeadToHeadGoalDiff(a.playerId, b.playerId, fixtures);
          const gdB = getHeadToHeadGoalDiff(b.playerId, a.playerId, fixtures);
          diff = gdB - gdA;
          break;
        }
      }
      if (diff !== 0) return diff;
    }
    return a.playerId.localeCompare(b.playerId);
  });
}

function getHeadToHeadPoints(
  playerId: string,
  opponentId: string,
  fixtures: Fixture[]
): number {
  let points = 0;
  fixtures.forEach((f) => {
    if (!f.result) return;
    if (f.homePlayerId === playerId && f.awayPlayerId === opponentId) {
      const outcome = f.result.homeScore > f.result.awayScore ? 'W' : f.result.homeScore < f.result.awayScore ? 'L' : 'D';
      points += outcome === 'W' ? 3 : outcome === 'D' ? 1 : 0;
    } else if (f.awayPlayerId === playerId && f.homePlayerId === opponentId) {
      const outcome = f.result.awayScore > f.result.homeScore ? 'W' : f.result.awayScore < f.result.homeScore ? 'L' : 'D';
      points += outcome === 'W' ? 3 : outcome === 'D' ? 1 : 0;
    }
  });
  return points;
}

function getHeadToHeadGoalDiff(
  playerId: string,
  opponentId: string,
  fixtures: Fixture[]
): number {
  let gd = 0;
  fixtures.forEach((f) => {
    if (!f.result) return;
    if (f.homePlayerId === playerId && f.awayPlayerId === opponentId) {
      gd += f.result.homeScore - f.result.awayScore;
    } else if (f.awayPlayerId === playerId && f.homePlayerId === opponentId) {
      gd += f.result.awayScore - f.result.homeScore;
    }
  });
  return gd;
}

export function calculatePlayerStats(tournament: Tournament): Map<string, PlayerStats> {
  const { players, fixtures } = tournament;
  const map = new Map<string, PlayerStats>();

  players.forEach((player) => {
    map.set(player.id, {
      playerId: player.id,
      goals: 0,
      assists: 0,
      goalContributions: 0,
      cleanSheets: 0,
      yellowCards: 0,
      redCards: 0,
      playerOfMatchAwards: 0,
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      winRate: 0,
      form: [],
      longestWinStreak: 0,
      longestUnbeatenStreak: 0,
      longestLosingStreak: 0,
      averageGoalsScored: 0,
      averageGoalsConceded: 0,
    });
  });

  const completedFixtures = fixtures.filter((f) => f.status === 'completed' && f.result);

  completedFixtures.forEach((fixture) => {
    const result = fixture.result!;
    const homeStats = map.get(fixture.homePlayerId);
    const awayStats = map.get(fixture.awayPlayerId);

    if (homeStats) {
      homeStats.matchesPlayed++;
      homeStats.goalsFor += result.homeScore;
      homeStats.goalsAgainst += result.awayScore;
      if (result.homeCleanSheet) homeStats.cleanSheets++;
      if (result.homeScore > result.awayScore) homeStats.wins++;
      else if (result.homeScore === result.awayScore) homeStats.draws++;
      else homeStats.losses++;
      if (result.playerOfMatchId === fixture.homePlayerId) homeStats.playerOfMatchAwards++;
    }

    if (awayStats) {
      awayStats.matchesPlayed++;
      awayStats.goalsFor += result.awayScore;
      awayStats.goalsAgainst += result.homeScore;
      if (result.awayCleanSheet) awayStats.cleanSheets++;
      if (result.awayScore > result.homeScore) awayStats.wins++;
      else if (result.awayScore === result.homeScore) awayStats.draws++;
      else awayStats.losses++;
      if (result.playerOfMatchId === fixture.awayPlayerId) awayStats.playerOfMatchAwards++;
    }

    // Goal events
    result.goals.forEach((goal) => {
      if (!goal.isOwnGoal) {
        const scorer = map.get(goal.scorerId);
        if (scorer) scorer.goals++;
        if (goal.assistId) {
          const assistant = map.get(goal.assistId);
          if (assistant) assistant.assists++;
        }
      } else {
        // Own goal - counts against the scorer's team
        const scorer = map.get(goal.scorerId);
        // Own goals don't count for scorer stats but hurt their record
      }
    });

    // Cards
    [...result.homeCards, ...result.awayCards].forEach((card) => {
      const playerStats = map.get(card.playerId);
      if (!playerStats) return;
      if (card.type === 'yellow') playerStats.yellowCards++;
      if (card.type === 'red' || card.type === 'yellow-red') playerStats.redCards++;
    });
  });

  // Calculate derived stats
  map.forEach((stats, playerId) => {
    stats.goalDifference = stats.goalsFor - stats.goalsAgainst;
    stats.goalContributions = stats.goals + stats.assists;
    stats.points =
      stats.wins * tournament.settings.pointsWin +
      stats.draws * tournament.settings.pointsDraw;
    stats.winRate = stats.matchesPlayed > 0 ? Math.round((stats.wins / stats.matchesPlayed) * 100) : 0;
    stats.averageGoalsScored =
      stats.matchesPlayed > 0
        ? Math.round((stats.goalsFor / stats.matchesPlayed) * 10) / 10
        : 0;
    stats.averageGoalsConceded =
      stats.matchesPlayed > 0
        ? Math.round((stats.goalsAgainst / stats.matchesPlayed) * 10) / 10
        : 0;

    // Form last 5
    const playerFixtures = completedFixtures
      .filter((f) => f.homePlayerId === playerId || f.awayPlayerId === playerId)
      .slice(-5);
    stats.form = playerFixtures.map((f) => {
      const isHome = f.homePlayerId === playerId;
      return getMatchOutcome(f.result!.homeScore, f.result!.awayScore, isHome);
    });

    // Streaks
    const allPlayerFixtures = completedFixtures.filter(
      (f) => f.homePlayerId === playerId || f.awayPlayerId === playerId
    );
    stats.longestWinStreak = longestStreak(allPlayerFixtures, playerId, 'W');
    stats.longestLosingStreak = longestStreak(allPlayerFixtures, playerId, 'L');
    stats.longestUnbeatenStreak = longestUnbeaten(allPlayerFixtures, playerId);
  });

  return map;
}

function longestStreak(fixtures: Fixture[], playerId: string, type: FormResult): number {
  let max = 0;
  let current = 0;
  fixtures.forEach((f) => {
    const isHome = f.homePlayerId === playerId;
    const result = getMatchOutcome(f.result!.homeScore, f.result!.awayScore, isHome);
    if (result === type) {
      current++;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  });
  return max;
}

function longestUnbeaten(fixtures: Fixture[], playerId: string): number {
  let max = 0;
  let current = 0;
  fixtures.forEach((f) => {
    const isHome = f.homePlayerId === playerId;
    const result = getMatchOutcome(f.result!.homeScore, f.result!.awayScore, isHome);
    if (result !== 'L') {
      current++;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  });
  return max;
}

export function calculateHeadToHead(
  tournament: Tournament,
  player1Id: string,
  player2Id: string
): HeadToHead {
  const { fixtures } = tournament;
  const h2hFixtures = fixtures.filter(
    (f) =>
      f.status === 'completed' &&
      ((f.homePlayerId === player1Id && f.awayPlayerId === player2Id) ||
        (f.homePlayerId === player2Id && f.awayPlayerId === player1Id))
  );

  let p1Wins = 0, p2Wins = 0, draws = 0, p1Goals = 0, p2Goals = 0;

  h2hFixtures.forEach((f) => {
    const result = f.result!;
    const p1IsHome = f.homePlayerId === player1Id;
    const p1Goals_ = p1IsHome ? result.homeScore : result.awayScore;
    const p2Goals_ = p1IsHome ? result.awayScore : result.homeScore;
    p1Goals += p1Goals_;
    p2Goals += p2Goals_;
    if (p1Goals_ > p2Goals_) p1Wins++;
    else if (p1Goals_ < p2Goals_) p2Wins++;
    else draws++;
  });

  return {
    player1Id,
    player2Id,
    played: h2hFixtures.length,
    player1Wins: p1Wins,
    player2Wins: p2Wins,
    draws,
    player1Goals: p1Goals,
    player2Goals: p2Goals,
    fixtures: h2hFixtures.map((f) => f.id),
  };
}

export function buildLeaderboards(tournament: Tournament) {
  const playerStats = calculatePlayerStats(tournament);
  const standings = calculateStandings(tournament);

  const statsArray = Array.from(playerStats.values());

  const topScorers: LeaderboardEntry[] = statsArray
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
    .map((s, i) => ({
      rank: i + 1,
      playerId: s.playerId,
      teamId: tournament.players.find((p) => p.id === s.playerId)?.teamId ?? '',
      value: s.goals,
      secondary: s.assists,
      label: 'Goals',
    }));

  const topAssists: LeaderboardEntry[] = [...statsArray]
    .sort((a, b) => b.assists - a.assists || b.goals - a.goals)
    .map((s, i) => ({
      rank: i + 1,
      playerId: s.playerId,
      teamId: tournament.players.find((p) => p.id === s.playerId)?.teamId ?? '',
      value: s.assists,
      secondary: s.goals,
      label: 'Assists',
    }));

  const topContributions: LeaderboardEntry[] = [...statsArray]
    .sort((a, b) => b.goalContributions - a.goalContributions)
    .map((s, i) => ({
      rank: i + 1,
      playerId: s.playerId,
      teamId: tournament.players.find((p) => p.id === s.playerId)?.teamId ?? '',
      value: s.goalContributions,
      secondary: s.goals,
      label: 'G+A',
    }));

  const cleanSheets: LeaderboardEntry[] = [...statsArray]
    .sort((a, b) => b.cleanSheets - a.cleanSheets)
    .map((s, i) => ({
      rank: i + 1,
      playerId: s.playerId,
      teamId: tournament.players.find((p) => p.id === s.playerId)?.teamId ?? '',
      value: s.cleanSheets,
      label: 'Clean Sheets',
    }));

  const potm: LeaderboardEntry[] = [...statsArray]
    .sort((a, b) => b.playerOfMatchAwards - a.playerOfMatchAwards)
    .map((s, i) => ({
      rank: i + 1,
      playerId: s.playerId,
      teamId: tournament.players.find((p) => p.id === s.playerId)?.teamId ?? '',
      value: s.playerOfMatchAwards,
      label: 'POTM Awards',
    }));

  const winRate: LeaderboardEntry[] = [...statsArray]
    .filter((s) => s.matchesPlayed > 0)
    .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins)
    .map((s, i) => ({
      rank: i + 1,
      playerId: s.playerId,
      teamId: tournament.players.find((p) => p.id === s.playerId)?.teamId ?? '',
      value: s.winRate,
      secondary: s.wins,
      label: 'Win %',
    }));

  const bestDefense: LeaderboardEntry[] = [...statsArray]
    .filter((s) => s.matchesPlayed > 0)
    .sort((a, b) => a.averageGoalsConceded - b.averageGoalsConceded)
    .map((s, i) => ({
      rank: i + 1,
      playerId: s.playerId,
      teamId: tournament.players.find((p) => p.id === s.playerId)?.teamId ?? '',
      value: s.averageGoalsConceded,
      secondary: s.goalsAgainst,
      label: 'Avg Conceded',
    }));

  return {
    topScorers,
    topAssists,
    topContributions,
    cleanSheets,
    potm,
    winRate,
    bestDefense,
    standings,
    playerStats,
  };
}

export function generateInsights(tournament: Tournament) {
  const stats = calculatePlayerStats(tournament);
  const standings = calculateStandings(tournament);
  const completedFixtures = tournament.fixtures.filter(
    (f) => f.status === 'completed' && f.result
  );

  const insights: Array<{
    id: string;
    type: 'topScorer' | 'cleanSheet' | 'form' | 'rivalry' | 'upset' | 'milestone' | 'titleRace' | 'topFour' | 'relegation' | 'streak';
    title: string;
    description: string;
    playerId?: string;
    fixtureId?: string;
    icon?: string;
    color?: string;
    priority: number;
  }> = [];

  if (completedFixtures.length === 0) return insights;

  // Highest scoring match
  let highestScoringMatch = completedFixtures[0];
  completedFixtures.forEach((f) => {
    const total = f.result!.homeScore + f.result!.awayScore;
    const currentMax =
      highestScoringMatch.result!.homeScore + highestScoringMatch.result!.awayScore;
    if (total > currentMax) highestScoringMatch = f;
  });
  const hsmTotal =
    highestScoringMatch.result!.homeScore + highestScoringMatch.result!.awayScore;
  if (hsmTotal > 0) {
    insights.push({
      id: 'highest-scoring',
      type: 'milestone' as const,
      title: 'Highest Scoring Match',
      description: `${hsmTotal} goals in a single match`,
      fixtureId: highestScoringMatch.id,
      icon: '⚽',
      color: 'emerald',
      priority: 1,
    });
  }

  // Top scorer
  const statsArray = Array.from(stats.values()).sort((a, b) => b.goals - a.goals);
  if (statsArray[0]?.goals > 0) {
    insights.push({
      id: 'top-scorer',
      type: 'topScorer' as const,
      title: 'Top Scorer',
      description: `${statsArray[0].goals} goals`,
      playerId: statsArray[0].playerId,
      icon: '🥅',
      color: 'yellow',
      priority: 2,
    });
  }

  // Best form
  const bestFormPlayer = [...statsArray].sort((a, b) => {
    const aPoints = a.form.reduce((acc, r) => acc + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0);
    const bPoints = b.form.reduce((acc, r) => acc + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0);
    return bPoints - aPoints;
  })[0];

  if (bestFormPlayer && bestFormPlayer.form.length > 0) {
    const formPoints = bestFormPlayer.form.reduce(
      (acc, r) => acc + (r === 'W' ? 3 : r === 'D' ? 1 : 0),
      0
    );
    insights.push({
      id: 'best-form',
      type: 'form' as const,
      title: 'Best Form',
      description: `${formPoints} pts from last ${bestFormPlayer.form.length} games`,
      playerId: bestFormPlayer.playerId,
      icon: '🔥',
      color: 'orange',
      priority: 3,
    });
  }

  // Title race (if not already won)
  if (tournament.status === 'active' && standings.length >= 2) {
    const gap = standings[0].points - standings[1].points;
    if (gap <= 3) {
      insights.push({
        id: 'title-race',
        type: 'titleRace' as const,
        title: 'Title Race',
        description: `Only ${gap} point${gap !== 1 ? 's' : ''} separating top ${Math.min(standings.length, 3)}`,
        icon: '🏆',
        color: 'purple',
        priority: 4,
      });
    }
  }

  return insights;
}

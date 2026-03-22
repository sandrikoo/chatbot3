// ============================================
// EA FC 26 Tournament Manager - Type Definitions
// ============================================

export type TournamentFormat =
  | 'round-robin'
  | 'double-round-robin'
  | 'group-knockout'
  | 'league-playoffs';

export type TournamentStatus = 'setup' | 'active' | 'completed' | 'archived';

export type MatchStatus =
  | 'scheduled'
  | 'live'
  | 'completed'
  | 'postponed'
  | 'cancelled'
  | 'voided';

export type TiebreakerType =
  | 'points'
  | 'goalDifference'
  | 'goalsFor'
  | 'headToHead'
  | 'headToHeadGoalDiff'
  | 'wins'
  | 'awayGoals';

export type CardType = 'yellow' | 'red' | 'yellow-red';
export type GoalType = 'normal' | 'penalty' | 'own-goal' | 'free-kick' | 'header';
export type FormResult = 'W' | 'D' | 'L';
export type KnockoutRoundName = 'R32' | 'R16' | 'QF' | 'SF' | 'F' | '3rd';

// ---- Team ----
export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
  emoji?: string;
  primaryColor: string;
  secondaryColor: string;
  country?: string;
  type: 'club' | 'national';
  league?: string;
  rating?: number;
}

// ---- Player ----
export interface Player {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  teamId: string;
  joinedAt: string;
}

// ---- Goal / Card events ----
export interface GoalEvent {
  id: string;
  scorerId: string; // player who scored
  assistId?: string; // player who assisted
  minute?: number;
  type: GoalType;
  isOwnGoal?: boolean;
}

export interface CardEvent {
  id: string;
  playerId: string;
  type: CardType;
  minute?: number;
}

export interface PenaltyKick {
  playerId: string;
  scored: boolean;
}

export interface PenaltyShootout {
  homeScore: number;
  awayScore: number;
  sequence: PenaltyKick[];
}

// ---- Match Result ----
export interface MatchResult {
  homeScore: number;
  awayScore: number;
  goals: GoalEvent[];
  homeCards: CardEvent[];
  awayCards: CardEvent[];
  playerOfMatchId?: string;
  notes?: string;
  extraTime: boolean;
  extraTimeHomeScore?: number;
  extraTimeAwayScore?: number;
  penalties?: PenaltyShootout;
  homeCleanSheet: boolean;
  awayCleanSheet: boolean;
  enteredAt: string;
  updatedAt?: string;
}

// ---- Fixture ----
export interface Fixture {
  id: string;
  tournamentId: string;
  round: number;
  matchday: number;
  homePlayerId: string;
  awayPlayerId: string;
  result?: MatchResult;
  status: MatchStatus;
  leg?: 1 | 2;
  parentFixtureId?: string;
  scheduledDate?: string;
  knockoutRound?: KnockoutRoundName;
  groupId?: string;
}

// ---- Group ----
export interface Group {
  id: string;
  name: string;
  playerIds: string[];
}

// ---- Knockout Round ----
export interface KnockoutBracketFixture {
  id: string;
  round: KnockoutRoundName;
  position: number; // bracket position
  homePlayerId?: string;
  awayPlayerId?: string;
  winnerId?: string;
  leg1FixtureId?: string;
  leg2FixtureId?: string;
}

// ---- Tournament Settings ----
export interface TournamentSettings {
  allowDuplicateTeams: boolean;
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  tiebreakers: TiebreakerType[];
  awayGoals: boolean;
  twoLeggedKnockout: boolean;
  playersCount: number;
  teamsPool: Team[];
  groupCount?: number;
  qualifiersPerGroup?: number;
  hasThirdPlace?: boolean;
}

// ---- Tournament ----
export interface Tournament {
  id: string;
  name: string;
  logo?: string;
  banner?: string;
  format: TournamentFormat;
  status: TournamentStatus;
  season?: string;
  createdAt: string;
  updatedAt: string;
  settings: TournamentSettings;
  players: Player[];
  fixtures: Fixture[];
  currentRound: number;
  totalRounds: number;
  groups?: Group[];
  knockoutBracket?: KnockoutBracketFixture[];
  winnerId?: string;
  description?: string;
  tags?: string[];
}

// ---- Standing Entry ----
export interface StandingEntry {
  playerId: string;
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: FormResult[];
  cleanSheets: number;
  biggestWin?: string;
  biggestLoss?: string;
  homeRecord: { w: number; d: number; l: number; gf: number; ga: number };
  awayRecord: { w: number; d: number; l: number; gf: number; ga: number };
  streak: { type: FormResult | null; count: number };
}

// ---- Player Stats ----
export interface PlayerStats {
  playerId: string;
  goals: number;
  assists: number;
  goalContributions: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
  playerOfMatchAwards: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  winRate: number;
  form: FormResult[];
  longestWinStreak: number;
  longestUnbeatenStreak: number;
  longestLosingStreak: number;
  averageGoalsScored: number;
  averageGoalsConceded: number;
}

// ---- Head to Head ----
export interface HeadToHead {
  player1Id: string;
  player2Id: string;
  played: number;
  player1Wins: number;
  player2Wins: number;
  draws: number;
  player1Goals: number;
  player2Goals: number;
  fixtures: string[]; // fixture IDs
}

// ---- Insight ----
export interface TournamentInsight {
  id: string;
  type:
    | 'topScorer'
    | 'cleanSheet'
    | 'form'
    | 'rivalry'
    | 'upset'
    | 'milestone'
    | 'titleRace'
    | 'topFour'
    | 'relegation'
    | 'streak';
  title: string;
  description: string;
  playerId?: string;
  fixtureId?: string;
  icon?: string;
  color?: string;
  priority: number;
}

// ---- Award ----
export interface Award {
  id: string;
  tournamentId: string;
  type:
    | 'winner'
    | 'topScorer'
    | 'topAssists'
    | 'bestDefense'
    | 'fairPlay'
    | 'mvp'
    | 'bestGoalkeeper'
    | 'goldenBoot'
    | 'silverBoot'
    | 'bronzeBoot';
  playerId: string;
  value?: number;
  awardedAt: string;
}

// ---- App State ----
export interface AppState {
  tournaments: Tournament[];
  activeTournamentId: string | null;
  theme: 'dark' | 'light';
}

// ---- Utility types ----
export type SortDirection = 'asc' | 'desc';

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  teamId: string;
  value: number;
  secondary?: number;
  label: string;
}

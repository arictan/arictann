// Online game services (Game Center on iOS, Google Play Games on Android).
// Until a plugin is added and the leaderboards exist in App Store Connect / the Play Console,
// scores are kept in local weekly boards, so the game works the same offline.
// To go live: install a Capacitor game-services plugin, create these leaderboard IDs in both
// stores, and implement `online` below (sign in, submit, show).

import { save } from './platform';
import { weekKey } from './progress';

export const BOARDS = {
  height: { id: 'best_height', name: 'Best stack' },
  level: { id: 'journey_level', name: 'Journey level' },
  gauntlet: { id: 'gauntlet_chefs', name: 'Gauntlet chefs' },
  time: { id: 'time_attack', name: 'Time Attack' },
} as const;

export type BoardId = keyof typeof BOARDS;

export interface OnlineServices {
  signIn(): Promise<boolean>;
  submit(board: string, value: number): Promise<void>;
  show(board?: string): Promise<void>;
}

/** Set this to a real implementation once a game-services plugin is installed. */
export let online: OnlineServices | null = null;

export function setOnlineServices(s: OnlineServices): void {
  online = s;
}

type Weekly = { week: string; best: Partial<Record<BoardId, number>>; allTime: Partial<Record<BoardId, number>> };
let local: Weekly = save.json('boards', { week: '', best: {}, allTime: {} });

/** Records a score: best this week and best ever, and submits it online when connected. */
export function submitScore(board: BoardId, value: number): void {
  if (local.week !== weekKey()) local = { week: weekKey(), best: {}, allTime: local.allTime };
  local.best[board] = Math.max(local.best[board] ?? 0, value);
  local.allTime[board] = Math.max(local.allTime[board] ?? 0, value);
  save.setJson('boards', local);
  void online?.submit(BOARDS[board].id, value).catch(() => undefined);
}

export function localBoards(): Weekly {
  if (local.week !== weekKey()) local = { week: weekKey(), best: {}, allTime: local.allTime };
  return local;
}

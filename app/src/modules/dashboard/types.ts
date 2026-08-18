import type React from 'react';

/** A feature tile on the dashboard grid. */
export interface ModuleCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  badge?: { count: number; type: 'info' | 'warning' | 'error' };
  /**
   * Which design token tints this tile. Named, not a literal, so the tile
   * follows the palette: the page renders `rgb(var(--${color}))`.
   */
  color: TileTone;
}

/** The tokens a dashboard tile may be tinted with. */
export type TileTone =
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'ink-mid'
  | 'ink-light';

/** A headline metric on the dashboard. */
export interface QuickStat {
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
}

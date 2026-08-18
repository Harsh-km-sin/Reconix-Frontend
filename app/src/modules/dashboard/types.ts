import type React from 'react';

/** A feature tile on the dashboard grid. */
export interface ModuleCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  badge?: { count: number; type: 'info' | 'warning' | 'error' };
  color: string;
}

/** A headline metric on the dashboard. */
export interface QuickStat {
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
}

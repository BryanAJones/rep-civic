import { useMemo } from 'react';
import type { District, DistrictCode, DistrictLevel } from '../types/domain';

/** Ordered from most local to most broad, then "all" */
const LEVEL_ORDER: readonly DistrictLevel[] = ['city', 'county', 'state', 'federal'];

const LEVEL_LABELS: Record<DistrictLevel, string> = {
  city: 'City',
  county: 'County',
  state: 'State',
  federal: 'Federal',
};

export interface LevelTab {
  /** null means "All" */
  level: DistrictLevel | null;
  label: string;
  districtCodes: DistrictCode[];
}

export function useDistrictLevels(districts: District[]): LevelTab[] {
  return useMemo(() => {
    const byLevel = new Map<DistrictLevel, DistrictCode[]>();

    for (const d of districts) {
      const codes = byLevel.get(d.level) ?? [];
      codes.push(d.code);
      byLevel.set(d.level, codes);
    }

    const tabs: LevelTab[] = [];

    for (const level of LEVEL_ORDER) {
      const codes = byLevel.get(level);
      if (codes && codes.length > 0) {
        tabs.push({ level, label: LEVEL_LABELS[level], districtCodes: codes });
      }
    }

    // "All" tab at the end — includes every district code
    const allCodes = districts.map((d) => d.code);
    tabs.push({ level: null, label: 'All', districtCodes: allCodes });

    return tabs;
  }, [districts]);
}

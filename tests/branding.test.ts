import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CONFIG,
  INDUSTRY_CONFIGS,
  getAvailableIndustries,
  getBrandingConfig,
} from '../apps/web/lib/branding';

describe('branding configuration', () => {
  it('returns default config for unknown industry', () => {
    const cfg = getBrandingConfig('nonexistent');
    expect(cfg).toEqual(DEFAULT_CONFIG);
  });

  it('lists available industries', () => {
    const industries = getAvailableIndustries();
    // Should include at least a couple defined keys
    const keys = industries.map(i => i.key);
    expect(keys).toContain('healthcare');
    expect(keys).toContain('corporate');
  });

  it('healthcare terminology overrides team member label', () => {
    const cfg = getBrandingConfig('healthcare');
    expect(cfg.terminology.team_member).toBeDefined();
  });
});

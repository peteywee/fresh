'use client';

import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';

// Internal module import without extension (Next.js + Bundler moduleResolution)
import { BrandingConfig, getAvailableIndustries, getBrandingConfig } from './branding';

interface BrandingContextType {
  config: BrandingConfig;
  setIndustry: (industry: string) => void;
  availableIndustries: Array<{ key: string; name: string }>;
  isLoading: boolean;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

interface BrandingProviderProps {
  children: ReactNode;
  initialIndustry?: string;
}

export function BrandingProvider({ children, initialIndustry }: BrandingProviderProps) {
  const [industry, setIndustryState] = useState<string>(initialIndustry || 'corporate');
  const [config, setConfig] = useState<BrandingConfig>(() => getBrandingConfig(initialIndustry));
  const [isLoading, setIsLoading] = useState(true);

  const availableIndustries = getAvailableIndustries();

  // Load industry preference from localStorage on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fresh_industry_preference');
      if (saved && !initialIndustry) {
        setIndustryState(saved);
        setConfig(getBrandingConfig(saved));
      }
      setIsLoading(false);
    }
  }, [initialIndustry]);

  // Update config when industry changes
  useEffect(() => {
    setConfig(getBrandingConfig(industry));
  }, [industry]);

  // Apply CSS custom properties for theming
  useEffect(() => {
    if (typeof window !== 'undefined' && config) {
      const root = document.documentElement;

      // Apply color variables
      root.style.setProperty('--color-primary', config.colors.primary);
      root.style.setProperty('--color-secondary', config.colors.secondary);
      root.style.setProperty('--color-accent', config.colors.accent);
      root.style.setProperty('--color-background', config.colors.background);
      root.style.setProperty('--color-text', config.colors.text);
      root.style.setProperty('--color-muted', config.colors.muted);

      // Update document title and favicon if specified
      if (config.ui.app_name) {
        document.title = config.ui.app_name;
      }

      if (config.ui.favicon_url) {
        const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (favicon) {
          favicon.href = config.ui.favicon_url;
        }
      }
    }
  }, [config]);

  const setIndustry = (newIndustry: string) => {
    setIndustryState(newIndustry);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('fresh_industry_preference', newIndustry);
    }
  };

  return (
    <BrandingContext.Provider
      value={{
        config,
        setIndustry,
        availableIndustries,
        isLoading,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding(): BrandingContextType {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}

// Helper hook for terminology
export function useTerminology() {
  const { config } = useBranding();
  return config.terminology;
}

// Helper hook for colors
export function useColors() {
  const { config } = useBranding();
  return config.colors;
}

// Helper hook for features
export function useFeatures() {
  const { config } = useBranding();
  return config.features;
}

// Helper hook for UI settings
export function useUIConfig() {
  const { config } = useBranding();
  return config.ui;
}

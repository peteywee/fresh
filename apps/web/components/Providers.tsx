'use client';

import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';

import { BrandingConfig, getAvailableIndustries, getBrandingConfig } from '@/lib/branding';

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

function BrandingProvider({ children, initialIndustry }: BrandingProviderProps) {
  const [industry, setIndustryState] = useState<string>(initialIndustry || 'corporate');
  // Safer initialization without lazy initializer
  const [config, setConfig] = useState<BrandingConfig>(getBrandingConfig('corporate'));
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
    }
  }, [config]);

  const setIndustry = (newIndustry: string) => {
    setIndustryState(newIndustry);
    // Save preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('fresh_industry_preference', newIndustry);
    }
  };

  const value: BrandingContextType = {
    config,
    setIndustry,
    availableIndustries,
    isLoading,
  };

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

interface ProvidersProps {
  children: React.ReactNode;
  initialIndustry?: string;
}

export function Providers({ children, initialIndustry }: ProvidersProps) {
  return <BrandingProvider initialIndustry={initialIndustry}>{children}</BrandingProvider>;
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

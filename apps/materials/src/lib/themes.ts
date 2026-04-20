export interface ColorTheme {
  id: string;
  name: string;
  displayName: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
  };
  light: {
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    border: string;
    input: string;
    ring: string;
    muted: string;
    mutedForeground: string;
    destructive: string;
    destructiveForeground: string;
    sidebar: {
      background: string;
      foreground: string;
      primary: string;
      primaryForeground: string;
      accent: string;
      accentForeground: string;
      border: string;
      ring: string;
    };
  };
  dark: {
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    border: string;
    input: string;
    ring: string;
    muted: string;
    mutedForeground: string;
    destructive: string;
    destructiveForeground: string;
    sidebar: {
      background: string;
      foreground: string;
      primary: string;
      primaryForeground: string;
      accent: string;
      accentForeground: string;
      border: string;
      ring: string;
    };
  };
}

export const colorThemes: ColorTheme[] = [
  {
    id: 'blue',
    name: 'blue',
    displayName: 'الأزرق الكلاسيكي',
    description: 'الثيم الافتراضي الهادئ والمريح للعين',
    preview: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#0ea5e9'
    },
    light: {
      primary: '217 91% 60%',
      primaryForeground: '210 40% 98%',
      secondary: '240 5% 96%',
      secondaryForeground: '222.2 47.4% 11.2%',
      accent: '240 5% 90%',
      accentForeground: '222.2 47.4% 11.2%',
      background: '240 10% 99%',
      foreground: '222.2 84% 4.9%',
      card: '255 100% 100%',
      cardForeground: '222.2 84% 4.9%',
      border: '240 6% 90%',
      input: '240 6% 90%',
      ring: '217 91% 60%',
      muted: '240 5% 96%',
      mutedForeground: '215.4 16.3% 46.9%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 40% 98%',
      sidebar: {
        background: '240 10% 99%',
        foreground: '222.2 84% 4.9%',
        primary: '217 91% 60%',
        primaryForeground: '210 40% 98%',
        accent: '240 5% 90%',
        accentForeground: '222.2 47.4% 11.2%',
        border: '240 6% 90%',
        ring: '217 91% 60%'
      }
    },
    dark: {
      primary: '217 91% 60%',
      primaryForeground: '210 40% 98%',
      secondary: '217.2 32.6% 17.5%',
      secondaryForeground: '210 40% 98%',
      accent: '217.2 32.6% 17.5%',
      accentForeground: '210 40% 98%',
      background: '222 47% 11%',
      foreground: '210 40% 98%',
      card: '222 47% 11%',
      cardForeground: '210 40% 98%',
      border: '217.2 32.6% 17.5%',
      input: '217.2 32.6% 17.5%',
      ring: '217 91% 60%',
      muted: '217.2 32.6% 17.5%',
      mutedForeground: '215 20.2% 65.1%',
      destructive: '0 62.8% 30.6%',
      destructiveForeground: '210 40% 98%',
      sidebar: {
        background: '224 71% 4%',
        foreground: '210 40% 98%',
        primary: '217 91% 60%',
        primaryForeground: '210 40% 98%',
        accent: '217.2 32.6% 17.5%',
        accentForeground: '210 40% 98%',
        border: '217.2 32.6% 17.5%',
        ring: '217.2 91.2% 59.8%'
      }
    }
  },
  {
    id: 'emerald',
    name: 'emerald',
    displayName: 'الأخضر الزمردي',
    description: 'ثيم طبيعي يبعث على الراحة والهدوء',
    preview: {
      primary: '#10b981',
      secondary: '#6b7280',
      accent: '#059669'
    },
    light: {
      primary: '160 84% 39%',
      primaryForeground: '210 40% 98%',
      secondary: '240 5% 96%',
      secondaryForeground: '222.2 47.4% 11.2%',
      accent: '142 76% 36%',
      accentForeground: '210 40% 98%',
      background: '138 76% 97%',
      foreground: '222.2 84% 4.9%',
      card: '255 100% 100%',
      cardForeground: '222.2 84% 4.9%',
      border: '142 76% 88%',
      input: '142 76% 88%',
      ring: '160 84% 39%',
      muted: '142 76% 92%',
      mutedForeground: '215.4 16.3% 46.9%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 40% 98%',
      sidebar: {
        background: '138 76% 97%',
        foreground: '222.2 84% 4.9%',
        primary: '160 84% 39%',
        primaryForeground: '210 40% 98%',
        accent: '142 76% 88%',
        accentForeground: '222.2 47.4% 11.2%',
        border: '142 76% 88%',
        ring: '160 84% 39%'
      }
    },
    dark: {
      primary: '160 84% 39%',
      primaryForeground: '210 40% 98%',
      secondary: '155 7.7% 15.3%',
      secondaryForeground: '210 40% 98%',
      accent: '155 7.7% 15.3%',
      accentForeground: '210 40% 98%',
      background: '160 21% 8%',
      foreground: '210 40% 98%',
      card: '160 21% 8%',
      cardForeground: '210 40% 98%',
      border: '155 7.7% 15.3%',
      input: '155 7.7% 15.3%',
      ring: '160 84% 39%',
      muted: '155 7.7% 15.3%',
      mutedForeground: '215 20.2% 65.1%',
      destructive: '0 62.8% 30.6%',
      destructiveForeground: '210 40% 98%',
      sidebar: {
        background: '160 28% 4%',
        foreground: '210 40% 98%',
        primary: '160 84% 39%',
        primaryForeground: '210 40% 98%',
        accent: '155 7.7% 15.3%',
        accentForeground: '210 40% 98%',
        border: '155 7.7% 15.3%',
        ring: '160 84% 39%'
      }
    }
  },
  {
    id: 'purple',
    name: 'purple',
    displayName: 'البنفسجي الملكي',
    description: 'ثيم أنيق يضفي لمسة من الفخامة',
    preview: {
      primary: '#8b5cf6',
      secondary: '#6b7280',
      accent: '#7c3aed'
    },
    light: {
      primary: '258 90% 66%',
      primaryForeground: '210 40% 98%',
      secondary: '240 5% 96%',
      secondaryForeground: '222.2 47.4% 11.2%',
      accent: '262 83% 58%',
      accentForeground: '210 40% 98%',
      background: '258 100% 99%',
      foreground: '222.2 84% 4.9%',
      card: '255 100% 100%',
      cardForeground: '222.2 84% 4.9%',
      border: '258 100% 92%',
      input: '258 100% 92%',
      ring: '258 90% 66%',
      muted: '258 100% 96%',
      mutedForeground: '215.4 16.3% 46.9%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 40% 98%',
      sidebar: {
        background: '258 100% 99%',
        foreground: '222.2 84% 4.9%',
        primary: '258 90% 66%',
        primaryForeground: '210 40% 98%',
        accent: '258 100% 92%',
        accentForeground: '222.2 47.4% 11.2%',
        border: '258 100% 92%',
        ring: '258 90% 66%'
      }
    },
    dark: {
      primary: '258 90% 66%',
      primaryForeground: '210 40% 98%',
      secondary: '263 3.3% 17.1%',
      secondaryForeground: '210 40% 98%',
      accent: '263 3.3% 17.1%',
      accentForeground: '210 40% 98%',
      background: '263 15% 8%',
      foreground: '210 40% 98%',
      card: '263 15% 8%',
      cardForeground: '210 40% 98%',
      border: '263 3.3% 17.1%',
      input: '263 3.3% 17.1%',
      ring: '258 90% 66%',
      muted: '263 3.3% 17.1%',
      mutedForeground: '215 20.2% 65.1%',
      destructive: '0 62.8% 30.6%',
      destructiveForeground: '210 40% 98%',
      sidebar: {
        background: '263 25% 4%',
        foreground: '210 40% 98%',
        primary: '258 90% 66%',
        primaryForeground: '210 40% 98%',
        accent: '263 3.3% 17.1%',
        accentForeground: '210 40% 98%',
        border: '263 3.3% 17.1%',
        ring: '258 90% 66%'
      }
    }
  },
  {
    id: 'orange',
    name: 'orange',
    displayName: 'البرتقالي الدافئ',
    description: 'ثيم حيوي ينشط ويحفز الإبداع',
    preview: {
      primary: '#f97316',
      secondary: '#6b7280',
      accent: '#ea580c'
    },
    light: {
      primary: '24 95% 53%',
      primaryForeground: '210 40% 98%',
      secondary: '240 5% 96%',
      secondaryForeground: '222.2 47.4% 11.2%',
      accent: '20 91% 48%',
      accentForeground: '210 40% 98%',
      background: '33 100% 98%',
      foreground: '222.2 84% 4.9%',
      card: '255 100% 100%',
      cardForeground: '222.2 84% 4.9%',
      border: '33 100% 90%',
      input: '33 100% 90%',
      ring: '24 95% 53%',
      muted: '33 100% 94%',
      mutedForeground: '215.4 16.3% 46.9%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 40% 98%',
      sidebar: {
        background: '33 100% 98%',
        foreground: '222.2 84% 4.9%',
        primary: '24 95% 53%',
        primaryForeground: '210 40% 98%',
        accent: '33 100% 90%',
        accentForeground: '222.2 47.4% 11.2%',
        border: '33 100% 90%',
        ring: '24 95% 53%'
      }
    },
    dark: {
      primary: '24 95% 53%',
      primaryForeground: '210 40% 98%',
      secondary: '33 3.3% 15.7%',
      secondaryForeground: '210 40% 98%',
      accent: '33 3.3% 15.7%',
      accentForeground: '210 40% 98%',
      background: '33 15% 7%',
      foreground: '210 40% 98%',
      card: '33 15% 7%',
      cardForeground: '210 40% 98%',
      border: '33 3.3% 15.7%',
      input: '33 3.3% 15.7%',
      ring: '24 95% 53%',
      muted: '33 3.3% 15.7%',
      mutedForeground: '215 20.2% 65.1%',
      destructive: '0 62.8% 30.6%',
      destructiveForeground: '210 40% 98%',
      sidebar: {
        background: '33 25% 3%',
        foreground: '210 40% 98%',
        primary: '24 95% 53%',
        primaryForeground: '210 40% 98%',
        accent: '33 3.3% 15.7%',
        accentForeground: '210 40% 98%',
        border: '33 3.3% 15.7%',
        ring: '24 95% 53%'
      }
    }
  },
  {
    id: 'rose',
    name: 'rose',
    displayName: 'الوردي الأنيق',
    description: 'ثيم رقيق يضفي لمسة أنثوية راقية',
    preview: {
      primary: '#f43f5e',
      secondary: '#6b7280',
      accent: '#e11d48'
    },
    light: {
      primary: '347 77% 50%',
      primaryForeground: '210 40% 98%',
      secondary: '240 5% 96%',
      secondaryForeground: '222.2 47.4% 11.2%',
      accent: '346 87% 43%',
      accentForeground: '210 40% 98%',
      background: '347 77% 98%',
      foreground: '222.2 84% 4.9%',
      card: '255 100% 100%',
      cardForeground: '222.2 84% 4.9%',
      border: '347 77% 90%',
      input: '347 77% 90%',
      ring: '347 77% 50%',
      muted: '347 77% 94%',
      mutedForeground: '215.4 16.3% 46.9%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 40% 98%',
      sidebar: {
        background: '347 77% 98%',
        foreground: '222.2 84% 4.9%',
        primary: '347 77% 50%',
        primaryForeground: '210 40% 98%',
        accent: '347 77% 90%',
        accentForeground: '222.2 47.4% 11.2%',
        border: '347 77% 90%',
        ring: '347 77% 50%'
      }
    },
    dark: {
      primary: '347 77% 50%',
      primaryForeground: '210 40% 98%',
      secondary: '347 3.3% 15.7%',
      secondaryForeground: '210 40% 98%',
      accent: '347 3.3% 15.7%',
      accentForeground: '210 40% 98%',
      background: '347 15% 7%',
      foreground: '210 40% 98%',
      card: '347 15% 7%',
      cardForeground: '210 40% 98%',
      border: '347 3.3% 15.7%',
      input: '347 3.3% 15.7%',
      ring: '347 77% 50%',
      muted: '347 3.3% 15.7%',
      mutedForeground: '215 20.2% 65.1%',
      destructive: '0 62.8% 30.6%',
      destructiveForeground: '210 40% 98%',
      sidebar: {
        background: '347 25% 3%',
        foreground: '210 40% 98%',
        primary: '347 77% 50%',
        primaryForeground: '210 40% 98%',
        accent: '347 3.3% 15.7%',
        accentForeground: '210 40% 98%',
        border: '347 3.3% 15.7%',
        ring: '347 77% 50%'
      }
    }
  },
  {
    id: 'teal',
    name: 'teal',
    displayName: 'التيل المهدئ',
    description: 'ثيم مريح يجمع بين الأزرق والأخضر',
    preview: {
      primary: '#14b8a6',
      secondary: '#6b7280',
      accent: '#0f766e'
    },
    light: {
      primary: '173 80% 40%',
      primaryForeground: '210 40% 98%',
      secondary: '240 5% 96%',
      secondaryForeground: '222.2 47.4% 11.2%',
      accent: '175 84% 32%',
      accentForeground: '210 40% 98%',
      background: '173 80% 98%',
      foreground: '222.2 84% 4.9%',
      card: '255 100% 100%',
      cardForeground: '222.2 84% 4.9%',
      border: '173 80% 90%',
      input: '173 80% 90%',
      ring: '173 80% 40%',
      muted: '173 80% 94%',
      mutedForeground: '215.4 16.3% 46.9%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 40% 98%',
      sidebar: {
        background: '173 80% 98%',
        foreground: '222.2 84% 4.9%',
        primary: '173 80% 40%',
        primaryForeground: '210 40% 98%',
        accent: '173 80% 90%',
        accentForeground: '222.2 47.4% 11.2%',
        border: '173 80% 90%',
        ring: '173 80% 40%'
      }
    },
    dark: {
      primary: '173 80% 40%',
      primaryForeground: '210 40% 98%',
      secondary: '173 3.3% 15.7%',
      secondaryForeground: '210 40% 98%',
      accent: '173 3.3% 15.7%',
      accentForeground: '210 40% 98%',
      background: '173 15% 7%',
      foreground: '210 40% 98%',
      card: '173 15% 7%',
      cardForeground: '210 40% 98%',
      border: '173 3.3% 15.7%',
      input: '173 3.3% 15.7%',
      ring: '173 80% 40%',
      muted: '173 3.3% 15.7%',
      mutedForeground: '215 20.2% 65.1%',
      destructive: '0 62.8% 30.6%',
      destructiveForeground: '210 40% 98%',
      sidebar: {
        background: '173 25% 3%',
        foreground: '210 40% 98%',
        primary: '173 80% 40%',
        primaryForeground: '210 40% 98%',
        accent: '173 3.3% 15.7%',
        accentForeground: '210 40% 98%',
        border: '173 3.3% 15.7%',
        ring: '173 80% 40%'
      }
    }
  },
  {
    id: 'indigo',
    name: 'indigo',
    displayName: 'النيلي العميق',
    description: 'ثيم عميق يبعث على التركيز والهدوء',
    preview: {
      primary: '#6366f1',
      secondary: '#6b7280',
      accent: '#4f46e5'
    },
    light: {
      primary: '239 84% 67%',
      primaryForeground: '210 40% 98%',
      secondary: '240 5% 96%',
      secondaryForeground: '222.2 47.4% 11.2%',
      accent: '243 75% 59%',
      accentForeground: '210 40% 98%',
      background: '239 84% 98%',
      foreground: '222.2 84% 4.9%',
      card: '255 100% 100%',
      cardForeground: '222.2 84% 4.9%',
      border: '239 84% 90%',
      input: '239 84% 90%',
      ring: '239 84% 67%',
      muted: '239 84% 94%',
      mutedForeground: '215.4 16.3% 46.9%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 40% 98%',
      sidebar: {
        background: '239 84% 98%',
        foreground: '222.2 84% 4.9%',
        primary: '239 84% 67%',
        primaryForeground: '210 40% 98%',
        accent: '239 84% 90%',
        accentForeground: '222.2 47.4% 11.2%',
        border: '239 84% 90%',
        ring: '239 84% 67%'
      }
    },
    dark: {
      primary: '239 84% 67%',
      primaryForeground: '210 40% 98%',
      secondary: '239 3.3% 15.7%',
      secondaryForeground: '210 40% 98%',
      accent: '239 3.3% 15.7%',
      accentForeground: '210 40% 98%',
      background: '239 15% 7%',
      foreground: '210 40% 98%',
      card: '239 15% 7%',
      cardForeground: '210 40% 98%',
      border: '239 3.3% 15.7%',
      input: '239 3.3% 15.7%',
      ring: '239 84% 67%',
      muted: '239 3.3% 15.7%',
      mutedForeground: '215 20.2% 65.1%',
      destructive: '0 62.8% 30.6%',
      destructiveForeground: '210 40% 98%',
      sidebar: {
        background: '239 25% 3%',
        foreground: '210 40% 98%',
        primary: '239 84% 67%',
        primaryForeground: '210 40% 98%',
        accent: '239 3.3% 15.7%',
        accentForeground: '210 40% 98%',
        border: '239 3.3% 15.7%',
        ring: '239 84% 67%'
      }
    }
  }
];

export function getTheme(themeId: string): ColorTheme {
  return colorThemes.find(theme => theme.id === themeId) || colorThemes[0];
}

export function applyTheme(themeId: string, mode: 'light' | 'dark') {
  const theme = getTheme(themeId);
  const colors = theme[mode];
  
  const root = document.documentElement;
  
  // Apply CSS custom properties
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--primary-foreground', colors.primaryForeground);
  root.style.setProperty('--secondary', colors.secondary);
  root.style.setProperty('--secondary-foreground', colors.secondaryForeground);
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--accent-foreground', colors.accentForeground);
  root.style.setProperty('--background', colors.background);
  root.style.setProperty('--foreground', colors.foreground);
  root.style.setProperty('--card', colors.card);
  root.style.setProperty('--card-foreground', colors.cardForeground);
  root.style.setProperty('--border', colors.border);
  root.style.setProperty('--input', colors.input);
  root.style.setProperty('--ring', colors.ring);
  root.style.setProperty('--muted', colors.muted);
  root.style.setProperty('--muted-foreground', colors.mutedForeground);
  root.style.setProperty('--destructive', colors.destructive);
  root.style.setProperty('--destructive-foreground', colors.destructiveForeground);
  
  // Apply sidebar colors
  root.style.setProperty('--sidebar-background', colors.sidebar.background);
  root.style.setProperty('--sidebar-foreground', colors.sidebar.foreground);
  root.style.setProperty('--sidebar-primary', colors.sidebar.primary);
  root.style.setProperty('--sidebar-primary-foreground', colors.sidebar.primaryForeground);
  root.style.setProperty('--sidebar-accent', colors.sidebar.accent);
  root.style.setProperty('--sidebar-accent-foreground', colors.sidebar.accentForeground);
  root.style.setProperty('--sidebar-border', colors.sidebar.border);
  root.style.setProperty('--sidebar-ring', colors.sidebar.ring);
}

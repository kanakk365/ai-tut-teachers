'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import api from '@/lib/api';

interface Institution {
  id: string;
  name: string;
  type: string;
  affiliatedBoard: string;
  email: string;
  phone: string;
  website: string;
  yearOfEstablishment: string;
  totalStudentStrength: number;
  proofOfInstitutionUrl: string;
  profilePhotoUrl?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  pocName?: string | null;
  address: string;
  approvalStatus: string;
  isSuspended?: boolean;
  createdAt: string;
  updatedAt: string;
  addedById: string;
  curriculumMode?: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  institution: Institution | null;
  login: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Derive readable foreground color (black/white) based on background color brightness
const getContrastingTextColor = (hexColor?: string | null): string => {
  if (!hexColor) return '#ffffff';
  let hex = hexColor.trim();
  if (hex.startsWith('oklch')) {
    // If someone passes an oklch color, default to white foreground
    return '#ffffff';
  }
  if (hex.startsWith('#')) hex = hex.slice(1);
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  // YIQ formula
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#ffffff';
};

// Apply institution theme colors to CSS variables at runtime
const applyInstitutionTheme = (institution: Institution | null) => {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const primary = institution?.primaryColor || null;
  const secondary = institution?.secondaryColor || null;

  if (primary) {
    root.style.setProperty('--primary', primary);
    root.style.setProperty('--primary-foreground', getContrastingTextColor(primary));
  } else {
    root.style.removeProperty('--primary');
    root.style.removeProperty('--primary-foreground');
  }

  if (secondary) {
    root.style.setProperty('--secondary', secondary);
    root.style.setProperty('--secondary-foreground', getContrastingTextColor(secondary));
  } else {
    root.style.removeProperty('--secondary');
    root.style.removeProperty('--secondary-foreground');
  }

  // Persist theme in localStorage for fast rehydration
  try {
    const theme = { primary, secondary };
    localStorage.setItem('institution-theme', JSON.stringify(theme));
  } catch { }
};

// Restore theme from localStorage if present
const restoreThemeFromStorage = () => {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem('institution-theme');
    if (!stored) return;
    const theme = JSON.parse(stored) as { primary?: string | null; secondary?: string | null } | null;
    if (!theme) return;
    const root = document.documentElement;
    if (theme.primary) {
      root.style.setProperty('--primary', theme.primary);
      root.style.setProperty('--primary-foreground', getContrastingTextColor(theme.primary));
    }
    if (theme.secondary) {
      root.style.setProperty('--secondary', theme.secondary);
      root.style.setProperty('--secondary-foreground', getContrastingTextColor(theme.secondary));
    }
  } catch { }
};

const formatInstitutionData = (rawInstitution: unknown): Institution => {
  const record = (rawInstitution ?? {}) as Record<string, unknown>;

  const toStringOrEmpty = (value: unknown, fallback = "") =>
    value === null || value === undefined ? fallback : String(value);

  const optionalString = (value: unknown): string | null => {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    return String(value);
  };

  const numberValue = (value: unknown): number => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  return {
    id: toStringOrEmpty(record.id ?? record._id),
    name: toStringOrEmpty(record.name ?? record.institutionName ?? "Institution"),
    type: toStringOrEmpty(record.type ?? "Educational"),
    affiliatedBoard: toStringOrEmpty(record.affiliatedBoard),
    email: toStringOrEmpty(record.email),
    phone: toStringOrEmpty(record.phone),
    website: toStringOrEmpty(record.website),
    yearOfEstablishment: toStringOrEmpty(record.yearOfEstablishment),
    totalStudentStrength: numberValue(record.totalStudentStrength),
    proofOfInstitutionUrl: toStringOrEmpty(record.proofOfInstitutionUrl),
    profilePhotoUrl: optionalString(record.profilePhotoUrl),
    logoUrl: optionalString(record.logoUrl),
    primaryColor: optionalString(record.primaryColor),
    secondaryColor: optionalString(record.secondaryColor),
    pocName: optionalString(record.pocName),
    address: toStringOrEmpty(record.address),
    approvalStatus: toStringOrEmpty(record.approvalStatus ?? "approved"),
    isSuspended: Boolean(record.isSuspended ?? false),
    createdAt: toStringOrEmpty(record.createdAt),
    updatedAt: toStringOrEmpty(record.updatedAt),
    addedById: toStringOrEmpty(record.addedById),
    curriculumMode: optionalString(record.curriculumMode),
  };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on component mount
    const authCookie = Cookies.get('auth');

    if (authCookie) {
      try {
        const parsedAuth = JSON.parse(authCookie);
        const { user, token } = parsedAuth;

        if (user && token) {
          const formattedInstitution = formatInstitutionData(user);

          setInstitution(formattedInstitution);
          setIsAuthenticated(true);
          // Apply theme from cookie data
          applyInstitutionTheme(formattedInstitution);
        }
      } catch {
        // Invalid data, clear cookies
        Cookies.remove('auth');
        Cookies.remove('auth-token');
        Cookies.remove('institution-data');
      }
    }
    // If no cookie-based theme was applied, try restoring from localStorage for faster paint
    restoreThemeFromStorage();
    setLoading(false);
  }, []);

  const login = async (name: string, email: string, password: string) => {
    try {
      const response = await api.post('/teacher/auth/login', {
        name,
        email,
        password,
        institutionId: 'cmk4kyn3l003wskba7nl7um9u',
      });

      if (response.data.success) {
        const { token, institution: institutionData } = response.data.data;
        const formattedInstitution = formatInstitutionData(institutionData);

        // Store in both formats for compatibility
        const authData = {
          token,
          user: formattedInstitution
        };

        Cookies.set('auth', JSON.stringify(authData), { expires: 7 }); // Main auth cookie
        Cookies.set('auth-token', token, { expires: 7 }); // Token only
        Cookies.set('institution-data', JSON.stringify(formattedInstitution), { expires: 7 }); // Institution data
        // Also store in localStorage as requested
        try {
          localStorage.setItem('auth', JSON.stringify(authData));
          localStorage.setItem('auth-token', token);
          localStorage.setItem('institution-data', JSON.stringify(formattedInstitution));
        } catch { }

        setInstitution(formattedInstitution);
        setIsAuthenticated(true);
        // Apply and persist theme colors from login response
        applyInstitutionTheme(formattedInstitution);

        return { success: true, message: response.data.message };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? (error as Error & { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Login failed. Please try again.';
      return {
        success: false,
        message: errorMessage || 'Login failed. Please try again.'
      };
    }
  };

  const logout = () => {
    console.log('=== LOGOUT PROCESS STARTED ===');
    console.log('Current isAuthenticated:', isAuthenticated);
    console.log('Current institution:', institution);

    console.log('Removing cookies...');

    // Get all cookies before removal for debugging
    console.log('Cookies before removal:', {
      auth: Cookies.get('auth'),
      authToken: Cookies.get('auth-token'),
      institutionData: Cookies.get('institution-data')
    });

    // Remove cookies with different path options to ensure they're cleared
    Cookies.remove('auth', { path: '' });
    Cookies.remove('auth', { path: '/' });
    Cookies.remove('auth-token', { path: '' });
    Cookies.remove('auth-token', { path: '/' });
    Cookies.remove('institution-data', { path: '' });
    Cookies.remove('institution-data', { path: '/' });

    // Also clear any other potential auth-related cookies
    Cookies.remove('auth');
    Cookies.remove('auth-token');
    Cookies.remove('institution-data');

    // Clear localStorage entries
    try {
      localStorage.removeItem('auth');
      localStorage.removeItem('auth-token');
      localStorage.removeItem('institution-data');
      localStorage.removeItem('institution-theme');
    } catch { }

    // Reset theme overrides to fall back to CSS defaults
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      root.style.removeProperty('--primary');
      root.style.removeProperty('--primary-foreground');
      root.style.removeProperty('--secondary');
      root.style.removeProperty('--secondary-foreground');
    }

    // Check cookies after removal
    console.log('Cookies after removal:', {
      auth: Cookies.get('auth'),
      authToken: Cookies.get('auth-token'),
      institutionData: Cookies.get('institution-data')
    });

    console.log('Setting state...');
    setInstitution(null);
    setIsAuthenticated(false);

    console.log('=== LOGOUT PROCESS COMPLETED ===');
    console.log('New isAuthenticated:', false);
    console.log('New institution:', null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        institution,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

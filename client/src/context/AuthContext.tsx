import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '../types';
import { authService, type LoginResult, type ProfileResponse } from '../services/authService';
import { authStorage, setUnauthorizedHandler } from '../services/apiClient';

type AuthRole = 'employee' | 'employer';

interface AuthContextValue {
  user: User | null;
  role: AuthRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  accountStatus: string | null;
  dashboardPath: string | null;
  login: (email: string, password: string, role: AuthRole) => Promise<User>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getDashboardPath = (role: AuthRole | null) => {
  if (role === 'employer') {
    return '/employer/dashboard';
  }

  if (role === 'employee') {
    return '/dashboard/employee';
  }

  return null;
};

const toSessionUser = (profile: ProfileResponse): User | null => {
  const role = profile.role === 'employee' || profile.role === 'employer' ? profile.role : null;
  if (!role) {
    return null;
  }

  const rawUser = profile.user as Record<string, unknown>;
  const name =
    role === 'employee'
      ? String(rawUser.full_name || rawUser.name || 'Employee')
      : String(rawUser.organization_name || rawUser.name || 'Employer');

  return {
    id: String(rawUser.id || ''),
    email: String(rawUser.email || ''),
    name,
    role,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AuthRole | null>(null);
  const [accountStatus, setAccountStatus] = useState<string | null>(authStorage.getAccountStatus());
  const [loading, setLoading] = useState(true);

  const clearAuthState = () => {
    authStorage.clearUserSession();
    setUser(null);
    setRole(null);
    setAccountStatus(null);
  };

  const applyLoginResult = (result: LoginResult) => {
    setUser(result.user);
    setRole(result.user.role as AuthRole);
    setAccountStatus(result.account_status || authStorage.getAccountStatus());
  };

  const applyProfile = (profile: ProfileResponse) => {
    const sessionUser = toSessionUser(profile);
    if (!sessionUser) {
      clearAuthState();
      return;
    }

    setUser(sessionUser);
    setRole(sessionUser.role as AuthRole);

    const nextAccountStatus =
      typeof (profile.user as Record<string, unknown>).account_status === 'string'
        ? String((profile.user as Record<string, unknown>).account_status)
        : authStorage.getAccountStatus();

    setAccountStatus(nextAccountStatus);
  };

  const refreshProfile = async () => {
    const profile = await authService.getProfile();
    applyProfile(profile);
  };

  useEffect(() => {
    let mounted = true;

    setUnauthorizedHandler(() => {
      if (!mounted) {
        return;
      }

      setUser(null);
      setRole(null);
      setAccountStatus(null);
      setLoading(false);
    });

    const initializeAuth = async () => {
      try {
        await refreshProfile();
      } catch {
        if (mounted) {
          clearAuthState();
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void initializeAuth();

    return () => {
      mounted = false;
      setUnauthorizedHandler(null);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      loading,
      isAuthenticated: Boolean(user && role),
      accountStatus,
      dashboardPath: getDashboardPath(role),
      login: async (email, password, nextRole) => {
        const result = await authService.login(email, password, nextRole);
        applyLoginResult(result);
        return result.user;
      },
      logout: async () => {
        await authService.logout();
        clearAuthState();
      },
      refreshProfile,
    }),
    [accountStatus, loading, role, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

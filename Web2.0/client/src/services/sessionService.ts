export type SessionRole = 'employee' | 'employer' | 'admin';

export interface SessionState {
  isAuthenticated: boolean;
  role: SessionRole | null;
  dashboardPath: string | null;
  token: string | null;
}

const getEmployeeOrEmployerSession = (): SessionState | null => {
  const token = localStorage.getItem('nevn_token');
  const role = localStorage.getItem('nevn_role');

  if (!token || (role !== 'employee' && role !== 'employer')) {
    return null;
  }

  return {
    isAuthenticated: true,
    role,
    dashboardPath: role === 'employer' ? '/employer/dashboard' : '/dashboard/employee',
    token,
  };
};

const getAdminSession = (): SessionState | null => {
  const token = localStorage.getItem('nevn_admin_token');
  if (!token) {
    return null;
  }

  return {
    isAuthenticated: true,
    role: 'admin',
    dashboardPath: '/admin',
    token,
  };
};

export { getAdminSession };

export const sessionService = {
  getSession(): SessionState {
    return getAdminSession() || getEmployeeOrEmployerSession() || {
      isAuthenticated: false,
      role: null,
      dashboardPath: null,
      token: null,
    };
  },

  clearUserSession() {
    localStorage.removeItem('nevn_token');
    localStorage.removeItem('nevn_role');
    localStorage.removeItem('nevn_account_status');
  },

  clearAdminSession() {
    localStorage.removeItem('nevn_admin_token');
  },

  clearAllSessions() {
    this.clearUserSession();
    this.clearAdminSession();
  },
};

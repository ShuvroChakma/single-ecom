/**
 * Auth Store using React Context with HttpOnly Cookie-based Refresh
 * 
 * Security: 
 * - Access token stored in memory only (not localStorage)
 * - Refresh token in HttpOnly cookie (managed by TanStack Start server)
 */
import { refreshToken as refreshTokenApi } from "@/api/auth";
import { setTokenRefreshCallback } from "@/api/client";
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

interface User {
  id: string;
  email: string;
  full_name: string;
  user_type: string;
}

interface AuthContextType {
  user: User | null;
    token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
    login: (token: string, user: User) => void;
  logout: () => void;
    setAccessToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = "admin_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

    // Update access token
    const setAccessToken = useCallback((accessToken: string) => {
        setToken(accessToken);
  }, []);

    // Logout function
    const logout = useCallback(() => {
        setToken(null);
        setUser(null);

      if (typeof window !== "undefined") {
          localStorage.removeItem(USER_KEY);
      }
  }, []);

    // Handle token refresh (called by API client on 401)
    const handleTokenRefresh = useCallback(async () => {
      try {
        // Call server function - it reads refresh token from HttpOnly cookie
        const response = await refreshTokenApi();

        if (response.success && response.data) {
            setToken(response.data.access_token);
            return {
                access_token: response.data.access_token,
                refresh_token: response.data.refresh_token,
            };
        }
        return null;
    } catch {
        // Refresh failed - clear auth state
        logout();
        return null;
    }
  }, [logout]);

    // Set up token refresh callback for API client
    useEffect(() => {
        setTokenRefreshCallback(handleTokenRefresh);
    }, [handleTokenRefresh]);

    // Try to restore session on mount by calling refresh
  useEffect(() => {
      const restoreSession = async () => {
          // Check if we have stored user data
          const storedUser = typeof window !== "undefined"
              ? localStorage.getItem(USER_KEY)
              : null;

        if (storedUser) {
        try {
            // Try to refresh token using HttpOnly cookie
            const response = await refreshTokenApi();

            if (response.success && response.data) {
                setToken(response.data.access_token);
                setUser(JSON.parse(storedUser));
          } else {
              // Refresh failed, clear stored user
              localStorage.removeItem(USER_KEY);
          }
        } catch {
            // Refresh failed, clear stored user
          localStorage.removeItem(USER_KEY);
        }
      }
      setIsLoading(false);
      };

      restoreSession();
  }, []);

    const login = (newToken: string, newUser: User) => {
      setToken(newToken);
    setUser(newUser);

      // Only store user info (not tokens) in localStorage
      if (typeof window !== "undefined") {
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
              token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
              setAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Auth Store using React Context with Token Refresh
 * Manages authentication state across the admin app
 */
import { refreshToken as refreshTokenApi } from "@/api/auth";
import { AuthenticationError, setTokenRefreshCallback } from "@/api/client";
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
    refreshTokenValue: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
    login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
    updateTokens: (accessToken: string, refreshToken: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "admin_token";
const REFRESH_TOKEN_KEY = "admin_refresh_token";
const USER_KEY = "admin_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
    const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

    // Update tokens (used for refresh)
    const updateTokens = useCallback((accessToken: string, refreshToken: string) => {
        setToken(accessToken);
        setRefreshTokenValue(refreshToken);

        if (typeof window !== "undefined") {
            localStorage.setItem(TOKEN_KEY, accessToken);
            localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        }
    }, []);

    // Handle token refresh
    const handleTokenRefresh = useCallback(async () => {
        const storedRefreshToken =
            refreshTokenValue ||
            (typeof window !== "undefined"
                ? localStorage.getItem(REFRESH_TOKEN_KEY)
                : null);

        if (!storedRefreshToken) {
            return null;
        }

        try {
            const response = await refreshTokenApi({
                data: { refresh_token: storedRefreshToken },
            });

            if (response.success) {
                updateTokens(response.data.access_token, response.data.refresh_token);
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
    }, [refreshTokenValue, updateTokens]);

    // Set up token refresh callback for API client
    useEffect(() => {
        setTokenRefreshCallback(handleTokenRefresh);
    }, [handleTokenRefresh]);

  // Load auth state from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
            setRefreshTokenValue(storedRefreshToken);
          setUser(JSON.parse(storedUser));
        } catch {
          // Invalid stored data, clear it
          localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      }
      setIsLoading(false);
    }
  }, []);

    const login = (
        newToken: string,
        newRefreshToken: string,
        newUser: User
    ) => {
    setToken(newToken);
      setRefreshTokenValue(newRefreshToken);
    setUser(newUser);

    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    }
  };

  const logout = () => {
    setToken(null);
      setRefreshTokenValue(null);
    setUser(null);

    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
              refreshTokenValue,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
              updateTokens,
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

// Re-export AuthenticationError for use in components
export { AuthenticationError };

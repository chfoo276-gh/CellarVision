import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { initGapiClient, syncFromCloud, setCloudSyncEnabled } from '../services/cloudService';

interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

interface AuthContextType {
  user: UserProfile | null;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize GAPI client on load
  useEffect(() => {
    initGapiClient().then(() => {
        // Check if we have a stored user in local storage to persist session visually
        const storedUser = localStorage.getItem('cv_google_user');
        if (storedUser) {
           setUser(JSON.parse(storedUser));
           // Note: Cloud sync isn't enabled here until re-login gets a fresh token
        }
        setIsLoading(false);
    }).catch(err => {
        console.error("Failed to init GAPI", err);
        // Still allow app to load even if GAPI fails (offline mode)
        setIsLoading(false);
    });
  }, []);

  const loginFlow = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      // 1. Fetch User Info
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(res => res.json());

        const profile: UserProfile = {
            name: userInfo.name,
            email: userInfo.email,
            picture: userInfo.picture
        };

        setUser(profile);
        localStorage.setItem('cv_google_user', JSON.stringify(profile));
        
        // 2. Enable Cloud Sync & Pull Data
        // Set GAPI token for file operations using global window object
        if (window.gapi && window.gapi.client) {
            window.gapi.client.setToken({ access_token: tokenResponse.access_token });
            
            setCloudSyncEnabled(true);
            await syncFromCloud(tokenResponse.access_token); // Load data from Drive immediately
            
            // Force reload to reflect imported data in UI
            window.location.reload();
        } else {
            console.error("GAPI not ready for token setting");
        }
        
      } catch (error) {
          console.error("Login failed", error);
      }
    },
    onError: (error) => console.log('Login Failed:', error),
    scope: 'https://www.googleapis.com/auth/drive.file profile email', // Request Drive access
    prompt: 'select_account',
  });

  const logout = () => {
    googleLogout();
    setUser(null);
    setCloudSyncEnabled(false);
    localStorage.removeItem('cv_google_user');
    if (window.gapi && window.gapi.client) {
        window.gapi.client.setToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login: loginFlow, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
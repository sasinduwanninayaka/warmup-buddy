// src/theme/ThemeContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DARK_MODE_KEY = 'settings_dark_mode';

// Two colour palettes — every screen reads from whichever one is active
// instead of hardcoding colours, so toggling dark mode updates everything.
const LIGHT_COLORS = {
  background: '#fafafa',
  card: '#ffffff',
  text: '#111111',
  subtext: '#777777',
  border: '#e2e2e2',
  chipBg: '#eeeeee',
  inputBg: '#fafafa',
};

const DARK_COLORS = {
  background: '#121212',
  card: '#1e1e1e',
  text: '#f5f5f5',
  subtext: '#a0a0a0',
  border: '#333333',
  chipBg: '#2a2a2a',
  inputBg: '#1a1a1a',
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // useState: whether dark mode is currently on
  const [isDark, setIsDark] = useState(false);

  // useState: true until the saved preference has been loaded, so we don't
  // flash the wrong theme for a split second on app launch
  const [loaded, setLoaded] = useState(false);

  // Load the saved preference once when the app starts
  useEffect(() => {
    AsyncStorage.getItem(DARK_MODE_KEY)
      .then(value => {
        if (value !== null) setIsDark(value === 'true');
      })
      .finally(() => setLoaded(true));
  }, []);

  // Flips dark mode and saves the new value so it persists across restarts
  const toggleDark = () => {
    const newValue = !isDark;
    setIsDark(newValue);
    AsyncStorage.setItem(DARK_MODE_KEY, newValue.toString()).catch(() => {});
  };

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook used by every screen to access { isDark, toggleDark, colors }
export function useTheme() {
  return useContext(ThemeContext);
}
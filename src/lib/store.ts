import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Types
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  lastLogin: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'system' | 'light' | 'dark';
  language: string;
  notifications: boolean;
  soundEnabled: boolean;
  autoSave: boolean;
}

export interface UserSettings {
  dailyGoal: number;
  studyReminders: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  dataCollection: boolean;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

export interface ToolProgress {
  completed: number;
  total: number;
  lastUsed: Date;
  streak: number;
  accuracy?: number;
}

export interface PrepTalkState {
  // User state
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // App settings
  theme: 'system' | 'light' | 'dark';
  settings: UserSettings;
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // Tools tracking
  tools: {
    lastUsed: string[];
    favorites: string[];
    progress: Record<string, ToolProgress>;
  };
  
  // UI state
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  
  // Actions
  setUser: (user: UserProfile | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setTheme: (theme: 'system' | 'light' | 'dark') => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  
  // Tool actions
  trackToolUsage: (toolId: string) => void;
  toggleFavorite: (toolId: string) => void;
  updateToolProgress: (toolId: string, progress: Partial<ToolProgress>) => void;
  
  // UI actions
  setSidebarOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  
  // Utility actions
  reset: () => void;
}

// Default values
const defaultSettings: UserSettings = {
  dailyGoal: 50,
  studyReminders: true,
  emailNotifications: true,
  pushNotifications: true,
  dataCollection: true,
};

const generateId = () => crypto.randomUUID();

// Create the store
export const useAppStore = create<PrepTalkState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      theme: 'system',
      settings: defaultSettings,
      notifications: [],
      unreadCount: 0,
      tools: {
        lastUsed: [],
        favorites: [],
        progress: {},
      },
      sidebarOpen: false,
      mobileMenuOpen: false,

      // User actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setLoading: (isLoading) => set({ isLoading }),
      
      // Theme actions
      setTheme: (theme) => set({ theme }),
      
      // Settings actions
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      // Notification actions
      addNotification: (notification) => set((state) => {
        const newNotification: Notification = {
          ...notification,
          id: generateId(),
          timestamp: new Date(),
          read: false,
        };
        
        return {
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        };
      }),
      
      removeNotification: (id) => set((state) => {
        const notification = state.notifications.find(n => n.id === id);
        const wasUnread = notification && !notification.read;
        
        return {
          notifications: state.notifications.filter(n => n.id !== id),
          unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
        };
      }),
      
      markNotificationAsRead: (id) => set((state) => {
        const notifications = state.notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        );
        
        const notification = state.notifications.find(n => n.id === id);
        const wasUnread = notification && !notification.read;
        
        return {
          notifications,
          unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
        };
      }),
      
      markAllNotificationsAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      })),

      // Tool actions
      trackToolUsage: (toolId) => set((state) => {
        const updatedLastUsed = [
          toolId,
          ...state.tools.lastUsed.filter(id => id !== toolId)
        ].slice(0, 10); // Keep only last 10 used tools
        
        return {
          tools: {
            ...state.tools,
            lastUsed: updatedLastUsed,
          }
        };
      }),
      
      toggleFavorite: (toolId) => set((state) => {
        const isFavorite = state.tools.favorites.includes(toolId);
        const favorites = isFavorite
          ? state.tools.favorites.filter(id => id !== toolId)
          : [...state.tools.favorites, toolId];
        
        return {
          tools: {
            ...state.tools,
            favorites,
          }
        };
      }),
      
      updateToolProgress: (toolId, progress) => set((state) => ({
        tools: {
          ...state.tools,
          progress: {
            ...state.tools.progress,
            [toolId]: {
              ...state.tools.progress[toolId],
              ...progress,
              lastUsed: new Date(),
            }
          }
        }
      })),

      // UI actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

      // Utility actions
      reset: () => set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        theme: 'system',
        settings: defaultSettings,
        notifications: [],
        unreadCount: 0,
        tools: {
          lastUsed: [],
          favorites: [],
          progress: {},
        },
        sidebarOpen: false,
        mobileMenuOpen: false,
      }),
    }),
    {
      name: 'preptalk-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        settings: state.settings,
        tools: state.tools,
        // Don't persist notifications and UI state
      }),
    }
  )
);

// Selectors for better performance
export const useUser = () => useAppStore((state) => state.user);
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated);
export const useTheme = () => useAppStore((state) => state.theme);
export const useSettings = () => useAppStore((state) => state.settings);
export const useNotifications = () => useAppStore((state) => ({
  notifications: state.notifications,
  unreadCount: state.unreadCount,
}));
export const useTools = () => useAppStore((state) => state.tools);
export const useUIState = () => useAppStore((state) => ({
  sidebarOpen: state.sidebarOpen,
  mobileMenuOpen: state.mobileMenuOpen,
}));
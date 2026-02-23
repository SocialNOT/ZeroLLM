import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ModelConnection, Persona, Workspace, ChatSession, Message, UserRole, ToolDefinition } from '@/types';
import { testConnection, fetchModels } from '@/lib/llm-api';

interface AppState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  connections: ModelConnection[];
  activeConnectionId: string | null;
  personas: Persona[];
  sessions: ChatSession[];
  activeSessionId: string | null;
  isConfigured: boolean;
  currentUserRole: UserRole;
  availableTools: ToolDefinition[];
  availableModels: string[];
  connectionStatus: 'online' | 'offline' | 'checking';
  
  // Actions
  addWorkspace: (w: Workspace) => void;
  setActiveWorkspace: (id: string) => void;
  addConnection: (c: ModelConnection) => void;
  updateConnection: (id: string, c: Partial<ModelConnection>) => void;
  setActiveConnection: (id: string | null) => void;
  addPersona: (p: Persona) => void;
  createSession: (workspaceId: string) => string;
  setActiveSession: (id: string | null) => void;
  addMessage: (sessionId: string, message: Message) => void;
  updateSessionSettings: (sessionId: string, settings: Partial<ChatSession['settings']>) => void;
  completeInitialSetup: (baseUrl: string, modelId: string) => Promise<boolean>;
  setRole: (role: UserRole) => void;
  checkConnection: () => Promise<void>;
  refreshModels: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      workspaces: [
        { id: 'ws-1', name: 'General Assistant', icon: 'zap', description: 'Default multipurpose workspace' },
        { id: 'ws-2', name: 'Academic Research', icon: 'book', description: 'Papers and thesis management' }
      ],
      activeWorkspaceId: 'ws-1',
      connections: [],
      activeConnectionId: null,
      personas: [
        { id: 'p-1', name: 'Socratic Professor', icon: 'graduation-cap', systemPrompt: 'You are a wise Socratic professor. Answer questions with guided questions.' },
        { id: 'p-2', name: 'Expert Coder', icon: 'code', systemPrompt: 'You are a world-class senior software engineer. Provide clean, documented code.' }
      ],
      sessions: [],
      activeSessionId: null,
      isConfigured: false,
      currentUserRole: 'Admin',
      availableTools: [
        { id: 'calculator', name: 'Calculator', description: 'Perform mathematical operations', icon: 'calculator' },
        { id: 'web_search', name: 'Web Search', description: 'Search the internet for real-time info', icon: 'search' }
      ],
      availableModels: [],
      connectionStatus: 'offline',

      addWorkspace: (w) => set((state) => ({ workspaces: [...state.workspaces, w] })),
      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
      
      addConnection: (c) => set((state) => ({ 
        connections: [...state.connections, c],
        activeConnectionId: state.activeConnectionId || c.id 
      })),

      updateConnection: (id, updates) => {
        set((state) => ({
          connections: state.connections.map(c => c.id === id ? { ...c, ...updates } : c)
        }));
        if (id === get().activeConnectionId) {
          get().checkConnection();
        }
      },

      setActiveConnection: (id) => {
        set({ activeConnectionId: id });
        get().checkConnection();
      },

      addPersona: (p) => set((state) => ({ personas: [...state.personas, p] })),
      setActiveSession: (id) => set({ activeSessionId: id }),
      setRole: (role) => set({ currentUserRole: role }),
      
      checkConnection: async () => {
        const activeConn = get().connections.find(c => c.id === get().activeConnectionId);
        if (!activeConn) return;

        set({ connectionStatus: 'checking' });
        try {
          const isOnline = await testConnection(activeConn.baseUrl);
          set({ connectionStatus: isOnline ? 'online' : 'offline' });
          
          if (isOnline) {
            await get().refreshModels();
          }
        } catch (e) {
          set({ connectionStatus: 'offline' });
        }
      },

      refreshModels: async () => {
        const activeConn = get().connections.find(c => c.id === get().activeConnectionId);
        if (!activeConn) return;

        try {
          const models = await fetchModels(activeConn.baseUrl);
          set({ availableModels: models.map(m => m.id) });
        } catch (e) {
          // Fail silently
        }
      },

      completeInitialSetup: async (baseUrl, modelId) => {
        const id = 'default-conn';
        set({ connectionStatus: 'checking' });
        
        try {
          const isOnline = await testConnection(baseUrl);
          
          const newConn: ModelConnection = {
            id,
            name: 'Primary Engine',
            provider: 'Custom',
            baseUrl,
            modelId,
            contextWindow: 4096,
            status: isOnline ? 'online' : 'offline'
          };

          set({ 
            connections: [newConn], 
            activeConnectionId: id,
            isConfigured: true,
            connectionStatus: isOnline ? 'online' : 'offline'
          });

          if (isOnline) {
            await get().refreshModels();
          }

          return isOnline;
        } catch (err) {
          set({ connectionStatus: 'offline' });
          return false;
        }
      },

      createSession: (workspaceId) => {
        const id = Math.random().toString(36).substring(7);
        const newSession: ChatSession = {
          id,
          workspaceId,
          title: 'New Conversation',
          messages: [],
          activeModelId: get().activeConnectionId || '',
          personaId: get().personas[0]?.id || '',
          settings: {
            temperature: 0.7,
            topP: 0.9,
            maxTokens: 1024,
            format: 'markdown',
            memoryType: 'buffer',
            enabledTools: []
          }
        };
        set((state) => ({ sessions: [...state.sessions, newSession], activeSessionId: id }));
        return id;
      },

      addMessage: (sessionId, message) => set((state) => ({
        sessions: state.sessions.map(s => 
          s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s
        )
      })),

      updateSessionSettings: (sessionId, settings) => set((state) => ({
        sessions: state.sessions.map(s => 
          s.id === sessionId ? { ...s, settings: { ...s.settings, ...settings } } : s
        )
      }))
    }),
    { name: 'aetheria-storage' }
  )
);

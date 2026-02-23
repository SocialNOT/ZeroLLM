
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ModelConnection, Persona, Workspace, ChatSession, Message } from '@/types';

interface AppState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  connections: ModelConnection[];
  activeConnectionId: string | null;
  personas: Persona[];
  sessions: ChatSession[];
  activeSessionId: string | null;
  isConfigured: boolean;
  
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
  completeInitialSetup: (baseUrl: string, modelId: string) => void;
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

      addWorkspace: (w) => set((state) => ({ workspaces: [...state.workspaces, w] })),
      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
      
      addConnection: (c) => set((state) => ({ 
        connections: [...state.connections, c],
        activeConnectionId: state.activeConnectionId || c.id 
      })),

      updateConnection: (id, updates) => set((state) => ({
        connections: state.connections.map(c => c.id === id ? { ...c, ...updates } : c)
      })),

      setActiveConnection: (id) => set({ activeConnectionId: id }),

      addPersona: (p) => set((state) => ({ personas: [...state.personas, p] })),
      
      setActiveSession: (id) => set({ activeSessionId: id }),
      
      completeInitialSetup: (baseUrl, modelId) => {
        const id = 'default-conn';
        const newConn: ModelConnection = {
          id,
          name: 'Primary Engine',
          provider: 'Ollama',
          baseUrl,
          modelId,
          contextWindow: 4096,
          status: 'checking'
        };
        set({ 
          connections: [newConn], 
          activeConnectionId: id,
          isConfigured: true 
        });
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
            format: 'markdown'
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

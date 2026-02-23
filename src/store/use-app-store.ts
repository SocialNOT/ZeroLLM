
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ModelConnection, Persona, Workspace, ChatSession, Message } from '@/types';

interface AppState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  connections: ModelConnection[];
  personas: Persona[];
  sessions: ChatSession[];
  activeSessionId: string | null;
  
  // Actions
  addWorkspace: (w: Workspace) => void;
  setActiveWorkspace: (id: string) => void;
  addConnection: (c: ModelConnection) => void;
  updateConnection: (id: string, c: Partial<ModelConnection>) => void;
  addPersona: (p: Persona) => void;
  createSession: (workspaceId: string) => string;
  setActiveSession: (id: string | null) => void;
  addMessage: (sessionId: string, message: Message) => void;
  updateSessionSettings: (sessionId: string, settings: Partial<ChatSession['settings']>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      workspaces: [
        { id: 'ws-1', name: 'General Assistant', icon: 'zap', description: 'Default multipurpose workspace' },
        { id: 'ws-2', name: 'Academic Research', icon: 'book', description: 'Papers and thesis management' }
      ],
      activeWorkspaceId: 'ws-1',
      connections: [
        { id: 'conn-1', name: 'Local Ollama', provider: 'Ollama', baseUrl: 'http://localhost:11434/v1', modelId: 'llama3:8b', contextWindow: 4096 }
      ],
      personas: [
        { id: 'p-1', name: 'Socratic Professor', icon: 'graduation-cap', systemPrompt: 'You are a wise Socratic professor. Answer questions with guided questions.' },
        { id: 'p-2', name: 'Expert Coder', icon: 'code', systemPrompt: 'You are a world-class senior software engineer. Provide clean, documented code.' }
      ],
      sessions: [],
      activeSessionId: null,

      addWorkspace: (w) => set((state) => ({ workspaces: [...state.workspaces, w] })),
      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
      addConnection: (c) => set((state) => ({ connections: [...state.connections, c] })),
      updateConnection: (id, updates) => set((state) => ({
        connections: state.connections.map(c => c.id === id ? { ...c, ...updates } : c)
      })),
      addPersona: (p) => set((state) => ({ personas: [...state.personas, p] })),
      setActiveSession: (id) => set({ activeSessionId: id }),
      
      createSession: (workspaceId) => {
        const id = Math.random().toString(36).substring(7);
        const newSession: ChatSession = {
          id,
          workspaceId,
          title: 'New Conversation',
          messages: [],
          activeModelId: get().connections[0]?.id || '',
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

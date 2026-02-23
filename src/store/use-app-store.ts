
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ModelConnection, Persona, Workspace, ChatSession, Message, UserRole, ToolDefinition, Framework, LinguisticControl } from '@/types';
import { testConnectionAction, fetchModelsAction, loadModelAction } from '@/ai/actions/engine-actions';

interface AppState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  connections: ModelConnection[];
  activeConnectionId: string | null;
  personas: Persona[];
  frameworks: Framework[];
  linguisticControls: LinguisticControl[];
  sessions: ChatSession[];
  activeSessionId: string | null;
  isConfigured: boolean;
  currentUserRole: UserRole;
  availableTools: ToolDefinition[];
  availableModels: string[];
  connectionStatus: 'online' | 'offline' | 'checking';
  isModelLoading: boolean;
  
  // Actions
  addWorkspace: (w: Workspace) => void;
  setActiveWorkspace: (id: string) => void;
  addConnection: (c: ModelConnection) => void;
  updateConnection: (id: string, c: Partial<ModelConnection>) => void;
  setActiveConnection: (id: string | null) => void;
  
  // Persona Actions
  addPersona: (p: Persona) => void;
  
  // Framework Actions
  addFramework: (f: Framework) => void;
  
  // Linguistic Actions
  addLinguisticControl: (l: LinguisticControl) => void;

  createSession: (workspaceId: string) => string;
  setActiveSession: (id: string | null) => void;
  addMessage: (sessionId: string, message: Message) => void;
  updateSessionSettings: (sessionId: string, settings: Partial<ChatSession['settings']>) => void;
  applyFramework: (sessionId: string, frameworkId: string) => void;
  applyPersona: (sessionId: string, personaId: string) => void;
  applyLinguisticControl: (sessionId: string, linguisticId: string) => void;

  completeInitialSetup: (baseUrl: string, modelId: string, apiKey?: string) => Promise<boolean>;
  setRole: (role: UserRole) => void;
  checkConnection: () => Promise<void>;
  refreshModels: () => Promise<void>;
  triggerModelLoad: (modelId: string) => Promise<boolean>;
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
        { id: 'p-2', name: 'Expert Coder', icon: 'code', systemPrompt: 'You are a world-class senior software engineer. Provide clean, documented code.' },
        { id: 'p-3', name: 'UX Strategist', icon: 'layout', systemPrompt: 'You are a senior UX strategist. Focus on user empathy, accessibility, and clean design patterns.' }
      ],

      frameworks: [
        { id: 'f-1', name: 'Deep Research', description: 'Optimized for cross-referencing and factual verification.', systemPrompt: 'Act as a research scientist. Cite sources, use logical deduction, and verify all claims.', tools: ['web_search'] },
        { id: 'f-2', name: 'Code Auditor', description: 'Focused on security, performance, and best practices.', systemPrompt: 'Audit the provided code for vulnerabilities, leaks, and inefficiencies.', tools: [] },
        { id: 'f-3', name: 'Mathematical Engine', description: 'High precision calculations and symbolic math.', systemPrompt: 'Solve complex mathematical problems with step-by-step proofs.', tools: ['calculator'] }
      ],

      linguisticControls: [
        { id: 'l-1', name: 'Academic Formal', temperature: 0.3, topP: 0.8, maxTokens: 2048, format: 'markdown', description: 'Structured, precise, and objective language.' },
        { id: 'l-2', name: 'Casual Direct', temperature: 0.8, topP: 0.9, maxTokens: 512, format: 'markdown', description: 'Concise, friendly, and easy to understand.' },
        { id: 'l-3', name: 'Creative Explosive', temperature: 1.0, topP: 1.0, maxTokens: 1024, format: 'markdown', description: 'High variability, poetic, and imaginative.' }
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
      isModelLoading: false,

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
      },

      setActiveConnection: (id) => {
        set({ activeConnectionId: id });
        get().checkConnection();
      },

      addPersona: (p) => set((state) => ({ personas: [...state.personas, p] })),
      addFramework: (f) => set((state) => ({ frameworks: [...state.frameworks, f] })),
      addLinguisticControl: (l) => set((state) => ({ linguisticControls: [...state.linguisticControls, l] })),

      setActiveSession: (id) => set({ activeSessionId: id }),
      setRole: (role) => set({ currentUserRole: role }),
      
      checkConnection: async () => {
        const activeConn = get().connections.find(c => c.id === get().activeConnectionId);
        if (!activeConn) return;

        set({ connectionStatus: 'checking' });
        try {
          const isOnline = await testConnectionAction(activeConn.baseUrl, activeConn.apiKey);
          set({ connectionStatus: isOnline ? 'online' : 'offline' });
          if (isOnline) await get().refreshModels();
        } catch (e) {
          set({ connectionStatus: 'offline' });
        }
      },

      refreshModels: async () => {
        const activeConn = get().connections.find(c => c.id === get().activeConnectionId);
        if (!activeConn) return;
        try {
          const models = await fetchModelsAction(activeConn.baseUrl, activeConn.apiKey);
          set({ availableModels: models.map(m => m.id) });
        } catch (e) {}
      },

      triggerModelLoad: async (modelId) => {
        const activeConn = get().connections.find(c => c.id === get().activeConnectionId);
        if (!activeConn) return false;
        set({ isModelLoading: true });
        try {
          return await loadModelAction(activeConn.baseUrl, modelId, activeConn.apiKey);
        } finally {
          set({ isModelLoading: false });
        }
      },

      completeInitialSetup: async (baseUrl, modelId, apiKey) => {
        const id = 'default-conn';
        set({ connectionStatus: 'checking' });
        try {
          const isOnline = await testConnectionAction(baseUrl, apiKey);
          const newConn: ModelConnection = {
            id,
            name: 'Primary Engine',
            provider: 'Custom',
            baseUrl,
            apiKey,
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
          if (isOnline) await get().refreshModels();
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
      })),

      applyFramework: (sessionId, frameworkId) => {
        const framework = get().frameworks.find(f => f.id === frameworkId);
        if (!framework) return;
        set((state) => ({
          sessions: state.sessions.map(s => 
            s.id === sessionId ? { 
              ...s, 
              frameworkId,
              settings: { ...s.settings, enabledTools: framework.tools }
            } : s
          )
        }));
      },

      applyPersona: (sessionId, personaId) => {
        set((state) => ({
          sessions: state.sessions.map(s => 
            s.id === sessionId ? { ...s, personaId } : s
          )
        }));
      },

      applyLinguisticControl: (sessionId, linguisticId) => {
        const control = get().linguisticControls.find(l => l.id === linguisticId);
        if (!control) return;
        set((state) => ({
          sessions: state.sessions.map(s => 
            s.id === sessionId ? { 
              ...s, 
              settings: { 
                ...s.settings, 
                temperature: control.temperature, 
                topP: control.topP, 
                maxTokens: control.maxTokens,
                format: control.format as any
              }
            } : s
          )
        }));
      }
    }),
    { name: 'aetheria-storage' }
  )
);


import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ModelConnection, Persona, Workspace, ChatSession, Message, UserRole, ToolDefinition, Framework, LinguisticControl } from '@/types';
import { testConnectionAction, fetchModelsAction, loadModelAction } from '@/ai/actions/engine-actions';
import { PERSONAS } from '@/lib/personas';
import { FRAMEWORKS } from '@/lib/frameworks';
import { LINGUISTICS } from '@/lib/linguistics';

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
  activeParameterTab: string;
  showInfoSidebar: boolean;
  
  // Actions
  addWorkspace: (w: Workspace) => void;
  setActiveWorkspace: (id: string) => void;
  addConnection: (c: ModelConnection) => void;
  updateConnection: (id: string, c: Partial<ModelConnection>) => void;
  setActiveConnection: (id: string | null) => void;
  
  addPersona: (p: Persona) => void;
  addFramework: (f: Framework) => void;
  addLinguisticControl: (l: LinguisticControl) => void;

  createSession: (workspaceId: string) => string;
  deleteSession: (id: string) => void;
  setActiveSession: (id: string | null) => void;
  addMessage: (sessionId: string, message: Message) => void;
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => void;
  updateSessionSettings: (sessionId: string, settings: Partial<ChatSession['settings']>) => void;
  applyFramework: (sessionId: string, frameworkId: string) => void;
  applyPersona: (sessionId: string, personaId: string) => void;
  applyLinguisticControl: (sessionId: string, linguisticId: string) => void;

  completeInitialSetup: (baseUrl: string, modelId: string, apiKey?: string) => Promise<boolean>;
  setRole: (role: UserRole) => void;
  checkConnection: () => Promise<void>;
  refreshModels: () => Promise<void>;
  triggerModelLoad: (modelId: string) => Promise<boolean>;
  setActiveParameterTab: (tab: string) => void;
  toggleInfoSidebar: () => void;
  toggleTool: (sessionId: string, tool: 'webSearch' | 'reasoning' | 'voice' | 'calculator' | 'code' | 'knowledge') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      workspaces: [
        { id: 'ws-1', name: 'General Intelligence', icon: 'zap', description: 'Universal node for daily tasks' },
        { id: 'ws-2', name: 'Knowledge Vault', icon: 'database', description: 'Document-aware research workspace' }
      ],
      activeWorkspaceId: 'ws-1',
      connections: [],
      activeConnectionId: null,
      
      personas: PERSONAS,
      frameworks: FRAMEWORKS,
      linguisticControls: LINGUISTICS,

      sessions: [],
      activeSessionId: null,
      isConfigured: false,
      currentUserRole: 'Admin',
      availableTools: [
        { id: 'calculator', name: 'Calculator', description: 'Perform mathematical operations', icon: 'calculator' },
        { id: 'web_search', name: 'Web Search', description: 'Search the internet for real-time info', icon: 'globe' },
        { id: 'knowledge_search', name: 'RAG Agent', description: 'Query your local knowledge base', icon: 'database' },
        { id: 'code_interpreter', name: 'Code Logic', description: 'Execute complex logic sandboxes', icon: 'terminal' }
      ],
      availableModels: [],
      connectionStatus: 'offline',
      isModelLoading: false,
      activeParameterTab: 'frameworks',
      showInfoSidebar: false, // Default to false for wider chat

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
            enabledTools: [],
            webSearchEnabled: false,
            reasoningEnabled: false,
            voiceResponseEnabled: false,
            calculatorEnabled: false,
            codeEnabled: false,
            knowledgeEnabled: false
          }
        };
        set((state) => ({ sessions: state.sessions ? [...state.sessions, newSession] : [newSession], activeSessionId: id }));
        return id;
      },

      deleteSession: (id) => set((state) => ({
        sessions: state.sessions.filter(s => s.id !== id),
        activeSessionId: state.activeSessionId === id ? null : state.activeSessionId
      })),

      addMessage: (sessionId, message) => set((state) => ({
        sessions: state.sessions.map(s => 
          s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s
        )
      })),

      updateSession: (sessionId, updates) => set((state) => ({
        sessions: state.sessions.map(s => 
          s.id === sessionId ? { ...s, ...updates } : s
        )
      })),

      updateSessionSettings: (sessionId, settings) => set((state) => ({
        sessions: state.sessions.map(s => 
          s.id === sessionId ? { ...s, settings: { ...s.settings, ...settings } } : s
        )
      })),

      applyFramework: (sessionId, frameworkId) => {
        const framework = get().frameworks.find(f => f.id === frameworkId);
        set((state) => ({
          sessions: state.sessions.map(s => 
            s.id === sessionId ? { 
              ...s, 
              frameworkId: s.frameworkId === frameworkId ? undefined : frameworkId,
              settings: { 
                ...s.settings, 
                enabledTools: framework?.tools || s.settings.enabledTools 
              }
            } : s
          )
        }));
      },

      applyPersona: (sessionId, personaId) => {
        const persona = get().personas.find(p => p.id === personaId);
        if (!persona) return;
        set((state) => ({
          sessions: state.sessions.map(s => 
            s.id === sessionId ? { 
              ...s, 
              personaId,
              settings: {
                ...s.settings,
                temperature: persona.default_temp !== undefined ? persona.default_temp : s.settings.temperature
              }
            } : s
          )
        }));
      },

      applyLinguisticControl: (sessionId, linguisticId) => {
        const control = get().linguisticControls.find(l => l.id === linguisticId);
        set((state) => ({
          sessions: state.sessions.map(s => 
            s.id === sessionId ? { 
              ...s, 
              linguisticId: s.linguisticId === linguisticId ? undefined : linguisticId,
              settings: { 
                ...s.settings, 
                temperature: (s.linguisticId !== linguisticId && control?.temperature !== undefined) ? control.temperature : s.settings.temperature, 
                topP: (s.linguisticId !== linguisticId && control?.topP !== undefined) ? control.topP : s.settings.topP, 
                maxTokens: (s.linguisticId !== linguisticId && control?.maxTokens !== undefined) ? control.maxTokens : s.settings.maxTokens,
                format: (s.linguisticId !== linguisticId && control?.format) ? (control.format as any) : s.settings.format
              }
            } : s
          )
        }));
      },

      toggleTool: (sessionId, tool) => {
        set((state) => ({
          sessions: state.sessions.map(s => {
            if (s.id !== sessionId) return s;
            const settings = { ...s.settings };
            if (tool === 'webSearch') settings.webSearchEnabled = !settings.webSearchEnabled;
            if (tool === 'reasoning') settings.reasoningEnabled = !settings.reasoningEnabled;
            if (tool === 'voice') settings.voiceResponseEnabled = !settings.voiceResponseEnabled;
            if (tool === 'calculator') settings.calculatorEnabled = !settings.calculatorEnabled;
            if (tool === 'code') settings.codeEnabled = !settings.codeEnabled;
            if (tool === 'knowledge') settings.knowledgeEnabled = !settings.knowledgeEnabled;
            
            // Sync actual tools array for Genkit
            const enabledTools: string[] = [];
            if (settings.webSearchEnabled) enabledTools.push('web_search');
            if (settings.calculatorEnabled) enabledTools.push('calculator');
            if (settings.codeEnabled) enabledTools.push('code_interpreter');
            if (settings.knowledgeEnabled) enabledTools.push('knowledge_search');

            return { ...s, settings: { ...settings, enabledTools } };
          })
        }));
      },

      setActiveParameterTab: (tab) => set({ activeParameterTab: tab }),
      toggleInfoSidebar: () => set((state) => ({ showInfoSidebar: !state.showInfoSidebar }))
    }),
    { 
      name: 'zerogpt-storage-v3',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.personas = PERSONAS;
          state.frameworks = FRAMEWORKS;
          state.linguisticControls = LINGUISTICS;
        }
      }
    }
  )
);

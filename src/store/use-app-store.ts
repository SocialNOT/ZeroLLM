
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ModelConnection, Persona, Workspace, ChatSession, Message, UserRole, ToolDefinition, Framework, LinguisticControl, AiMode } from '@/types';
import { testConnectionAction, fetchModelsAction, loadModelAction } from '@/ai/actions/engine-actions';
import { PERSONAS } from '@/lib/personas';
import { FRAMEWORKS } from '@/lib/frameworks';
import { LINGUISTICS } from '@/lib/linguistics';

interface AppState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  connections: ModelConnection[];
  activeConnectionId: string | null;
  activeOnlineModelId: string;
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
  aiMode: AiMode;
  
  // Modal States
  isProfileOpen: boolean;
  isSettingsOpen: boolean;
  
  // Theme Engine
  activeTheme: 'auto' | 0 | 1 | 2 | 3 | 4 | 5 | 6;
  
  // Session Security
  sessionStartTime: number | null;
  isSessionLocked: boolean;
  
  // Actions
  setIsProfileOpen: (open: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  addWorkspace: (w: Workspace) => void;
  setActiveWorkspace: (id: string) => void;
  addConnection: (c: ModelConnection) => void;
  updateConnection: (id: string, c: Partial<ModelConnection>) => void;
  setActiveConnection: (id: string | null) => void;
  setActiveOnlineModel: (id: string) => void;
  
  addPersona: (p: Persona) => void;
  updatePersona: (id: string, updates: Partial<Persona>) => void;
  deletePersona: (id: string) => void;
  
  addFramework: (f: Framework) => void;
  updateFramework: (id: string, updates: Partial<Framework>) => void;
  deleteFramework: (id: string) => void;
  
  addLinguisticControl: (l: LinguisticControl) => void;
  updateLinguisticControl: (id: string, updates: Partial<LinguisticControl>) => void;
  deleteLinguisticControl: (id: string) => void;

  createSession: (workspaceId: string) => string;
  deleteSession: (id: string) => void;
  setActiveSession: (id: string | null) => void;
  addMessage: (sessionId: string, message: Message) => void;
  updateMessage: (sessionId: string, messageId: string, updates: Partial<Message>) => void;
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => void;
  updateSessionSettings: (sessionId: string, settings: Partial<ChatSession['settings']>) => void;
  applyFramework: (sessionId: string, frameworkId: string) => void;
  applyPersona: (sessionId: string, personaId: string) => void;
  applyLinguisticControl: (sessionId: string, linguisticId: string) => void;

  completeInitialSetup: (baseUrl: string, modelId: string, apiKey?: string, mode?: AiMode) => Promise<boolean>;
  setAiMode: (mode: AiMode) => void;
  setRole: (role: UserRole) => void;
  startSession: () => void;
  checkConnection: () => Promise<void>;
  refreshModels: () => Promise<void>;
  triggerModelLoad: (modelId: string) => Promise<boolean>;
  setActiveParameterTab: (tab: string) => void;
  toggleInfoSidebar: () => void;
  toggleTool: (sessionId: string, tool: 'webSearch' | 'reasoning' | 'voice' | 'calculator' | 'code' | 'knowledge') => void;
  checkSessionExpiry: () => void;
  
  // Theme Actions
  setTheme: (theme: 'auto' | 0 | 1 | 2 | 3 | 4 | 5 | 6) => void;
  cycleTheme: () => void;
}

const GEMINI_MODELS = [
  'googleai/gemini-2.5-flash',
  'googleai/gemini-2.0-flash',
  'googleai/gemini-2.0-flash-thinking-exp',
  'googleai/gemini-2.0-pro-exp-02-05'
];

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
      activeOnlineModelId: 'googleai/gemini-2.5-flash',
      
      personas: PERSONAS,
      frameworks: FRAMEWORKS,
      linguisticControls: LINGUISTICS,

      sessions: [],
      activeSessionId: null,
      isConfigured: false,
      currentUserRole: 'User',
      aiMode: 'online',
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
      showInfoSidebar: false,
      
      isProfileOpen: false,
      isSettingsOpen: false,
      
      activeTheme: 'auto',
      
      sessionStartTime: null,
      isSessionLocked: false,

      setIsProfileOpen: (open) => set({ isProfileOpen: open }),
      setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),

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

      setActiveOnlineModel: (id) => set({ activeOnlineModelId: id }),

      addPersona: (p) => set((state) => ({ personas: [...state.personas, { ...p, id: `p-${Date.now()}`, isCustom: true }] })),
      updatePersona: (id, updates) => set((state) => ({
        personas: state.personas.map(p => p.id === id ? { ...p, ...updates } : p)
      })),
      deletePersona: (id) => set((state) => ({
        personas: state.personas.filter(p => p.id !== id || !p.isCustom)
      })),

      addFramework: (f) => set((state) => ({ frameworks: [...state.frameworks, { ...f, id: `f-${Date.now()}`, isCustom: true }] })),
      updateFramework: (id, updates) => set((state) => ({
        frameworks: state.frameworks.map(f => f.id === id ? { ...f, ...updates } : f)
      })),
      deleteFramework: (id) => set((state) => ({
        frameworks: state.frameworks.filter(f => f.id !== id || !f.isCustom)
      })),

      addLinguisticControl: (l) => set((state) => ({ linguisticControls: [...state.linguisticControls, { ...l, id: `l-${Date.now()}`, isCustom: true }] })),
      updateLinguisticControl: (id, updates) => set((state) => ({
        linguisticControls: state.linguisticControls.map(l => l.id === id ? { ...l, ...updates } : l)
      })),
      deleteLinguisticControl: (id) => set((state) => ({
        linguisticControls: state.linguisticControls.filter(l => l.id !== id || !l.isCustom)
      })),

      setActiveSession: (id) => set({ activeSessionId: id }),
      setRole: (role) => set({ currentUserRole: role }),
      setAiMode: (mode) => {
        set({ aiMode: mode });
        // Purge models before refreshing to ensure state purity
        set({ availableModels: [] });
        get().refreshModels();
      },
      startSession: () => set({ sessionStartTime: Date.now(), isSessionLocked: false }),
      
      checkConnection: async () => {
        if (get().aiMode === 'online') {
          set({ connectionStatus: 'online' });
          await get().refreshModels();
          return;
        }
        const activeConn = get().connections.find(c => c.id === get().activeConnectionId);
        if (!activeConn) return;

        set({ connectionStatus: 'checking' });
        try {
          const isOnline = await testConnectionAction(activeConn.baseUrl, activeConn.apiKey);
          set({ connectionStatus: isOnline ? 'online' : 'offline' });
          if (isOnline) {
            await get().refreshModels();
          } else {
            set({ availableModels: [] });
          }
        } catch (e) {
          set({ connectionStatus: 'offline', availableModels: [] });
        }
      },

      refreshModels: async () => {
        if (get().aiMode === 'online') {
          set({ availableModels: GEMINI_MODELS });
          return;
        }
        
        // In Offline mode, only refresh if the connection status is online
        if (get().connectionStatus !== 'online') {
          set({ availableModels: [] });
          return;
        }

        const activeConn = get().connections.find(c => c.id === get().activeConnectionId);
        if (!activeConn) return;
        
        try {
          const models = await fetchModelsAction(activeConn.baseUrl, activeConn.apiKey);
          set({ availableModels: models.map(m => m.id) });
        } catch (e) {
          set({ availableModels: [] });
        }
      },

      triggerModelLoad: async (modelId) => {
        if (get().aiMode === 'online') {
          get().setActiveOnlineModel(modelId);
          return true;
        }
        const activeConn = get().connections.find(c => c.id === get().activeConnectionId);
        if (!activeConn) return false;
        set({ isModelLoading: true });
        try {
          const success = await loadModelAction(activeConn.baseUrl, modelId, activeConn.apiKey);
          if (success) {
            get().updateConnection(activeConn.id, { modelId });
          }
          return success;
        } finally {
          set({ isModelLoading: false });
        }
      },

      completeInitialSetup: async (baseUrl, modelId, apiKey, mode = 'online') => {
        if (mode === 'online') {
          set({ 
            aiMode: 'online', 
            isConfigured: true, 
            connectionStatus: 'online',
            activeOnlineModelId: modelId || GEMINI_MODELS[0]
          });
          await get().refreshModels();
          return true;
        }
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
            aiMode: 'offline',
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
          activeModelId: get().aiMode === 'online' ? get().activeOnlineModelId : (get().activeConnectionId || ''),
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
        set((state) => ({ 
          sessions: state.sessions ? [...state.sessions, newSession] : [newSession], 
          activeSessionId: id 
        }));
        return id;
      },

      deleteSession: (id) => set((state) => {
        const filteredSessions = state.sessions.filter(s => s.id !== id);
        let nextActiveId = state.activeSessionId;
        
        if (state.activeSessionId === id) {
          nextActiveId = filteredSessions.length > 0 ? filteredSessions[0].id : null;
        }
        
        return {
          sessions: filteredSessions,
          activeSessionId: nextActiveId
        };
      }),

      addMessage: (sessionId, message) => set((state) => ({
        sessions: state.sessions.map(s => 
          s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s
        )
      })),

      updateMessage: (sessionId, messageId, updates) => set((state) => ({
        sessions: state.sessions.map(s => 
          s.id === sessionId ? {
            ...s,
            messages: s.messages.map(m => m.id === messageId ? { ...m, ...updates } : m)
          } : s
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
      toggleInfoSidebar: () => set((state) => ({ showInfoSidebar: !state.showInfoSidebar })),
      
      setTheme: (theme) => set({ activeTheme: theme }),
      cycleTheme: () => set((state) => {
        const order: Array<'auto' | 0 | 1 | 2 | 3 | 4 | 5 | 6> = ['auto', 0, 1, 2, 3, 4, 5, 6];
        const currentVal = state.activeTheme === 'auto' ? 'auto' : Number(state.activeTheme);
        const currentIdx = order.indexOf(currentVal as any);
        const nextIdx = (currentIdx + 1) % order.length;
        return { activeTheme: order[nextIdx] };
      }),

      checkSessionExpiry: () => {
        const { sessionStartTime, currentUserRole, isSessionLocked, aiMode } = get();
        if (!sessionStartTime) return;
        
        if (aiMode === 'offline') {
          if (isSessionLocked) set({ isSessionLocked: false });
          return;
        }

        if (currentUserRole !== 'Viewer') {
          if (isSessionLocked) set({ isSessionLocked: false });
          return;
        }
        
        const now = Date.now();
        const ONE_HOUR = 3600000;
        const startDate = new Date(sessionStartTime).toDateString();
        const currentDate = new Date(now).toDateString();
        
        if (startDate !== currentDate) {
          set({ sessionStartTime: now, isSessionLocked: false });
          return;
        }

        if (now - sessionStartTime > ONE_HOUR) {
          set({ isSessionLocked: true });
        }
      }
    }),
    { 
      name: 'zerogpt-storage-v14',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const customPersonas = state.personas?.filter(p => p.isCustom) || [];
          state.personas = [...PERSONAS, ...customPersonas];
          
          const customFrameworks = state.frameworks?.filter(f => f.isCustom) || [];
          state.frameworks = [...FRAMEWORKS, ...customFrameworks];
          
          const customLinguistic = state.linguisticControls?.filter(l => l.isCustom) || [];
          state.linguisticControls = [...LINGUISTICS, ...customLinguistic];
          
          state.checkSessionExpiry();
        }
      }
    }
  )
);

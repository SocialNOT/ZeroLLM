
export type ModelProvider = 'Ollama' | 'LM Studio' | 'Custom';
export type UserRole = 'Admin' | 'User' | 'Viewer';
export type MemoryType = 'buffer' | 'summary' | 'knowledge-graph';

export interface ModelConnection {
  id: string;
  name: string;
  provider: ModelProvider;
  baseUrl: string;
  apiKey?: string;
  modelId: string;
  contextWindow: number;
  status?: 'online' | 'offline' | 'checking';
}

export interface Persona {
  id: string;
  name: string;
  systemPrompt: string;
  icon: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  citations?: Array<{ source: string; page?: number }>;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  description?: string;
  knowledgeBaseId?: string;
}

export interface ChatSession {
  id: string;
  workspaceId: string;
  title: string;
  messages: Message[];
  activeModelId: string;
  personaId: string;
  settings: {
    temperature: number;
    topP: number;
    maxTokens: number;
    format: 'markdown' | 'json' | 'step-by-step';
    memoryType: MemoryType;
    enabledTools: string[];
  };
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
}

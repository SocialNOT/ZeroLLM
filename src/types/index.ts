
export type ModelProvider = 'Ollama' | 'LM Studio' | 'Custom' | 'Gemini Cloud';
export type UserRole = 'Admin' | 'User' | 'Viewer';
export type MemoryType = 'buffer' | 'summary' | 'knowledge-graph';
export type AiMode = 'online' | 'offline';

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
  category: string;
  description: string;
  system_prompt: string;
  tags?: string[];
  default_temp?: number;
  usecases?: string[];
  keypoints?: string[];
  isCustom?: boolean;
}

export interface Framework {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  usecases: string[];
  keypoints: string[];
  content: string; // The system instructions or prompt framework
  tools?: string[];
  isCustom?: boolean;
}

export interface LinguisticControl {
  id: string;
  name: string;
  category: string;
  description: string;
  system_instruction: string;
  usecases: string[];
  keypoints: string[];
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  format?: 'markdown' | 'json' | 'step-by-step';
  isCustom?: boolean;
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
  frameworkId?: string;
  linguisticId?: string;
  settings: {
    temperature: number;
    topP: number;
    maxTokens: number;
    format: 'markdown' | 'json' | 'step-by-step';
    memoryType: MemoryType;
    enabledTools: string[];
    webSearchEnabled?: boolean;
    reasoningEnabled?: boolean;
    voiceResponseEnabled?: boolean;
    calculatorEnabled?: boolean;
    codeEnabled?: boolean;
    knowledgeEnabled?: boolean;
    visionEnabled?: boolean;
    analysisEnabled?: boolean;
    planningEnabled?: boolean;
    researchEnabled?: boolean;
  };
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
}

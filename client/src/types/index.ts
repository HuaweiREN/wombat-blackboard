export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  mermaidCode?: string;
}

export interface GenerateRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  templateId?: string;
}

export interface GenerateResponse {
  success: boolean;
  content?: string;
  mermaidCode?: string;
  diagramType?: string;
  artifactId?: string;
  error?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  diagramType: string;
}

export type DiagramType = 'flowchart' | 'sequence' | 'state' | 'class' | 'er' | 'unknown';

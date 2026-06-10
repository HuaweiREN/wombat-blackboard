import { useState, useCallback, useRef } from 'react';
import { Message } from '../types';
import { generateDiagram } from '../services/api';

let idCounter = 0;

function generateId(): string {
  idCounter += 1;
  return `msg-${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useConversation() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagramType, setDiagramType] = useState<string>('');
  const messagesRef = useRef<Message[]>([]);

  // Keep ref in sync
  messagesRef.current = messages;

  const currentCode = (() => {
    if (messages.length === 0) return '';
    // Find the last assistant message that has mermaidCode
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === 'assistant' && msg.mermaidCode) {
        return msg.mermaidCode;
      }
    }
    return '';
  })();

  const sendMessage = useCallback(async (userInput: string, templateId?: string) => {
    if (!userInput.trim() || isLoading) return;

    setError(null);

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: userInput.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const currentMessages = [...messagesRef.current, userMessage];
      const apiMessages = currentMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const result = await generateDiagram({
        messages: apiMessages,
        templateId,
      });

      if (!result.success) {
        setError(result.error || '生成失败，请重试');
        setIsLoading(false);
        return;
      }

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: result.content || '已生成示意图',
        timestamp: Date.now(),
        mermaidCode: result.mermaidCode,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (result.diagramType) {
        setDiagramType(result.diagramType);
      }
    } catch (err: any) {
      setError(err?.message || '请求发生异常，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const reset = useCallback(() => {
    setMessages([]);
    setIsLoading(false);
    setError(null);
    setDiagramType('');
  }, []);

  return {
    messages,
    isLoading,
    error,
    currentCode,
    diagramType,
    sendMessage,
    reset,
  };
}

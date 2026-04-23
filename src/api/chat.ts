import request, { API_BASE_URL } from '@/utils/request';
import { ElMessage } from 'element-plus';
import type {
  ApiResponse,
  ChatSessionVO,
  ChatMessageVO,
  CreateChatSessionRequest,
  CreateChatSessionResponse,
  ChatStreamEvent,
} from '@/types/api';

const BASE = '/api/chat';
const TOKEN_KEY = 'token';

/**
 * 创建一个新的对话会话
 * POST /api/chat/sessions
 */
export function createChatSession(title = '新对话') {
  const payload: CreateChatSessionRequest = { title };
  return request.post<
    ApiResponse<CreateChatSessionResponse>,
    ApiResponse<CreateChatSessionResponse>
  >(`${BASE}/sessions`, payload);
}

/**
 * 获取当前用户的会话列表
 * GET /api/chat/sessions
 */
export function getChatSessions() {
  return request.get<
    ApiResponse<ChatSessionVO[]>,
    ApiResponse<ChatSessionVO[]>
  >(`${BASE}/sessions`);
}

/**
 * 获取某个会话的历史消息
 * GET /api/chat/sessions/{id}/messages
 */
export function getChatMessages(sessionId: number) {
  return request.get<
    ApiResponse<ChatMessageVO[]>,
    ApiResponse<ChatMessageVO[]>
  >(`${BASE}/sessions/${sessionId}/messages`);
}

export type StreamDeltaHandler = (chunk: string) => void | Promise<void>;
export type StreamDoneHandler = () => void | Promise<void>;
export type StreamErrorHandler = (message: string) => void | Promise<void>;

function handleUnauthorized(status: number) {
  if (status === 401 || status === 403) {
    localStorage.removeItem(TOKEN_KEY);
    ElMessage.error('登录已过期，请重新登录');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return true;
  }
  return false;
}

/**
 * 发送消息并以 SSE 流式接收 AI 回复。
 *
 * 约束（严格遵守）：
 * - 不使用 EventSource（其不支持 POST / 自定义 Authorization）。
 * - 不使用 WebSocket。
 * - 仅通过 backend 的 /api/chat/sessions/{id}/stream，不直连 ai-service。
 * - 所有请求携带 JWT Bearer Token。
 * - 响应流通过 fetch + response.body.getReader() 解析。
 */
export async function streamChatReply(
  sessionId: number,
  content: string,
  token: string,
  onDelta: StreamDeltaHandler,
  onDone?: StreamDoneHandler,
  onError?: StreamErrorHandler,
  signal?: AbortSignal,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(
      `${API_BASE_URL}${BASE}/sessions/${sessionId}/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({ content }),
        signal,
      },
    );
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') return;
    await onError?.((err as Error)?.message || '网络异常，请稍后重试');
    return;
  }

  if (!response.ok) {
    if (handleUnauthorized(response.status)) return;
    let msg = `请求失败 (${response.status})`;
    try {
      const text = await response.text();
      if (text) {
        try {
          const parsed = JSON.parse(text);
          if (parsed?.msg) msg = parsed.msg;
          else if (parsed?.message) msg = parsed.message;
        } catch {
          msg = text;
        }
      }
    } catch {
      // ignore
    }
    await onError?.(msg);
    return;
  }

  if (!response.body) {
    await onError?.('响应体为空，无法读取流式数据');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let finished = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // 统一换行符，避免 \r\n 和 \n 混用导致分帧失败
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() || '';

      for (const chunk of chunks) {
        if (finished) break;
        const dataLine = chunk
          .split('\n')
          .find((line) => line.startsWith('data:'));
        if (!dataLine) continue;

        const jsonText = dataLine.slice(5).trim();
        if (!jsonText) continue;

        let event: ChatStreamEvent;
        try {
          event = JSON.parse(jsonText) as ChatStreamEvent;
        } catch {
          continue;
        }

        if (event.type === 'delta') {
          if (event.content) await onDelta(event.content);
        } else if (event.type === 'done') {
          finished = true;
          await onDone?.();
        } else if (event.type === 'error') {
          finished = true;
          await onError?.(event.message || 'AI 服务调用失败');
        }
      }

      if (finished) {
        try {
          await reader.cancel();
        } catch {
          // ignore
        }
        break;
      }
    }
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') return;
    if (!finished) {
      await onError?.((err as Error)?.message || '流式读取异常');
    }
  }
}

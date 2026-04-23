<template>
  <div class="chat-view">
    <div class="chat-container">
      <aside class="chat-sidebar">
        <div class="sidebar-header">
          <div class="sidebar-title">
            <el-icon><ChatDotRound /></el-icon>
            <span>历史对话</span>
          </div>
          <el-button
            text
            circle
            size="small"
            :disabled="sending"
            @click="newSession"
          >
            <el-icon><Plus /></el-icon>
          </el-button>
        </div>
        <el-scrollbar class="session-list">
          <div
            v-if="activeId === null"
            class="session-item"
            :class="{ active: true }"
          >
            <div class="session-avatar">
              <el-avatar :size="40" :src="aiAvatar" />
            </div>
            <div class="session-info">
              <div class="session-row">
                <span class="session-name">新的对话</span>
                <span class="session-time">刚刚</span>
              </div>
              <div class="session-preview">说点什么开始吧～</div>
            </div>
          </div>
          <div
            v-for="s in sessions"
            :key="s.id"
            class="session-item"
            :class="{ active: s.id === activeId }"
            @click="activateSession(s.id)"
          >
            <div class="session-avatar">
              <el-avatar :size="40" :src="aiAvatar" />
            </div>
            <div class="session-info">
              <div class="session-row">
                <span class="session-name">{{ s.title }}</span>
                <span class="session-time">{{ s.time }}</span>
              </div>
              <div class="session-preview">{{ s.preview || '点击查看对话' }}</div>
            </div>
          </div>
          <div v-if="sessions.length === 0 && activeId !== null" class="session-empty">
            还没有历史对话
          </div>
        </el-scrollbar>
      </aside>

      <section class="chat-main">
        <div class="chat-header">
          <el-avatar :size="38" :src="aiAvatar" />
          <div>
            <div class="chat-title">小语 · AI 倾听者</div>
            <div class="chat-status">
              <span class="status-dot" />
              在线 · 随时听你说
            </div>
          </div>
        </div>

        <el-scrollbar ref="scrollRef" class="chat-messages" view-class="chat-messages-inner">
          <div v-if="loadingMessages" class="messages-loading">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>正在加载对话…</span>
          </div>

          <div
            v-for="m in currentMessages"
            :key="m.id"
            class="message"
            :class="m.role === 'user' ? 'message-user' : 'message-ai'"
          >
            <el-avatar
              v-if="m.role === 'ai'"
              :size="36"
              :src="aiAvatar"
              class="msg-avatar"
            />
            <div class="message-bubble">
              <div
                v-if="m.content && m.role === 'ai'"
                class="markdown-body"
                v-html="renderMarkdown(m.content)"
              ></div>
              <span v-else-if="m.content">{{ m.content }}</span>
              <span v-if="m.pending && !m.content" class="typing">
                <i></i><i></i><i></i>
              </span>
              <span v-else-if="m.pending" class="cursor-blink">▍</span>
            </div>
            <el-avatar
              v-if="m.role === 'user'"
              :size="36"
              :src="resolveAssetUrl(userStore.avatar) || userAvatarDefault"
              class="msg-avatar"
            />
          </div>

          <div
            v-if="!loadingMessages && currentMessages.length === 0"
            class="messages-empty"
          >
            <el-avatar :size="56" :src="aiAvatar" />
            <div class="empty-title">嗨，我是小语</div>
            <div class="empty-desc">深呼吸，慢慢来，你想从哪里开始？</div>
          </div>
        </el-scrollbar>

        <div class="chat-input">
          <el-input
            v-model="draft"
            type="textarea"
            :autosize="{ minRows: 2 }"
            resize="none"
            :disabled="sending"
            placeholder="写点什么吧，我会认真听 🌙  （Enter 发送，Shift + Enter 换行）"
            @keydown="onKeydown"
          />
          <el-button
            type="primary"
            class="send-btn"
            :loading="sending"
            :disabled="!draft.trim() || sending"
            @click="sendMessage"
          >
            发送
          </el-button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, onMounted, onBeforeUnmount } from 'vue';
import { ChatDotRound, Plus, Loading } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import MarkdownIt from 'markdown-it';
import { useUserStore } from '@/stores/user';
import { resolveAssetUrl } from '@/utils/request';
import {
  createChatSession,
  getChatSessions,
  getChatMessages,
  streamChatReply,
} from '@/api/chat';
import type { ChatSessionVO, ChatMessageVO } from '@/types/api';

interface ChatMessage {
  /** 本地唯一 id，后端消息使用后端 id；前端临时消息用负数 */
  id: number;
  role: 'user' | 'ai';
  content: string;
  pending?: boolean;
}

interface ChatSessionItem {
  id: number;
  title: string;
  createdAt: string;
  time: string;
  preview: string;
}

const userStore = useUserStore();

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

const defaultLinkRender =
  md.renderer.rules.link_open ||
  function (tokens, idx, options, _env, self) {
    return self.renderToken(tokens, idx, options);
  };
md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  const token = tokens[idx];
  const targetIdx = token.attrIndex('target');
  if (targetIdx < 0) token.attrPush(['target', '_blank']);
  else token.attrs![targetIdx][1] = '_blank';
  const relIdx = token.attrIndex('rel');
  if (relIdx < 0) token.attrPush(['rel', 'noopener noreferrer']);
  else token.attrs![relIdx][1] = 'noopener noreferrer';
  return defaultLinkRender(tokens, idx, options, env, self);
};

function renderMarkdown(content: string): string {
  if (!content) return '';
  return md.render(content);
}

const aiAvatar =
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=xiaoyu&backgroundColor=bae6fd';
const userAvatarDefault =
  'https://api.dicebear.com/7.x/thumbs/svg?seed=heart&backgroundColor=dbeafe';

const scrollRef = ref<{ setScrollTop: (v: number) => void; wrapRef?: HTMLElement } | null>(
  null,
);

const sessions = ref<ChatSessionItem[]>([]);
/** null 表示「新对话未保存」状态，第一次发送时才创建会话 */
const activeId = ref<number | null>(null);
const draft = ref('');
const sending = ref(false);
const loadingMessages = ref(false);

/** 按 sessionId 缓存消息列表；key='new' 保存未创建会话前的临时消息 */
const messagesMap = ref<Record<string, ChatMessage[]>>({ new: [] });

let tempMsgSeq = -1;
function nextTempId() {
  return tempMsgSeq--;
}

let currentAbort: AbortController | null = null;
const STREAM_APPEND_DELAY_MS = 45;

const currentMessages = computed<ChatMessage[]>(() => {
  const key = activeId.value === null ? 'new' : String(activeId.value);
  return messagesMap.value[key] || [];
});

function formatTime(createdAt: string): string {
  if (!createdAt) return '';
  // "2026-04-23 16:00:00" -> "04-23 16:00"
  const m = createdAt.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!m) return createdAt;
  return `${m[2]}-${m[3]} ${m[4]}:${m[5]}`;
}

function toLocalMessage(m: ChatMessageVO): ChatMessage {
  return {
    id: m.id,
    role: m.role === 'user' ? 'user' : 'ai',
    content: m.content,
  };
}

function mapSession(s: ChatSessionVO): ChatSessionItem {
  return {
    id: s.id,
    title: s.title,
    createdAt: s.createdAt,
    time: formatTime(s.createdAt),
    preview: '',
  };
}

function updateSessionPreview(sessionId: number, preview: string) {
  const s = sessions.value.find((x) => x.id === sessionId);
  if (s) {
    s.preview = preview.slice(0, 30);
  }
}

async function loadSessions() {
  try {
    const res = await getChatSessions();
    sessions.value = (res.data || []).map(mapSession);
  } catch {
    // 错误已由 request 拦截器提示
  }
}

async function activateSession(id: number) {
  if (sending.value) {
    ElMessage.warning('请等待当前回复结束');
    return;
  }
  activeId.value = id;
  const key = String(id);
  if (!messagesMap.value[key]) {
    loadingMessages.value = true;
    try {
      const res = await getChatMessages(id);
      messagesMap.value[key] = (res.data || []).map(toLocalMessage);
      const last = [...(res.data || [])].reverse().find(Boolean);
      if (last) updateSessionPreview(id, last.content);
    } catch {
      messagesMap.value[key] = [];
    } finally {
      loadingMessages.value = false;
    }
  }
  scrollToBottom();
}

function newSession() {
  if (sending.value) {
    ElMessage.warning('请等待当前回复结束');
    return;
  }
  activeId.value = null;
  messagesMap.value.new = [];
  scrollToBottom();
}

function scrollToBottom() {
  nextTick(() => {
    const wrap = scrollRef.value?.wrapRef;
    if (wrap) {
      wrap.scrollTop = wrap.scrollHeight;
    }
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function splitStreamChunk(chunk: string, size = 2): string[] {
  const chars = Array.from(chunk);
  const parts: string[] = [];
  for (let i = 0; i < chars.length; i += size) {
    parts.push(chars.slice(i, i + size).join(''));
  }
  return parts;
}

async function appendStreamChunk(target: ChatMessage, chunk: string) {
  for (const part of splitStreamChunk(chunk)) {
    target.content += part;
    scrollToBottom();
    await sleep(STREAM_APPEND_DELAY_MS);
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

async function ensureSessionId(firstContent: string): Promise<number | null> {
  if (activeId.value !== null) return activeId.value;

  try {
    const title = firstContent.trim().slice(0, 20) || '新对话';
    const res = await createChatSession(title);
    const newId = res.data.sessionId;

    sessions.value.unshift({
      id: newId,
      title,
      createdAt: '',
      time: '刚刚',
      preview: '',
    });

    // 把 'new' 里已有的本地消息迁移到正式 session key 下
    messagesMap.value[String(newId)] = messagesMap.value.new || [];
    messagesMap.value.new = [];
    activeId.value = newId;
    return newId;
  } catch (err) {
    console.error('创建会话失败', err);
    return null;
  }
}

async function sendMessage() {
  const text = draft.value.trim();
  if (!text) return;
  if (sending.value) return;

  sending.value = true;
  draft.value = '';

  // 先把用户消息插入本地（暂时放在 new 或当前 session 下）
  const tempKey = activeId.value === null ? 'new' : String(activeId.value);
  const list = (messagesMap.value[tempKey] ||= []);
  const userMsg: ChatMessage = {
    id: nextTempId(),
    role: 'user',
    content: text,
  };
  list.push(userMsg);
  scrollToBottom();

  // 确保有 sessionId（没有则现场创建）
  const sessionId = await ensureSessionId(text);
  if (sessionId === null) {
    sending.value = false;
    return;
  }

  // 创建一条 assistant 占位消息（等收到第一个 delta 再显示 content）
  // 必须用 reactive 包裹：否则后续在流式回调里对 assistantMsg.content 的赋值
  // 会绕过 push 进数组后生成的 Proxy，无法触发视图更新，导致内容要等刷新才出现。
  const messages = messagesMap.value[String(sessionId)];
  const assistantMsg = reactive<ChatMessage>({
    id: nextTempId(),
    role: 'ai',
    content: '',
    pending: true,
  });
  messages.push(assistantMsg);
  scrollToBottom();

  // 建立 Abort 控制器，支持中断
  currentAbort?.abort();
  currentAbort = new AbortController();

  const token = localStorage.getItem('token') || '';

  try {
    await streamChatReply(
      sessionId,
      text,
      token,
      async (chunk) => {
        await appendStreamChunk(assistantMsg, chunk);
      },
      () => {
        assistantMsg.pending = false;
        updateSessionPreview(sessionId, assistantMsg.content);
        scrollToBottom();
      },
      (message) => {
        assistantMsg.pending = false;
        if (!assistantMsg.content) {
          // 还没有任何内容，则移除这条空消息，避免把错误信息当成回复
          const idx = messages.findIndex((m) => m.id === assistantMsg.id);
          if (idx !== -1) messages.splice(idx, 1);
        }
        ElMessage.error(message || '回复失败，请稍后再试');
      },
      currentAbort.signal,
    );
  } catch (err) {
    // 网络层异常，onError 已处理；这里兜底
    assistantMsg.pending = false;
    if (!assistantMsg.content) {
      const idx = messages.findIndex((m) => m.id === assistantMsg.id);
      if (idx !== -1) messages.splice(idx, 1);
    }
    console.error('流式请求失败', err);
  } finally {
    sending.value = false;
    currentAbort = null;
  }
}

onMounted(async () => {
  await loadSessions();
  // 默认进入「新对话」状态，等待用户开始
  activeId.value = null;
  scrollToBottom();
});

onBeforeUnmount(() => {
  currentAbort?.abort();
});
</script>

<style scoped>
.chat-view {
  max-width: 1200px;
  margin: 0 auto;
}

.chat-container {
  display: grid;
  grid-template-columns: 300px 1fr;
  height: calc(100vh - 140px);
  min-height: 560px;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: var(--healing-card-shadow);
  overflow: hidden;
}

.chat-sidebar {
  border-right: 1px solid #e0f2fe;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f0f9ff, #ffffff);
  min-height: 0;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 18px 12px;
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1e3a8a;
}

.session-list {
  flex: 1 1 0;
  min-height: 0;
  height: 0;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: background 0.2s ease;
}

.session-item:hover {
  background: rgba(186, 230, 253, 0.3);
}

.session-item.active {
  background: rgba(186, 230, 253, 0.5);
  border-left-color: #60a5fa;
}

.session-info {
  flex: 1;
  min-width: 0;
}

.session-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.session-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e3a8a;
}

.session-time {
  font-size: 11px;
  color: var(--healing-muted);
}

.session-preview {
  margin-top: 2px;
  font-size: 12px;
  color: var(--healing-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-empty {
  padding: 30px 16px;
  text-align: center;
  font-size: 12px;
  color: var(--healing-muted);
}

.chat-main {
  display: flex;
  flex-direction: column;
  background: #fafdff;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: #ffffff;
  border-bottom: 1px solid #e0f2fe;
  flex-shrink: 0;
}

.chat-title {
  font-weight: 600;
  color: #1e3a8a;
}

.chat-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--healing-muted);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
}

.chat-messages {
  flex: 1 1 0;
  min-height: 0;
  height: 0;
  background: linear-gradient(180deg, #f0f9ff, #ecfeff);
}

:deep(.chat-messages-inner) {
  padding: 20px;
}

.messages-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 30px 0;
  color: var(--healing-muted);
  font-size: 13px;
}

.messages-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 60px 20px;
  color: var(--healing-muted);
  text-align: center;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e3a8a;
  margin-top: 8px;
}

.empty-desc {
  font-size: 13px;
}

.message {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 14px;
}

.message-user {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.7;
  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.12);
  white-space: pre-wrap;
  word-break: break-word;
}

.message-ai .message-bubble {
  background: #ffffff;
  color: #334155;
  border-bottom-left-radius: 4px;
}

.markdown-body {
  white-space: normal;
  word-break: break-word;
}

.markdown-body :deep(p) {
  margin: 0 0 8px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-body :deep(strong) {
  font-weight: 600;
  color: #1e3a8a;
}

.markdown-body :deep(em) {
  font-style: italic;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 6px 0;
  padding-left: 22px;
}

.markdown-body :deep(li) {
  margin: 2px 0;
  line-height: 1.7;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin: 10px 0 6px;
  font-weight: 600;
  color: #1e3a8a;
  line-height: 1.4;
}

.markdown-body :deep(h1) {
  font-size: 18px;
}

.markdown-body :deep(h2) {
  font-size: 16px;
}

.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  font-size: 15px;
}

.markdown-body :deep(code) {
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(96, 165, 250, 0.12);
  color: #1e3a8a;
  font-size: 13px;
  font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
}

.markdown-body :deep(pre) {
  margin: 8px 0;
  padding: 10px 12px;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.5;
}

.markdown-body :deep(pre code) {
  padding: 0;
  background: transparent;
  color: inherit;
}

.markdown-body :deep(blockquote) {
  margin: 8px 0;
  padding: 4px 12px;
  border-left: 3px solid #60a5fa;
  background: rgba(186, 230, 253, 0.25);
  color: #475569;
  border-radius: 4px;
}

.markdown-body :deep(a) {
  color: #2563eb;
  text-decoration: underline;
}

.markdown-body :deep(hr) {
  margin: 10px 0;
  border: none;
  border-top: 1px solid #e0f2fe;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  margin: 8px 0;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  padding: 6px 10px;
  border: 1px solid #e0f2fe;
}

.message-user .message-bubble {
  background: linear-gradient(135deg, #60a5fa, #22d3ee);
  color: #ffffff;
  border-bottom-right-radius: 4px;
}

.msg-avatar {
  flex-shrink: 0;
}

.typing {
  display: inline-flex;
  gap: 4px;
  padding: 4px 2px;
}

.typing i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #60a5fa;
  animation: bounce 1.2s infinite ease-in-out;
}

.typing i:nth-child(2) {
  animation-delay: 0.15s;
}

.typing i:nth-child(3) {
  animation-delay: 0.3s;
}

.cursor-blink {
  display: inline-block;
  margin-left: 2px;
  color: #60a5fa;
  animation: blink 1s steps(2) infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

@keyframes bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-5px);
    opacity: 1;
  }
}

.chat-input {
  display: flex;
  gap: 10px;
  padding: 14px 20px;
  background: #ffffff;
  border-top: 1px solid #e0f2fe;
  align-items: flex-end;
  flex-shrink: 0;
}

.chat-input :deep(.el-textarea__inner) {
  border-radius: 12px;
  resize: none;
  overflow-y: hidden;
}

.send-btn {
  height: 44px;
  padding: 0 22px;
  border-radius: 12px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .chat-container {
    grid-template-columns: 1fr;
    height: calc(100vh - 120px);
  }

  .chat-sidebar {
    display: none;
  }
}
</style>

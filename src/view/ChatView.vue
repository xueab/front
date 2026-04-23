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
            @click="newSession"
          >
            <el-icon><Plus /></el-icon>
          </el-button>
        </div>
        <el-scrollbar class="session-list">
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
              <div class="session-preview">{{ s.preview }}</div>
            </div>
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
              <span v-if="!m.pending">{{ m.content }}</span>
              <span v-else class="typing">
                <i></i><i></i><i></i>
              </span>
            </div>
            <el-avatar
              v-if="m.role === 'user'"
              :size="36"
              :src="resolveAssetUrl(userStore.avatar) || userAvatarDefault"
              class="msg-avatar"
            />
          </div>
        </el-scrollbar>

        <div class="chat-input">
          <el-input
            v-model="draft"
            type="textarea"
            :rows="2"
            resize="none"
            placeholder="写点什么吧，我会认真听 🌙  （Enter 发送，Shift + Enter 换行）"
            @keydown="onKeydown"
          />
          <el-button
            type="primary"
            class="send-btn"
            :loading="sending"
            :disabled="!draft.trim()"
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
import { computed, nextTick, ref, onMounted } from 'vue';
import { ChatDotRound, Plus } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { resolveAssetUrl } from '@/utils/request';

interface ChatMessage {
  id: number;
  role: 'user' | 'ai';
  content: string;
  pending?: boolean;
}

interface ChatSession {
  id: number;
  title: string;
  preview: string;
  time: string;
  messages: ChatMessage[];
}

const userStore = useUserStore();

const aiAvatar =
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=xiaoyu&backgroundColor=bae6fd';
const userAvatarDefault =
  'https://api.dicebear.com/7.x/thumbs/svg?seed=heart&backgroundColor=dbeafe';

const scrollRef = ref<{ setScrollTop: (v: number) => void; wrapRef?: HTMLElement } | null>(
  null,
);

const sessions = ref<ChatSession[]>([
  {
    id: 1,
    title: '今天有点累',
    preview: '嗯，我在。慢慢说，不用着急。',
    time: '刚刚',
    messages: [
      {
        id: 11,
        role: 'ai',
        content: '你好呀，我是小语。今天想聊点什么呢？我会一直在这里听你说 🌿',
      },
      {
        id: 12,
        role: 'user',
        content: '今天加班到很晚，脑子有点转不动了。',
      },
      {
        id: 13,
        role: 'ai',
        content:
          '辛苦了，先深呼吸一下。被疲惫包围的时候，先照顾身体，再处理心情。有没有哪件事让你特别在意？',
      },
    ],
  },
  {
    id: 2,
    title: '关于失眠',
    preview: '睡不着的夜，可以说说窗外的月光。',
    time: '昨天',
    messages: [
      {
        id: 21,
        role: 'ai',
        content: '失眠的夜很漫长，但你并不孤单，我在这里陪你。',
      },
    ],
  },
  {
    id: 3,
    title: '想要改变',
    preview: '每一个小小的坚持，都算数。',
    time: '4月12日',
    messages: [
      {
        id: 31,
        role: 'ai',
        content: '想做出改变的你，已经比昨天更勇敢了一些哦 ✨',
      },
    ],
  },
]);

const activeId = ref(sessions.value[0].id);
const draft = ref('');
const sending = ref(false);

const currentMessages = computed(() => {
  const s = sessions.value.find((x) => x.id === activeId.value);
  return s ? s.messages : [];
});

function activateSession(id: number) {
  activeId.value = id;
  scrollToBottom();
}

function newSession() {
  const id = Date.now();
  sessions.value.unshift({
    id,
    title: '新的对话',
    preview: '我在这里，开始说说吧。',
    time: '刚刚',
    messages: [
      {
        id: id + 1,
        role: 'ai',
        content: '嗨，我是小语。深呼吸，慢慢来，你想从哪里开始？',
      },
    ],
  });
  activeId.value = id;
}

function scrollToBottom() {
  nextTick(() => {
    const wrap = scrollRef.value?.wrapRef;
    if (wrap) {
      wrap.scrollTop = wrap.scrollHeight;
    }
  });
}

const aiReplies = [
  '嗯，我听着呢。你说的这些，我都有认真记下。',
  '这样的感觉一定不容易，谢谢你愿意告诉我。',
  '先给自己一点点时间，允许情绪流动。可以试着深呼吸三次 🌿',
  '你并不孤单，我一直都在。愿意多聊一点吗？',
  '先把自己照顾好，其他的事可以慢慢来。',
];

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

async function sendMessage() {
  const text = draft.value.trim();
  if (!text) return;
  const session = sessions.value.find((s) => s.id === activeId.value);
  if (!session) return;

  const userMsg: ChatMessage = {
    id: Date.now(),
    role: 'user',
    content: text,
  };
  session.messages.push(userMsg);
  session.preview = text.slice(0, 20);
  session.time = '刚刚';
  draft.value = '';
  sending.value = true;
  scrollToBottom();

  const pendingMsg: ChatMessage = {
    id: Date.now() + 1,
    role: 'ai',
    content: '',
    pending: true,
  };
  session.messages.push(pendingMsg);
  scrollToBottom();

  setTimeout(() => {
    const reply = aiReplies[Math.floor(Math.random() * aiReplies.length)];
    const target = session.messages.find((m) => m.id === pendingMsg.id);
    if (target) {
      target.content = reply;
      target.pending = false;
    }
    session.preview = reply.slice(0, 20);
    sending.value = false;
    scrollToBottom();
  }, 1000);
}

onMounted(scrollToBottom);
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
  flex: 1;
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

.chat-main {
  display: flex;
  flex-direction: column;
  background: #fafdff;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: #ffffff;
  border-bottom: 1px solid #e0f2fe;
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
  flex: 1;
  background: linear-gradient(180deg, #f0f9ff, #ecfeff);
}

:deep(.chat-messages-inner) {
  padding: 20px;
}

.message {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 14px;
}

.message-user {
  flex-direction: row-reverse;
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
}

.chat-input :deep(.el-textarea__inner) {
  border-radius: 12px;
  resize: none;
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

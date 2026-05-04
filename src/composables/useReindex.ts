import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { reindexKnowledge } from '@/api/admin';

// 模块级单例状态：确保整个 admin 应用同一时刻只有一个重建任务在跑
const visible = ref(false);
const running = ref(false);
const elapsed = ref(0);
let timer: number | null = null;

function startTimer() {
  elapsed.value = 0;
  if (timer) window.clearInterval(timer);
  timer = window.setInterval(() => {
    elapsed.value += 1;
  }, 1000);
}

function stopTimer() {
  if (timer) {
    window.clearInterval(timer);
    timer = null;
  }
}

/**
 * 重建知识库索引：
 * - 触发后展示一个不可关闭的全屏弹窗
 * - 完成后弹窗自动关闭并 toast 通知
 * - 失败时弹窗也会关闭，错误由全局拦截器提示
 */
export function useReindex() {
  async function runReindex() {
    if (running.value) return;
    running.value = true;
    visible.value = true;
    startTimer();
    try {
      const res = await reindexKnowledge();
      ElMessage.success(`知识索引已重建完成，共 ${res.data.chunkCount} 个分片`);
    } catch {
      // 全局拦截器已提示错误
    } finally {
      stopTimer();
      running.value = false;
      visible.value = false;
    }
  }

  return {
    visible,
    running,
    elapsed,
    runReindex,
  };
}

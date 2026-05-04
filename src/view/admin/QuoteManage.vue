<template>
  <div class="quote-manage">
    <el-card class="filter-bar" shadow="never">
      <div class="filter-row">
        <el-input
          v-model="query.keyword"
          placeholder="搜索内容 / 作者"
          clearable
          class="search-input"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="query.status"
          placeholder="状态"
          clearable
          class="filter-select"
        >
          <el-option label="全部状态" value="" />
          <el-option label="启用中" value="ENABLED" />
          <el-option label="已停用" value="DISABLED" />
        </el-select>
        <el-button type="primary" round @click="handleSearch">
          <el-icon><Search /></el-icon>
          <span>查询</span>
        </el-button>
        <el-button plain round @click="handleResetQuery">重置</el-button>

        <div class="filter-spacer"></div>

        <el-button type="success" round @click="openCreate">
          <el-icon><Plus /></el-icon>
          <span>新建短句</span>
        </el-button>
      </div>
    </el-card>

    <el-card class="list-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="records"
        stripe
        empty-text="暂无短句"
        class="quote-table"
      >
        <el-table-column label="内容" min-width="320">
          <template #default="{ row }">
            <div class="quote-content">
              <div class="quote-mark">&ldquo;</div>
              <span>{{ row.content }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="作者" prop="author" width="160">
          <template #default="{ row }">
            <span class="muted">{{ row.author || '匿名' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'ENABLED' ? 'success' : 'info'"
              effect="light"
              round
              size="small"
            >
              {{ row.status === 'ENABLED' ? '启用中' : '已停用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="排序" prop="sortOrder" width="90" />

        <el-table-column
          label="更新时间"
          prop="updatedAt"
          width="170"
          :formatter="formatTime"
        />

        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="openEdit(row)">
              <el-icon><Edit /></el-icon>
              <span>编辑</span>
            </el-button>
            <el-button text size="small" @click="toggleStatus(row)">
              <el-icon><SwitchButton /></el-icon>
              <span>{{ row.status === 'ENABLED' ? '停用' : '启用' }}</span>
            </el-button>
            <el-popconfirm
              title="确定删除该短句吗？"
              confirm-button-text="删除"
              cancel-button-text="取消"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button text size="small" type="danger">
                  <el-icon><Delete /></el-icon>
                  <span>删除</span>
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="total > 0" class="pager">
        <el-pagination
          background
          layout="total, prev, pager, next, sizes"
          :current-page="query.page"
          :page-size="query.size"
          :page-sizes="[10, 20, 50]"
          :total="total"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="editorVisible"
      :title="editorMode === 'create' ? '新建励志短句' : '编辑励志短句'"
      width="540px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        size="default"
      >
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="今天哪怕只前进一小步，也是值得肯定的事。"
            resize="none"
          />
        </el-form-item>
        <el-form-item label="作者" prop="author">
          <el-input
            v-model="form.author"
            placeholder="留空则为匿名"
            maxlength="100"
            clearable
          />
        </el-form-item>
        <div class="form-grid">
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="form.status">
              <el-radio value="ENABLED">启用</el-radio>
              <el-radio value="DISABLED">停用</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="排序" prop="sortOrder">
            <el-input-number
              v-model="form.sortOrder"
              :min="0"
              :max="9999"
              controls-position="right"
            />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="editorVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ editorMode === 'create' ? '创建' : '保存' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import {
  ElMessage,
  type FormInstance,
  type FormRules,
} from 'element-plus';
import {
  Search,
  Plus,
  Edit,
  Delete,
  SwitchButton,
} from '@element-plus/icons-vue';
import {
  pageQuotes,
  createQuote,
  updateQuote,
  deleteQuote,
} from '@/api/admin';
import type { MotivationalQuoteVO, QuotePageQuery } from '@/types/api';

const loading = ref(false);
const saving = ref(false);
const records = ref<MotivationalQuoteVO[]>([]);
const total = ref(0);

const query = reactive<Required<Pick<QuotePageQuery, 'page' | 'size'>> & QuotePageQuery>({
  page: 1,
  size: 10,
  keyword: '',
  status: '',
});

type EditorMode = 'create' | 'edit';
const editorMode = ref<EditorMode>('create');
const editorVisible = ref(false);
const editingId = ref<number | null>(null);

const formRef = ref<FormInstance>();
const form = reactive({
  content: '',
  author: '',
  status: 'ENABLED',
  sortOrder: 0,
});

const rules: FormRules = {
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    { max: 500, message: '内容最多 500 字', trigger: 'blur' },
  ],
};

function formatTime(_row: any, _col: any, value: string) {
  if (!value) return '--';
  return value.replace('T', ' ').slice(0, 16);
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await pageQuotes({
      page: query.page,
      size: query.size,
      keyword: query.keyword?.trim() || undefined,
      status: query.status || undefined,
    });
    records.value = res.data.records || [];
    total.value = res.data.total || 0;
  } catch {
    // 全局拦截器已提示
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.page = 1;
  fetchList();
}

function handleResetQuery() {
  query.keyword = '';
  query.status = '';
  query.page = 1;
  fetchList();
}

function handlePageChange(p: number) {
  query.page = p;
  fetchList();
}

function handleSizeChange(s: number) {
  query.size = s;
  query.page = 1;
  fetchList();
}

function resetForm() {
  form.content = '';
  form.author = '';
  form.status = 'ENABLED';
  form.sortOrder = 0;
}

function openCreate() {
  editorMode.value = 'create';
  editingId.value = null;
  resetForm();
  editorVisible.value = true;
}

function openEdit(row: MotivationalQuoteVO) {
  editorMode.value = 'edit';
  editingId.value = row.id;
  form.content = row.content;
  form.author = row.author || '';
  form.status = row.status || 'ENABLED';
  form.sortOrder = row.sortOrder ?? 0;
  editorVisible.value = true;
}

async function handleSave() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  saving.value = true;
  try {
    if (editorMode.value === 'create') {
      await createQuote({
        content: form.content.trim(),
        author: form.author.trim() || null,
        status: form.status,
        sortOrder: form.sortOrder,
      });
      ElMessage.success('已创建');
    } else if (editingId.value != null) {
      await updateQuote(editingId.value, {
        content: form.content.trim(),
        author: form.author.trim() || null,
        status: form.status,
        sortOrder: form.sortOrder,
      });
      ElMessage.success('已保存');
    }
    editorVisible.value = false;
    fetchList();
  } catch {
    // 全局拦截器已提示
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(row: MotivationalQuoteVO) {
  const next = row.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
  try {
    const res = await updateQuote(row.id, { status: next });
    const idx = records.value.findIndex((q) => q.id === res.data.id);
    if (idx !== -1) records.value[idx] = res.data;
    ElMessage.success(next === 'ENABLED' ? '已启用' : '已停用');
  } catch {
    // 全局拦截器已提示
  }
}

async function handleDelete(row: MotivationalQuoteVO) {
  try {
    await deleteQuote(row.id);
    ElMessage.success('已删除');
    if (records.value.length === 1 && query.page > 1) {
      query.page -= 1;
    }
    fetchList();
  } catch {
    // 全局拦截器已提示
  }
}

onMounted(fetchList);
</script>

<style scoped>
.quote-manage {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.filter-bar,
.list-card {
  border: none;
  border-radius: 18px;
  box-shadow: var(--healing-card-shadow);
  background: #ffffff;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.search-input {
  width: 260px;
}

.filter-select {
  width: 160px;
}

.filter-spacer {
  flex: 1;
}

.quote-content {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  color: #334155;
  line-height: 1.7;
}

.quote-mark {
  font-size: 26px;
  color: #60a5fa;
  font-family: Georgia, serif;
  line-height: 1;
  flex-shrink: 0;
}

.muted {
  color: var(--healing-muted);
  font-size: 13px;
}

.quote-table :deep(.el-table__inner-wrapper)::before {
  display: none;
}

.quote-table :deep(th.el-table__cell) {
  background: #f0f9ff;
  color: #1e3a8a;
  font-weight: 600;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>

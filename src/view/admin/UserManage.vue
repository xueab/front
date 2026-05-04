<template>
  <div class="user-manage">
    <el-card class="filter-bar" shadow="never">
      <div class="filter-row">
        <el-input
          v-model="query.keyword"
          placeholder="搜索邮箱 / 昵称"
          clearable
          size="default"
          class="search-input"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="query.role"
          placeholder="角色"
          clearable
          size="default"
          class="filter-select"
        >
          <el-option label="全部角色" value="" />
          <el-option
            v-for="r in roles"
            :key="r.code"
            :label="r.name"
            :value="r.code"
          />
        </el-select>

        <el-select
          v-model="query.status"
          placeholder="状态"
          clearable
          size="default"
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
      </div>
    </el-card>

    <el-card class="list-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="records"
        class="user-table"
        stripe
        empty-text="暂无用户"
      >
        <el-table-column label="用户" min-width="220">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar
                :size="38"
                :src="resolveAssetUrl(row.avatar) || defaultAvatar"
                :icon="UserFilled"
                class="cell-avatar"
              />
              <div class="cell-meta">
                <div class="cell-nick">{{ row.nickname || '未命名' }}</div>
                <div class="cell-email">{{ row.email }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="角色" width="130">
          <template #default="{ row }">
            <el-tag
              :type="row.role === 'ADMIN' ? 'primary' : 'info'"
              effect="light"
              round
              size="small"
            >
              {{ row.roleName || row.role }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'ENABLED' ? 'success' : 'danger'"
              effect="light"
              round
              size="small"
            >
              {{ row.status === 'ENABLED' ? '启用中' : '已停用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="注册时间"
          prop="createdAt"
          width="180"
          :formatter="formatTime"
        />

        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="openEdit(row)">
              <el-icon><Edit /></el-icon>
              <span>编辑</span>
            </el-button>
            <el-button
              text
              size="small"
              :disabled="isSelf(row)"
              @click="toggleStatus(row)"
            >
              <el-icon><SwitchButton /></el-icon>
              <span>{{ row.status === 'ENABLED' ? '停用' : '启用' }}</span>
            </el-button>
            <el-button text size="small" @click="openResetPwd(row)">
              <el-icon><Lock /></el-icon>
              <span>重置密码</span>
            </el-button>
            <el-popconfirm
              title="将物理删除该用户，确定吗？"
              confirm-button-text="删除"
              cancel-button-text="取消"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button text size="small" type="danger" :disabled="isSelf(row)">
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
      v-model="editVisible"
      title="编辑用户"
      width="460px"
      destroy-on-close
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-position="top"
        size="large"
      >
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="editForm.nickname" maxlength="32" clearable />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="editForm.role" placeholder="请选择角色">
            <el-option
              v-for="r in roles"
              :key="r.code"
              :label="r.name"
              :value="r.code"
            />
          </el-select>
          <div v-if="editingSelf" class="form-hint">
            不能把自己改成非管理员角色
          </div>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="editForm.status" :disabled="editingSelf">
            <el-radio value="ENABLED">启用</el-radio>
            <el-radio value="DISABLED">停用</el-radio>
          </el-radio-group>
          <div v-if="editingSelf" class="form-hint">不能停用自己</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSaving" @click="handleEditSave">
          保存
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="pwdVisible"
      title="重置密码"
      width="420px"
      destroy-on-close
    >
      <el-form
        ref="pwdFormRef"
        :model="pwdForm"
        :rules="pwdRules"
        label-position="top"
        size="large"
      >
        <el-alert
          type="info"
          :closable="false"
          show-icon
          title="将直接覆盖该用户的登录密码，请提前与对方沟通"
          class="pwd-alert"
        />
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="pwdForm.newPassword"
            type="password"
            show-password
            placeholder="6-32 位"
          />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirm">
          <el-input
            v-model="pwdForm.confirm"
            type="password"
            show-password
            placeholder="请再次输入新密码"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdVisible = false">取消</el-button>
        <el-button type="primary" :loading="pwdSaving" @click="handleResetPwd">
          确认重置
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
  Edit,
  Delete,
  Lock,
  SwitchButton,
  UserFilled,
} from '@element-plus/icons-vue';
import {
  pageUsers,
  updateUser,
  updateUserStatus,
  resetUserPassword,
  deleteUser,
  listRoles,
} from '@/api/admin';
import { resolveAssetUrl } from '@/utils/request';
import { useUserStore } from '@/stores/user';
import type {
  AdminUserVO,
  AdminUserPageQuery,
  RoleVO,
} from '@/types/api';

const userStore = useUserStore();

const defaultAvatar =
  'https://api.dicebear.com/7.x/thumbs/svg?seed=user&backgroundColor=bae6fd,a5f3fc,dbeafe';

const loading = ref(false);
const records = ref<AdminUserVO[]>([]);
const total = ref(0);
const roles = ref<RoleVO[]>([]);

const query = reactive<Required<Pick<AdminUserPageQuery, 'page' | 'size'>> & AdminUserPageQuery>({
  page: 1,
  size: 10,
  keyword: '',
  role: '',
  status: '',
});

// 编辑弹窗
const editVisible = ref(false);
const editSaving = ref(false);
const editingId = ref<number | null>(null);
const editingSelf = ref(false);
const editFormRef = ref<FormInstance>();
const editForm = reactive({
  nickname: '',
  role: 'USER',
  status: 'ENABLED',
});

const editRules: FormRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 1, max: 32, message: '昵称长度 1-32', trigger: 'blur' },
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
};

// 重置密码弹窗
const pwdVisible = ref(false);
const pwdSaving = ref(false);
const pwdTargetId = ref<number | null>(null);
const pwdFormRef = ref<FormInstance>();
const pwdForm = reactive({
  newPassword: '',
  confirm: '',
});

const pwdRules: FormRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度 6-32', trigger: 'blur' },
  ],
  confirm: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_r, val, cb) => {
        if (val !== pwdForm.newPassword) cb(new Error('两次输入的密码不一致'));
        else cb();
      },
      trigger: 'blur',
    },
  ],
};

function isSelf(row: AdminUserVO) {
  return userStore.userId != null && row.userId === userStore.userId;
}

function formatTime(_row: any, _col: any, value: string) {
  if (!value) return '--';
  return value.replace('T', ' ').slice(0, 16);
}

async function fetchRoles() {
  try {
    const res = await listRoles();
    roles.value = res.data || [];
  } catch {
    // 全局拦截器已提示
  }
}

async function fetchList() {
  loading.value = true;
  try {
    const params: AdminUserPageQuery = {
      page: query.page,
      size: query.size,
    };
    if (query.keyword) params.keyword = query.keyword.trim();
    if (query.role) params.role = query.role;
    if (query.status) params.status = query.status;

    const res = await pageUsers(params);
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
  query.role = '';
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

function openEdit(row: AdminUserVO) {
  editingId.value = row.userId;
  editingSelf.value = isSelf(row);
  editForm.nickname = row.nickname || '';
  editForm.role = row.role || 'USER';
  editForm.status = row.status || 'ENABLED';
  editVisible.value = true;
}

async function handleEditSave() {
  if (!editFormRef.value || editingId.value == null) return;
  const valid = await editFormRef.value.validate().catch(() => false);
  if (!valid) return;

  editSaving.value = true;
  try {
    const res = await updateUser(editingId.value, {
      nickname: editForm.nickname.trim(),
      role: editForm.role,
      status: editForm.status,
    });
    const idx = records.value.findIndex((u) => u.userId === res.data.userId);
    if (idx !== -1) records.value[idx] = res.data;
    ElMessage.success('已保存');
    editVisible.value = false;
  } catch {
    // 全局拦截器已提示
  } finally {
    editSaving.value = false;
  }
}

async function toggleStatus(row: AdminUserVO) {
  if (isSelf(row)) return;
  const next = row.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
  try {
    const res = await updateUserStatus(row.userId, next);
    const idx = records.value.findIndex((u) => u.userId === res.data.userId);
    if (idx !== -1) records.value[idx] = res.data;
    ElMessage.success(next === 'ENABLED' ? '已启用' : '已停用');
  } catch {
    // 全局拦截器已提示
  }
}

function openResetPwd(row: AdminUserVO) {
  pwdTargetId.value = row.userId;
  pwdForm.newPassword = '';
  pwdForm.confirm = '';
  pwdVisible.value = true;
}

async function handleResetPwd() {
  if (!pwdFormRef.value || pwdTargetId.value == null) return;
  const valid = await pwdFormRef.value.validate().catch(() => false);
  if (!valid) return;

  pwdSaving.value = true;
  try {
    await resetUserPassword(pwdTargetId.value, {
      newPassword: pwdForm.newPassword,
    });
    ElMessage.success('密码已重置');
    pwdVisible.value = false;
  } catch {
    // 全局拦截器已提示
  } finally {
    pwdSaving.value = false;
  }
}

async function handleDelete(row: AdminUserVO) {
  if (isSelf(row)) return;
  try {
    await deleteUser(row.userId);
    ElMessage.success('已删除');
    if (records.value.length === 1 && query.page > 1) {
      query.page -= 1;
    }
    await fetchList();
  } catch {
    // 全局拦截器已提示
  }
}

onMounted(() => {
  fetchRoles();
  fetchList();
});
</script>

<style scoped>
.user-manage {
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

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cell-avatar {
  border: 2px solid #ffffff;
  box-shadow: 0 4px 10px rgba(96, 165, 250, 0.2);
  background: linear-gradient(135deg, #bae6fd, #a5f3fc);
  color: #fff;
  flex-shrink: 0;
}

.cell-meta {
  min-width: 0;
}

.cell-nick {
  font-size: 14px;
  font-weight: 500;
  color: #1e3a8a;
  margin-bottom: 2px;
}

.cell-email {
  font-size: 12px;
  color: var(--healing-muted);
}

.user-table :deep(.el-table__inner-wrapper)::before {
  display: none;
}

.user-table :deep(th.el-table__cell) {
  background: #f0f9ff;
  color: #1e3a8a;
  font-weight: 600;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.form-hint {
  font-size: 12px;
  color: var(--healing-muted);
  margin-top: 4px;
}

.pwd-alert {
  margin-bottom: 12px;
  border-radius: 10px;
}

@media (max-width: 768px) {
  .search-input,
  .filter-select {
    width: 100%;
  }
}
</style>

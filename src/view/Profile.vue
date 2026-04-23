<template>
  <div class="profile-view" v-loading="loading">
    <div class="page-header">
      <h2 class="page-title">个人资料</h2>
      <p class="page-subtitle">一个更懂自己的你，从这里开始 ✨</p>
    </div>

    <el-card class="profile-card" shadow="never">
      <div class="avatar-block">
        <el-avatar
          :size="96"
          :src="resolveAssetUrl(form.avatar) || defaultAvatar"
          class="avatar-large"
        />
        <el-upload
          class="upload-trigger"
          :show-file-list="false"
          :auto-upload="false"
          :on-change="handleAvatarChange"
          accept="image/*"
          :disabled="uploading"
        >
          <el-button plain size="small" round :loading="uploading">
            <el-icon v-if="!uploading"><Camera /></el-icon>
            <span>{{ uploading ? '上传中...' : '更换头像' }}</span>
          </el-button>
        </el-upload>
        <div class="avatar-tip">支持 JPG / PNG，建议尺寸 200×200，5MB 以内</div>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        size="large"
        class="profile-form"
      >
        <el-form-item label="手机号">
          <el-input v-model="form.phone" disabled>
            <template #prefix>
              <el-icon><Phone /></el-icon>
            </template>
          </el-input>
          <div class="form-hint">手机号用于登录，暂不支持修改</div>
        </el-form-item>

        <el-form-item label="昵称" prop="nickname">
          <el-input
            v-model="form.nickname"
            placeholder="给自己取个温柔的名字"
            maxlength="20"
            show-word-limit
            clearable
          />
        </el-form-item>

        <div class="form-actions">
          <el-button plain @click="openChangePassword">
            <el-icon><Lock /></el-icon>
            <span>修改密码</span>
          </el-button>
          <div class="right-actions">
            <el-button plain @click="resetForm">重置</el-button>
            <el-button type="primary" :loading="saving" @click="handleSave">
              保存修改
            </el-button>
          </div>
        </div>
      </el-form>
    </el-card>

    <el-dialog
      v-model="pwdDialogVisible"
      title="修改密码"
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
        <el-form-item label="当前密码" prop="oldPassword">
          <el-input
            v-model="pwdForm.oldPassword"
            type="password"
            show-password
            placeholder="请输入当前登录密码"
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="pwdForm.newPassword"
            type="password"
            show-password
            placeholder="6-20 位，新的开始"
          />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="pwdForm.confirmPassword"
            type="password"
            show-password
            placeholder="请再次输入新密码"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="changingPwd"
          @click="handleChangePassword"
        >
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import {
  ElMessage,
  type FormInstance,
  type FormRules,
  type UploadFile,
} from 'element-plus';
import { Camera, Phone, Lock } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { resolveAssetUrl } from '@/utils/request';

const userStore = useUserStore();

const defaultAvatar =
  'https://api.dicebear.com/7.x/thumbs/svg?seed=heart&backgroundColor=bae6fd,a5f3fc,dbeafe';

const formRef = ref<FormInstance>();
const pwdFormRef = ref<FormInstance>();
const loading = ref(false);
const saving = ref(false);
const uploading = ref(false);
const changingPwd = ref(false);
const pwdDialogVisible = ref(false);

const form = reactive({
  phone: '',
  nickname: '',
  avatar: '' as string,
});

const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const rules: FormRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 1, max: 20, message: '昵称长度应为 1-20 个字符', trigger: 'blur' },
  ],
};

const pwdRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '新密码长度应为 6-20 个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== pwdForm.newPassword) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
};

function syncFormFromStore() {
  form.phone = userStore.phone || '';
  form.nickname = userStore.nickname || '';
  form.avatar = userStore.avatar || '';
}

async function loadProfile() {
  loading.value = true;
  try {
    await userStore.fetchProfile();
    syncFormFromStore();
  } catch {
    syncFormFromStore();
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  syncFormFromStore();
  ElMessage.info('已重置为当前资料');
}

async function handleAvatarChange(file: UploadFile) {
  const raw = file.raw;
  if (!raw) return;
  if (!raw.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件');
    return;
  }
  if (raw.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB');
    return;
  }

  uploading.value = true;
  try {
    const avatarUrl = await userStore.uploadAvatar(raw as File);
    form.avatar = avatarUrl;
    ElMessage.success('头像已更新');
  } catch {
    // 全局拦截器已经提示过错误
  } finally {
    uploading.value = false;
  }
}

async function handleSave() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  saving.value = true;
  try {
    await userStore.updateProfile({ nickname: form.nickname });
    syncFormFromStore();
    ElMessage.success('资料已更新');
  } catch {
    // 异常已全局提示
  } finally {
    saving.value = false;
  }
}

function openChangePassword() {
  pwdForm.oldPassword = '';
  pwdForm.newPassword = '';
  pwdForm.confirmPassword = '';
  pwdDialogVisible.value = true;
}

async function handleChangePassword() {
  if (!pwdFormRef.value) return;
  const valid = await pwdFormRef.value.validate().catch(() => false);
  if (!valid) return;

  changingPwd.value = true;
  try {
    await userStore.changePassword({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword,
    });
    ElMessage.success('密码修改成功，请牢记新密码');
    pwdDialogVisible.value = false;
  } catch {
    // 异常已全局提示
  } finally {
    changingPwd.value = false;
  }
}

onMounted(loadProfile);
</script>

<style scoped>
.profile-view {
  max-width: 720px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 24px;
}

.page-title {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 600;
  color: #1e3a8a;
}

.page-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--healing-muted);
}

.profile-card {
  border: none;
  border-radius: 18px;
  box-shadow: var(--healing-card-shadow);
  background: #ffffff;
}

.avatar-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 0 28px;
  border-bottom: 1px dashed #e0f2fe;
  margin-bottom: 24px;
}

.avatar-large {
  border: 4px solid #ffffff;
  box-shadow: 0 10px 28px rgba(96, 165, 250, 0.25);
  background: linear-gradient(135deg, #bae6fd, #a5f3fc);
}

.avatar-tip {
  font-size: 12px;
  color: var(--healing-muted);
}

.profile-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #334155;
}

.form-hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--healing-muted);
}

.form-actions {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.right-actions {
  display: flex;
  gap: 12px;
}
</style>

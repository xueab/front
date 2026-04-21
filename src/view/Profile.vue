<template>
  <div class="profile-view">
    <div class="page-header">
      <h2 class="page-title">个人资料</h2>
      <p class="page-subtitle">一个更懂自己的你，从这里开始 ✨</p>
    </div>

    <el-card class="profile-card" shadow="never">
      <div class="avatar-block">
        <el-avatar :size="96" :src="form.avatar || defaultAvatar" class="avatar-large" />
        <el-upload
          class="upload-trigger"
          :show-file-list="false"
          :auto-upload="false"
          :on-change="handleAvatarChange"
          accept="image/*"
        >
          <el-button plain size="small" round>
            <el-icon><Camera /></el-icon>
            <span>更换头像</span>
          </el-button>
        </el-upload>
        <div class="avatar-tip">支持 JPG / PNG，建议尺寸 200×200</div>
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
          <el-button plain @click="resetForm">重置</el-button>
          <el-button type="primary" :loading="saving" @click="handleSave">
            保存修改
          </el-button>
        </div>
      </el-form>
    </el-card>
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
import { Camera, Phone } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

const defaultAvatar =
  'https://api.dicebear.com/7.x/thumbs/svg?seed=heart&backgroundColor=bae6fd,a5f3fc,dbeafe';

const formRef = ref<FormInstance>();
const saving = ref(false);

const form = reactive({
  phone: '',
  nickname: '',
  avatar: '' as string,
});

const rules: FormRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 1, max: 20, message: '昵称长度应为 1-20 个字符', trigger: 'blur' },
  ],
};

function loadFromStore() {
  form.phone = userStore.phone || '138****0000';
  form.nickname = userStore.nickname || '温柔的朋友';
  form.avatar = userStore.avatar || '';
}

function resetForm() {
  loadFromStore();
  ElMessage.info('已重置为当前资料');
}

function handleAvatarChange(file: UploadFile) {
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
  const reader = new FileReader();
  reader.onload = (e) => {
    form.avatar = (e.target?.result as string) || '';
    ElMessage.success('头像已预览，点击保存生效');
  };
  reader.readAsDataURL(raw);
}

async function handleSave() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  saving.value = true;
  await new Promise((resolve) => setTimeout(resolve, 800));
  userStore.updateProfile({
    nickname: form.nickname,
    avatar: form.avatar || null,
  });
  saving.value = false;
  ElMessage.success('资料已更新');
}

onMounted(loadFromStore);
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
  justify-content: flex-end;
  gap: 12px;
}
</style>

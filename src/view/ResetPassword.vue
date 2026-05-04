<template>
  <div class="auth-page">
    <el-card class="auth-card" shadow="never">
      <template #header>
        <div class="auth-header">
          <h2 class="auth-title">找回密码</h2>
          <p class="auth-subtitle">使用邮箱验证码重置登录密码</p>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        size="large"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="form.email"
            placeholder="请输入邮箱地址"
            maxlength="64"
            clearable
          />
        </el-form-item>

        <el-form-item label="验证码" prop="code">
          <div class="code-row">
            <el-input
              v-model="form.code"
              placeholder="请输入验证码"
              maxlength="6"
            />
            <el-button
              class="code-btn"
              :loading="sendingCode"
              :disabled="countdown > 0 || sendingCode"
              @click="handleSendCode"
            >
              {{ countdown > 0 ? `${countdown}s 后重试` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入新密码（不少于 6 位）"
            show-password
          />
        </el-form-item>

        <el-button
          type="primary"
          class="auth-submit"
          size="large"
          :loading="loading"
          @click="handleSubmit"
        >
          重置密码
        </el-button>

        <div class="auth-links">
          想起密码了？
          <router-link to="/login">返回登录</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { resetPassword, sendCode } from '@/api/auth';

const router = useRouter();

const formRef = ref<FormInstance>();
const loading = ref(false);
const sendingCode = ref(false);
const countdown = ref(0);
let timer: number | null = null;

const form = reactive({
  email: '',
  code: '',
  password: '',
});

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    {
      type: 'email',
      message: '请输入正确的邮箱地址',
      trigger: 'blur',
    },
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { min: 4, max: 6, message: '验证码长度为 4-6 位', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' },
  ],
};

function startCountdown() {
  countdown.value = 60;
  timer = window.setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0 && timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }, 1000);
}

async function handleSendCode() {
  if (!formRef.value) return;
  const valid = await formRef.value
    .validateField('email')
    .catch(() => false);
  if (!valid) return;

  sendingCode.value = true;
  try {
    await sendCode({ email: form.email });
    ElMessage.success(`验证码已发送至 ${form.email}，请查收邮件`);
    startCountdown();
  } catch (err) {
    console.warn('[ResetPassword] 发送验证码失败', err);
  } finally {
    sendingCode.value = false;
  }
}

async function handleSubmit() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    const res = await resetPassword({
      email: form.email,
      password: form.password,
      code: form.code,
    });
    ElMessage.success(res.data || '密码重置成功，请重新登录');
    setTimeout(() => router.push('/login'), 600);
  } catch (err) {
    console.warn('[ResetPassword] 重置密码失败', err);
  } finally {
    loading.value = false;
  }
}

onBeforeUnmount(() => {
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
});
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(160deg, #f0f9ff 0%, #e0f2fe 60%, #dbeafe 100%);
}

.auth-card {
  width: 100%;
  max-width: 420px;
  border: none;
  border-radius: 18px;
  box-shadow: var(--healing-card-shadow);
  background: #ffffff;
}

.auth-header {
  text-align: center;
}

.auth-title {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 600;
  color: #1e3a8a;
}

.auth-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--healing-muted);
}

.code-row {
  display: flex;
  gap: 10px;
  width: 100%;
}

.code-row :deep(.el-input) {
  flex: 1;
}

.code-btn {
  min-width: 120px;
  border-radius: 10px;
  background-color: #e0f2fe;
  color: var(--healing-primary-active);
  border-color: #bae6fd;
}

.code-btn:hover:not(:disabled) {
  background-color: #bae6fd;
  color: var(--healing-primary-active);
  border-color: #7dd3fc;
}

.auth-submit {
  width: 100%;
  margin-top: 6px;
  border-radius: 10px;
}

.auth-links {
  margin-top: 16px;
  text-align: center;
  font-size: 13px;
  color: var(--healing-muted);
}
</style>

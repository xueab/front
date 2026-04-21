<template>
  <div class="auth-page">
    <el-card class="auth-card" shadow="never">
      <template #header>
        <div class="auth-header">
          <h2 class="auth-title">创建账号</h2>
          <p class="auth-subtitle">开启你的心理健康旅程</p>
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
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="form.phone"
            placeholder="请输入 11 位手机号"
            maxlength="11"
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

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请设置不少于 6 位的密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="昵称（可选）" prop="nickname">
          <el-input
            v-model="form.nickname"
            placeholder="给自己取一个温柔的称呼"
            maxlength="20"
          />
        </el-form-item>

        <el-button
          type="primary"
          class="auth-submit"
          size="large"
          :loading="loading"
          @click="handleSubmit"
        >
          注 册
        </el-button>

        <div class="auth-links">
          已有账号？
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
import { register, sendCode } from '@/api/auth';

const router = useRouter();

const formRef = ref<FormInstance>();
const loading = ref(false);
const sendingCode = ref(false);
const countdown = ref(0);
let timer: number | null = null;

const form = reactive({
  phone: '',
  code: '',
  password: '',
  confirmPassword: '',
  nickname: '',
});

const validateConfirmPassword = (
  _rule: unknown,
  value: string,
  callback: (err?: Error) => void,
) => {
  if (!value) {
    callback(new Error('请再次输入密码'));
  } else if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const rules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      pattern: /^1\d{10}$/,
      message: '请输入正确的 11 位手机号',
      trigger: 'blur',
    },
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { min: 4, max: 6, message: '验证码长度为 4-6 位', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请设置密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' },
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
    .validateField('phone')
    .catch(() => false);
  if (!valid) return;

  sendingCode.value = true;
  try {
    await sendCode({ phone: form.phone });
    ElMessage.success(`验证码已发送至 ${form.phone}，请到后端控制台查看`);
    startCountdown();
  } catch (err) {
    console.warn('[Register] 发送验证码失败', err);
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
    const payload = {
      phone: form.phone,
      password: form.password,
      code: form.code,
      ...(form.nickname ? { nickname: form.nickname } : {}),
    };
    const res = await register(payload);
    ElMessage.success(res.data || '注册成功，即将跳转登录');
    setTimeout(() => router.push('/login'), 600);
  } catch (err) {
    console.warn('[Register] 注册失败', err);
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
  max-width: 440px;
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

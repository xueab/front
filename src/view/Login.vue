<template>
  <div class="auth-page">
    <el-card class="auth-card" shadow="never">
      <template #header>
        <div class="auth-header">
          <h2 class="auth-title">欢迎回来</h2>
          <p class="auth-subtitle">登录你的心灵小屋</p>
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

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
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
          登 录
        </el-button>

        <div class="auth-links">
          <router-link to="/register">立即注册</router-link>
          <span class="divider">|</span>
          <router-link to="/reset-password">找回密码</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();

const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({
  phone: '',
  password: '',
});

const rules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      pattern: /^1\d{10}$/,
      message: '请输入正确的 11 位手机号',
      trigger: 'blur',
    },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' },
  ],
};

async function handleSubmit() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    await userStore.login({
      phone: form.phone,
      password: form.password,
    });
    ElMessage.success('登录成功');
    router.push('/');
  } catch (err) {
    console.warn('[Login] 登录失败', err);
  } finally {
    loading.value = false;
  }
}
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

.auth-submit {
  width: 100%;
  margin-top: 6px;
  border-radius: 10px;
}

.auth-links {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.auth-links .divider {
  color: #cbd5e1;
}
</style>

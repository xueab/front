# 对话报告 API 文档

> 版本：v1（2026-05-06）
> 适用：心理健康系统 backend 模块
> 路径前缀：`/api/chat`
> 鉴权：所有接口要求请求头 `Authorization: Bearer <JWT>`，报告数据按用户隔离，用户只能操作自己的报告。

---

## 1. 通用约定

### 1.1 请求/响应格式

- 所有接口均为 JSON（`Content-Type: application/json`），统一返回如下结构：

```json
{
  "code": 200,
  "msg": "success",
  "data": <T>
}
```

- 业务错误：`code != 200`，`msg` 为提示文案；常见 `code`：
  - 400：参数/业务校验失败（如会话无对话记录）
  - 401：未登录或 token 失效
  - 403：尝试操作他人报告/会话
  - 404：报告或会话不存在
  - 502 / 503：调用 AI 服务异常

### 1.2 分页响应

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "total": 15,
    "page": 1,
    "size": 10,
    "records": [ ... ]
  }
}
```

### 1.3 数据库迁移

新增表见 `backend/src/main/resources/db/migration/V20260506_02__chat_report.sql`，需手工执行：

- 新增 `chat_report` 表（对话分析报告）
- `session_id` 设唯一索引，保证每个会话最多一份报告

### 1.4 AI 服务配置

`application.properties` 新增：

```properties
ai-service.report-generate-path=${AI_SERVICE_REPORT_GENERATE_PATH:/internal/v1/chat/report/generate}
```

AI 服务需实现该接口，请求/响应格式见 [第 5 节](#5-ai-服务接口契约)。

---

## 2. AI 生成报告

### 2.1 生成/覆盖报告

`POST /api/chat/sessions/{sessionId}/report/generate`

调用 AI 服务，为指定会话生成一份分析报告。若该会话已有报告，则**覆盖**（更新标题和内容），不会产生多条记录。

**路径参数：**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| sessionId | long | 会话 ID |

**请求体：** 无

**响应示例：**

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": 1,
    "sessionId": 42,
    "sessionTitle": "关于近期焦虑的对话",
    "title": "情绪分析报告：焦虑情绪识别与建议",
    "content": "## 对话概述\n\n本次对话中，用户主要表达了近期工作压力导致的焦虑情绪...\n\n## 情绪识别\n\n...\n\n## 建议\n\n...",
    "createdAt": "2026-05-06 14:30:00",
    "updatedAt": "2026-05-06 14:30:00"
  }
}
```

**错误情况：**

| code | msg | 触发条件 |
| --- | --- | --- |
| 400 | 该会话暂无对话记录，无法生成报告 | 会话中没有任何消息 |
| 403 | 无权限访问该会话 | 尝试为他人会话生成报告 |
| 404 | 会话不存在 | sessionId 无效 |
| 502 | AI 报告生成失败，请稍后重试 | AI 服务返回错误 |
| 502 | AI 服务返回了空报告 | AI 服务返回内容为空 |
| 503 | AI 服务连接超时，请稍后重试 | AI 服务不可达 |

---

## 3. 报告查询

### 3.1 按会话查看报告

`GET /api/chat/sessions/{sessionId}/report`

根据会话 ID 获取其关联的报告。

**路径参数：**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| sessionId | long | 会话 ID |

**响应示例：**

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": 1,
    "sessionId": 42,
    "sessionTitle": "关于近期焦虑的对话",
    "title": "情绪分析报告：焦虑情绪识别与建议",
    "content": "## 对话概述\n\n...",
    "createdAt": "2026-05-06 14:30:00",
    "updatedAt": "2026-05-06 14:30:00"
  }
}
```

**错误情况：**

| code | msg | 触发条件 |
| --- | --- | --- |
| 403 | 无权限访问该会话 | 尝试查看他人会话的报告 |
| 404 | 会话不存在 | sessionId 无效 |
| 404 | 该会话尚未生成报告 | 会话存在但未生成过报告 |

---

### 3.2 分页查询报告列表

`GET /api/chat/reports`

查询当前用户的所有报告，支持关键词搜索和分页。

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | int | 否 | 页码，默认 1 |
| size | int | 否 | 每页条数，默认 10 |
| keyword | string | 否 | 关键词，模糊匹配报告标题和内容 |

**请求示例：**

```
GET /api/chat/reports?page=1&size=10&keyword=焦虑
```

**响应示例：**

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "total": 3,
    "page": 1,
    "size": 10,
    "records": [
      {
        "id": 3,
        "sessionId": 55,
        "sessionTitle": "睡眠问题咨询",
        "title": "睡眠质量分析报告",
        "content": "## 对话概述\n\n...",
        "createdAt": "2026-05-06 16:00:00",
        "updatedAt": "2026-05-06 16:00:00"
      },
      {
        "id": 1,
        "sessionId": 42,
        "sessionTitle": "关于近期焦虑的对话",
        "title": "情绪分析报告：焦虑情绪识别与建议",
        "content": "## 对话概述\n\n...",
        "createdAt": "2026-05-06 14:30:00",
        "updatedAt": "2026-05-06 14:30:00"
      }
    ]
  }
}
```

> 列表按 `updatedAt` 倒序排列（最近更新的排在前面）。

---

### 3.3 报告详情

`GET /api/chat/reports/{id}`

**路径参数：**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| id | long | 报告 ID |

**响应示例：**

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": 1,
    "sessionId": 42,
    "sessionTitle": "关于近期焦虑的对话",
    "title": "情绪分析报告：焦虑情绪识别与建议",
    "content": "## 对话概述\n\n本次对话中，用户主要表达了近期工作压力导致的焦虑情绪...\n\n## 情绪识别\n\n- 主要情绪：焦虑、紧张\n- 情绪强度：中高\n- 持续时间：约两周\n\n## 建议\n\n1. 尝试渐进性肌肉放松法...\n2. 保持规律作息...",
    "createdAt": "2026-05-06 14:30:00",
    "updatedAt": "2026-05-06 14:30:00"
  }
}
```

**错误情况：**

| code | msg | 触发条件 |
| --- | --- | --- |
| 403 | 无权限访问该报告 | 尝试查看他人报告 |
| 404 | 报告不存在 | id 无效 |

---

## 4. 报告编辑与删除

### 4.1 更新报告

`PUT /api/chat/reports/{id}`

手动编辑报告的标题和内容。

**路径参数：**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| id | long | 报告 ID |

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| title | string | 是 | 报告标题，不可为空 |
| content | string | 是 | 报告内容，不可为空 |

**请求示例：**

```json
{
  "title": "焦虑情绪分析报告（修订版）",
  "content": "## 对话概述\n\n修改后的内容..."
}
```

**响应示例：**

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": 1,
    "sessionId": 42,
    "sessionTitle": "关于近期焦虑的对话",
    "title": "焦虑情绪分析报告（修订版）",
    "content": "## 对话概述\n\n修改后的内容...",
    "createdAt": "2026-05-06 14:30:00",
    "updatedAt": "2026-05-06 15:20:00"
  }
}
```

**错误情况：**

| code | msg | 触发条件 |
| --- | --- | --- |
| 400 | 报告标题不能为空 | title 为空或纯空白 |
| 400 | 报告内容不能为空 | content 为空或纯空白 |
| 403 | 无权限访问该报告 | 尝试编辑他人报告 |
| 404 | 报告不存在 | id 无效 |

---

### 4.2 删除报告

`DELETE /api/chat/reports/{id}`

**路径参数：**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| id | long | 报告 ID |

**响应示例：**

```json
{
  "code": 200,
  "msg": "success",
  "data": null
}
```

**错误情况：**

| code | msg | 触发条件 |
| --- | --- | --- |
| 403 | 无权限访问该报告 | 尝试删除他人报告 |
| 404 | 报告不存在 | id 无效 |

---

## 5. AI 服务接口契约

后端调用 AI 服务的报告生成接口，前端无需关心此节，仅供 ai-service 端开发参考。

### 请求

`POST {ai-service.base-url}{ai-service.report-generate-path}`

默认：`POST http://localhost:8001/internal/v1/chat/report/generate`

**请求头：**

| Header | 说明 |
| --- | --- |
| Content-Type | application/json |
| X-Internal-Token | 可选，内部鉴权 token |

**请求体：**

```json
{
  "sessionId": 42,
  "messages": [
    { "role": "user", "content": "最近总是感到焦虑，睡不好觉" },
    { "role": "assistant", "content": "我理解你的感受。焦虑确实会影响睡眠质量..." },
    { "role": "user", "content": "是的，而且白天工作也很难集中注意力" },
    { "role": "assistant", "content": "注意力不集中也是焦虑的常见表现..." }
  ]
}
```

### 响应

```json
{
  "title": "情绪分析报告：焦虑情绪识别与建议",
  "reportText": "## 对话概述\n\n本次对话中，用户主要表达了...\n\n## 情绪识别\n\n...\n\n## 建议\n\n...",
  "model": "deepseek-chat",
  "requestId": "req_abc123"
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| title | string | 否 | AI 生成的报告标题；为空时后端自动以「{会话标题} - 分析报告」作为标题 |
| reportText | string | 是 | 报告正文，建议使用 Markdown 格式 |
| model | string | 否 | 使用的模型名称 |
| requestId | string | 否 | 请求追踪 ID |

---

## 6. 数据结构参考

### 6.1 ChatReportVO（报告响应体）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | long | 报告 ID |
| sessionId | long | 关联的会话 ID |
| sessionTitle | string | 会话标题（关联查询） |
| title | string | 报告标题 |
| content | string | 报告正文（Markdown） |
| createdAt | string | 创建时间，格式 `yyyy-MM-dd HH:mm:ss` |
| updatedAt | string | 最后更新时间，格式 `yyyy-MM-dd HH:mm:ss` |

### 6.2 ReportQueryDTO（分页查询参数）

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| page | int | 1 | 页码 |
| size | int | 10 | 每页条数 |
| keyword | string | null | 关键词搜索（匹配标题和内容） |

### 6.3 UpdateReportDTO（编辑请求体）

| 字段 | 类型 | 必填 | 校验规则 |
| --- | --- | --- | --- |
| title | string | 是 | 不可为空白 |
| content | string | 是 | 不可为空白 |

---

## 7. 接口清单速查

| Method | 路径 | 说明 |
| --- | --- | --- |
| POST | /api/chat/sessions/{sessionId}/report/generate | AI 生成报告（已有则覆盖） |
| GET | /api/chat/sessions/{sessionId}/report | 按会话查看报告 |
| GET | /api/chat/reports?page=&size=&keyword= | 分页查询报告列表 |
| GET | /api/chat/reports/{id} | 报告详情 |
| PUT | /api/chat/reports/{id} | 编辑报告 |
| DELETE | /api/chat/reports/{id} | 删除报告 |

---

## 8. 前端集成建议

### 8.1 对话页面（生成报告入口）

- 在对话界面中增加「生成报告」按钮
- 点击后调用 `POST /api/chat/sessions/{sessionId}/report/generate`
- AI 生成需要一定时间（通常 5-15 秒），建议按钮加 loading 状态
- 生成成功后可跳转到报告详情页，或弹窗展示

### 8.2 判断会话是否已有报告

- 调用 `GET /api/chat/sessions/{sessionId}/report`
- 如果返回 `code=404`（msg: "该会话尚未生成报告"），说明未生成
- 如果返回 `code=200`，说明已生成，可显示「查看报告」和「重新生成」按钮

### 8.3 报告管理页面

- 调用 `GET /api/chat/reports` 展示报告列表
- 搜索框传 `keyword` 参数
- 列表项展示 `sessionTitle`（对话标题）、`title`（报告标题）、`updatedAt`
- 支持点击查看详情、编辑、删除操作

### 8.4 报告详情页

- 报告 `content` 为 Markdown 格式，前端建议使用 markdown 渲染组件（如 `markdown-it`、`marked`）
- 提供「编辑」按钮，进入编辑模式可修改标题和内容
- 提供「重新生成」按钮，会覆盖当前报告

---

## 9. cURL 速查

```bash
# 1. 登录拿 token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"xxxxxx"}'

TOKEN="..."

# 2. 为会话生成报告
curl -X POST http://localhost:8080/api/chat/sessions/42/report/generate \
  -H "Authorization: Bearer $TOKEN"

# 3. 按会话查看报告
curl http://localhost:8080/api/chat/sessions/42/report \
  -H "Authorization: Bearer $TOKEN"

# 4. 分页查询报告列表
curl "http://localhost:8080/api/chat/reports?page=1&size=10" \
  -H "Authorization: Bearer $TOKEN"

# 5. 带关键词搜索
curl "http://localhost:8080/api/chat/reports?page=1&size=10&keyword=焦虑" \
  -H "Authorization: Bearer $TOKEN"

# 6. 查看报告详情
curl http://localhost:8080/api/chat/reports/1 \
  -H "Authorization: Bearer $TOKEN"

# 7. 编辑报告
curl -X PUT http://localhost:8080/api/chat/reports/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"修订后的标题","content":"修订后的内容..."}'

# 8. 删除报告
curl -X DELETE http://localhost:8080/api/chat/reports/1 \
  -H "Authorization: Bearer $TOKEN"
```

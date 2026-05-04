# 管理员端后端 API 文档

> 版本：v1（2026-05-05）
> 适用：心理健康系统 backend 模块
> 路径前缀：`/api/admin/**`（除「公开励志短句」外）
> 鉴权：所有 `/api/admin/**` 接口要求请求头 `Authorization: Bearer <JWT>`，并且 JWT 中 `role=ADMIN`。
> CORS：默认放通 `http://localhost:5173`，如改前端地址请同步修改 `SecurityConfig`。

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
  - 400：参数/业务校验失败
  - 401：未登录或 token 失效
  - 403：无管理员权限 / 账号被停用
  - 404：资源不存在
  - 502 / 503：调用 ai-service 异常

### 1.2 分页响应

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "total": 123,
    "page": 1,
    "size": 20,
    "records": [ ... ]
  }
}
```

### 1.3 鉴权说明

- 登录接口仍是 `POST /api/auth/login`，登录成功后返回的 `data.role` 为 `"ADMIN"` 时即代表管理员。
- 当账号被管理员停用时，登录会返回 `code=403, msg="账号已被停用，请联系管理员"`。
- 管理员账号开通方式（任选其一）：
  - SQL：`UPDATE sys_user SET role_id = 2 WHERE email = 'xxx@xxx.com';`（id=2 为内置 ADMIN 角色）
  - 或者本来就在系统中的账号，由现有管理员通过「用户管理」接口提权。

### 1.4 数据库迁移

新增字段与表见 `backend/src/main/resources/db/migration/V20260505_02__admin_module.sql`，需要手工执行：

- 新增 `sys_role` 表（角色字典），并预置 `USER` / `ADMIN` 两条记录
- `sys_user` 新增 `role_id BIGINT NOT NULL DEFAULT 1`（外键 → `sys_role.id`）
- `sys_user` 新增 `status VARCHAR(20) NOT NULL DEFAULT 'ENABLED'`
- 新增 `motivational_quote` 表

> 角色不再以字符串列形式存放在 `sys_user` 上，而是通过 `role_id` 引用 `sys_role`。
> Mapper 在 SELECT 时 JOIN `sys_role`，把 `role`（code）和 `roleName` 一并查出，
> 业务代码无需直接访问 `role_id`。

---

## 2. 知识文档管理

> 实现说明：直接管理 `ai-service/knowledge/docs/*.md` 物理文件。
> 配置项：`ai-service.knowledge-dir`（默认 `../ai-service/knowledge/docs`）。
> 增删改后请调用「重建索引」接口让 RAG 索引刷新。

### 2.1 分页查询

`GET /api/admin/knowledge`

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| keyword | string | 否 | 模糊匹配文件名 / 标题 |
| page | long | 否 | 默认 1 |
| size | long | 否 | 默认 20，上限 100 |

响应：`PageResult<KnowledgeDocVO>`，其中列表项 `content` 字段为 `null`，仅含元信息：

```json
{
  "id": "anxiety-coping",
  "filename": "anxiety-coping.md",
  "title": "焦虑应对的十个练习",
  "size": 4764,
  "updatedAt": "2026-05-04T23:47:00",
  "content": null
}
```

### 2.2 文档详情

`GET /api/admin/knowledge/{id}`

返回 `KnowledgeDocVO`，包含完整 markdown 内容。

### 2.3 新建文档

`POST /api/admin/knowledge`

请求体：

```json
{
  "id": "self-care-routines",
  "content": "# 自我关怀的小练习\n\n..."
}
```

约束：
- `id` 必填，长度 1-100，只能包含 `A-Z a-z 0-9 _ -`，自动追加 `.md` 写入；
- 同名文件已存在会返回 400；
- `content` 必填，最长 100000 字符。

响应：写入后的 `KnowledgeDocVO`（含 content）。

### 2.4 更新文档

`PUT /api/admin/knowledge/{id}`

请求体：

```json
{ "content": "# 更新后的标题\n..." }
```

返回 `KnowledgeDocVO`。

### 2.5 删除文档

`DELETE /api/admin/knowledge/{id}`

成功返回 `data: "删除成功"`。

### 2.6 重建索引

`POST /api/admin/knowledge/reindex`

调用 ai-service `/internal/v1/rag/reindex`，重建 RAG 索引。

```json
{ "code": 200, "msg": "success", "data": { "chunkCount": 1234 } }
```

ai-service 不可达或失败时返回 502 / 503。

---

## 3. 用户管理

### 3.1 分页查询

`GET /api/admin/users`

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| keyword | string | 否 | 模糊匹配 email / nickname |
| role | string | 否 | `USER` / `ADMIN` |
| status | string | 否 | `ENABLED` / `DISABLED` |
| page | long | 否 | 默认 1 |
| size | long | 否 | 默认 20，上限 100 |

`AdminUserVO` 字段：

```json
{
  "userId": 12,
  "email": "alice@example.com",
  "roleId": 1,
  "role": "USER",
  "roleName": "普通用户",
  "status": "ENABLED",
  "nickname": "Alice",
  "avatar": "/uploads/avatar/xxx.png",
  "createdAt": "2026-04-20T15:00:00",
  "updatedAt": "2026-05-01T10:30:00"
}
```

> `role` 是角色 code（USER / ADMIN），`roleName` 是 `sys_role.name` 的中文显示。
> 修改角色时仍按 code 传入（见 3.4），后端会查表换算为 `role_id` 写库。

### 3.2 用户总览（顶部统计卡片）

`GET /api/admin/users/overview`

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "total": 128,
    "enabled": 120,
    "disabled": 8,
    "admins": 2
  }
}
```

### 3.3 用户详情

`GET /api/admin/users/{userId}` → `AdminUserVO`。

### 3.4 修改角色 / 状态 / 昵称

`PUT /api/admin/users/{userId}`

请求体（任意字段都可省略，省略表示不修改）：

```json
{ "role": "ADMIN", "status": "ENABLED", "nickname": "新昵称" }
```

约束：
- `role` 必须是 `sys_role.code` 中存在的取值（默认有 `USER` / `ADMIN`）；不能把自己改成非 ADMIN 角色。
- `status` 仅允许 `ENABLED` / `DISABLED`；不能停用自己。
- `nickname` 长度 1-32。

返回更新后的 `AdminUserVO`。

### 3.5 启停账号（便捷接口）

`PUT /api/admin/users/{userId}/status?status=DISABLED`

等价于 3.4 仅传 `status`。

### 3.6 重置密码

`PUT /api/admin/users/{userId}/password`

```json
{ "newPassword": "新密码1234" }
```

约束：长度 6-32。成功返回 `data: "密码已重置"`。

### 3.7 删除用户

`DELETE /api/admin/users/{userId}`

> 物理删除。建议优先用 3.5 停用账号，仅在清理测试账号时使用。
> 不能删除自己。

### 3.8 角色字典

`GET /api/admin/roles`

返回 `sys_role` 全表，供前端「修改角色」下拉框使用。

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    { "id": 1, "code": "USER",  "name": "普通用户", "description": "..." },
    { "id": 2, "code": "ADMIN", "name": "管理员",   "description": "..." }
  ]
}
```

---

## 4. 励志短句管理

### 4.1 公开接口（前台首页用）

`GET /api/quotes/today` 与 `GET /api/quotes/random`：返回一条随机已启用短句，**无需登录**。

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": 12,
    "content": "今天哪怕只前进一小步，也是值得肯定的事。",
    "author": "MentalHealth",
    "status": "ENABLED",
    "sortOrder": 0,
    "createdAt": "2026-05-05T01:00:00",
    "updatedAt": "2026-05-05T01:00:00"
  }
}
```

库中无可用短句时会返回内置兜底文案，`id=0`。

### 4.2 管理员分页查询

`GET /api/admin/quotes`

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| keyword | string | 模糊匹配 content / author |
| status | string | `ENABLED` / `DISABLED` |
| page | long | 默认 1 |
| size | long | 默认 20 |

返回 `PageResult<MotivationalQuoteVO>`。

### 4.3 详情

`GET /api/admin/quotes/{id}` → `MotivationalQuoteVO`。

### 4.4 新建

`POST /api/admin/quotes`

```json
{
  "content": "今天哪怕只前进一小步，也是值得肯定的事。",
  "author": "MentalHealth",
  "status": "ENABLED",
  "sortOrder": 10
}
```

约束：`content` 必填且不超过 500；`author` 可空，不超过 100；`status` 默认 `ENABLED`；`sortOrder` 默认 0。

返回创建后的 `MotivationalQuoteVO`。

### 4.5 更新

`PUT /api/admin/quotes/{id}`

请求体字段全部可选；为空字段表示不修改。

```json
{ "status": "DISABLED" }
```

返回更新后的 `MotivationalQuoteVO`。

### 4.6 删除

`DELETE /api/admin/quotes/{id}`

---

## 5. 高风险用户

### 5.1 列表

`GET /api/admin/risk-users`

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| days | int | 否 | 统计窗口，默认 14；仅允许 7 / 14 / 30 |
| level | string | 否 | `HIGH` / `MEDIUM` / `LOW`；不传返回全部命中 |
| limit | int | 否 | 默认 50，上限 100 |

风险等级判定规则（默认窗口 14 天）：

| 等级 | 判定 |
| --- | --- |
| HIGH | 窗口内任意一篇日记 `mood_score <= 2` |
| MEDIUM | 平均分 ≤ 4 且日记数 ≥ 3 |
| LOW | 平均分 ≤ 5 且日记数 ≥ 3 |

`RiskUserVO` 字段：

```json
{
  "userId": 18,
  "email": "bob@example.com",
  "nickname": "Bob",
  "avatar": "/uploads/avatar/yyy.png",
  "level": "HIGH",
  "averageScore": 3.2,
  "minScore": 1,
  "diaryCount": 6,
  "lastDiaryAt": "2026-05-04T22:18:00",
  "reason": "出现极端低分（最低 1 分），共 6 篇日记，平均 3.2 分"
}
```

返回结果先按 `level`（HIGH > MEDIUM > LOW）排序，再按 `averageScore` 升序，最后按 `minScore` 升序。前端可直接拿来铺列表。

---

## 6. 接口清单速查

| 模块 | Method | 路径 | 权限 |
| --- | --- | --- | --- |
| 知识文档 | GET | /api/admin/knowledge | ADMIN |
| 知识文档 | GET | /api/admin/knowledge/{id} | ADMIN |
| 知识文档 | POST | /api/admin/knowledge | ADMIN |
| 知识文档 | PUT | /api/admin/knowledge/{id} | ADMIN |
| 知识文档 | DELETE | /api/admin/knowledge/{id} | ADMIN |
| 知识文档 | POST | /api/admin/knowledge/reindex | ADMIN |
| 用户管理 | GET | /api/admin/users | ADMIN |
| 用户管理 | GET | /api/admin/users/overview | ADMIN |
| 用户管理 | GET | /api/admin/users/{userId} | ADMIN |
| 用户管理 | PUT | /api/admin/users/{userId} | ADMIN |
| 用户管理 | PUT | /api/admin/users/{userId}/status | ADMIN |
| 用户管理 | PUT | /api/admin/users/{userId}/password | ADMIN |
| 用户管理 | DELETE | /api/admin/users/{userId} | ADMIN |
| 角色字典 | GET | /api/admin/roles | ADMIN |
| 励志短句 | GET | /api/admin/quotes | ADMIN |
| 励志短句 | GET | /api/admin/quotes/{id} | ADMIN |
| 励志短句 | POST | /api/admin/quotes | ADMIN |
| 励志短句 | PUT | /api/admin/quotes/{id} | ADMIN |
| 励志短句 | DELETE | /api/admin/quotes/{id} | ADMIN |
| 励志短句（公开） | GET | /api/quotes/today | 公开 |
| 励志短句（公开） | GET | /api/quotes/random | 公开 |
| 高风险用户 | GET | /api/admin/risk-users | ADMIN |

---

## 7. 配置项

`backend/src/main/resources/application.properties` 新增：

```properties
ai-service.reindex-path=${AI_SERVICE_REINDEX_PATH:/internal/v1/rag/reindex}
ai-service.knowledge-dir=${AI_SERVICE_KNOWLEDGE_DIR:../ai-service/knowledge/docs}
```

如部署时 `backend` 与 `ai-service` 不在同机/不同目录，请显式配置 `ai-service.knowledge-dir` 为绝对路径。

`ai-service` 一侧若开启了 `ai_service_internal_token`，请让 backend 的 `ai-service.internal-token` 与之保持一致。

---

## 8. cURL 速查

```bash
# 1. 登录拿 token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"xxxxxx"}'

# 2. 拿到 token 后
TOKEN="..."

# 3. 用户列表
curl "http://localhost:8080/api/admin/users?page=1&size=20" -H "Authorization: Bearer $TOKEN"

# 4. 停用某账号
curl -X PUT "http://localhost:8080/api/admin/users/12/status?status=DISABLED" -H "Authorization: Bearer $TOKEN"

# 5. 创建知识文档
curl -X POST http://localhost:8080/api/admin/knowledge \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"id":"daily-routine","content":"# 每日例行\n\n..."}'

# 6. 重建 RAG 索引
curl -X POST http://localhost:8080/api/admin/knowledge/reindex -H "Authorization: Bearer $TOKEN"

# 7. 添加首页短句
curl -X POST http://localhost:8080/api/admin/quotes \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"content":"愿你慢一点，也能抵达想去的地方。","author":"匿名","status":"ENABLED","sortOrder":1}'

# 8. 高风险用户
curl "http://localhost:8080/api/admin/risk-users?days=14&limit=20" -H "Authorization: Bearer $TOKEN"
```

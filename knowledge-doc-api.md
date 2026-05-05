# 知识文档管理 API 文档

> 版本：v2（2026-05-06）
> 适用：心理健康系统 backend 模块
> 存储：MySQL `knowledge_doc` 表（替代原文件系统方案）
> 管理路径前缀：`/api/admin/knowledge`（需 ADMIN 权限）
> 内部路径前缀：`/api/internal/knowledge`（供 ai-service 调用，无需 JWT）
> 鉴权：管理员接口要求 `Authorization: Bearer <JWT>` 且 `role=ADMIN`；内部接口通过 `X-Internal-Token` 鉴权。

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
  - 400：参数/业务校验失败（如 docKey 重复、内容为空）
  - 401：未登录或 token 失效
  - 403：无管理员权限
  - 404：文档不存在
  - 502 / 503：调用 ai-service 异常

### 1.2 分页响应

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "total": 73,
    "page": 1,
    "size": 20,
    "records": [ ... ]
  }
}
```

### 1.3 数据库迁移

新增表见 `backend/src/main/resources/db/migration/V20260506_03__knowledge_doc.sql`：

```sql
CREATE TABLE knowledge_doc (
    id         BIGINT        PRIMARY KEY AUTO_INCREMENT,
    doc_key    VARCHAR(100)  NOT NULL COMMENT '文档标识',
    title      VARCHAR(200)  NOT NULL DEFAULT '',
    content    MEDIUMTEXT    NOT NULL,
    category   VARCHAR(50)   NOT NULL DEFAULT 'general',
    created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_knowledge_doc_key (doc_key)
);
```

### 1.4 与旧版的差异

| 对比项 | v1（文件系统） | v2（MySQL） |
| --- | --- | --- |
| 存储介质 | `ai-service/knowledge/docs/*.md` 物理文件 | MySQL `knowledge_doc` 表 |
| 文档标识 | `id`（String，即文件名） | `id`（Long，自增主键）+ `docKey`（String，唯一标识） |
| ai-service 读取方式 | 扫描本地目录 | HTTP 调用 `GET /api/internal/knowledge/docs` |
| 配置依赖 | `ai-service.knowledge-dir` 须指向同机目录 | `BACKEND_DOCS_URL` 指向后端地址即可，支持跨机部署 |

---

## 2. 管理员接口

### 2.1 分页查询

`GET /api/admin/knowledge`

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| keyword | string | 否 | 模糊匹配 `doc_key` / `title` |
| page | long | 否 | 默认 1 |
| size | long | 否 | 默认 20，上限 100 |

响应：`PageResult<KnowledgeDocVO>`，列表项 `content` 为 `null`，仅含元信息：

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "total": 73,
    "page": 1,
    "size": 20,
    "records": [
      {
        "id": 1,
        "docKey": "anxiety-coping",
        "title": "焦虑应对的十个练习",
        "category": "emotions",
        "createdAt": "2026-05-04T23:47:00",
        "updatedAt": "2026-05-06T01:20:00",
        "content": null
      }
    ]
  }
}
```

### 2.2 文档详情

`GET /api/admin/knowledge/{id}`

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| id | Long（路径） | 文档主键 |

返回 `KnowledgeDocVO`，包含完整 markdown 内容：

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": 1,
    "docKey": "anxiety-coping",
    "title": "焦虑应对的十个练习",
    "category": "emotions",
    "createdAt": "2026-05-04T23:47:00",
    "updatedAt": "2026-05-06T01:20:00",
    "content": "# 焦虑应对的十个练习\n\n焦虑是一种常见的情绪反应……"
  }
}
```

文档不存在时返回 `code=404`。

### 2.3 新建文档

`POST /api/admin/knowledge`

请求体：

```json
{
  "docKey": "self-care-routines",
  "category": "habits",
  "content": "# 自我关怀的小练习\n\n..."
}
```

| 字段 | 类型 | 必填 | 约束 |
| --- | --- | --- | --- |
| docKey | string | 是 | 长度 1-100，只能包含 `A-Z a-z 0-9 _ -`，不可与已有文档重复 |
| category | string | 否 | 知识分类，不传则默认 `general`；可用值见下方分类表 |
| content | string | 是 | Markdown 全文，最长 100000 字符 |

`title` 字段由后端自动从 `content` 首行 `#` 标题中提取，无需手动传入。

返回创建后的 `KnowledgeDocVO`（含 content）。

**知识分类参考值**：

| category | 说明 |
| --- | --- |
| `foundations` | 基础理论与方法（CBT、ACT、正念等） |
| `emotions` | 情绪与症状自助（焦虑、抑郁、孤独等） |
| `habits` | 行为与习惯（睡眠、运动、拖延等） |
| `relationships` | 关系与沟通 |
| `work-life` | 学业/工作/财务压力 |
| `self-identity` | 自我与身份 |
| `trauma-care` | 创伤、慢病与专业资源 |
| `general` | 未分类（默认） |

### 2.4 更新文档

`PUT /api/admin/knowledge/{id}`

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| id | Long（路径） | 文档主键 |

请求体：

```json
{
  "content": "# 更新后的标题\n\n更新后的内容……",
  "category": "emotions"
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| content | string | 是 | 新的 Markdown 全文 |
| category | string | 否 | 不传则保持原值 |

`title` 自动从新 `content` 提取。`docKey` 不可修改。

返回更新后的 `KnowledgeDocVO`。

### 2.5 删除文档

`DELETE /api/admin/knowledge/{id}`

成功返回：

```json
{ "code": 200, "msg": "success", "data": "删除成功" }
```

文档不存在时返回 `code=404`。

### 2.6 重建索引

`POST /api/admin/knowledge/reindex`

调用 ai-service `/internal/v1/rag/reindex`，触发 RAG 索引全量重建。ai-service 会通过内部接口拉取最新的全量文档进行切分和向量化。

成功响应：

```json
{ "code": 200, "msg": "success", "data": { "chunkCount": 1234 } }
```

ai-service 不可达或处理失败时返回 `code=502` 或 `code=503`。

> 建议：在批量新增/修改/删除文档后统一调用一次即可，无需每次操作后都触发。

---

## 3. 内部接口（供 ai-service 调用）

### 3.1 获取全量知识文档

`GET /api/internal/knowledge/docs`

**用途**：ai-service 在构建/重建 RAG 索引时调用此接口，从 MySQL 拉取全部知识文档内容。

**鉴权**：通过请求头 `X-Internal-Token` 校验。若后端未配置 `ai-service.internal-token`（值为空），则跳过校验。

| 请求头 | 说明 |
| --- | --- |
| X-Internal-Token | 与 `ai-service.internal-token` 配置值一致 |

**响应**：直接返回 JSON 数组（无 `Result` 包装），每个元素代表一篇知识文档：

```json
[
  {
    "docKey": "anxiety-coping",
    "title": "焦虑应对的十个练习",
    "content": "# 焦虑应对的十个练习\n\n焦虑是一种常见的情绪反应……",
    "category": "emotions"
  },
  {
    "docKey": "sleep-hygiene",
    "title": "睡眠卫生指南",
    "content": "# 睡眠卫生指南\n\n良好的睡眠……",
    "category": "habits"
  }
]
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| docKey | string | 文档标识 |
| title | string | 文档标题 |
| content | string | Markdown 全文内容 |
| category | string | 知识分类 |

Token 校验失败时返回 HTTP 401。

---

## 4. 数据模型

### 4.1 knowledge_doc 表

| 列名 | 类型 | 说明 |
| --- | --- | --- |
| id | BIGINT (PK) | 自增主键 |
| doc_key | VARCHAR(100) | 文档标识，唯一索引 |
| title | VARCHAR(200) | 标题（自动提取） |
| content | MEDIUMTEXT | Markdown 全文 |
| category | VARCHAR(50) | 知识分类，默认 `general` |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间（自动维护） |

### 4.2 KnowledgeDocVO

```json
{
  "id": 1,
  "docKey": "anxiety-coping",
  "title": "焦虑应对的十个练习",
  "category": "emotions",
  "createdAt": "2026-05-04T23:47:00",
  "updatedAt": "2026-05-06T01:20:00",
  "content": "# 焦虑应对的十个练习\n\n..."
}
```

> 列表接口中 `content` 为 `null`，详情接口中返回完整内容。

### 4.3 KnowledgeDocSaveDTO

```json
{
  "docKey": "self-care-routines",
  "category": "habits",
  "content": "# 自我关怀的小练习\n\n..."
}
```

| 字段 | 创建时 | 更新时 | 约束 |
| --- | --- | --- | --- |
| docKey | 必填 | 忽略 | `^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$` |
| category | 可选 | 可选 | 最长 50 字符 |
| content | 必填 | 必填 | 非空，最长 100000 字符 |

---

## 5. 接口清单速查

| 用途 | Method | 路径 | 权限 |
| --- | --- | --- | --- |
| 分页查询 | GET | /api/admin/knowledge | ADMIN |
| 文档详情 | GET | /api/admin/knowledge/{id} | ADMIN |
| 新建文档 | POST | /api/admin/knowledge | ADMIN |
| 更新文档 | PUT | /api/admin/knowledge/{id} | ADMIN |
| 删除文档 | DELETE | /api/admin/knowledge/{id} | ADMIN |
| 重建索引 | POST | /api/admin/knowledge/reindex | ADMIN |
| 全量拉取（内部） | GET | /api/internal/knowledge/docs | X-Internal-Token |

---

## 6. 配置项

### 6.1 后端 application.properties

```properties
# ai-service 重建索引接口路径
ai-service.reindex-path=${AI_SERVICE_REINDEX_PATH:/internal/v1/rag/reindex}
# 内部鉴权 token（与 ai-service 共享，留空则跳过校验）
ai-service.internal-token=${AI_SERVICE_INTERNAL_TOKEN:}
```

> 旧版 `ai-service.knowledge-dir` 已移除，不再需要后端与 ai-service 共享文件目录。

### 6.2 ai-service .env

```bash
# 后端知识文档 HTTP 数据源（从 MySQL 拉取）
BACKEND_DOCS_URL=http://localhost:8080/api/internal/knowledge/docs
# 与后端 ai-service.internal-token 保持一致
AI_SERVICE_INTERNAL_TOKEN=
```

ai-service 在构建/重建 RAG 索引时：
1. 优先调用 `BACKEND_DOCS_URL` 从后端 MySQL 获取全量文档
2. 如果 HTTP 调用失败，回退到扫描本地 `knowledge/docs/*.md` 文件

---

## 7. 架构说明

### 7.1 数据流

```
管理员（前端）
    │
    ▼ CRUD
后端 /api/admin/knowledge  ──────►  MySQL knowledge_doc 表
    │
    │ POST /reindex
    ▼
ai-service /internal/v1/rag/reindex
    │
    │ GET /api/internal/knowledge/docs
    ▼
后端返回全量文档 ──► ai-service 切分 + 嵌入 ──► 向量索引（Qdrant / FAISS）
                                                + BM25 索引
```

### 7.2 索引重建触发时机

- 管理员通过前端手动点击「重建索引」按钮
- 建议在批量操作后统一触发一次，避免频繁重建

---

## 8. cURL 速查

```bash
# 0. 登录拿 token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"xxxxxx"}' | jq -r '.data.token')

# 1. 分页查询
curl "http://localhost:8080/api/admin/knowledge?page=1&size=20" \
  -H "Authorization: Bearer $TOKEN"

# 2. 关键字搜索
curl "http://localhost:8080/api/admin/knowledge?keyword=焦虑" \
  -H "Authorization: Bearer $TOKEN"

# 3. 查看详情
curl "http://localhost:8080/api/admin/knowledge/1" \
  -H "Authorization: Bearer $TOKEN"

# 4. 新建文档
curl -X POST http://localhost:8080/api/admin/knowledge \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "docKey": "daily-routine",
    "category": "habits",
    "content": "# 每日例行\n\n建立健康的每日例行……"
  }'

# 5. 更新文档
curl -X PUT http://localhost:8080/api/admin/knowledge/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "# 更新后的标题\n\n更新后的内容……"}'

# 6. 删除文档
curl -X DELETE http://localhost:8080/api/admin/knowledge/1 \
  -H "Authorization: Bearer $TOKEN"

# 7. 重建 RAG 索引
curl -X POST http://localhost:8080/api/admin/knowledge/reindex \
  -H "Authorization: Bearer $TOKEN"

# 8. 内部接口 - ai-service 拉取全量文档
curl "http://localhost:8080/api/internal/knowledge/docs" \
  -H "X-Internal-Token: your_token_here"
```

---

## 9. 数据迁移（从文件系统导入 MySQL）

如果需要将现有 `ai-service/knowledge/docs/*.md` 文件导入到 MySQL，可通过管理员接口逐个创建：

```bash
# 遍历所有 .md 文件并导入
for f in ../ai-service/knowledge/docs/*.md; do
  KEY=$(basename "$f" .md)
  CONTENT=$(cat "$f" | jq -Rs .)
  curl -X POST http://localhost:8080/api/admin/knowledge \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"docKey\":\"$KEY\", \"content\":$CONTENT}"
  echo " -> imported $KEY"
done

# 导入完成后重建索引
curl -X POST http://localhost:8080/api/admin/knowledge/reindex \
  -H "Authorization: Bearer $TOKEN"
```

或者直接用 SQL 插入：

```sql
-- 示例：手动插入一篇文档
INSERT INTO knowledge_doc (doc_key, title, content, category)
VALUES ('anxiety-coping', '焦虑应对的十个练习', '# 焦虑应对的十个练习\n\n...', 'emotions');
```

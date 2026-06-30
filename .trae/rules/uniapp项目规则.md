# UniApp 项目开发规则

## 1. 飞书多维表格 API 使用规范

### 1.1 附件字段格式
- **附件字段**必须传对象数组格式：`[{ file_token: "xxx" }]`
- 错误示例：`avatar: fileTokenString` ❌
- 正确示例：`avatar: [{ file_token: fileTokenString }]` ✅
- 报错信息：`AttachFieldConvFail` - 表示附件字段格式错误

### 1.2 查询条件限制
- 查询条件**只支持** `is`（等于）操作符
- **不支持** `!=`（不等于）操作符
- 如需筛选不等于的数据，需要：
  1. 查询所有数据后在代码中过滤，或
  2. 查询其他状态的数据后合并结果
- 查询条件使用 JavaScript 对象，不是 JSON 字符串
  - 错误：`const filter = '{"review_status": "待审核"}'` ❌
  - 正确：`const filter = { review_status: '待审核' }` ✅

### 1.3 下拉选项值
- 飞书下拉选项使用**中文值**，不是英文
- 例如：`待审核`、`通过`、`拒绝`，不是 `pending`、`approved`、`rejected`
- 报错信息：`There is no option 'xxx' for the field 'xxx'` - 表示选项值不匹配

### 1.4 Text 字段格式
- 飞书返回的 text 字段格式为**对象数组**：`[{ text: "值" }]`
- 取值时需要处理：`item.fields.name?.[0]?.text || ''`
- child_id 字段也可能是对象数组格式，需要特殊处理

### 1.5 图片 URL 获取
- 附件图片的 `file_token` 需要通过 `getImageUrls` 批量获取真实 URL
- 不要直接拼接飞书内部 API URL
- 正确流程：
  1. 获取记录中的 `file_token`
  2. 调用 `feishuRequest.feishutools.getImageUrls({ fileTokens })`
  3. 使用返回的 `urlMap` 中的 URL

### 1.6 错误排查
- 飞书 API 错误包含 `log_id`，记录日志便于排查
- 错误码说明：
  - `1254018` (InvalidFilter): 查询条件格式错误或字段不存在
  - `1254069` (AttachFieldConvFail): 附件字段格式错误

## 2. 数据查询优化

### 2.1 请求参数筛选
- **优先**通过请求参数筛选数据，减少返回后过滤
- 示例：查询待审核记录时，使用 `{ review_status: '待审核' }` 作为 filter
- 避免一次性查询所有数据后在代码中过滤

### 2.2 并行查询
- 多个独立查询使用 `Promise.all` 并行执行
- 示例：同时查询任务表和打卡记录表

### 2.3 数据排序
- 前端排序使用 `sort((a, b) => new Date(b.created_time) - new Date(a.created_time))`
- 时间倒序排列：最新的数据排在最前面

## 3. Vue/UniApp 组件规范

### 3.1 ImageUploader 组件
- 使用 `:value` 和 `@input` 进行双向绑定
- 不要直接使用 `v-model`
- 示例：
  ```vue
  <ImageUploader 
    :value="avatarFiles" 
    @input="handleAvatarChange"
  />
  ```

### 3.2 异步上传处理
- 图片上传使用 `await Promise.all` 等待所有上传完成
- 避免直接赋值 Promise 数组
- 正确示例：
  ```javascript
  const newFiles = await Promise.all(
    res.tempFiles.map(async (file) => {
      // 上传逻辑
      return { fileToken, url }
    })
  )
  ```

### 3.3 组件数据引用
- 组件内部数据使用 `this.localFiles`，不是 `this.files`
- 确保数据引用正确，避免预览不显示的问题

## 4. 页面状态管理

### 4.1 审核操作后刷新
- 审核通过/拒绝后，调用 `this.loadCheckins()` 刷新列表数据
- 不要只从本地数组移除数据，确保数据一致性

### 4.2 状态切换
- 切换筛选状态时，重新加载对应状态的数据
- 避免重复加载相同状态的数据（添加状态判断）

### 4.3 Loading 状态
- 数据加载时显示 `uni.showLoading({ title: '加载中...' })`
- 加载完成后调用 `uni.hideLoading()`
- 使用 `try...finally` 确保 loading 一定关闭

## 5. 数据格式处理

### 5.1 时间格式化
- 使用 `formatTime` 方法格式化时间戳
- 显示规则：
  - 当天："今天 HH:mm"
  - 昨天："昨天 HH:mm"
  - 其他："M月D日 HH:mm"

### 5.2 空值处理
- 对可能为空的字段添加默认值
- 使用可选链操作符 `?.` 避免报错
- 示例：`item.fields.content?.[0]?.text || ''`

### 5.3 child_id 处理
- child_id 可能是字符串、对象数组或复杂对象
- 统一处理为字符串：
  ```javascript
  let childId = item.fields.child_id || ''
  if (Array.isArray(childId) && childId[0] && childId[0].text) {
    childId = childId[0].text
  }
  childId = String(childId).trim()
  ```

## 6. 积分记录添加

### 6.1 审核通过后添加积分
- 审核通过时，在积分记录表添加一条记录
- 积分记录字段：
  - `child_id`: 儿童ID
  - `type`: '挣得'（积分类型）
  - `description`: 描述信息（如 "完成任务: xxx"）
  - `created_time`: 当前时间戳
  - `base_points`: 基础积分
  - `reward_points`: 奖励积分

### 6.2 积分与金币字段映射
- **积分**：使用字段 `base_points`
- **金币**：使用字段 `reward_points`
- 后续开发中涉及积分和金币的展示、计算、存储均使用上述字段

## 7. 模块化规范

### 7.1 云函数拆分
- 大型云函数按功能拆分为模块
- 例如：`bitable.js`（表格操作）、`wiki.js`（知识库）、`media.js`（媒体文件）
- 主文件统一导入并导出所有方法

### 7.2 公共方法封装
- 通用的 API 请求封装在 `feishu-request.js` 中
- 用户相关操作封装在 `user-manager.js` 中
- 避免在页面中直接调用云函数，统一通过封装方法调用

### 需要修改代码的地方 先读取一下现有代码，确保理解其功能，再继续修改，不要把已经修改好了的代码再重新写成之前的错误的代码逻辑

## 8. 修改规范

### 8.1 修改前必须读取文件
- 修改任何文件前，必须先使用 Read 工具读取最新的文件内容
- 确保理解当前代码逻辑后再进行修改
- 不要凭记忆或假设修改代码

### 8.2 不要覆盖已正确的代码
- 如果用户反馈某段代码已经修改正确，不要再次修改这段代码
- 不要把已经修改好了的代码重新写成之前的错误逻辑
- 修改前仔细对比当前代码与用户描述是否一致

### 8.3 最小化修改原则
- 只修改必要的部分，不要进行不必要的重构或格式化
- 保持原有代码风格和结构
- 避免引入新的问题

### 8.4 Coze代码节点参数读取规范
- `components/abc.js` 中的参数直接从 `params` 读取，不需要 `params.input`
- 正确方式：`params.feishuConfig`、`params.userInfo`、`params.content`
- 错误方式：`params.input.feishuConfig`、`params.input.userInfo`、`params.input.content`

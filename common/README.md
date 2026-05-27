# 飞书数据请求工具使用说明

## 概述

飞书数据请求工具（`feishu-request.js`）是一个基于飞书多维表格API的数据操作工具，支持根据配置发送请求到对应的数据表，实现数据的增删改查操作。

## 文件说明

### 1. feishu-request.js
核心请求工具类，提供以下功能：
- 查询记录（支持过滤条件）
- 查询单条记录
- 查询记录是否存在
- 添加记录
- 更新记录
- 删除记录
- 批量添加记录
- 用户注册或更新（先查询再添加）
- 用户登录验证

**Token 管理功能**：
- 自动缓存 AccessToken 到本地存储
- 自动检测 Token 过期并在过期前刷新
- Token 失效时自动重新获取并重试请求
- 支持提前60秒刷新，避免过期

### 2. table-config.js
数据表配置文件，定义了各个业务表与飞书多维表格的映射关系，包括：
- 用户表（USER）
- 儿童表（CHILD）
- 任务表（TASK）
- 打卡记录表（CHECKIN）
- 积分记录表（POINTS）
- 礼品表（REWARD）
- 兑换记录表（REDEEM）
- 学习进度表（LEARNING）

### 3. feishu-request-examples.js
使用示例文件，包含10个常用场景的示例代码。

## 前置条件

1. 在飞书多维表格配置页面配置好多维表格Token
2. 在飞书多维表格中创建相应的数据表
3. 确保数据表的表名与配置文件中定义的表名一致

## 基本使用

### 导入工具

```javascript
import { feishuRequest } from '@/common/feishu-request.js'
import { TABLE_CONFIG } from '@/common/table-config.js'
```

### 1. 用户注册或更新

```javascript
async function registerUser(phone, password, role) {
	try {
		const userData = {
			phone: phone,
			password: password,
			role: role,
			createdTime: new Date().toISOString(),
			updatedTime: new Date().toISOString()
		}

		const result = await feishuRequest.registerOrUpdateUser(userData)
		
		if (result.success) {
			console.log(result.message) // "用户注册成功" 或 "用户更新成功"
			console.log('记录ID:', result.recordId)
		}
		
		return result
	} catch (error) {
		console.error('注册失败:', error.message)
		throw error
	}
}
```

### 2. 用户登录验证

```javascript
async function loginUser(phone, password) {
	try {
		const result = await feishuRequest.validateUser(phone, password)
		
		if (result.success) {
			console.log('登录成功')
			console.log('用户信息:', result.user)
			// 保存用户信息到本地存储
			uni.setStorageSync('userInfo', result.user)
			return result.user
		} else {
			console.log('登录失败:', result.message)
			return null
		}
	} catch (error) {
		console.error('登录验证失败:', error.message)
		throw error
	}
}
```

### 3. 添加记录

```javascript
async function addChild(parentId, name, age, grade) {
	try {
		const childData = {
			parentId: parentId,
			name: name,
			age: age,
			grade: grade,
			points: 0,
			streakDays: 0,
			createdTime: new Date().toISOString(),
			updatedTime: new Date().toISOString()
		}

		const result = await feishuRequest.addRecord(TABLE_CONFIG.CHILD.name, childData)
		
		if (result.success) {
			console.log('添加成功，记录ID:', result.recordId)
		}
		
		return result
	} catch (error) {
		console.error('添加失败:', error.message)
		throw error
	}
}
```

### 4. 查询记录

```javascript
async function getChildren(parentId) {
	try {
		const result = await feishuRequest.queryRecords(
			TABLE_CONFIG.CHILD.name,
			{ parentId: parentId }
		)
		
		if (result.success) {
			console.log('查询成功，共', result.total, '条记录')
			console.log('儿童列表:', result.data)
			return result.data
		}
		
		return []
	} catch (error) {
		console.error('查询失败:', error.message)
		throw error
	}
}
```

### 5. 更新记录

```javascript
async function updateChildPoints(childId, points) {
	try {
		// 先查询获取记录ID
		const child = await feishuRequest.queryOne(TABLE_CONFIG.CHILD.name, { childId: childId })
		
		if (!child) {
			throw new Error('儿童不存在')
		}

		const updateData = {
			points: points,
			updatedTime: new Date().toISOString()
		}

		const result = await feishuRequest.updateRecord(
			TABLE_CONFIG.CHILD.name,
			child.record_id,
			updateData
		)
		
		if (result.success) {
			console.log('更新成功')
		}
		
		return result
	} catch (error) {
		console.error('更新失败:', error.message)
		throw error
	}
}
```

### 6. 删除记录

```javascript
async function deleteTask(taskId) {
	try {
		// 先查询获取记录ID
		const task = await feishuRequest.queryOne(TABLE_CONFIG.TASK.name, { taskId: taskId })
		
		if (!task) {
			throw new Error('任务不存在')
		}

		const result = await feishuRequest.deleteRecord(
			TABLE_CONFIG.TASK.name,
			task.record_id
		)
		
		if (result.success) {
			console.log('删除成功')
		}
		
		return result
	} catch (error) {
		console.error('删除失败:', error.message)
		throw error
	}
}
```

### 7. 批量添加记录

```javascript
async function batchAddTasks(parentId, childId, tasks) {
	try {
		const taskRecords = tasks.map(task => ({
			parentId: parentId,
			childId: childId,
			title: task.title,
			description: task.description,
			type: task.type,
			points: task.points,
			status: 'pending',
			createdTime: new Date().toISOString(),
			updatedTime: new Date().toISOString()
		}))

		const result = await feishuRequest.batchAddRecords(TABLE_CONFIG.TASK.name, taskRecords)
		
		if (result.success) {
			console.log('批量添加成功，共', result.records.length, '条记录')
		}
		
		return result
	} catch (error) {
		console.error('批量添加失败:', error.message)
		throw error
	}
}
```

## API参考

### feishuRequest.queryRecords(tableName, filter, options)
查询多条记录

**参数：**
- `tableName` (string): 表名
- `filter` (object): 过滤条件，格式: `{ field_name: value }`
- `options` (object): 查询选项
  - `pageSize` (number): 每页数量
  - `pageToken` (string): 分页令牌

**返回：**
```javascript
{
  success: true,
  data: [...], // 记录数组
  total: 10,   // 总数
  pageToken: '...', // 分页令牌
  hasMore: false // 是否还有更多
}
```

### feishuRequest.queryOne(tableName, filter)
查询单条记录

**参数：**
- `tableName` (string): 表名
- `filter` (object): 过滤条件

**返回：** 记录对象或null

### feishuRequest.exists(tableName, filter)
查询记录是否存在

**参数：**
- `tableName` (string): 表名
- `filter` (object): 过滤条件

**返回：** boolean

### feishuRequest.addRecord(tableName, data)
添加记录

**参数：**
- `tableName` (string): 表名
- `data` (object): 记录数据，格式: `{ field_name: value }`

**返回：**
```javascript
{
  success: true,
  recordId: '...',
  createdTime: 1234567890
}
```

### feishuRequest.updateRecord(tableName, recordId, data)
更新记录

**参数：**
- `tableName` (string): 表名
- `recordId` (string): 记录ID
- `data` (object): 更新数据

**返回：**
```javascript
{
  success: true,
  recordId: '...',
  updatedTime: 1234567890
}
```

### feishuRequest.deleteRecord(tableName, recordId)
删除记录

**参数：**
- `tableName` (string): 表名
- `recordId` (string): 记录ID

**返回：**
```javascript
{
  success: true,
  recordId: '...'
}
```

### feishuRequest.batchAddRecords(tableName, records)
批量添加记录

**参数：**
- `tableName` (string): 表名
- `records` (array): 记录数组

**返回：**
```javascript
{
  success: true,
  records: [...]
}
```

### feishuRequest.registerOrUpdateUser(userData)
用户注册或更新（先查询再添加）

**参数：**
- `userData` (object): 用户数据

**返回：**
```javascript
{
  success: true,
  action: 'create' | 'update', // 操作类型
  recordId: '...',
  message: '用户注册成功' | '用户更新成功'
}
```

### feishuRequest.validateUser(phone, password)
验证用户登录

**参数：**
- `phone` (string): 手机号
- `password` (string): 密码

**返回：**
```javascript
{
  success: true,
  user: {...}, // 用户信息
  recordId: '...',
  message: '登录成功'
}
```

## 注意事项

1. **表名匹配**：确保飞书多维表格中的表名与配置文件中定义的表名一致
2. **字段名称**：数据字段名称需要与飞书多维表格中的字段名称一致
3. **错误处理**：所有方法都可能抛出异常，建议使用try-catch进行错误处理
4. **异步操作**：所有方法都是异步的，需要使用async/await或Promise
5. **配置检查**：使用前确保已配置飞书多维表格Token
6. **权限问题**：确保飞书应用有足够的权限访问多维表格

**Token 管理说明**：
- Token 会自动缓存到本地存储，有效期内无需重复获取
- Token 会在有效期提前60秒时自动刷新
- 如果 Token 失效，会自动重新获取并重试一次当前请求
- 缓存的 Key 为 `feishu_access_token` 和 `feishu_token_expires_at`

## 扩展表配置

如需添加新的数据表，请在 `table-config.js` 中添加配置：

```javascript
export const TABLE_CONFIG = {
	// ... 现有配置
	
	// 新表配置
	NEW_TABLE: {
		name: '新表名称',
		description: '表描述',
		fields: {
			field1: '字段1说明',
			field2: '字段2说明'
		}
	}
}
```

## 示例代码

更多使用示例请参考 `feishu-request-examples.js` 文件。
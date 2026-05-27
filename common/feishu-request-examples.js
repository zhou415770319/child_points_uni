/**
 * 飞书数据请求工具使用示例
 * @description 展示如何使用feishuRequest工具进行数据操作
 */

import { feishuRequest } from './feishu-request.js'
import { TABLE_CONFIG } from './table-config.js'

/**
 * 示例1: 用户注册
 * 先查询用户是否存在，不存在则添加用户
 */
export async function registerUserExample() {
	try {
		const userData = {
			phone: '13800138000',
			password: '123456',
			secondPassword: '654321',
			role: 'parent',
			nickname: '张三',
			avatar: 'https://example.com/avatar.jpg',
			createdTime: new Date().toISOString(),
			updatedTime: new Date().toISOString()
		}

		console.log('开始用户注册...')
		const result = await feishuRequest.registerOrUpdateUser(userData)
		
		if (result.success) {
			console.log('操作成功:', result.message)
			console.log('操作类型:', result.action)
			console.log('记录ID:', result.recordId)
		}
		
		return result
	} catch (error) {
		console.error('用户注册失败:', error.message)
		throw error
	}
}

/**
 * 示例2: 用户登录验证
 */
export async function loginUserExample(phone, password) {
	try {
		console.log('开始用户登录验证...')
		const result = await feishuRequest.validateUser(phone, password)
		
		if (result.success) {
			console.log('登录成功')
			console.log('用户信息:', result.user)
		} else {
			console.log('登录失败:', result.message)
		}
		
		return result
	} catch (error) {
		console.error('登录验证失败:', error.message)
		throw error
	}
}

/**
 * 示例3: 添加儿童信息
 */
export async function addChildExample(parentId) {
	try {
		const childData = {
			parentId: parentId,
			name: '小明',
			avatar: '👦',
			age: 8,
			grade: '小学二年级',
			points: 0,
			streakDays: 0,
			createdTime: new Date().toISOString(),
			updatedTime: new Date().toISOString()
		}

		console.log('开始添加儿童信息...')
		const result = await feishuRequest.addRecord(TABLE_CONFIG.CHILD.name, childData)
		
		if (result.success) {
			console.log('添加成功，记录ID:', result.recordId)
		}
		
		return result
	} catch (error) {
		console.error('添加儿童信息失败:', error.message)
		throw error
	}
}

/**
 * 示例4: 查询儿童列表
 */
export async function getChildrenExample(parentId) {
	try {
		console.log('开始查询儿童列表...')
		const result = await feishuRequest.queryRecords(
			TABLE_CONFIG.CHILD.name,
			{ parentId: parentId }
		)
		
		if (result.success) {
			console.log('查询成功，共', result.total, '条记录')
			console.log('儿童列表:', result.data)
		}
		
		return result
	} catch (error) {
		console.error('查询儿童列表失败:', error.message)
		throw error
	}
}

/**
 * 示例5: 添加任务
 */
export async function addTaskExample(parentId, childId) {
	try {
		const taskData = {
			parentId: parentId,
			childId: childId,
			title: '语文阅读30分钟',
			description: '阅读语文课本第10-15页',
			type: 'reading',
			points: 10,
			status: 'pending',
			createdTime: new Date().toISOString(),
			updatedTime: new Date().toISOString()
		}

		console.log('开始添加任务...')
		const result = await feishuRequest.addRecord(TABLE_CONFIG.TASK.name, taskData)
		
		if (result.success) {
			console.log('添加成功，记录ID:', result.recordId)
		}
		
		return result
	} catch (error) {
		console.error('添加任务失败:', error.message)
		throw error
	}
}

/**
 * 示例6: 更新任务状态
 */
export async function updateTaskStatusExample(taskId, status) {
	try {
		const updateData = {
			status: status,
			updatedTime: new Date().toISOString()
		}

		console.log('开始更新任务状态...')
		const result = await feishuRequest.updateRecord(
			TABLE_CONFIG.TASK.name,
			taskId,
			updateData
		)
		
		if (result.success) {
			console.log('更新成功')
		}
		
		return result
	} catch (error) {
		console.error('更新任务状态失败:', error.message)
		throw error
	}
}

/**
 * 示例7: 添加积分记录
 */
export async function addPointsExample(childId, amount, reason) {
	try {
		const pointsData = {
			childId: childId,
			type: 'earn',
			amount: amount,
			reason: reason,
			createdTime: new Date().toISOString()
		}

		console.log('开始添加积分记录...')
		const result = await feishuRequest.addRecord(TABLE_CONFIG.POINTS.name, pointsData)
		
		if (result.success) {
			console.log('添加成功，记录ID:', result.recordId)
		}
		
		return result
	} catch (error) {
		console.error('添加积分记录失败:', error.message)
		throw error
	}
}

/**
 * 示例8: 查询积分记录
 */
export async function getPointsHistoryExample(childId) {
	try {
		console.log('开始查询积分记录...')
		const result = await feishuRequest.queryRecords(
			TABLE_CONFIG.POINTS.name,
			{ childId: childId },
			{ pageSize: 20 }
		)
		
		if (result.success) {
			console.log('查询成功，共', result.total, '条记录')
			console.log('积分记录:', result.data)
		}
		
		return result
	} catch (error) {
		console.error('查询积分记录失败:', error.message)
		throw error
	}
}

/**
 * 示例9: 批量添加礼品
 */
export async function batchAddRewardsExample() {
	try {
		const rewards = [
			{
				name: '糖果礼包',
				description: '美味糖果',
				icon: '🍬',
				price: 100,
				stock: 50,
				createdTime: new Date().toISOString(),
				updatedTime: new Date().toISOString()
			},
			{
				name: '卡通贴纸',
				description: '可爱贴纸',
				icon: '🎨',
				price: 50,
				stock: 100,
				createdTime: new Date().toISOString(),
				updatedTime: new Date().toISOString()
			},
			{
				name: '小玩具',
				description: '益智玩具',
				icon: '🧩',
				price: 200,
				stock: 30,
				createdTime: new Date().toISOString(),
				updatedTime: new Date().toISOString()
			}
		]

		console.log('开始批量添加礼品...')
		const result = await feishuRequest.batchAddRecords(TABLE_CONFIG.REWARD.name, rewards)
		
		if (result.success) {
			console.log('批量添加成功，共', result.records.length, '条记录')
		}
		
		return result
	} catch (error) {
		console.error('批量添加礼品失败:', error.message)
		throw error
	}
}

/**
 * 示例10: 删除记录
 */
export async function deleteRecordExample(tableName, recordId) {
	try {
		console.log('开始删除记录...')
		const result = await feishuRequest.deleteRecord(tableName, recordId)
		
		if (result.success) {
			console.log('删除成功')
		}
		
		return result
	} catch (error) {
		console.error('删除记录失败:', error.message)
		throw error
	}
}
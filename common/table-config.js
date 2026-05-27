/**
 * 飞书数据表配置
 * @description 定义各个业务表与飞书多维表格的映射关系
 */

export const TABLE_CONFIG = {
	// 用户表
	USER: {
		name: '用户',
		description: '存储用户基本信息',
		fields: {
			phone: '手机号',
			password: '密码',
			secondPassword: '二级密码',
			role: '角色(parent/child)',
			nickname: '昵称',
			avatar: '头像',
			createdTime: '创建时间',
			updatedTime: '更新时间'
		}
	},
	
	// 儿童表
	CHILD: {
		name: '儿童',
		description: '存储儿童信息',
		fields: {
			parentId: '家长ID',
			name: '姓名',
			avatar: '头像',
			age: '年龄',
			grade: '年级',
			points: '积分',
			streakDays: '连续打卡天数',
			createdTime: '创建时间',
			updatedTime: '更新时间'
		}
	},
	
	// 任务表
	TASK: {
		name: '任务',
		description: '存储任务信息',
		fields: {
			parentId: '家长ID',
			childId: '儿童ID',
			title: '任务标题',
			description: '任务描述',
			type: '任务类型(reading/math/english/art/sports)',
			points: '积分奖励',
			status: '状态(pending/completed)',
			createdTime: '创建时间',
			updatedTime: '更新时间'
		}
	},
	
	// 打卡记录表
	CHECKIN: {
		name: '打卡记录',
		description: '存储打卡记录',
		fields: {
			taskId: '任务ID',
			childId: '儿童ID',
			status: '状态(pending/approved/rejected)',
			evidence: '打卡凭证',
			points: '获得积分',
			createdTime: '打卡时间',
			updatedTime: '更新时间'
		}
	},
	
	// 积分记录表
	POINTS: {
		name: '积分记录',
		description: '存储积分变动记录',
		fields: {
			childId: '儿童ID',
			type: '类型(earn/spend)',
			amount: '积分数量',
			reason: '原因',
			createdTime: '创建时间'
		}
	},
	
	// 礼品表
	REWARD: {
		name: '礼品',
		description: '存储礼品信息',
		fields: {
			name: '礼品名称',
			description: '礼品描述',
			icon: '图标',
			price: '所需积分',
			stock: '库存',
			createdTime: '创建时间',
			updatedTime: '更新时间'
		}
	},
	
	// 兑换记录表
	REDEEM: {
		name: '兑换记录',
		description: '存储礼品兑换记录',
		fields: {
			childId: '儿童ID',
			rewardId: '礼品ID',
			points: '消耗积分',
			status: '状态(pending/completed)',
			createdTime: '创建时间',
			updatedTime: '更新时间'
		}
	},
	
	// 学习进度表
	LEARNING: {
		name: '学习进度',
		description: '存储学习进度信息',
		fields: {
			childId: '儿童ID',
			bookName: '教材名称',
			progress: '进度百分比',
			createdTime: '创建时间',
			updatedTime: '更新时间'
		}
	}
}

/**
 * 获取表配置
 * @param {string} tableName - 表名
 * @returns {Object|null} 表配置
 */
export function getTableConfig(tableName) {
	for (const key in TABLE_CONFIG) {
		if (TABLE_CONFIG[key].name === tableName) {
			return TABLE_CONFIG[key]
		}
	}
	return null
}

/**
 * 获取所有表名列表
 * @returns {Array} 表名列表
 */
export function getAllTableNames() {
	return Object.values(TABLE_CONFIG).map(config => config.name)
}
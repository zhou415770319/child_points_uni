/**
 * 飞书数据请求工具
 * @description 根据多维表格配置，发送请求到对应的数据表
 * 支持查询、添加、更新、删除等操作
 */

import { feishuApi } from '@/uni_modules/settings-feishu-dataBase/src/utils/feishu-api.js'

class FeishuRequest {
	constructor() {
		this.feishutools = null
		this.baseToken = null
		this.accessToken = null
		this.tokenExpiresAt = null
		this.tokenCacheKey = 'feishu_access_token'
		this.tokenExpireKey = 'feishu_token_expires_at'
	}

	/**
	 * 初始化云对象
	 * @private
	 */
	async initCloudObject() {
		if (!this.feishutools) {
			this.feishutools = uniCloud.importObject('feishutools')
		}
	}

	/**
	 * 获取配置
	 * @private
	 */
	getConfig() {
		const config = feishuApi.getConfig()
		if (!config || !config.baseToken) {
			throw new Error('飞书配置未设置，请先配置多维表格Token')
		}
		this.baseToken = config.baseToken
		return config
	}

	/**
	 * 从缓存中获取访问令牌
	 * @private
	 */
	getAccessTokenFromCache() {
		try {
			const accessToken = uni.getStorageSync(this.tokenCacheKey)
			const expiresAt = uni.getStorageSync(this.tokenExpireKey)
			
			if (accessToken && expiresAt && Date.now() < expiresAt - 60000) {
				console.log('[FeishuRequest] 从缓存中获取AccessToken成功')
				this.accessToken = accessToken
				this.tokenExpiresAt = expiresAt
				return accessToken
			}
		} catch (e) {
			console.warn('[FeishuRequest] 读取缓存失败', e)
		}
		return null
	}

	/**
	 * 缓存访问令牌
	 * @private
	 */
	saveAccessTokenToCache(accessToken, expiresIn) {
		try {
			const expiresAt = Date.now() + expiresIn * 1000
			uni.setStorageSync(this.tokenCacheKey, accessToken)
			uni.setStorageSync(this.tokenExpireKey, expiresAt)
			
			this.accessToken = accessToken
			this.tokenExpiresAt = expiresAt
			
			console.log('[FeishuRequest] AccessToken缓存成功，有效期至:', new Date(expiresAt).toLocaleString())
		} catch (e) {
			console.warn('[FeishuRequest] 缓存AccessToken失败', e)
		}
	}

	/**
	 * 清除缓存的访问令牌
	 * @private
	 */
	clearAccessTokenCache() {
		try {
			uni.removeStorageSync(this.tokenCacheKey)
			uni.removeStorageSync(this.tokenExpireKey)
			this.accessToken = null
			this.tokenExpiresAt = null
			console.log('[FeishuRequest] AccessToken缓存已清除')
		} catch (e) {
			console.warn('[FeishuRequest] 清除缓存失败', e)
		}
	}

	/**
	 * 获取访问令牌
	 * @private
	 */
	async getAccessToken(forceRefresh = false) {
		if (!forceRefresh) {
			const cachedToken = this.getAccessTokenFromCache()
			if (cachedToken) {
				return cachedToken
			}
		}
		
		console.log('[FeishuRequest] 获取新的AccessToken...')
		await this.initCloudObject()
		const result = await this.feishutools.getAccessToken()
		
		this.saveAccessTokenToCache(result.accessToken, result.expiresIn)
		return result.accessToken
	}

	/**
	 * 检查是否是Token相关的错误
	 * @private
	 */
	isTokenError(responseData) {
		if (!responseData || responseData.code === undefined) {
			return false
		}
		const tokenErrorCodes = [99991668, 10013, 10014, 10008, 10009, 10010, 10011, 10012]
		return tokenErrorCodes.includes(responseData.code)
	}

	/**
	 * 根据表名获取表ID
	 * @param {string} tableName - 表名
	 * @returns {string} 表ID
	 */
	getTableIdByName(tableName) {
		const tables = feishuApi.getTableListSaved()
		const table = tables.find(t => t.name === tableName)
		if (!table) {
			throw new Error(`未找到表名为"${tableName}"的数据表`)
		}
		return table.table_id
	}

	/**
	 * 查询记录
	 * @param {string} tableName - 表名
	 * @param {Object} filter - 过滤条件，格式: { field_name: value }
	 * @param {Object} options - 查询选项
	 * @returns {Promise<Object>} 查询结果
	 */
	async queryRecords(tableName, filter = {}, options = {}, retry = false) {
		
		this.getConfig()
		const tableId = this.getTableIdByName(tableName)
		console.log('[FeishuRequest] 查询记录，表名:', tableName, '过滤条件:', filter)
		
		await this.initCloudObject()
		return this.feishutools.queryRecords({
			baseToken: this.baseToken,
			tableId: tableId,
			filter: filter,
			pageSize: options.pageSize,
			pageToken: options.pageToken
		})
	}

	/**
	 * 查询单条记录
	 * @param {string} tableName - 表名
	 * @param {Object} filter - 过滤条件
	 * @returns {Promise<Object|null>} 记录对象或null
	 */
	async queryOne(tableName, filter) {
		const result = await this.queryRecords(tableName, filter, { pageSize: 1 })
		if (result.success && result.data.length > 0) {
			return result.data[0]
		}
		return null
	}

	/**
	 * 查询记录是否存在
	 * @param {string} tableName - 表名
	 * @param {Object} filter - 过滤条件
	 * @returns {Promise<boolean>} 是否存在
	 */
	async exists(tableName, filter) {
		const record = await this.queryOne(tableName, filter)
		return record !== null
	}

	/**
	 * 添加记录
	 * @param {string} tableName - 表名
	 * @param {Object} data - 记录数据，格式: { field_name: value }
	 * @returns {Promise<Object>} 添加结果
	 */
	async addRecord(tableName, data, retry = false) {
		console.log('[FeishuRequest] 添加记录，表名:', tableName, '数据:', data)

		this.getConfig()
		const tableId = this.getTableIdByName(tableName)
		
		await this.initCloudObject()
		return this.feishutools.addRecord({
			baseToken: this.baseToken,
			tableId: tableId,
			data: data
		})
	}

	/**
	 * 更新记录
	 * @param {string} tableName - 表名
	 * @param {string} recordId - 记录ID
	 * @param {Object} data - 更新数据
	 * @returns {Promise<Object>} 更新结果
	 */
	async updateRecord(tableName, recordId, data, retry = false) {
		console.log('[FeishuRequest] 更新记录，表名:', tableName, '记录ID:', recordId, '数据:', data)

		this.getConfig()
		const tableId = this.getTableIdByName(tableName)
		
		await this.initCloudObject()
		return this.feishutools.updateRecord({
			baseToken: this.baseToken,
			tableId: tableId,
			recordId: recordId,
			data: data
		})
	}

	/**
	 * 删除记录
	 * @param {string} tableName - 表名
	 * @param {string} recordId - 记录ID
	 * @returns {Promise<Object>} 删除结果
	 */
	async deleteRecord(tableName, recordId, retry = false) {
		console.log('[FeishuRequest] 删除记录，表名:', tableName, '记录ID:', recordId)

		this.getConfig()
		const tableId = this.getTableIdByName(tableName)
		
		await this.initCloudObject()
		return this.feishutools.deleteRecord({
			baseToken: this.baseToken,
			tableId: tableId,
			recordId: recordId
		})
	}

	/**
	 * 批量添加记录
	 * @param {string} tableName - 表名
	 * @param {Array} records - 记录数组
	 * @returns {Promise<Object>} 批量添加结果
	 */
	async batchAddRecords(tableName, records, retry = false) {
		console.log('[FeishuRequest] 批量添加记录，表名:', tableName, '记录数:', records.length)

		this.getConfig()
		const tableId = this.getTableIdByName(tableName)
		
		await this.initCloudObject()
		return this.feishutools.batchAddRecords({
			baseToken: this.baseToken,
			tableId: tableId,
			records: records
		})
	}

	/**
	 * 批量获取首页数据（减少云函数调用次数）
	 * @param {string} childId - 儿童ID
	 * @returns {Promise<Object>} 包含任务、奖励、教材的首页数据
	 */
	async getHomeData(childId) {
		console.log('[FeishuRequest] 获取首页数据，childId:', childId)

		this.getConfig()
		
		// 获取需要的表ID映射
		const tables = {}
		const tableList = feishuApi.getTableListSaved()
		
		const neededTables = ['任务表', '兑换记录表', '教材表']
		tableList.forEach(table => {
			if (neededTables.includes(table.name)) {
				tables[table.name] = table.table_id
			}
		})
		
		await this.initCloudObject()
		return this.feishutools.getHomeData({
			baseToken: this.baseToken,
			childId: childId,
			tables: tables
		})
	}

	/**
	 * 构建过滤条件
	 * @private
	 */
	buildFilter(filter) {
		const conditions = []
		for (const key in filter) {
			const value = filter[key]
			if (typeof value === 'string') {
				conditions.push(`CurrentValue.[${key}]="${value}"`)
			} else if (typeof value === 'number') {
				conditions.push(`CurrentValue.[${key}]=${value}`)
			} else if (typeof value === 'boolean') {
				conditions.push(`CurrentValue.[${key}]=${value}`)
			}
		}
		return conditions.join(' AND ')
	}

	/**
	 * 用户注册
	 * @param {Object} userData - 用户数据
	 * @returns {Promise<Object>} 操作结果
	 */
	async registerOrUpdateUser(userData) {
		console.log('[FeishuRequest] 用户注册，用户数据:', userData)

		const tableName = '用户表'

		const phone = userData.phone
		if (!phone) {
			throw new Error('用户手机号不能为空')
		}

		const exists = await this.exists(tableName, { phone })

		if (exists) {
			console.log('[FeishuRequest] 用户已存在，提示账号已注册')
			return {
				success: false,
				action: 'exists',
				message: '账号已注册'
			}
		} else {
			console.log('[FeishuRequest] 用户不存在，执行添加操作')
			const result = await this.addRecord(tableName, userData)
			return {
				success: true,
				action: 'create',
				recordId: result.recordId,
				message: '用户注册成功'
			}
		}
	}

	/**
	 * 获取用户信息
	 * @param {string} phone - 手机号
	 * @returns {Promise<Object|null>} 用户信息
	 */
	async getUserByPhone(phone) {
		console.log('[FeishuRequest] 获取用户信息，手机号:', phone)
		const tableName = '用户表'
		return await this.queryOne(tableName, { phone })
	}

	/**
	 * 验证用户登录
	 * @param {string} phone - 手机号
	 * @param {string} password - 密码
	 * @returns {Promise<Object>} 验证结果
	 */
	async validateUser(phone, password) {
		console.log('[FeishuRequest] 验证用户登录，手机号:', phone)

		const user = await this.getUserByPhone(phone)

		if (!user) {
			return {
				success: false,
				message: '用户不存在'
			}
		}

		if (user.fields.password !== password) {
			return {
				success: false,
				message: '密码错误'
			}
		}

		return {
			success: true,
			user: user.fields,
			recordId: user.record_id,
			message: '登录成功'
		}
	}

	/**
	 * 密码加密
	 * @param {string} password - 原始密码
	 * @returns {string} 加密后的密码
	 */
	async hashPassword(password) {
		const encoder = new TextEncoder()
		const data = encoder.encode(password)
		const hashBuffer = await crypto.subtle.digest('SHA-256', data)
		const hashArray = Array.from(new Uint8Array(hashBuffer))
		const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
		return hashHex
	}

	/**
	 * 用户登录
	 * @param {string} phone - 手机号
	 * @param {string} password - 密码
	 * @param {string} role - 角色（parent/child）
	 * @param {string} secondPassword - 二级密码（家长角色需要）
	 * @returns {Promise<Object>} 登录结果
	 */
	async loginUser(phone, password, role = 'parent', secondPassword = '') {
		console.log('[FeishuRequest] 用户登录，手机号:', phone, '角色:', role)

		const user = await this.getUserByPhone(phone)

		if (!user) {
			return {
				success: false,
				message: '用户不存在'
			}
		}

		const hashedPassword = await this.hashPassword(password)
		console.log('[FeishuRequest] 加密后的密码:', hashedPassword)
		console.log('[FeishuRequest] 用户存储的密码:', user.fields.password)

		if (user.fields.password[0].text !== hashedPassword) {
			return {
				success: false,
				message: '密码错误'
			}
		}

		if (role === 'parent') {
			if (!secondPassword) {
				return {
					success: false,
					message: '请输入二级密码'
				}
			}

			const hashedSecondPassword = await this.hashPassword(secondPassword)
			console.log('[FeishuRequest] 加密后的二级密码:', hashedSecondPassword)
			console.log('[FeishuRequest] 用户存储的二级密码:', user.fields.second_password)

			if (user.fields.second_password[0].text !== hashedSecondPassword) {
				return {
					success: false,
					message: '二级密码错误'
				}
			}
		}

		return {
			success: true,
			user: user,
			recordId: user.record_id,
			message: '登录成功'
		}
	}
}

export const feishuRequest = new FeishuRequest()
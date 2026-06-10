/**
 * 飞书数据请求工具
 * @description 根据多维表格配置，发送请求到对应的数据表
 * 支持查询、添加、更新、删除等操作
 * 网络不可用时自动使用mock数据
 */

import { feishuApi } from '@/uni_modules/settings-feishu-dataBase/src/utils/feishu-api.js'
import { 
  mockTasks, 
  mockRewards, 
  mockTextbooks, 
  mockPointsHistory, 
  mockGoods,
  mockCategories,
  mockBookStatus,
  mockChildren,
  mockTaskTemplates
} from './mock-data.js'

// 是否使用mock数据（网络不可用时自动启用）
// 设置为true时，所有请求都会使用本地mock数据，不会调用飞书API
const USE_MOCK = false

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
	async getConfig() {
		const config = feishuApi.getConfig()
		if (!config) {
			throw new Error('飞书配置未设置，请先配置多维表格Token')
		}
		
		// 使用直接配置的 baseToken
		if (!config.baseToken) {
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
		console.log('[FeishuRequest] 查询记录，表名:', tableName, '过滤条件:', filter)
		
		// 如果使用mock数据，直接返回mock数据
		if (USE_MOCK) {
			return this.getMockData(tableName, filter, options)
		}
		
		try {
			await this.getConfig()
			const tableId = this.getTableIdByName(tableName)
			
			await this.initCloudObject()
			
			// 如果有 keyword 参数，使用模糊搜索
			if (filter && filter.keyword) {
				return this.feishutools.searchRecords({
					baseToken: this.baseToken,
					tableId: tableId,
					tableName: tableName,
					keyword: filter.keyword,
					pageSize: options.pageSize,
					pageToken: options.pageToken
				})
			}
			
			return this.feishutools.queryRecords({
				baseToken: this.baseToken,
				tableId: tableId,
				filter: filter,
				pageSize: options.pageSize,
				pageToken: options.pageToken
			})
		} catch (error) {
			console.error('[FeishuRequest] 查询记录失败，尝试使用mock数据:', error.message)
			return this.getMockData(tableName, filter, options)
		}
	}
	
	/**
	 * 模糊搜索记录
	 * @param {string} tableName - 表名
	 * @param {string} keyword - 搜索关键词
	 * @param {Object} options - 查询选项
	 * @returns {Promise<Object>} 查询结果
	 */
	async searchRecords(tableName, keyword, options = {}) {
		console.log('[FeishuRequest] 模糊搜索记录，表名:', tableName, '关键词:', keyword)
		
		if (USE_MOCK) {
			return this.getMockData(tableName, { keyword }, options)
		}
		
		try {
			await this.getConfig()
			const tableId = this.getTableIdByName(tableName)
			
			await this.initCloudObject()
			return this.feishutools.searchRecords({
				baseToken: this.baseToken,
				tableId: tableId,
				keyword: keyword,
				pageSize: options.pageSize,
				pageToken: options.pageToken
			})
		} catch (error) {
			console.error('[FeishuRequest] 模糊搜索失败，尝试使用mock数据:', error.message)
			return this.getMockData(tableName, { keyword }, options)
		}
	}
	
	/**
	 * 获取mock数据
	 * @private
	 */
	getMockData(tableName, filter = {}, options = {}) {
		console.log('[FeishuRequest] 使用mock数据，表名:', tableName)
		
		let mockData = []
		let total = 0
		
		switch (tableName) {
			case '任务表':
				mockData = mockTasks
				break
			case '兑换记录表':
				mockData = mockRewards
				break
			case '教材表':
				mockData = mockTextbooks
				break
			case '积分记录表':
				mockData = mockPointsHistory
				break
			case '礼品表':
				mockData = mockGoods
				break
			case '分类表':
				mockData = [{
					record_id: 'cat001',
					fields: {
						gift_category: mockCategories,
						book_status: mockBookStatus,
						task_type: mockCategories.map(c => c.value)
					}
				}]
				break
			case '儿童表':
				mockData = mockChildren.map(c => ({
					record_id: c.id,
					fields: {
						id: c.child_id,
						name: [{ text: c.name, type: 'text' }],
						child_id: c.child_id,
						total_points: c.total_points
					}
				}))
				break
			case '任务模板表':
				mockData = mockTaskTemplates
				break
			default:
				mockData = []
		}
		
		// 应用过滤条件
		let filteredData = mockData
		if (filter && Object.keys(filter).length > 0) {
			filteredData = mockData.filter(item => {
				for (const key in filter) {
					const filterValue = filter[key]
					const itemValue = item.fields[key]
					
					if (key === 'keyword') {
						// 根据不同表名搜索不同字段
						let match = false
						let searchFields = ['name'] // 默认搜索name字段
						
						if (tableName === '任务模板表') {
							searchFields = ['template_title']
						} else if (tableName === '任务表') {
							searchFields = ['title']
						} else if (tableName === '教材表') {
							searchFields = ['name']
						}
						
						searchFields.forEach(field => {
							const fieldValue = item.fields[field]
							if (fieldValue) {
								let textValue = ''
								if (Array.isArray(fieldValue) && fieldValue[0] && fieldValue[0].text) {
									textValue = fieldValue[0].text
								} else if (typeof fieldValue === 'string') {
									textValue = fieldValue
								}
								if (textValue.toLowerCase().includes(filterValue.toLowerCase())) {
									match = true
								}
							}
						})
						if (!match) return false
					} else if (key === 'child_id') {
						const childId = this.normalizeChildId(itemValue)
						if (childId !== filterValue) return false
					} else if (key === 'category') {
						if (itemValue !== filterValue) return false
					} else if (key === 'status') {
						if (itemValue !== filterValue) return false
					}
				}
				return true
			})
		}
		
		total = filteredData.length
		
		// 应用分页
		if (options.pageSize && options.pageToken) {
			const pageNum = parseInt(options.pageToken) || 1
			const start = (pageNum - 1) * options.pageSize
			filteredData = filteredData.slice(start, start + options.pageSize)
		} else if (options.pageSize) {
			filteredData = filteredData.slice(0, options.pageSize)
		}
		
		return {
			success: true,
			data: filteredData,
			total: total,
			pageToken: null,
			hasMore: false
		}
	}
	
	/**
	 * 标准化child_id
	 */
	normalizeChildId(field) {
		if (!field) return ''
		if (typeof field === 'object' && field.type === 1 && field.value && Array.isArray(field.value) && field.value.length > 0) {
			return field.value[0].text || ''
		}
		if (Array.isArray(field) && field[0] && field[0].text) {
			return field[0].text
		}
		if (typeof field === 'string') {
			return field
		}
		return ''
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
		
		if (USE_MOCK) {
			return {
				success: true,
				recordId: 'mock_' + Date.now(),
				createdTime: new Date().toISOString()
			}
		}
		
		try {
			await this.getConfig()
			const tableId = this.getTableIdByName(tableName)
			
			await this.initCloudObject()
			return this.feishutools.addRecord({
				baseToken: this.baseToken,
				tableId: tableId,
				data: data
			})
		} catch (error) {
			console.error('[FeishuRequest] 添加记录失败，尝试使用mock数据:', error.message)
			return {
				success: true,
				recordId: 'mock_' + Date.now(),
				createdTime: new Date().toISOString()
			}
		}
	}

	/**
	 * 上传文件到飞书云文档
	 * @param {string} filePath - 本地文件路径
	 * @param {string|null} objToken - 多维表格的 obj_token（从知识库获取），为空则使用 baseToken
	 * @returns {Promise<Object>} 上传结果，包含 fileToken
	 */
	async uploadFile(filePath, objToken = null) {
		console.log('[FeishuRequest] 上传文件:', filePath, 'objToken:', objToken ? objToken.substring(0, 10) + '...' : 'null(使用baseToken)')
		
		if (USE_MOCK) {
			return {
				success: true,
				fileToken: 'mock_file_token_' + Date.now()
			}
		}
		
		try {
			await this.getConfig()
			
			// 提取文件名（处理各种路径格式）
			const fileName = filePath.split('/').pop().split('\\').pop()
			console.log('[FeishuRequest] 文件名:', fileName)
			
			let fileContentBase64 = null
			
			if (typeof uni.getFileSystemManager === 'function') {
				fileContentBase64 = await new Promise((resolve, reject) => {
					uni.getFileSystemManager().readFile({
						filePath: filePath,
						success: (res) => {
							console.log('[FeishuRequest] 文件读取成功，base64长度:', res.data ? res.data.length : 0)
							resolve(res.data)
						},
						fail: (error) => {
							console.error('[FeishuRequest] 文件读取失败:', error)
							reject(error)
						}
					})
				})
			} else {
				const response = await fetch(filePath)
				const blob = await response.blob()
				fileContentBase64 = await new Promise((resolve, reject) => {
					const reader = new FileReader()
					reader.onload = () => resolve(reader.result.split(',')[1])
					reader.onerror = reject
					reader.readAsDataURL(blob)
				})
			}
			
			if (!fileContentBase64) {
				console.error('[FeishuRequest] 文件内容为空')
				return {
					success: false,
					message: '文件内容为空'
				}
			}
			
			console.log('[FeishuRequest] 文件大小:', fileContentBase64.length * 0.75, '字节')
			
			await this.initCloudObject()
			return this.feishutools.uploadFile({
				baseToken: this.baseToken,
				parentNode: objToken || this.baseToken,  // 优先使用 objToken，否则用 baseToken
				fileName: fileName,
				fileContentBase64: fileContentBase64
			})
		} catch (error) {
			console.error('[FeishuRequest] 上传文件失败:', error.message)
			return {
				success: false,
				message: '上传失败: ' + error.message
			}
		}
	}

	/**
	 * 通过 baseToken 获取知识库节点信息（用于获取 obj_token）
	 * @returns {Promise<Object>} 包含 objToken 的结果
	 */
	async getNodeByToken() {
		console.log('[FeishuRequest] 获取知识库节点信息...')
		
		if (USE_MOCK) {
			return {
				success: true,
				objToken: 'mock_obj_token_' + Date.now()
			}
		}
		
		try {
			await this.getConfig()
			
			await this.initCloudObject()
			return this.feishutools.getNodeByToken({
				baseToken: this.baseToken
			})
		} catch (error) {
			console.error('[FeishuRequest] 获取知识库节点信息失败:', error.message)
			return {
				success: false,
				message: '获取节点信息失败: ' + error.message
			}
		}
	}

	/**
	 * 获取单条记录（通过 record_id）
	 * @param {string} tableName - 表名
	 * @param {string} recordId - 记录ID
	 * @returns {Promise<Object|null>} 记录数据或null
	 */
	async getRecord(tableName, recordId) {
		console.log('[FeishuRequest] 获取单条记录，表名:', tableName, '记录ID:', recordId)
		
		if (USE_MOCK) {
			return null
		}
		
		try {
			await this.getConfig()
			const tableId = this.getTableIdByName(tableName)
			
			await this.initCloudObject()
			const result = await this.feishutools.getRecord({
				baseToken: this.baseToken,
				tableId: tableId,
				recordId: recordId
			})
			
			if (result.success && result.data) {
				return {
					success: true,
					data: result.data
				}
			}
			return null
		} catch (error) {
			console.error('[FeishuRequest] 获取单条记录失败:', error.message)
			return null
		}
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
		
		if (USE_MOCK) {
			return {
				success: true,
				recordId: recordId,
				updatedTime: new Date().toISOString()
			}
		}
		
		try {
			await this.getConfig()
			const tableId = this.getTableIdByName(tableName)
			
			await this.initCloudObject()
			return this.feishutools.updateRecord({
				baseToken: this.baseToken,
				tableId: tableId,
				recordId: recordId,
				data: data
			})
		} catch (error) {
			console.error('[FeishuRequest] 更新记录失败，尝试使用mock数据:', error.message)
			return {
				success: true,
				recordId: recordId,
				updatedTime: new Date().toISOString()
			}
		}
	}

	/**
	 * 删除记录
	 * @param {string} tableName - 表名
	 * @param {string} recordId - 记录ID
	 * @returns {Promise<Object>} 删除结果
	 */
	async deleteRecord(tableName, recordId, retry = false) {
		console.log('[FeishuRequest] 删除记录，表名:', tableName, '记录ID:', recordId)
		
		if (USE_MOCK) {
			return {
				success: true,
				recordId: recordId
			}
		}
		
		try {
			await this.getConfig()
			const tableId = this.getTableIdByName(tableName)
			
			await this.initCloudObject()
			return this.feishutools.deleteRecord({
				baseToken: this.baseToken,
				tableId: tableId,
				recordId: recordId
			})
		} catch (error) {
			console.error('[FeishuRequest] 删除记录失败，尝试使用mock数据:', error.message)
			return {
				success: true,
				recordId: recordId
			}
		}
	}

	/**
	 * 批量添加记录
	 * @param {string} tableName - 表名
	 * @param {Array} records - 记录数组
	 * @returns {Promise<Object>} 批量添加结果
	 */
	async batchAddRecords(tableName, records, retry = false) {
		console.log('[FeishuRequest] 批量添加记录，表名:', tableName, '记录数:', records.length)
		
		if (USE_MOCK) {
			return {
				success: true,
				records: records.map((_, index) => ({
					record_id: 'mock_batch_' + Date.now() + '_' + index
				}))
			}
		}
		
		try {
			await this.getConfig()
			const tableId = this.getTableIdByName(tableName)
			
			await this.initCloudObject()
			return this.feishutools.batchAddRecords({
				baseToken: this.baseToken,
				tableId: tableId,
				records: records
			})
		} catch (error) {
			console.error('[FeishuRequest] 批量添加记录失败，尝试使用mock数据:', error.message)
			return {
				success: true,
				records: records.map((_, index) => ({
					record_id: 'mock_batch_' + Date.now() + '_' + index
				}))
			}
		}
	}

	/**
	 * 批量获取首页数据（减少云函数调用次数）
	 * @param {string} childId - 儿童ID
	 * @returns {Promise<Object>} 包含任务、奖励、教材的首页数据
	 */
	async getHomeData(childId) {
		console.log('[FeishuRequest] 获取首页数据，childId:', childId)
		
		if (USE_MOCK) {
			return {
				success: true,
				data: {
					tasks: mockTasks.filter(t => {
						const taskChildId = this.normalizeChildId(t.fields.child_id)
						return taskChildId === childId || !childId
					}),
					rewards: mockRewards.filter(r => {
						const rewardChildId = this.normalizeChildId(r.fields.child_id)
						return rewardChildId === childId || !childId
					}).slice(0, 3),
					textbooks: mockTextbooks.filter(b => {
						const bookChildId = this.normalizeChildId(b.fields.child_id)
						return bookChildId === childId || !childId
					})
				}
			}
		}
		
		try {
			await this.getConfig()
			
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
		} catch (error) {
			console.error('[FeishuRequest] 获取首页数据失败，尝试使用mock数据:', error.message)
			return {
				success: true,
				data: {
					tasks: mockTasks.filter(t => {
						const taskChildId = this.normalizeChildId(t.fields.child_id)
						return taskChildId === childId || !childId
					}),
					rewards: mockRewards.filter(r => {
						const rewardChildId = this.normalizeChildId(r.fields.child_id)
						return rewardChildId === childId || !childId
					}).slice(0, 3),
					textbooks: mockTextbooks.filter(b => {
						const bookChildId = this.normalizeChildId(b.fields.child_id)
						return bookChildId === childId || !childId
					})
				}
			}
		}
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
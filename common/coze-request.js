/**
 * Coze工作流请求工具
 * @description 根据配置调用Coze工作流，生成任务数据
 */

class CozeRequest {
	constructor() {
		this.workflowUrl = null
		this.apiKey = null
		this.configKey = 'coze_config'
	}

	/**
	 * 获取Coze配置
	 * @returns {Object} 配置对象
	 */
	getConfig() {
		try {
			const config = uni.getStorageSync(this.configKey)
			if (config) {
				return JSON.parse(config)
			}
		} catch (e) {
			console.warn('[CozeRequest] 读取配置失败:', e)
		}
		return null
	}

	/**
	 * 保存Coze配置
	 * @param {Object} config - 配置对象
	 */
	saveConfig(config) {
		try {
			uni.setStorageSync(this.configKey, JSON.stringify(config))
			this.workflowUrl = config.workflowUrl
			this.apiKey = config.apiKey
			console.log('[CozeRequest] 配置保存成功')
		} catch (e) {
			console.error('[CozeRequest] 保存配置失败:', e)
		}
	}

	/**
	 * 初始化配置
	 * @private
	 */
	initConfig() {
		const config = this.getConfig()
		if (config && config.workflowUrl && config.apiKey) {
			this.workflowUrl = config.workflowUrl
			this.apiKey = config.apiKey
			return true
		}
		return false
	}

	/**
	 * 调用Coze工作流生成任务
	 * @param {Object} params - 请求参数
	 * @returns {Promise<Object>} 工作流执行结果
	 */
	async generateTasks(params) {
		if (!this.initConfig()) {
			return {
				success: false,
				message: 'Coze配置未设置，请先配置工作流地址和API密钥'
			}
		}

		console.log('[CozeRequest] 调用Coze工作流，参数:', params)

		try {
			const response = await uni.request({
				url: this.workflowUrl,
				method: 'POST',
				header: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.apiKey}`
				},
				data: params
			})

			if (response.statusCode === 200) {
				const data = response.data
				console.log('[CozeRequest] Coze工作流执行成功:', data)
				return {
					success: true,
					data: data,
					message: '任务生成成功'
				}
			} else {
				console.error('[CozeRequest] Coze工作流执行失败，状态码:', response.statusCode)
				return {
					success: false,
					message: `工作流调用失败，状态码: ${response.statusCode}`
				}
			}
		} catch (error) {
			console.error('[CozeRequest] 调用Coze工作流异常:', error)
			return {
				success: false,
				message: '调用工作流时发生异常: ' + (error.message || error)
			}
		}
	}

	/**
	 * 生成任务的标准请求参数
	 * @param {string} prompt - 生成主题
	 * @param {number} count - 任务数量
	 * @param {string} difficulty - 难度等级
	 * @param {string} childId - 儿童ID（可选）
	 * @returns {Object} 格式化的请求参数
	 */
	buildTaskParams(prompt, count, difficulty, childId = '') {
		return {
			prompt: prompt,
			task_count: count,
			difficulty: difficulty,
			child_id: childId,
			format: 'json'
		}
	}
}

export const cozeRequest = new CozeRequest()
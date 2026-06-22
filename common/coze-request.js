/**
 * Coze工作流请求工具
 * @description 根据配置调用Coze工作流，生成任务数据
 */

class CozeRequest {
	constructor() {
		this.token = 'pat_wVqn8SbKtO22vdsDcIg1cASkrhrdJwX9LyJjphyEVgMSFoVUXaoPHsq2YvOYiUJg'
		this.workflowId = '7639924978796101666'
		this.baseURL = 'https://api.coze.cn'
	}

	/**
	 * 获取当前配置
	 * @returns {Object} 配置对象
	 */
	getConfig() {
		return {
			workflowUrl: `${this.baseURL}/v1/workflow/run`,
			apiKey: this.token,
			workflowId: this.workflowId,
			baseURL: this.baseURL
		}
	}

	/**
	 * 调用Coze工作流生成任务（流式对话）
	 * @param {Object} params - 请求参数
	 * @param {Function} onData - 流式数据回调
	 * @param {Function} onError - 错误回调
	 * @param {Function} onComplete - 完成回调
	 */
	async generateTasksStream(params, onData, onError, onComplete) {
		console.log('[CozeRequest] 调用Coze流式工作流，参数:', params)

		try {
			const response = await uni.request({
				url: `${this.baseURL}/v1/workflow/run`,
				method: 'POST',
				header: {
					'Authorization': `Bearer ${this.token}`,
					'Content-Type': 'application/json'
				},
				data: {
					workflow_id: this.workflowId,
					parameters: params
				}
			})

			console.log('[CozeRequest] 流式请求响应:', response)

			if (response.statusCode === 200) {
				const data = response.data
				console.log('[CozeRequest] Coze工作流执行成功:', data)
				// 直接传递原始数据给回调
				onData(data)
				onComplete()
			} else {
				console.error('[CozeRequest] Coze工作流执行失败，状态码:', response.statusCode, response.data)
				const errorMsg = response.data?.msg || response.data?.error || `工作流调用失败，状态码: ${response.statusCode}`
				onError(errorMsg)
			}
		} catch (error) {
			console.error('[CozeRequest] 调用Coze工作流异常:', error)
			onError('调用工作流时发生异常: ' + (error.message || error))
		}
	}

	/**
	 * 调用Coze工作流生成任务（非流式）
	 * @param {Object} params - 请求参数
	 * @returns {Promise<Object>} 工作流执行结果
	 */
	async generateTasks(params) {
		console.log('[CozeRequest] 调用Coze工作流，参数:', params)

		try {
			const url = `${this.baseURL}/v1/workflow/run`

			const response = await uni.request({
				url: url,
				method: 'POST',
				header: {
					'Authorization': `Bearer ${this.token}`,
					'Content-Type': 'application/json'
				},
				data: {
					workflow_id: this.workflowId,
					parameters: params
				}
			})

			console.log('[CozeRequest] 非流式请求响应:', response)

			if (response.statusCode === 200) {
				const data = response.data
				console.log('[CozeRequest] Coze工作流执行成功:', data)
				return {
					success: true,
					data: data,
					message: '任务生成成功'
				}
			} else {
				console.error('[CozeRequest] Coze工作流执行失败，状态码:', response.statusCode, response.data)
				return {
					success: false,
					message: response.data?.msg || response.data?.error || `工作流调用失败，状态码: ${response.statusCode}`
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
	 * 生成任务的标准请求参数（包含飞书配置和用户信息）
	 * @param {string} prompt - 生成主题
	 * @param {number} count - 任务数量
	 * @param {string} difficulty - 难度等级
	 * @param {Object} userInfo - 用户信息
	 * @param {Object} feishuConfig - 飞书多维表格配置
	 * @returns {Object} 格式化的请求参数
	 */
	buildTaskParams(prompt, count, difficulty, userInfo = {}, feishuConfig = {}) {
		// 构建用户信息字符串
		const userInfoStr = JSON.stringify({
			姓名: userInfo.name || '',
			年级: userInfo.grade || '',
			年龄: userInfo.age || '',
			兴趣: userInfo.hobby || ''
		})

		return {
			content: prompt,
			userInfo: userInfoStr,
			task_count: count,
			difficulty: difficulty
		}
	}
}

export const cozeRequest = new CozeRequest()
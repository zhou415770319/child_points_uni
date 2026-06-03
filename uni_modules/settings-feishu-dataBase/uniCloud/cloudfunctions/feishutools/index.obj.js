// 飞书工具云对象

// Token缓存
let cachedToken = null
let tokenExpiresAt = 0

// 图片URL缓存（key: file_token, value: { url, expiresAt }）
let imageUrlCache = {}
// 缓存有效期（24小时，与飞书临时下载链接有效期一致）
const IMAGE_CACHE_EXPIRE_MS = 24 * 60 * 60 * 1000

/**
 * 获取飞书访问令牌（带缓存）
 */
async function getAccessToken(forceRefresh = false) {
	console.log('[FeishuTools] 获取飞书AccessToken...')
	
	// 检查缓存是否有效（提前60秒刷新）
	if (!forceRefresh && cachedToken && Date.now() < tokenExpiresAt - 60000) {
		console.log('[FeishuTools] 使用缓存的AccessToken')
		return { accessToken: cachedToken, expiresIn: Math.floor((tokenExpiresAt - Date.now()) / 1000) }
	}
	
	// 从环境变量获取配置
	
	const appId = 'cli_a841db3b9837500e'
	const appSecret = 'mLl3P1bmZWeeKQ04hHRqMcYRx7GHtuTy'
	// const appId = process.env.APP_ID
	// const appSecret = process.env.APP_SECRET
	console.log('[FeishuTools] APP_ID配置:', appId ? '已配置' : '未配置')
	console.log('[FeishuTools] APP_SECRET配置:', appSecret ? '已配置' : '未配置')
	
	if (!appId || !appSecret) {
		console.error('[FeishuTools] 错误：飞书配置未设置')
		throw new Error('飞书配置未设置，请在环境变量中配置APP_ID和APP_SECRET')
	}
	
	console.log('[FeishuTools] 请求飞书API获取token...')
	
	// 请求飞书API获取token
	const response = await uniCloud.httpclient.request('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
		method: 'POST',
		data: {
			app_id: appId,
			app_secret: appSecret
		},
		dataType: 'json'
	})
	
	console.log('[FeishuTools] 飞书API响应:', JSON.stringify(response.data))
	
	if (response.data.code === 0) {
		cachedToken = response.data.tenant_access_token
		tokenExpiresAt = Date.now() + response.data.expire * 1000
		
		console.log('[FeishuTools] 获取AccessToken成功')
		return {
			accessToken: cachedToken,
			expiresIn: response.data.expire
		}
	} else {
		console.error('[FeishuTools] 获取AccessToken失败:', JSON.stringify(response.data))
		throw new Error('获取飞书AccessToken失败: ' + JSON.stringify(response.data))
	}
}

/**
 * 检查是否是Token相关的错误
 */
function isTokenError(code) {
	const tokenErrorCodes = [99991668, 10013, 10014, 10008, 10009, 10010, 10011, 10012, 401]
	return tokenErrorCodes.includes(code)
}

/**
 * 检查是否是权限相关的错误
 */
function isPermissionError(code) {
	const permissionErrorCodes = [91403, 10015]
	return permissionErrorCodes.includes(code)
}

/**
 * 构建过滤条件 (JSON格式)
 */
function buildFilter(filter) {
	const conditions = []
	for (const key in filter) {
		const value = filter[key]
		
		// 如果值已经是数组（如日期筛选 ["ExactDate", "时间戳"]），直接使用
		if (Array.isArray(value)) {
			conditions.push({
				field_name: key,
				operator: "is",
				value: value
			})
		} else {
			conditions.push({
				field_name: key,
				operator: "is",
				value: [value]
			})
		}
	}
	return {
		conjunction: "and",
		conditions: conditions
	}
}

/**
 * 获取多维表格列表 (使用bitable API)
 */
async function getBaseList(baseToken) {
	console.log('[FeishuTools] 获取多维表格列表...')
	
	const tokenResult = await getAccessToken()
	
	console.log('[FeishuTools] 调用飞书API: GET /open-apis/bitable/v1/apps')
	const response = await uniCloud.httpclient.request('https://open.feishu.cn/open-apis/bitable/v1/apps/'+ baseToken +'/tables', {
		method: 'GET',
		headers: {
			'Authorization': 'Bearer ' + tokenResult.accessToken
		},
		dataType: 'json'
	})
	
	console.log('[FeishuTools] 多维表格列表响应:', JSON.stringify(response.data))
	
	if (response.data.code === 0) {
		const bases = response.data.data.apps || []
		console.log('[FeishuTools] 获取多维表格列表成功，共', bases.length, '个表格')
		return {
			bases: bases.map(function(item) {
				return {
					base_id: item.app_token,
					name: item.name
				}
			})
		}
	} else {
		console.error('[FeishuTools] 获取多维表格列表失败:', JSON.stringify(response.data))
		throw new Error('获取多维表格列表失败: ' + JSON.stringify(response.data))
	}
}

/**
 * 获取数据表列表
 */
async function getTableList(baseToken) {
	console.log('[FeishuTools] 获取数据表列表，baseToken:', baseToken)
	
	if (!baseToken) {
		console.error('[FeishuTools] 错误：多维表格Token为空')
		throw new Error('多维表格Token不能为空')
	}
	
	const tokenResult = await getAccessToken()
	
	console.log('[FeishuTools] 调用飞书API: GET /open-apis/bitable/v1/apps/' + baseToken + '/tables')
	const response = await uniCloud.httpclient.request('https://open.feishu.cn/open-apis/bitable/v1/apps/' + baseToken + '/tables', {
		method: 'GET',
		headers: {
			'Authorization': 'Bearer ' + tokenResult.accessToken
		},
		dataType: 'json'
	})
	
	console.log('[FeishuTools] 数据表列表响应:', JSON.stringify(response.data))
	
	if (response.data.code === 0) {
		const tables = response.data.data.items.map(function(item) {
			return {
				table_id: item.table_id,
				name: item.name,
				fields: []
			}
		})
		
		console.log('[FeishuTools] 获取数据表列表成功，共', tables.length, '个数据表')
		return {
			tables: tables
		}
	} else {
		console.error('[FeishuTools] 获取数据表列表失败:', JSON.stringify(response.data))
		throw new Error('获取数据表列表失败: ' + JSON.stringify(response.data))
	}
}

/**
 * 获取字段列表
 */
async function getTableFields(baseToken, tableId) {
	console.log('[FeishuTools] 获取字段列表，baseToken:', baseToken, ', tableId:', tableId)
	
	if (!baseToken || !tableId) {
		console.error('[FeishuTools] 错误：多维表格Token或数据表ID为空')
		throw new Error('多维表格Token和数据表ID不能为空')
	}
	
	const tokenResult = await getAccessToken()
	
	console.log('[FeishuTools] 调用飞书API: GET /open-apis/bitable/v1/apps/' + baseToken + '/tables/' + tableId + '/fields')
	const response = await uniCloud.httpclient.request('https://open.feishu.cn/open-apis/bitable/v1/apps/' + baseToken + '/tables/' + tableId + '/fields', {
		method: 'GET',
		headers: {
			'Authorization': 'Bearer ' + tokenResult.accessToken
		},
		dataType: 'json'
	})
	
	console.log('[FeishuTools] 字段列表响应:', JSON.stringify(response.data))
	
	if (response.data.code === 0) {
		const fields = response.data.data.items.map(function(item) {
			return {
				field_id: item.field_id,
				field_name: item.field_name,
				type: item.type
			}
		})
		
		console.log('[FeishuTools] 获取字段列表成功，共', fields.length, '个字段')
		return {
			fields: fields
		}
	} else {
		console.error('[FeishuTools] 获取字段列表失败:', JSON.stringify(response.data))
		throw new Error('获取字段列表失败: ' + JSON.stringify(response.data))
	}
}

/**
 * 测试连接
 */
async function testConnection() {
	console.log('[FeishuTools] 测试飞书连接...')
	
	try {
		await getAccessToken()
		console.log('[FeishuTools] 测试连接成功')
		return {
			success: true,
			message: '连接成功'
		}
	} catch (error) {
		console.error('[FeishuTools] 测试连接失败:', error.message)
		return {
			success: false,
			message: error.message
		}
	}
}

/**
 * 查询记录
 */
async function queryRecords(params) {
	console.log('[FeishuTools] 查询记录:', JSON.stringify(params))
	
	const { baseToken, tableId, filter, pageSize, pageToken } = params
	
	if (!baseToken || !tableId) {
		throw new Error('baseToken和tableId不能为空')
	}
	
	const tokenResult = await getAccessToken()
	const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${baseToken}/tables/${tableId}/records/search`
	
	const requestData = {}
	if (filter && Object.keys(filter).length > 0) {
		requestData.filter = buildFilter(filter)
	}
	if (pageSize) {
		requestData.page_size = pageSize
	}
	if (pageToken) {
		requestData.page_token = pageToken
	}
	
	console.log('[FeishuTools] 请求URL:', url,tokenResult.accessToken,requestData)
	const response = await uniCloud.httpclient.request(url, {
		method: 'POST',
		headers: {
			'Authorization': 'Bearer ' + tokenResult.accessToken,
			'Content-Type': 'application/json'
		},
		data: requestData,
		dataType: 'json'
	})
	
	console.log('[FeishuTools] 查询响应:', JSON.stringify(response.data))
	
	if (response.data.code === 0) {
		return {
			success: true,
			data: response.data.data.items,
			total: response.data.data.total,
			pageToken: response.data.data.page_token,
			hasMore: response.data.has_more
		}
	} else {
		throw new Error('查询失败: ' + JSON.stringify(response.data))
	}
}

/**
 * 添加记录
 */
async function addRecord(params, retryCount = 0) {
	console.log('[FeishuTools] 添加记录:', JSON.stringify(params))
	
	const { baseToken, tableId, data } = params
	
	if (!baseToken || !tableId || !data) {
		throw new Error('baseToken、tableId和data不能为空')
	}
	
	const tokenResult = await getAccessToken()
	const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${baseToken}/tables/${tableId}/records`
	
	console.log('[FeishuTools] 请求URL:', url)
	console.log('[FeishuTools] 请求数据:', JSON.stringify({ fields: data }))
	
	const response = await uniCloud.httpclient.request(url, {
		method: 'POST',
		headers: {
			'Authorization': 'Bearer ' + tokenResult.accessToken,
			'Content-Type': 'application/json'
		},
		data: { fields: data },
		dataType: 'json'
	})
	
	console.log('[FeishuTools] 添加响应:', JSON.stringify(response.data))
	
	if (response.data.code === 0) {
		return {
			success: true,
			recordId: response.data.data.record.record_id,
			createdTime: response.data.data.record.created_time
		}
	} else {
		// Token失效，重试一次
		if (isTokenError(response.data.code) && retryCount < 1) {
			console.log('[FeishuTools] Token失效，尝试重新获取并重试...')
			await getAccessToken(true) // 强制刷新Token
			return addRecord(params, retryCount + 1)
		}
		
		// 权限错误，给出更明确的提示
		if (isPermissionError(response.data.code)) {
			console.error('[FeishuTools] 权限错误：飞书应用没有访问多维表格的权限')
			throw new Error('权限错误：飞书应用没有访问多维表格的权限，请检查应用权限配置。错误详情: ' + JSON.stringify(response.data))
		}
		
		throw new Error('添加失败: ' + JSON.stringify(response.data))
	}
}

/**
 * 更新记录
 */
async function updateRecord(params) {
	console.log('[FeishuTools] 更新记录:', JSON.stringify(params))
	
	const { baseToken, tableId, recordId, data } = params
	
	if (!baseToken || !tableId || !recordId || !data) {
		throw new Error('baseToken、tableId、recordId和data不能为空')
	}
	
	const tokenResult = await getAccessToken()
	const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${baseToken}/tables/${tableId}/records/${recordId}`
	
	console.log('[FeishuTools] 请求URL:', url)
	const response = await uniCloud.httpclient.request(url, {
		method: 'PUT',
		headers: {
			'Authorization': 'Bearer ' + tokenResult.accessToken,
			'Content-Type': 'application/json'
		},
		data: { fields: data },
		dataType: 'json'
	})
	
	console.log('[FeishuTools] 更新响应:', JSON.stringify(response.data))
	
	if (response.data.code === 0) {
		return {
			success: true,
			recordId: response.data.data.record.record_id,
			updatedTime: response.data.data.record.last_modified_time
		}
	} else {
		throw new Error('更新失败: ' + JSON.stringify(response.data))
	}
}

/**
 * 删除记录
 */
async function deleteRecord(params) {
	console.log('[FeishuTools] 删除记录:', JSON.stringify(params))
	
	const { baseToken, tableId, recordId } = params
	
	if (!baseToken || !tableId || !recordId) {
		throw new Error('baseToken、tableId和recordId不能为空')
	}
	
	const tokenResult = await getAccessToken()
	const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${baseToken}/tables/${tableId}/records/${recordId}`
	
	console.log('[FeishuTools] 请求URL:', url)
	const response = await uniCloud.httpclient.request(url, {
		method: 'DELETE',
		headers: {
			'Authorization': 'Bearer ' + tokenResult.accessToken
		},
		dataType: 'json'
	})
	
	console.log('[FeishuTools] 删除响应:', JSON.stringify(response.data))
	
	if (response.data.code === 0) {
		return {
			success: true,
			recordId: recordId
		}
	} else {
		throw new Error('删除失败: ' + JSON.stringify(response.data))
	}
}

/**
 * 批量添加记录
 */
async function batchAddRecords(params) {
	console.log('[FeishuTools] 批量添加记录:', JSON.stringify(params))
	
	const { baseToken, tableId, records } = params
	
	if (!baseToken || !tableId || !records || !Array.isArray(records)) {
		throw new Error('baseToken、tableId和records不能为空，records必须是数组')
	}
	
	const tokenResult = await getAccessToken()
	const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${baseToken}/tables/${tableId}/records/batch_create`
	
	console.log('[FeishuTools] 请求URL:', url)
	const response = await uniCloud.httpclient.request(url, {
		method: 'POST',
		headers: {
			'Authorization': 'Bearer ' + tokenResult.accessToken,
			'Content-Type': 'application/json'
		},
		data: { records: records.map(r => ({ fields: r })) },
		dataType: 'json'
	})
	
	console.log('[FeishuTools] 批量添加响应:', JSON.stringify(response.data))
	
	if (response.data.code === 0) {
		return {
			success: true,
			records: response.data.data.records
		}
	} else {
		throw new Error('批量添加失败: ' + JSON.stringify(response.data))
	}
}

/**
 * 批量获取素材临时下载URL（每次最多5个token，带缓存）
 */
async function getImageUrls(params) {
	console.log('[FeishuTools] 获取图片URL:', JSON.stringify(params))
	
	const { fileTokens } = params
	
	if (!fileTokens || !Array.isArray(fileTokens) || fileTokens.length === 0) {
		throw new Error('fileTokens不能为空，必须是数组')
	}
	
	const now = Date.now()
	const cachedResults = {}
	const tokensToRequest = []
	
	// 先检查缓存
	fileTokens.forEach(token => {
		const cached = imageUrlCache[token]
		if (cached && cached.expiresAt > now) {
			// 缓存有效，使用缓存
			cachedResults[token] = cached.url
			console.log('[FeishuTools] 使用缓存的图片URL:', token)
		} else {
			// 缓存无效或不存在，需要请求
			tokensToRequest.push(token)
		}
	})
	
	// 如果所有token都有有效缓存，直接返回
	if (tokensToRequest.length === 0) {
		console.log('[FeishuTools] 所有图片URL均命中缓存')
		return {
			success: true,
			urlMap: cachedResults
		}
	}
	
	// 需要请求的token，分批处理（每次最多5个）
	const tokenResult = await getAccessToken()
	const batchSize = 5
	const results = []
	
	for (let i = 0; i < tokensToRequest.length; i += batchSize) {
		const batch = tokensToRequest.slice(i, i + batchSize)
		
		// 构建URL参数：file_tokens={token1}&file_tokens={token2}...
		const paramsStr = batch.map(token => `file_tokens=${encodeURIComponent(token)}`).join('&')
		const url = `https://open.feishu.cn/open-apis/drive/v1/medias/batch_get_tmp_download_url?${paramsStr}`
		
		console.log('[FeishuTools] 请求URL:', url)
		
		const response = await uniCloud.httpclient.request(url, {
			method: 'GET',
			headers: {
				'Authorization': 'Bearer ' + tokenResult.accessToken
			},
			dataType: 'json'
		})
		
		console.log('[FeishuTools] 获取图片URL响应:', JSON.stringify(response.data))
		
		if (response.data.code === 0) {
			if (response.data.data && response.data.data.tmp_download_urls) {
				results.push(...response.data.data.tmp_download_urls)
			}
		} else {
			console.error('[FeishuTools] 获取图片URL失败:', JSON.stringify(response.data))
			// 继续处理下一批，不中断整体流程
		}
	}
	
	// 更新缓存并合并结果
	results.forEach(item => {
		if (item.file_token && item.tmp_download_url) {
			// 更新缓存，设置过期时间
			imageUrlCache[item.file_token] = {
				url: item.tmp_download_url,
				expiresAt: now + IMAGE_CACHE_EXPIRE_MS
			}
			cachedResults[item.file_token] = item.tmp_download_url
		}
	})
	
	console.log('[FeishuTools] 获取urlMap响应:', JSON.stringify(cachedResults))

	return {
		success: true,
		urlMap: cachedResults
	}
}

/**
 * 上传文件到飞书云文档
 * @param {Object} params
 * @param {string} params.baseToken - 多维表格Token
 * @param {string} params.fileName - 文件名
 * @param {string} params.fileContentBase64 - base64编码的文件内容
 * @returns {Promise<Object>} 上传结果，包含 fileToken
 */
async function uploadFile(params) {
	console.log('[FeishuTools] 上传文件:', JSON.stringify(params))
	
	const { baseToken, fileName, fileContentBase64 } = params
	
	if (!baseToken || !fileName || !fileContentBase64) {
		throw new Error('baseToken、fileName和fileContentBase64不能为空')
	}
	
	const tokenResult = await getAccessToken()
	
	const fileContent = Buffer.from(fileContentBase64, 'base64')
	
	const url = `https://open.feishu.cn/open-apis/drive/v1/medias/upload_all?file_name=${encodeURIComponent(fileName)}&parent_type=bitable_image&parent_node=${baseToken}`
	
	console.log('[FeishuTools] 请求URL:', url)
	
	return new Promise((resolve, reject) => {
		const https = require('https')
		const urlObj = new URL(url)
		
		const boundary = '---7MA4YWxkTrZu0gW'
		const boundaryStart = Buffer.from('--' + boundary + '\r\n', 'utf8')
		const contentDisposition = Buffer.from('Content-Disposition: form-data; name="file"; filename="' + fileName + '"\r\n', 'utf8')
		const contentType = Buffer.from('Content-Type: application/octet-stream\r\n\r\n', 'utf8')
		const boundaryEnd = Buffer.from('\r\n--' + boundary + '--\r\n', 'utf8')
		
		const body = Buffer.concat([boundaryStart, contentDisposition, contentType, fileContent, boundaryEnd])
		
		const options = {
			hostname: urlObj.hostname,
			port: 443,
			path: urlObj.pathname + urlObj.search,
			method: 'POST',
			headers: {
				'Authorization': 'Bearer ' + tokenResult.accessToken,
				'Content-Type': 'multipart/form-data; boundary=' + boundary,
				'Content-Length': body.length
			}
		}
		
		const req = https.request(options, (res) => {
			let data = ''
			res.on('data', (chunk) => {
				data += chunk
			})
			res.on('end', () => {
				console.log('[FeishuTools] 上传响应:', data)
				try {
					const response = JSON.parse(data)
					if (response.code === 0) {
						resolve({
							success: true,
							fileToken: response.data.file_token
						})
					} else {
						reject(new Error('上传失败: ' + JSON.stringify(response)))
					}
				} catch (e) {
					reject(new Error('解析响应失败: ' + data))
				}
			})
		})
		
		req.on('error', (e) => {
			console.error('[FeishuTools] 请求错误:', e)
			reject(new Error('请求失败: ' + e.message))
		})
		
		req.write(body)
		req.end()
	})
}

/**
 * 批量获取首页数据（减少云函数调用次数）
 * @param {Object} params
 * @param {string} params.baseToken - 多维表格Token
 * @param {string} params.childId - 儿童ID
 * @param {Object} params.tables - 表名到表ID的映射
 */
async function getHomeData(params) {
	console.log('[FeishuTools] 获取首页数据:', JSON.stringify(params))
	
	const { baseToken, childId, tables } = params
	
	if (!baseToken || !childId || !tables) {
		throw new Error('baseToken、childId和tables不能为空')
	}
	
	const tokenResult = await getAccessToken()
	const results = {
		tasks: [],
		rewards: [],
		textbooks: []
	}
	
	// 并行获取所有数据
	const promises = []
	
	// 1. 获取今日任务
	if (tables['任务表']) {
		promises.push((async () => {
			try {
				const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${baseToken}/tables/${tables['任务表']}/records/search`
				const response = await uniCloud.httpclient.request(url, {
					method: 'POST',
					headers: {
						'Authorization': 'Bearer ' + tokenResult.accessToken,
						'Content-Type': 'application/json'
					},
					data: {
						filter: buildFilter({ child_id: childId })
					},
					dataType: 'json'
				})
				if (response.data.code === 0) {
					results.tasks = response.data.data.items || []
				}
			} catch (error) {
				console.error('[FeishuTools] 获取任务数据失败:', error.message)
				results.tasks = []
			}
		})())
	}
	
	// 2. 获取兑换记录（最近3条）
	if (tables['兑换记录表']) {
		promises.push((async () => {
			try {
				const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${baseToken}/tables/${tables['兑换记录表']}/records/search`
				const response = await uniCloud.httpclient.request(url, {
					method: 'POST',
					headers: {
						'Authorization': 'Bearer ' + tokenResult.accessToken,
						'Content-Type': 'application/json'
					},
					data: {
						filter: buildFilter({ child_id: childId }),
						page_size: 3
					},
					dataType: 'json'
				})
				if (response.data.code === 0) {
					results.rewards = response.data.data.items || []
				}
			} catch (error) {
				console.error('[FeishuTools] 获取兑换记录失败:', error.message)
				results.rewards = []
			}
		})())
	}
	
	// 3. 获取教材数据
	if (tables['教材表']) {
		promises.push((async () => {
			try {
				const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${baseToken}/tables/${tables['教材表']}/records/search`
				const response = await uniCloud.httpclient.request(url, {
					method: 'POST',
					headers: {
						'Authorization': 'Bearer ' + tokenResult.accessToken,
						'Content-Type': 'application/json'
					},
					data: {
						filter: buildFilter({ child_id: childId })
					},
					dataType: 'json'
				})
				if (response.data.code === 0) {
					results.textbooks = response.data.data.items || []
				}
			} catch (error) {
				console.error('[FeishuTools] 获取教材数据失败:', error.message)
				results.textbooks = []
			}
		})())
	}
	
	// 等待所有请求完成
	await Promise.all(promises)
	
	console.log('[FeishuTools] 获取首页数据完成:', JSON.stringify(results))
	
	return {
		success: true,
		data: results
	}
}

// 导出方法
module.exports = {
	getAccessToken,
	getBaseList,
	getTableList,
	getTableFields,
	testConnection,
	queryRecords,
	addRecord,
	updateRecord,
	deleteRecord,
	batchAddRecords,
	getImageUrls,
	getHomeData,
	uploadFile
}
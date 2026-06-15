'use strict';

const { getAccessToken } = require('../utils/token')
const { buildFilter } = require('../utils/common')

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
	} catch (error) {
		console.error('[FeishuTools] 测试连接失败:', error)
		return {
			success: false,
			message: '连接失败: ' + error.message
		}
	}
	
	return {
		success: true,
		message: '连接成功'
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
 * 模糊搜索记录（使用contains操作符）
 */
async function searchRecords(params) {
	console.log('[FeishuTools] 模糊搜索记录:', JSON.stringify(params))
	
	const { baseToken, tableId, keyword, tableName, pageSize, pageToken } = params
	
	if (!baseToken || !tableId || !keyword) {
		throw new Error('baseToken、tableId和keyword不能为空')
	}
	
	const tokenResult = await getAccessToken()
	const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${baseToken}/tables/${tableId}/records/search`
	
	// 根据不同表名搜索不同字段
	let searchFields = ['name'] // 默认搜索name字段
	
	if (tableName === '任务模板表') {
		searchFields = ['template_title']
	} else if (tableName === '任务表') {
		searchFields = ['title']
	} else if (tableName === '教材表') {
		searchFields = ['name']
	}
	
	// 构建模糊搜索条件
	const conditions = searchFields.map(field => ({
		field_name: field,
		operator: "contains",
		value: [keyword]
	}))
	
	const requestData = {
		filter: {
			conjunction: "or",
			conditions: conditions
		}
	}
	
	if (pageSize) {
		requestData.page_size = pageSize
	}
	if (pageToken) {
		requestData.page_token = pageToken
	}
	
	console.log('[FeishuTools] 请求URL:', url)
	console.log('[FeishuTools] 请求数据:', JSON.stringify(requestData))
	
	const response = await uniCloud.httpclient.request(url, {
		method: 'POST',
		headers: {
			'Authorization': 'Bearer ' + tokenResult.accessToken,
			'Content-Type': 'application/json'
		},
		data: requestData,
		dataType: 'json'
	})
	
	console.log('[FeishuTools] 搜索响应:', JSON.stringify(response.data))
	
	if (response.data.code === 0) {
		return {
			success: true,
			data: response.data.data.items,
			total: response.data.data.total,
			pageToken: response.data.data.page_token,
			hasMore: response.data.has_more
		}
	} else {
		throw new Error('搜索失败: ' + JSON.stringify(response.data))
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
		const { isTokenError, isPermissionError } = require('../utils/token')
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
 * 获取单条记录
 */
async function getRecord(params) {
	console.log('[FeishuTools] 获取单条记录:', JSON.stringify(params))
	
	const { baseToken, tableId, recordId } = params
	
	if (!baseToken || !tableId || !recordId) {
		throw new Error('baseToken、tableId和recordId不能为空')
	}
	
	const tokenResult = await getAccessToken()
	const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${baseToken}/tables/${tableId}/records/${recordId}`
	
	console.log('[FeishuTools] 请求URL:', url)
	const response = await uniCloud.httpclient.request(url, {
		method: 'GET',
		headers: {
			'Authorization': 'Bearer ' + tokenResult.accessToken
		},
		dataType: 'json'
	})
	
	console.log('[FeishuTools] 获取响应:', JSON.stringify(response.data))
	
	if (response.data.code === 0) {
		const record = response.data.data.record
		return {
			success: true,
			data: {
				record_id: record.record_id,
				fields: record.fields,
				createdTime: record.created_time,
				updatedTime: record.updated_time
			}
		}
	} else {
		throw new Error('获取记录失败: ' + JSON.stringify(response.data))
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

module.exports = {
	getBaseList,
	getTableList,
	getTableFields,
	testConnection,
	queryRecords,
	searchRecords,
	addRecord,
	getRecord,
	updateRecord,
	deleteRecord,
	batchAddRecords
}

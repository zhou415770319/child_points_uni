'use strict';

const { getAccessToken } = require('../utils/token')

/**
 * 从知识库获取多维表格的 app_token
 * @param {string} token - 知识库节点token（从URL的wiki/后的部分获取）
 * @param {string} obj_type - 对象类型，固定为 'wiki'
 * @returns {Promise<Object>} { success: boolean, appToken: string, message: string }
 */
async function getBitableAppTokenFromWiki(token, obj_type) {
	console.log('[FeishuTools] 从知识库获取多维表格app_token, token:', token, ', obj_type:', obj_type)
	
	if (!token) {
		console.error('[FeishuTools] 错误：知识库节点token为空')
		throw new Error('知识库节点token不能为空')
	}
	
	const tokenResult = await getAccessToken()
	
	// 调用知识库节点信息API
	// 参考文档：https://open.feishu.cn/document/server-docs/docs/wiki-v2/space-node/get_node
	// 使用 GET 请求，通过 URL 查询参数传递 token 和 obj_type
	const queryParams = 'token=' + encodeURIComponent(token) + '&obj_type=' + encodeURIComponent(obj_type || 'wiki')
	const url = 'https://open.feishu.cn/open-apis/wiki/v2/spaces/get_node?' + queryParams
	
	console.log('[FeishuTools] 调用飞书API: GET', url)
	
	const response = await uniCloud.httpclient.request(url, {
		method: 'GET',
		headers: {
			'Authorization': 'Bearer ' + tokenResult.accessToken
		},
		dataType: 'json'
	})
	
	console.log('[FeishuTools] 知识库节点响应:', JSON.stringify(response.data))
	
	if (response.data.code === 0) {
		const node = response.data.data.node
		console.log('[FeishuTools] 节点类型:', node.obj_type)
		
		// 检查节点类型是否为多维表格
		if (node.obj_type === 'bitable') {
			const appToken = node.obj_token
			console.log('[FeishuTools] 获取多维表格app_token成功:', appToken)
			return {
				success: true,
				appToken: appToken,
				message: '获取成功'
			}
		} else {
			console.error('[FeishuTools] 节点类型不是多维表格:', node.obj_type)
			return {
				success: false,
				appToken: null,
				message: '节点类型不是多维表格，当前类型: ' + node.obj_type
			}
		}
	} else {
		console.error('[FeishuTools] 获取知识库节点信息失败:', JSON.stringify(response.data))
		return {
			success: false,
			appToken: null,
			message: '获取知识库节点信息失败: ' + JSON.stringify(response.data)
		}
	}
}

/**
 * 通过 baseToken 获取知识库节点信息（用于获取 obj_token）
 * @param {Object} params
 * @param {string} params.baseToken - 知识库节点token（baseToken）
 * @returns {Promise<Object>} { success: boolean, objToken: string, message: string }
 */
async function getNodeByToken(params) {
	console.log('[FeishuTools] 获取知识库节点信息:', JSON.stringify(params))
	
	const { baseToken } = params
	
	if (!baseToken) {
		console.error('[FeishuTools] 错误：baseToken为空')
		return {
			success: false,
			objToken: null,
			message: 'baseToken不能为空'
		}
	}
	
	const tokenResult = await getAccessToken()
	
	// 调用知识库节点信息API
	// 参考文档：https://open.feishu.cn/document/server-docs/docs/wiki-v2/space-node/get_node
	const queryParams = 'token=' + encodeURIComponent(baseToken) + '&obj_type=' + encodeURIComponent('wiki')
	const url = 'https://open.feishu.cn/open-apis/wiki/v2/spaces/get_node?' + queryParams
	
	console.log('[FeishuTools] 调用飞书API: GET', url)
	
	const response = await uniCloud.httpclient.request(url, {
		method: 'GET',
		headers: {
			'Authorization': 'Bearer ' + tokenResult.accessToken
		},
		dataType: 'json'
	})
	
	console.log('[FeishuTools] 知识库节点响应:', JSON.stringify(response.data))
	
	if (response.data.code === 0) {
		const node = response.data.data.node
		console.log('[FeishuTools] 节点类型:', node.obj_type)
		
		return {
			success: true,
			objToken: node.obj_token,
			message: '获取成功'
		}
	} else {
		console.error('[FeishuTools] 获取知识库节点信息失败:', JSON.stringify(response.data))
		return {
			success: false,
			objToken: null,
			message: '获取知识库节点信息失败: ' + JSON.stringify(response.data)
		}
	}
}

module.exports = {
	getBitableAppTokenFromWiki,
	getNodeByToken
}
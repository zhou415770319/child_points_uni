'use strict';

// Token缓存
let cachedToken = null
let tokenExpiresAt = 0

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

module.exports = {
	getAccessToken,
	isTokenError,
	isPermissionError
}
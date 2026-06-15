'use strict';

const { getAccessToken } = require('../utils/token')
const { getImageUrlCache, setImageUrlCache, IMAGE_CACHE_EXPIRE_MS } = require('../utils/common')
const FormData = require('form-data');

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
	const imageUrlCache = getImageUrlCache()
	
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
			setImageUrlCache(item.file_token, item.tmp_download_url, now + IMAGE_CACHE_EXPIRE_MS)
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
 * 上传文件到飞书云文档（用于多维表格图片字段）
 * @param {Object} params
 * @param {string} params.baseToken - 多维表格Token (app_token)
 * @param {string} params.fileName - 文件名
 * @param {string} params.fileContentBase64 - base64编码的文件内容
 * @returns {Promise<Object>} 上传结果，包含 fileToken
 */
async function uploadFile(params) {
	console.log('[FeishuTools] 上传文件开始:', JSON.stringify({
		baseToken: params.baseToken ? params.baseToken.substring(0, 10) + '...' : null,
		fileName: params.fileName,
		fileContentBase64Length: params.fileContentBase64 ? params.fileContentBase64.length : 0
	}))
	
	const { baseToken, parentNode, fileName, fileContentBase64 } = params
	
	if (!baseToken || !fileName || !fileContentBase64) {
		console.error('[FeishuTools] 参数缺失:', { baseToken: !!baseToken, fileName: !!fileName, fileContentBase64: !!fileContentBase64, parentNode: !!parentNode })
		return {
			success: false,
			message: '参数缺失：baseToken、fileName和fileContentBase64不能为空'
		}
	}

	const tokenResult = await getAccessToken()
	
	const fileContent = Buffer.from(fileContentBase64, 'base64')
	const fileSize = fileContent.length
	
	// 如果文件名没有扩展名，添加.jpg扩展名
	let uploadFileName = fileName
	if (!uploadFileName.includes('.')) {
		uploadFileName = uploadFileName + '.jpg'
	}
	
	// 根据飞书API文档，所有参数都放在请求体中（formData）
	const url = 'https://open.feishu.cn/open-apis/drive/v1/medias/upload_all'
	
	console.log('[FeishuTools] 请求URL:', url)

	try {
		console.log('[FeishuTools] 上传文件名:', {
			method: 'POST',
			headers: {
				'Authorization': 'Bearer ' + tokenResult.accessToken,
				'Content-Type': 'multipart/form-data; boundary=---7MA4YWxkTrZu0gW'
			},
			data: {
				file_name: 'abc.png',
				parent_type: 'bitable_image',
				parent_node: parentNode || baseToken,
				size: fileSize.toString(),
				file: fileContent  // 直接传递二进制Buffer
			},
			dataType: 'json'
		}, url)
		const form = new FormData();
		form.append('file', fileContent, { filename: uploadFileName });
		form.append('file_name', uploadFileName);
		form.append('parent_type', 'bitable_image');
		form.append('parent_node', parentNode || baseToken);
		form.append('size', fileSize.toString());
		
		const response = await uniCloud.httpclient.request(url, {
			method: 'POST',
			content: form.getBuffer(),
			headers: {
				...form.getHeaders(),
				'Authorization': 'Bearer ' + tokenResult.accessToken
			},
			dataType: 'json'
		})
		
		console.log('[FeishuTools] 上传响应状态码:', response.status)
		console.log('[FeishuTools] 上传响应头:', JSON.stringify(response.headers))
		console.log('[FeishuTools] 上传响应:', JSON.stringify(response.data))
		
		if (response.data && response.data.code === 0) {
			console.log('[FeishuTools] 上传成功，fileToken:', response.data.data.file_token)
			return {
				success: true,
				fileToken: response.data.data.file_token
			}
		} else {
			console.error('[FeishuTools] 上传失败，错误码:', response.data && response.data.code, '错误信息:', response.data && response.data.msg)
			return {
				success: false,
				message: response.data && response.data.msg ? response.data.msg : '上传失败',
				code: response.data && response.data.code
			}
		}
	} catch (error) {
		console.error('[FeishuTools] 上传异常:', error.message)
		console.error('[FeishuTools] 异常堆栈:', error.stack)
		return {
			success: false,
			message: '上传异常: ' + error.message
		}
	}
}

module.exports = {
	getImageUrls,
	uploadFile
}
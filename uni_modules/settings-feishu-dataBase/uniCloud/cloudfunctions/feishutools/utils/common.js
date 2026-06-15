'use strict';

// 图片URL缓存（key: file_token, value: { url, expiresAt }）
let imageUrlCache = {}
// 缓存有效期（24小时，与飞书临时下载链接有效期一致）
const IMAGE_CACHE_EXPIRE_MS = 24 * 60 * 60 * 1000

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
 * 获取图片URL缓存
 */
function getImageUrlCache() {
	return imageUrlCache
}

/**
 * 设置图片URL缓存
 */
function setImageUrlCache(token, url, expiresAt) {
	imageUrlCache[token] = { url, expiresAt }
}

/**
 * 获取缓存有效期
 */
function getImageCacheExpireMs() {
	return IMAGE_CACHE_EXPIRE_MS
}

module.exports = {
	buildFilter,
	getImageUrlCache,
	setImageUrlCache,
	getImageCacheExpireMs,
	IMAGE_CACHE_EXPIRE_MS
}

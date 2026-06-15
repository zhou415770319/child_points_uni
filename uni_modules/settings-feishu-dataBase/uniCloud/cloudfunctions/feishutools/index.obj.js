// 飞书工具云对象
'use strict';

// 导入工具模块
const { getAccessToken, isTokenError, isPermissionError } = require('./utils/token')
const { buildFilter, getImageUrlCache, setImageUrlCache, IMAGE_CACHE_EXPIRE_MS } = require('./utils/common')

// 导入业务模块
const {
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
} = require('./modules/bitable')

const {
	getBitableAppTokenFromWiki,
	getNodeByToken
} = require('./modules/wiki')

const {
	getImageUrls,
	uploadFile
} = require('./modules/media')

const {
	getHomeData,
	getScrollContent
} = require('./modules/home')

// 导出所有方法
module.exports = {
	getAccessToken,
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
	batchAddRecords,
	getImageUrls,
	getHomeData,
	getScrollContent,
	uploadFile,
	getBitableAppTokenFromWiki,
	getNodeByToken,
	isTokenError,
	isPermissionError,
	buildFilter,
	getImageUrlCache,
	setImageUrlCache,
	IMAGE_CACHE_EXPIRE_MS
}
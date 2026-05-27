/**
 * 飞书API工具类
 * @description 配置飞书多维表格，获取数据表并生成对应的接口代码
 * 通过云对象feishutools调用飞书API
 */

class FeishuApi {
	constructor() {
		this.feishutools = null
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
	 * 获取飞书访问令牌
	 * @returns {Promise<string>} accessToken
	 */
	async getAccessToken() {
		await this.initCloudObject()
		const result = await this.feishutools.getAccessToken()
		return result.accessToken
	}

	/**
	 * 获取多维表格列表
	 * @returns {Promise<Array>} 多维表格列表
	 */
	async getBaseList(baseToken) {
		await this.initCloudObject()
		const result = await this.feishutools.getBaseList(baseToken)
		return result.bases
	}

	/**
	 * 获取数据表列表
	 * @param {string} baseToken - 多维表格Token
	 * @returns {Promise<Array>} 数据表列表
	 */
	async getTableList(baseToken) {
		await this.initCloudObject()
		const result = await this.feishutools.getTableList(baseToken)
		return result.tables
	}

	/**
	 * 获取字段列表
	 * @param {string} baseToken - 多维表格Token
	 * @param {string} tableId - 数据表ID
	 * @returns {Promise<Array>} 字段列表
	 */
	async getTableFields(baseToken, tableId) {
		await this.initCloudObject()
		const result = await this.feishutools.getTableFields(baseToken, tableId)
		return result.fields
	}

	/**
	 * 测试连接
	 * @returns {Promise<Object>} { success: boolean, message: string }
	 */
	async testConnection() {
		await this.initCloudObject()
		return await this.feishutools.testConnection()
	}

	/**
	 * 生成接口代码
	 * @param {Object} apiConfig - API配置
	 * @returns {Array} 生成的接口列表
	 */
	generateApiCode(apiConfig) {
		var apis = []
		var basePath = '/api/' + apiConfig.apiName

		apiConfig.operations.forEach(function(op) {
			if (!op.enabled) return

			switch (op.type) {
				case 'list':
					apis.push({
						name: apiConfig.apiName + 'List',
						path: basePath,
						method: 'GET',
						code: this.generateListCode(apiConfig)
					})
					break
				case 'detail':
					apis.push({
						name: apiConfig.apiName + 'Detail',
						path: basePath + '/{id}',
						method: 'GET',
						code: this.generateDetailCode(apiConfig)
					})
					break
				case 'create':
					apis.push({
						name: apiConfig.apiName + 'Create',
						path: basePath,
						method: 'POST',
						code: this.generateCreateCode(apiConfig)
					})
					break
				case 'update':
					apis.push({
						name: apiConfig.apiName + 'Update',
						path: basePath + '/{id}',
						method: 'PUT',
						code: this.generateUpdateCode(apiConfig)
					})
					break
				case 'delete':
					apis.push({
						name: apiConfig.apiName + 'Delete',
						path: basePath + '/{id}',
						method: 'DELETE',
						code: this.generateDeleteCode(apiConfig)
					})
					break
			}
		}.bind(this))

		return apis
	}

	/**
	 * 生成列表查询代码
	 * @private
	 */
	generateListCode(config) {
		return '// ' + config.tableName + ' - 列表查询\nexport async function get' + config.apiName + 'List(params) {\n' +
			'  const db = uniCloud.database()\n' +
			'  const collection = db.collection(\'' + config.tableId + '\')\n' +
			'  \n' +
			'  let query = collection\n' +
			'  if (params && params.pageSize) {\n' +
			'    query = query.limit(params.pageSize)\n' +
			'  }\n' +
			'  if (params && params.pageToken) {\n' +
			'    query = query.offset(parseInt(params.pageToken))\n' +
			'  }\n' +
			'  \n' +
			'  const result = await query.get()\n' +
			'  return result\n' +
			'}\n'
	}

	/**
	 * 生成详情查询代码
	 * @private
	 */
	generateDetailCode(config) {
		return '// ' + config.tableName + ' - 详情查询\nexport async function get' + config.apiName + 'Detail(id) {\n' +
			'  const db = uniCloud.database()\n' +
			'  const result = await db.collection(\'' + config.tableId + '\')\n' +
			'    .doc(id)\n' +
			'    .get()\n' +
			'  return result\n' +
			'}\n'
	}

	/**
	 * 生成创建记录代码
	 * @private
	 */
	generateCreateCode(config) {
		return '// ' + config.tableName + ' - 创建记录\nexport async function create' + config.apiName + '(data) {\n' +
			'  const db = uniCloud.database()\n' +
			'  const result = await db.collection(\'' + config.tableId + '\')\n' +
			'    .add(data)\n' +
			'  return result\n' +
			'}\n'
	}

	/**
	 * 生成更新记录代码
	 * @private
	 */
	generateUpdateCode(config) {
		return '// ' + config.tableName + ' - 更新记录\nexport async function update' + config.apiName + '(id, data) {\n' +
			'  const db = uniCloud.database()\n' +
			'  const result = await db.collection(\'' + config.tableId + '\')\n' +
			'    .doc(id)\n' +
			'    .update(data)\n' +
			'  return result\n' +
			'}\n'
	}

	/**
	 * 生成删除记录代码
	 * @private
	 */
	generateDeleteCode(config) {
		return '// ' + config.tableName + ' - 删除记录\nexport async function delete' + config.apiName + '(id) {\n' +
			'  const db = uniCloud.database()\n' +
			'  const result = await db.collection(\'' + config.tableId + '\')\n' +
			'    .doc(id)\n' +
			'    .remove()\n' +
			'  return result\n' +
			'}\n'
	}

	/**
	 * 保存飞书配置
	 * @param {Object} config - 飞书配置
	 */
	saveConfig(config) {
		uni.setStorageSync('feishu-database-config', JSON.stringify(config))
	}

	/**
	 * 获取保存的飞书配置
	 * @returns {Object|null} 飞书配置
	 */
	getConfig() {
		var config = uni.getStorageSync('feishu-database-config')
		return config ? JSON.parse(config) : null
	}

	/**
	 * 保存API配置列表
	 * @param {Array} configs - API配置列表
	 */
	saveApiConfigs(configs) {
		uni.setStorageSync('feishu-api-configs', JSON.stringify(configs))
	}

	/**
	 * 获取API配置列表
	 * @returns {Array} API配置列表
	 */
	getApiConfigs() {
		var configs = uni.getStorageSync('feishu-api-configs')
		return configs ? JSON.parse(configs) : []
	}

	/**
	 * 保存数据表列表
	 * @param {Array} tables - 数据表列表
	 */
	saveTableList(tables) {
		uni.setStorageSync('feishu-table-list', JSON.stringify(tables))
	}

	/**
	 * 获取保存的数据表列表
	 * @returns {Array} 数据表列表
	 */
	getTableListSaved() {
		var tables = uni.getStorageSync('feishu-table-list')
		return tables ? JSON.parse(tables) : []
	}

	/**
	 * 清空所有飞书配置（包括token和数据表数据）
	 */
	clearConfig() {
		uni.removeStorageSync('feishu-database-config')
		uni.removeStorageSync('feishu-table-list')
		uni.removeStorageSync('feishu-api-configs')
	}
}

export var feishuApi = new FeishuApi()
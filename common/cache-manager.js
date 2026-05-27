import { feishuRequest } from './feishu-request.js'

/**
 * 通用缓存管理器
 * 支持缓存优先机制：优先从缓存获取，缓存为空或强制刷新时从云函数请求
 */
class CacheManager {
  /**
   * 从飞书多维表格查询数据（支持缓存优先）
   * @param {string} tableName - 表格名称
   * @param {string} cacheKey - 缓存键名
   * @param {boolean} forceRefresh - 是否强制刷新（覆盖全局设置）
   * @param {string} source - 调用来源标识
   * @returns {Promise<Object|null>} - 返回数据或null
   */
  static async queryWithCache(tableName, cacheKey, forceRefresh = null, source = 'unknown') {
    // 获取刷新策略：参数优先，其次全局配置，最后默认false（缓存优先）
    const shouldRefresh = forceRefresh !== null 
      ? forceRefresh 
      : this.getForceRefresh()

    // 如果不是强制刷新，先尝试从缓存获取
    if (!shouldRefresh) {
      const cached = this.getCache(cacheKey)
      if (cached) {
        console.log(`[CacheManager] 使用缓存数据 (表: ${tableName}, 来源: ${source})`)
        return { success: true, data: cached }
      }
      console.log(`[CacheManager] 缓存为空，开始从云函数加载... (表: ${tableName}, 来源: ${source})`)
    }

    // 强制刷新或缓存为空，从云函数请求
    try {
      console.log(`[CacheManager] 开始查询数据... (表: ${tableName}, 来源: ${source}, 刷新: ${shouldRefresh})`)
      const result = await feishuRequest.queryRecords(tableName)
      
      if (result.success) {
        // 缓存数据
        this.setCache(cacheKey, result.data)
        console.log(`[CacheManager] 数据查询成功并缓存 (表: ${tableName}, 数量: ${result.data.length})`)
        return result
      } else {
        console.log(`[CacheManager] 数据查询失败 (表: ${tableName}):`, result.message)
        return result
      }
    } catch (error) {
      console.error(`[CacheManager] 查询数据异常 (表: ${tableName}, 来源: ${source}):`, error)
      return { success: false, message: error.message }
    }
  }

  /**
   * 获取缓存数据
   * @param {string} key - 缓存键名
   * @returns {any} - 缓存数据
   */
  static getCache(key) {
    const stored = uni.getStorageSync(key)
    return stored ? JSON.parse(stored) : null
  }

  /**
   * 设置缓存数据
   * @param {string} key - 缓存键名
   * @param {any} value - 缓存值
   */
  static setCache(key, value) {
    uni.setStorageSync(key, JSON.stringify(value))
  }

  /**
   * 清除指定缓存
   * @param {string} key - 缓存键名
   */
  static clearCache(key) {
    uni.removeStorageSync(key)
    console.log(`[CacheManager] 缓存已清除: ${key}`)
  }

  /**
   * 清除所有缓存
   */
  static clearAllCache() {
    uni.clearStorageSync()
    console.log('[CacheManager] 所有缓存已清除')
  }

  /**
   * 获取全局刷新配置
   * @returns {boolean} - 是否强制刷新
   */
  static getForceRefresh() {
    try {
      const app = getApp({ allowDefault: true })
      return app.globalData?.forceRefresh || false
    } catch (error) {
      console.warn('[CacheManager] 获取全局刷新配置失败:', error)
      return false
    }
  }

  /**
   * 设置全局刷新配置
   * @param {boolean} value - 是否强制刷新
   */
  static setForceRefresh(value) {
    try {
      const app = getApp({ allowDefault: true })
      app.globalData.forceRefresh = value
      console.log('[CacheManager] 全局刷新配置已设置为:', value)
    } catch (error) {
      console.error('[CacheManager] 设置全局刷新配置失败:', error)
    }
  }

  /**
   * 添加数据后刷新相关缓存
   * @param {string} tableName - 表格名称
   * @param {string} cacheKey - 缓存键名
   */
  static async refreshAfterAdd(tableName, cacheKey) {
    // 添加数据后清除缓存，下次查询时会重新获取
    this.clearCache(cacheKey)
    console.log(`[CacheManager] 添加数据后清除缓存: ${cacheKey}`)
  }

  /**
   * 更新数据后刷新相关缓存
   * @param {string} tableName - 表格名称
   * @param {string} cacheKey - 缓存键名
   * @param {Array} currentData - 当前数据列表
   * @param {Object} updatedItem - 更新的数据项
   */
  static async refreshAfterUpdate(tableName, cacheKey, currentData, updatedItem) {
    // 在内存中更新数据
    if (currentData && updatedItem) {
      const index = currentData.findIndex(item => item.id === updatedItem.id)
      if (index >= 0) {
        currentData[index] = { ...currentData[index], ...updatedItem }
      }
    }
    // 清除缓存
    this.clearCache(cacheKey)
    console.log(`[CacheManager] 更新数据后清除缓存: ${cacheKey}`)
  }

  /**
   * 删除数据后刷新相关缓存
   * @param {string} tableName - 表格名称
   * @param {string} cacheKey - 缓存键名
   * @param {Array} currentData - 当前数据列表
   * @param {string} deleteId - 删除的数据ID
   */
  static async refreshAfterDelete(tableName, cacheKey, currentData, deleteId) {
    // 在内存中删除数据
    if (currentData && deleteId) {
      const index = currentData.findIndex(item => item.id === deleteId)
      if (index >= 0) {
        currentData.splice(index, 1)
      }
    }
    // 清除缓存
    this.clearCache(cacheKey)
    console.log(`[CacheManager] 删除数据后清除缓存: ${cacheKey}`)
  }
}

export default CacheManager

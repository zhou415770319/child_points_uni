import { feishuRequest } from './feishu-request.js'

class CategoryManager {
  /**
   * 加载分类数据（支持缓存优先机制）
   * @param {string} source - 调用来源标识
   * @param {boolean} forceRefresh - 是否强制刷新（覆盖全局设置）
   * @returns {Promise<Object|null>} - 返回分类数据或null
   */
  static async loadCategories(source = 'unknown', forceRefresh = null) {
    // 获取刷新策略：参数优先，其次全局配置，最后默认false（缓存优先）
    const shouldRefresh = forceRefresh !== null 
      ? forceRefresh 
      : this.getForceRefresh()
    debugger
    // 如果不是强制刷新，先尝试从缓存获取
    if (!shouldRefresh) {
      const cached = this.getCategories()
      if (cached) {
        console.log(`[CategoryManager] 使用缓存分类数据 (来源: ${source})`)
        return cached
      }
      console.log(`[CategoryManager] 缓存为空，开始从云函数加载... (来源: ${source})`)
    }

    // 强制刷新或缓存为空，从云函数请求
    try {
      console.log(`[CategoryManager] 开始加载分类数据... (来源: ${source}, 刷新: ${shouldRefresh})`)
      const result = await feishuRequest.queryRecords('分类表')
      console.log(`[CategoryManager] 开始加载分类数据... (来源: 分类表, 结果: ${result})`)
      
      if (result.success && result.data && result.data && result.data.length > 0) {
        const item = result.data[0]
        // 通用处理：动态获取所有分类字段
        const categories = {
          id: item.record_id,
          categoryId: item.fields.id || ''
        }
        
        // 动态遍历 fields 中的所有字段
        for (const key in item.fields) {
          // 跳过已处理的 id 字段
          if (key === 'id') {
            continue
          }
          // 其他字段默认为空数组
          categories[key] = item.fields[key] || []
        }
        
        // 通用处理：动态格式化所有分类字段（排除 id 和 categoryId）
        const formattedCategories = {}
        const excludeFields = ['id', 'categoryId']
        
        for (const key in categories) {
          if (excludeFields.includes(key)) {
            continue
          }
          
          const fieldData = categories[key]
          if (Array.isArray(fieldData)) {
            formattedCategories[key] = fieldData.map(item => {
              // 处理飞书多维表格返回格式：可能是字符串，也可能是 {text: "值"} 对象
              const name = typeof item === 'string' ? item : (item.text || '')
              
              // 特殊处理 role 字段的显示文本
              if (key === 'role') {
                return {
                  label: name === 'parent' ? '家长' : '儿童',
                  value: name,
                  checked: false
                }
              }
              // 其他字段通用处理
              return {
                label: name,
                value: name,
                checked: false
              }
            })
          }
        }
        
        uni.setStorageSync('categories', JSON.stringify(formattedCategories))
        console.log(`[CategoryManager] 分类数据加载成功 (来源: ${source}):`, JSON.stringify(formattedCategories, null))
        
        return formattedCategories
      } else {
        console.log(`[CategoryManager] 分类数据为空或加载失败 (来源: ${source}):`, result.message)
        return null
      }
    } catch (error) {
      console.error(`[CategoryManager] 加载分类数据异常 (来源: ${source}):`, error)
      return null
    }
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
      console.warn('[CategoryManager] 获取全局刷新配置失败:', error)
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
      console.log('[CategoryManager] 全局刷新配置已设置为:', value)
    } catch (error) {
      console.error('[CategoryManager] 设置全局刷新配置失败:', error)
    }
  }

  /**
   * 获取缓存的分类数据
   * @returns {Object|null} - 分类数据
   */
  static getCategories() {
    const stored = uni.getStorageSync('categories')
    return stored ? JSON.parse(stored) : null
  }

  /**
   * 获取年级选项
   * @returns {Array} - 年级选项数组
   */
  static getGradeOptions() {
    const categories = this.getCategories()
    return categories?.grade || []
  }

  /**
   * 获取爱好选项
   * @returns {Array} - 爱好选项数组
   */
  static getHobbyOptions() {
    const categories = this.getCategories()
    return categories?.hobby || []
  }

  /**
   * 获取角色选项
   * @returns {Array} - 角色选项数组
   */
  static getRoleOptions() {
    const categories = this.getCategories()
    return categories?.role || []
  }

  /**
   * 清除分类缓存
   */
  static clearCache() {
    uni.removeStorageSync('categories')
    console.log('[CategoryManager] 分类缓存已清除')
  }
}

export default CategoryManager

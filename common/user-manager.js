import { feishuRequest } from './feishu-request.js'

/**
 * 用户信息管理模块
 * 统一管理家长和儿童的信息获取
 */
class UserManager {
  /**
   * 获取当前登录的用户角色
   * @returns {string} - parent 或 child
   */
  static getUserRole() {
    return uni.getStorageSync('userRole') || 'parent'
  }

  /**
   * 设置当前登录的用户角色
   * @param {string} role - parent 或 child
   */
  static setUserRole(role) {
    uni.setStorageSync('userRole', role)
  }

  /**
   * 获取当前登录的家长信息（从用户表获取）
   * @param {boolean} forceRefresh - 是否强制刷新
   * @returns {Promise<Object|null>} - 家长信息
   */
  static async getCurrentParent(forceRefresh = false) {
    // 如果不是强制刷新，先尝试从缓存获取
    if (!forceRefresh) {
      const cached = uni.getStorageSync('currentUser')
      if (cached) {
        try {
          const user = JSON.parse(cached)
          // 如果是完整的用户对象（包含 fields），返回 fields 数据
          if (user.fields) {
            return user.fields
          }
          return user
        } catch (e) {
          console.warn('[UserManager] 解析缓存的用户信息失败:', e)
        }
      }
    }

    // 从用户表获取最新数据
    try {
      const currentUser = JSON.parse(uni.getStorageSync('currentUser') || '{}')
      const phone = currentUser.fields?.phone || currentUser.phone || ''
      
      if (!phone) {
        console.warn('[UserManager] 未找到登录用户的手机号')
        return null
      }

      const result = await feishuRequest.queryOne('用户表', { phone })
      if (result && result.fields) {
        // 更新缓存
        uni.setStorageSync('currentUser', JSON.stringify(result))
        return result.fields
      }
      return null
    } catch (error) {
      console.error('[UserManager] 获取家长信息失败:', error)
      return null
    }
  }

  /**
   * 获取当前登录的儿童信息（从儿童表获取）
   * @param {boolean} forceRefresh - 是否强制刷新
   * @returns {Promise<Object|null>} - 儿童信息
   */
  static async getCurrentChild(forceRefresh = false) {
    // 如果不是强制刷新，先尝试从缓存获取
    if (!forceRefresh) {
      const cached = uni.getStorageSync('currentChild')
      if (cached) {
        try {
          return JSON.parse(cached)
        } catch (e) {
          console.warn('[UserManager] 解析缓存的儿童信息失败:', e)
        }
      }
    }

    // 从儿童表获取最新数据
    try {
      const currentChild = JSON.parse(uni.getStorageSync('currentChild') || '{}')
      // 使用 child_id 作为业务ID，而不是 record_id
      const childId = currentChild.child_id || currentChild.id || ''
      
      if (!childId) {
        console.warn('[UserManager] 未找到当前儿童的ID')
        return null
      }

      // 通过 child_id 查询儿童表
      const result = await feishuRequest.queryRecords('儿童表', { child_id: childId })
      if (result.success && result.data && result.data.length > 0) {
        const child = result.data[0]
        
        // 获取头像URL
        let avatarUrl = ''
        if (child.fields.avatar && child.fields.avatar.length > 0) {
          const fileToken = child.fields.avatar[0].file_token
          await feishuRequest.initCloudObject()
          const urlResult = await feishuRequest.feishutools.getImageUrls({
            fileTokens: [fileToken]
          })
          if (urlResult.success && urlResult.urlMap && urlResult.urlMap[fileToken]) {
            avatarUrl = urlResult.urlMap[fileToken]
          }
        }
        
        const childInfo = {
          id: child.record_id,
          child_id: child.fields.child_id || child.record_id,
          name: child.fields.name || '',
          avatar: avatarUrl || '👦',
          age: child.fields.age || 0,
          grade: child.fields.grade || '',
          hobby: child.fields.hobby ? (typeof child.fields.hobby === 'string' ? child.fields.hobby.split('、') : child.fields.hobby) : [],
          total_points: child.fields.total_points || 0,
          parent_account: child.fields.parent_account || ''
        }
        // 更新缓存
        uni.setStorageSync('currentChild', JSON.stringify(childInfo))
        return childInfo
      }
      return null
    } catch (error) {
      console.error('[UserManager] 获取儿童信息失败:', error)
      return null
    }
  }

  /**
   * 获取当前登录用户的信息（根据角色自动判断）
   * @param {boolean} forceRefresh - 是否强制刷新
   * @returns {Promise<Object|null>} - 用户信息
   */
  static async getCurrentUser(forceRefresh = false) {
    const role = this.getUserRole()
    if (role === 'parent') {
      return await this.getCurrentParent(forceRefresh)
    } else {
      return await this.getCurrentChild(forceRefresh)
    }
  }

  /**
   * 获取家长绑定的所有儿童列表（从儿童表获取）
   * @param {string} parentPhone - 家长手机号
   * @returns {Promise<Array>} - 儿童列表
   */
  static async getChildrenByParent(parentPhone) {
    try {
      const result = await feishuRequest.queryRecords('儿童表', { parent_account: parentPhone })
      if (result.success && result.data && result.data.length > 0) {
        console.log('儿童表----result.data',result.data);
        
        // 收集头像fileToken
        const avatarTokens = []
        result.data.forEach(item => {
          if (item.fields.avatar && item.fields.avatar.length > 0) {
            avatarTokens.push(item.fields.avatar[0].file_token)
          }
        })
        
        // 获取头像URL
        let avatarUrlMap = {}
        if (avatarTokens.length > 0) {
          await feishuRequest.initCloudObject()
          const urlResult = await feishuRequest.feishutools.getImageUrls({
            fileTokens: avatarTokens
          })
          if (urlResult.success && urlResult.urlMap) {
            avatarUrlMap = urlResult.urlMap
          }
        }
        
        return result.data.map(item => {
          let avatarUrl = ''
          if (item.fields.avatar && item.fields.avatar.length > 0) {
            const fileToken = item.fields.avatar[0].file_token
            avatarUrl = avatarUrlMap[fileToken] || ''
          }
          
          return {
            id: item.fields.child_id,
            child_id: item.fields.child_id || '',
            parent_account: item.fields.parent_account || '',
            name: item.fields.name[0].text || '',
            avatar: avatarUrl || '👦',
            age: item.fields.age || 0,
            grade: item.fields.grade || '',
            hobby: item.fields.hobby ? (typeof item.fields.hobby === 'string' ? item.fields.hobby.split('、') : item.fields.hobby) : [],
            total_points: item.fields.total_points || 0,
            parent_account: item.fields.parent_account || ''
          }
        })
      }
      return []
    } catch (error) {
      console.error('[UserManager] 获取儿童列表失败:', error)
      return []
    }
  }

  /**
   * 设置当前儿童
   * @param {Object} child - 儿童对象
   */
  static setCurrentChild(child) {
    uni.setStorageSync('currentChild', JSON.stringify(child))
  }

  /**
   * 设置当前家长
   * @param {Object} parent - 家长对象
   */
  static setCurrentParent(parent) {
    uni.setStorageSync('currentUser', JSON.stringify(parent))
  }

  /**
   * 清除用户缓存
   */
  static clearUserCache() {
    uni.removeStorageSync('currentUser')
    uni.removeStorageSync('currentChild')
    uni.removeStorageSync('userRole')
    console.log('[UserManager] 用户缓存已清除')
  }

  /**
   * 判断是否已登录
   * @returns {boolean} - 是否已登录
   */
  static isLoggedIn() {
    const role = this.getUserRole()
    const currentUser = uni.getStorageSync('currentUser')
    return role && currentUser
  }

  /**
   * 检查是否是家长角色
   * @returns {boolean} - 是否是家长
   */
  static isParent() {
    return this.getUserRole() === 'parent'
  }

  /**
   * 检查是否是儿童角色
   * @returns {boolean} - 是否是儿童
   */
  static isChild() {
    return this.getUserRole() === 'child'
  }
}

export default UserManager

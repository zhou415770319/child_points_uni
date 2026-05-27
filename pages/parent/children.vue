<template>
	<!-- 儿童管理页面 -->
	<view class="container">
		<!-- 主内容区域 -->
		<view class="section">
			<!-- 区域头部：标题和添加按钮 -->
			<view class="section-header">
				<text class="section-title">👧 我的孩子</text>
				<button class="add-btn" @click="showAddModal = true">+ 添加</button>
			</view>
			
			<!-- 儿童列表网格 -->
			<view class="children-grid">
				<view class="child-card" v-for="child in children" :key="child.id" @click="viewChild(child)">
					<view class="child-avatar">
						<image v-if="child.avatar && child.avatar.startsWith('http')" class="avatar-img" :src="child.avatar" mode="aspectFill" />
						<text v-else>{{ child.name.charAt(0) }}</text>
					</view>
					<text class="child-name">{{ child.name }}</text>
					<text class="child-detail">{{ child.grade }} · {{ child.age }}岁</text>
					<view class="child-stats">
						<text class="stat">{{ child.total_points }}积分</text>
					</view>
					<view class="child-actions">
						<text class="action-btn edit" @click.stop="editChild(child)">✏️</text>
						<text class="action-btn delete" @click.stop="deleteChild(child)">🗑️</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 添加/编辑儿童弹窗 -->
		<view class="modal-overlay" v-if="showAddModal" @click="closeModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">{{ editingChild ? '编辑儿童' : '添加儿童' }}</text>
					<text class="modal-close" @click="closeModal">✕</text>
				</view>
				<view class="modal-body">
					<!-- 姓名输入 -->
					<view class="form-item">
						<text class="form-label">姓名</text>
						<input class="form-input" v-model="formData.name" placeholder="请输入姓名" />
					</view>
					
					<!-- 年龄输入 -->
					<view class="form-item">
						<text class="form-label">年龄</text>
						<input class="form-input" type="number" v-model="formData.age" placeholder="请输入年龄" />
					</view>
					
					<!-- 年级选择：使用select下拉框 -->
					<view class="form-item">
						<text class="form-label">年级</text>
						<view class="form-select-wrapper">
							<select class="form-select" v-model="formData.grade">
								<option value="" disabled>请选择年级</option>
								<option v-for="grade in grades" :key="grade" :value="grade">{{ grade }}</option>
							</select>
						</view>
					</view>
					
					<!-- 爱好选择：点击弹出多选弹窗 -->
					<view class="form-item">
						<text class="form-label">爱好</text>
						<view class="form-picker" @click="showHobbyPicker = true">
							{{ formData.hobby.length > 0 ? formData.hobby.join('、') : '请选择爱好' }}
							<text class="picker-arrow">›</text>
						</view>
					</view>
				</view>
				<view class="modal-footer">
					<button class="btn btn-secondary" @click="closeModal">取消</button>
					<button class="btn btn-primary" @click="saveChild">保存</button>
				</view>
			</view>
		</view>

		<!-- 爱好多选弹窗 -->
		<view class="modal-overlay" v-if="showHobbyPicker" @click="showHobbyPicker = false">
			<view class="modal-content hobby-modal" @click.stop>
				<view class="modal-header">
					<text class="modal-title">选择爱好</text>
					<text class="modal-close" @click="showHobbyPicker = false">✕</text>
				</view>
				<view class="modal-body">
					<view class="hobby-grid">
						<view 
							v-for="hobby in hobbies" 
							:key="hobby.value"
							class="hobby-tag"
							:class="{ active: formData.hobby.includes(hobby.value) }"
							@click="toggleHobby(hobby.value)"
						>
							{{ hobby.label }}
						</view>
					</view>
				</view>
				<view class="modal-footer">
					<button class="btn btn-secondary" @click="showHobbyPicker = false">取消</button>
					<button class="btn btn-primary" @click="showHobbyPicker = false">确定</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	// 导入飞书请求工具、分类管理器、缓存管理器和用户管理器
	import { feishuRequest } from '@/common/feishu-request.js'
	import CategoryManager from '@/common/category-manager.js'
	import CacheManager from '@/common/cache-manager.js'
	import UserManager from '@/common/user-manager.js'

	/**
	 * 儿童管理页面组件
	 * 功能：展示儿童列表、添加/编辑/删除儿童信息
	 */
	export default {
		data() {
			return {
				children: [],           // 儿童列表数据
				showAddModal: false,    // 添加/编辑弹窗显示状态
				editingChild: null,     // 当前编辑的儿童对象
				formData: {             // 表单数据
					name: '',           // 姓名
					age: '',            // 年龄
					grade: '',          // 年级（通过select选择）
					hobby: []           // 爱好（多选）
				},
				grades: [],            // 年级选项列表（从分类表获取）
				hobbies: [],           // 爱好选项列表（从分类表获取）
				showHobbyPicker: false // 爱好多选弹窗显示状态
			}
		},
		/**
		 * 页面加载时初始化数据
		 */
		onLoad() {
			this.loadCategories()  // 加载分类数据（年级、爱好）
			this.loadChildren()    // 加载儿童列表
		},
		methods: {
			/**
			 * 加载分类数据（年级和爱好）
			 * 从CategoryManager获取缓存的分类数据，若无则使用默认值
			 */
			async loadCategories() {
				const gradeOptions = CategoryManager.getGradeOptions()
				const hobbyOptions = CategoryManager.getHobbyOptions()
				
				// 设置年级选项
				if (gradeOptions.length > 0) {
					this.grades = gradeOptions.map(g => g.label)
				} else {
					this.grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
				}
				
				// 设置爱好选项
				if (hobbyOptions.length > 0) {
					this.hobbies = hobbyOptions
				} else {
					this.hobbies = [
						{ label: '编程', value: '编程' },
						{ label: '画画', value: '画画' },
						{ label: '音乐', value: '音乐' },
						{ label: '阅读', value: '阅读' },
						{ label: '运动', value: '运动' }
					]
				}
			},
			/**
			 * 从飞书多维表格加载儿童列表数据（支持缓存优先）
			 */
			async loadChildren() {
				uni.showLoading({ title: '加载中...' })
				try {
					// 使用缓存管理器加载数据：优先从缓存获取，缓存为空或强制刷新时从云函数请求
					const result = await CacheManager.queryWithCache('儿童表', 'children_cache', null, 'children-page')
					
					if (result.success) {
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
						
						this.children = result.data.map(item => {
							let avatarUrl = ''
							if (item.fields.avatar && item.fields.avatar.length > 0) {
								const fileToken = item.fields.avatar[0].file_token
								avatarUrl = avatarUrlMap[fileToken] || ''
							}
							
							// 处理 hobby 字段：如果是字符串则分割，否则直接使用（可能是数组或其他类型）
							let hobbyData = []
							if (item.fields.hobby) {
								hobbyData = typeof item.fields.hobby === 'string' 
									? item.fields.hobby.split('、') 
									: (Array.isArray(item.fields.hobby) ? item.fields.hobby : [])
							}
							
							return {
								id: item.record_id,
								name: item.fields.name[0].text || '',
								avatar: avatarUrl || '👦',
								age: item.fields.age || 0,
								grade: item.fields.grade || '',
								hobby: hobbyData,
								total_points: item.fields.total_points || 0,
								parent_account: item.fields.parent_account || ''
							}
						})
					} else {
						console.warn('加载儿童数据失败:', result.message)
					}
				} catch (error) {
					console.error('加载儿童数据异常:', error)
					uni.showToast({ title: '加载失败', icon: 'none' })
				} finally {
					uni.hideLoading()
				}
			},
			/**
			 * 查看儿童详情（预留方法）
			 * @param {Object} child - 儿童对象
			 */
			viewChild(child) {
				uni.showToast({ title: `查看 ${child.name}`, icon: 'none' })
			},
			/**
			 * 编辑儿童信息
			 * @param {Object} child - 要编辑的儿童对象
			 */
			editChild(child) {
				this.editingChild = child
				this.formData = {
					name: child.name,
					age: child.age.toString(),
					grade: child.grade,
					hobby: Array.isArray(child.hobby) ? child.hobby : []
				}
				this.showAddModal = true
			},
			/**
			 * 删除儿童（带确认弹窗）
			 * @param {Object} child - 要删除的儿童对象
			 */
			async deleteChild(child) {
				uni.showModal({
					title: '确认删除',
					content: `确定要删除 ${child.name} 吗？`,
					success: async (res) => {
						if (res.confirm) {
							uni.showLoading({ title: '删除中...' })
							try {
								const result = await feishuRequest.deleteRecord('儿童表', child.id)
								if (result.success) {
									// 删除成功后清除缓存
									await CacheManager.refreshAfterDelete('儿童表', 'children_cache', this.children, child.id)
									uni.showToast({ title: '删除成功', icon: 'success' })
								} else {
									uni.showToast({ title: result.message || '删除失败', icon: 'none' })
								}
							} catch (error) {
								console.error('删除儿童失败:', error)
								uni.showToast({ title: '删除失败', icon: 'none' })
							} finally {
								uni.hideLoading()
							}
						}
					}
				})
			},
			/**
			 * 切换爱好选择状态（多选）
			 * @param {string} hobby - 爱好名称
			 */
			toggleHobby(hobby) {
				const index = this.formData.hobby.indexOf(hobby)
				if (index > -1) {
					this.formData.hobby.splice(index, 1)
				} else {
					this.formData.hobby.push(hobby)
				}
			},
			/**
			 * 关闭弹窗并重置表单
			 */
			closeModal() {
				this.showAddModal = false
				this.editingChild = null
				this.formData = { name: '', age: '', grade: '', hobby: [] }
			},
			/**
			 * 保存儿童信息（添加或编辑）
			 */
			async saveChild() {
				// 表单验证
				if (!this.formData.name || !this.formData.age || !this.formData.grade) {
					uni.showToast({ title: '请填写完整信息', icon: 'none' })
					return
				}

				uni.showLoading({ title: '保存中...' })
				
				try {
					// 从UserManager获取当前登录的家长账号（从用户表获取）
					const parent = await UserManager.getCurrentParent()
					const parentAccount = parent?.phone || ''
					
					// 构建飞书多维表格的数据格式（直接传字符串，不要包装成数组）
					const childData = {
						name: this.formData.name,
						age: parseInt(this.formData.age),
						grade: this.formData.grade,
						hobby: this.formData.hobby,
						total_points: this.editingChild ? this.editingChild.total_points : 0,  // 编辑时保留原积分，新增时设为0
						parent_account: parentAccount
					}


					if (this.editingChild) {
						// 编辑模式：更新已有记录
						const result = await feishuRequest.updateRecord('儿童表', this.editingChild.id, childData)
						if (result.success) {
							const updatedItem = {
								id: this.editingChild.id,
								name: this.formData.name,
								age: parseInt(this.formData.age),
								grade: this.formData.grade,
								hobby: this.formData.hobby
							}
							const index = this.children.findIndex(c => c.id === this.editingChild.id)
							if (index >= 0) {
								this.children[index] = { ...this.children[index], ...updatedItem }
							}
							// 更新成功后清除缓存
							await CacheManager.refreshAfterUpdate('儿童表', 'children_cache', this.children, updatedItem)
							uni.showToast({ title: '修改成功', icon: 'success' })
						} else {
							uni.showToast({ title: result.message || '修改失败', icon: 'none' })
						}
					} else {
						// 添加模式：创建新记录
						const result = await feishuRequest.addRecord('儿童表', childData)
						if (result.success) {
							this.children.push({
								id: result.recordId,
								name: this.formData.name,
								age: parseInt(this.formData.age),
								grade: this.formData.grade,
								hobby: this.formData.hobby,
								parent_account: parentAccount
							})
							// 添加成功后清除缓存
							await CacheManager.refreshAfterAdd('儿童表', 'children_cache')
							uni.showToast({ title: '添加成功', icon: 'success' })
						} else {
							uni.showToast({ title: result.message || '添加失败', icon: 'none' })
						}
					}
				} catch (error) {
					console.error('保存儿童失败:', error)
					uni.showToast({ title: '保存失败', icon: 'none' })
				} finally {
					uni.hideLoading()
					this.closeModal()
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		min-height: 100vh;
		background-color: #f5f5f5;
		padding: 20rpx;
		padding-bottom: 120rpx;
	}

	.section {
		background-color: #fff;
		border-radius: 16rpx;
		padding: 25rpx;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 25rpx;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.add-btn {
		height: 60rpx;
		padding: 0 25rpx;
		border-radius: 30rpx;
		font-size: 26rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		border: none;
	}

	.children-grid {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.child-card {
		display: flex;
		align-items: center;
		padding: 25rpx;
		background-color: #fafafa;
		border-radius: 16rpx;
		position: relative;
	}

	.child-avatar {
		width: 90rpx;
		height: 90rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 36rpx;
		font-weight: bold;
		color: #fff;
		margin-right: 25rpx;
		overflow: hidden;
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}

	.child-name {
		font-size: 30rpx;
		font-weight: bold;
		color: #333;
		display: block;
	}

	.child-detail {
		font-size: 24rpx;
		color: #999;
		display: block;
		margin: 5rpx 0;
	}

	.child-stats {
		flex: 1;
		display: flex;
		justify-content: flex-end;
		gap: 30rpx;
	}

	.stat {
		font-size: 24rpx;
		color: #666;
	}

	.child-actions {
		display: flex;
		gap: 15rpx;
		margin-left: 20rpx;
	}

	.action-btn {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		font-size: 28rpx;

		&.edit {
			background-color: #fff3e0;
		}

		&.delete {
			background-color: #ffebee;
		}
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 40rpx;
	}

	.modal-content {
		width: 100%;
		max-width: 640rpx;
		background-color: #fff;
		border-radius: 20rpx;
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.modal-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.modal-close {
		font-size: 36rpx;
		color: #999;
		padding: 10rpx;
	}

	.modal-body {
		padding: 30rpx;
	}

	.form-item {
		margin-bottom: 25rpx;
	}

	.form-label {
		font-size: 26rpx;
		color: #666;
		display: block;
		margin-bottom: 10rpx;
	}

	.form-input {
		width: 100%;
		height: 80rpx;
		padding: 0 20rpx;
		border: 2rpx solid #e8e8e8;
		border-radius: 10rpx;
		font-size: 28rpx;
		box-sizing: border-box;
	}

	.form-picker {
		width: 100%;
		height: 80rpx;
		padding: 0 20rpx;
		border: 2rpx solid #e8e8e8;
		border-radius: 10rpx;
		font-size: 28rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		color: #333;
	}

	.picker-arrow {
		font-size: 32rpx;
		color: #999;
	}

	.form-select-wrapper {
		width: 100%;
		height: 80rpx;
		border: 2rpx solid #e8e8e8;
		border-radius: 10rpx;
		overflow: hidden;
	}

	.form-select {
		width: 100%;
		height: 100%;
		padding: 0 20rpx;
		font-size: 28rpx;
		color: #333;
		background-color: transparent;
		border: none;
		appearance: none;
		-webkit-appearance: none;
	}

	.form-select option {
		font-size: 28rpx;
	}

	.modal-footer {
		display: flex;
		gap: 20rpx;
		padding: 20rpx 30rpx 30rpx;
	}

	.btn {
		flex: 1;
		height: 80rpx;
		border-radius: 40rpx;
		font-size: 30rpx;
		border: none;

		&.btn-primary {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: #fff;
		}

		&.btn-secondary {
			background-color: #f0f0f0;
			color: #333;
		}
	}

	.hobby-modal {
		max-width: 680rpx;
	}

	.hobby-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 15rpx;
	}

	.hobby-tag {
		padding: 15rpx 30rpx;
		border-radius: 30rpx;
		background-color: #f5f5f5;
		color: #666;
		font-size: 26rpx;
		transition: all 0.3s;

		&.active {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: #fff;
		}
	}
</style>
<template>
	<view class="container">
		<view class="header">
			<view class="user-section" @click="goToUcenter">
				<view class="avatar">{{ currentParent?.name?.charAt(0) || '👨' }}</view>
				<view class="user-info">
					<text class="greeting">👋 您好，{{ currentParent?.name || '家长' }}</text>
					<text class="date">{{ currentDate }}</text>
				</view>
			</view>
		</view>

		<view class="quick-stats">
			<view class="stat-card">
				<text class="stat-value">{{ todayTasks }}</text>
				<text class="stat-label">今日任务</text>
			</view>
			<view class="stat-card">
				<text class="stat-value">{{ pendingReviews }}</text>
				<text class="stat-label">待审核</text>
			</view>
			<view class="stat-card points">
				<text class="stat-value">{{ totalPoints }}</text>
				<text class="stat-label">总积分</text>
			</view>
			<view class="stat-card coins">
				<text class="stat-value">{{ totalCoins.toFixed(1) }}</text>
				<text class="stat-label">总金币</text>
			</view>
		</view>

		<view class="section">
			<view class="section-header">
				<text class="section-title">👧 我的孩子</text>
				<text class="section-link" @click="goToChildren">查看全部 ›</text>
			</view>
			<view class="children-list">
				<view class="child-card" v-for="child in children" :key="child.id" @click="goToChildDetail(child)">
					<view class="child-avatar">
						<image v-if="child.avatar && child.avatar.startsWith('http')" class="avatar-img" :src="child.avatar" mode="aspectFill" />
						<text v-else>{{ child.name.charAt(0) }}</text>
					</view>
					<view class="child-info">
						<text class="child-name">{{ child.name }}</text>
						<text class="child-detail">{{ child.grade }} · {{ child.age }}岁</text>
					</view>
					<view class="child-points">
						<view class="point-tag points">
							<text class="point-value">{{ child.total_points }}</text>
							<text class="point-label">积分</text>
						</view>
						<view class="point-tag coins">
							<text class="point-value">{{ (child.total_reward_points || 0).toFixed(1) }}</text>
							<text class="point-label">金币</text>
						</view>
					</view>
					<text class="arrow">›</text>
				</view>
			</view>
		</view>

		<view class="section">
			<view class="section-header">
				<text class="section-title">📋 今日任务</text>
				<text class="section-link" @click="goToTasks">管理任务 ›</text>
			</view>
			<view class="task-list">
				<view class="task-item" v-for="task in todayTasksList" :key="task.id">
					<view class="task-icon">{{ getTaskIcon(task.type) }}</view>
					<view class="task-info">
						<text class="task-title">{{ task.title }}</text>
						<text class="task-detail">{{ task.child_name }} · ⭐{{ task.base_points }}积分 <image class="coin-icon" src="/static/svg/jinbi.svg" mode="aspectFit" />{{ task.reward_points }}金币</text>
					</view>
					<view class="task-status" :class="task.status">
						{{ getStatusText(task.status) }}
					</view>
				</view>
			</view>
		</view>

		<view class="section">
			<view class="section-header">
				<text class="section-title">✅ 待审核打卡</text>
				<text class="section-link" @click="goToCheckins">去审核 ›</text>
			</view>
			<view class="checkin-list" v-if="pendingCheckins.length > 0">
				<view class="checkin-item" v-for="checkin in pendingCheckins" :key="checkin.id">
					<view class="checkin-child">{{ checkin.child_name }}</view>
					<view class="checkin-task">{{ checkin.task_title }}</view>
					<text class="checkin-time">{{ checkin.checkin_time }}</text>
				</view>
			</view>
			<view class="empty-state" v-else>
				<text class="empty-icon">🎉</text>
				<text class="empty-text">暂无待审核打卡</text>
			</view>
		</view>

		<view class="section">
			<view class="section-header">
				<text class="section-title">🎁 待审核兑换</text>
				<text class="section-link" @click="goToRedemptions">去审核 ›</text>
			</view>
			<view class="redemption-list" v-if="pendingRedemptions.length > 0">
				<view class="redemption-item" v-for="redemption in pendingRedemptions" :key="redemption.id">
					<view class="redemption-child">{{ redemption.child_name }}</view>
					<view class="redemption-info">
						<text class="redemption-gift">{{ redemption.gift_name }}</text>
						<text class="redemption-points">消耗 ⭐{{ redemption.base_points }}积分 <image class="coin-icon" src="/static/svg/jinbi.svg" mode="aspectFit" />{{ redemption.reward_points }}金币</text>
					</view>
					<text class="redemption-time">{{ redemption.created_time }}</text>
					<button class="review-btn" @click="showRedemptionModal(redemption)">审核</button>
				</view>
			</view>
			<view class="empty-state" v-else>
				<text class="empty-icon">🎁</text>
				<text class="empty-text">暂无待审核兑换</text>
			</view>
		</view>

		<!-- 兑换审核弹框 -->
		<view class="modal-overlay" v-if="showRedemptionReview" @click="closeRedemptionModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">兑换审核</text>
					<text class="modal-close" @click="closeRedemptionModal">×</text>
				</view>
				<view class="modal-body" v-if="currentRedemption">
					<view class="modal-row">
						<text class="modal-label">兑换儿童</text>
						<text class="modal-value">{{ currentRedemption.child_name }}</text>
					</view>
					<view class="modal-row">
						<text class="modal-label">兑换礼品</text>
						<view class="modal-value gift-info">
							<text>{{ currentRedemption.gift_name }}</text>
							<image v-if="currentRedemption.gift_image" class="gift-image" :src="currentRedemption.gift_image" mode="aspectFit" />
						</view>
					</view>
					<view class="modal-row">
						<text class="modal-label">消耗积分</text>
						<text class="modal-value">⭐{{ currentRedemption.base_points }}积分</text>
					</view>
					<view class="modal-row">
						<text class="modal-label">消耗金币</text>
						<view class="modal-value">
							<image class="coin-icon" src="/static/svg/jinbi.svg" mode="aspectFit" />{{ currentRedemption.reward_points }}金币
						</view>
					</view>
					<view class="modal-row">
						<text class="modal-label">兑换时间</text>
						<text class="modal-value">{{ currentRedemption.created_time }}</text>
					</view>
					<view class="modal-row">
						<text class="modal-label">备注</text>
						<text class="modal-value">{{ currentRedemption.remark || '无' }}</text>
					</view>
				</view>
				<view class="modal-footer">
					<button class="modal-btn cancel" @click="rejectRedemption">拒绝</button>
					<button class="modal-btn confirm" @click="acceptRedemption">通过</button>
				</view>
			</view>
		</view>
		<custom-tab-bar ref="tabBar"></custom-tab-bar>
	</view>
</template>

<script>
	import customTabBar from '@/custom-tab-bar/index.vue'
	import CategoryManager from '@/common/category-manager.js'
	import UserManager from '@/common/user-manager.js'
	import { feishuRequest } from '@/common/feishu-request.js'

	export default {
		components: { customTabBar },
		data() {
			return {
				currentDate: '',
				currentParent: null,
				todayTasks: 0,
				pendingReviews: 0,
				pendingRedemptionCount: 0,
				totalPoints: 0,
				totalCoins: 0,
				children: [],
				todayTasksList: [],
				pendingCheckins: [],
				pendingRedemptions: [],
				showRedemptionReview: false,
				currentRedemption: null
			}
		},
		async onLoad() {
			const now = new Date()
			this.currentDate = `${now.getMonth() + 1}月${now.getDate()}日 ${['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()]}`
			
			// 先加载用户信息和儿童列表
			await this.loadUserData()
			// 加载今日任务和待审核打卡
			await this.loadTasksAndCheckins()
		},
		onShow() {
			if (this.$refs.tabBar) {
				this.$refs.tabBar.updateSelected('/pages/parent/dashboard')
			}
			this.loadCategories()
		},
		methods: {
			/**
			 * 加载用户数据（从用户表获取家长信息，从儿童表获取儿童信息）
			 */
			async loadUserData() {
				try {
					// 从用户表获取当前家长信息
					this.currentParent = await UserManager.getCurrentParent()
					console.log('[Dashboard] 当前家长信息:', this.currentParent)
					
					if (this.currentParent && this.currentParent.phone) {
						// 从儿童表获取该家长绑定的儿童列表
						this.children = await UserManager.getChildrenByParent(this.currentParent.phone)
						// 处理儿童名称格式
						this.children = this.children.map(child => ({
							...child,
							name: child.name 
								? (Array.isArray(child.name) && child.name[0] && child.name[0].text 
									? child.name[0].text 
									: child.name)
								: ''
						}))
						console.log('[Dashboard] 儿童列表:', this.children)
						
						// 缓存儿童列表，供其他页面使用
						UserManager.setChildren(this.children)
						
						// 计算总积分和总金币
						this.totalPoints = this.children.reduce((sum, child) => sum + (child.total_points || 0), 0)
						this.totalCoins = this.children.reduce((sum, child) => sum + (child.total_reward_points || 0), 0)
					}
				} catch (error) {
					console.error('[Dashboard] 加载用户数据失败:', error)
				}
			},
			/**
			 * 根据child_id获取儿童名称
			 */
			getChildName(childId) {
				console.log('this.children',childId,this.children);
				
				const child = this.children.find(c => c.child_id === childId || c.id === childId)
				return child ? child.name : '未知儿童'
			},
			
			/**
			 * 加载今日任务、待审核打卡和待审核兑换（通过单次请求获取数据）
			 */
			async loadTasksAndCheckins() {
				uni.showLoading({ title: '加载中...' })
				try {
					// 并行查询任务表、打卡记录表和兑换记录表
					// 获取今天的开始时间戳（毫秒）
					const today = new Date()
					today.setHours(0, 0, 0, 0)
					const todayTimestamp = today.getTime().toString()
					
					const [tasksResult, checkinsResult, redemptionsResult] = await Promise.all([
						// 查询今日任务：start_time是今天
						feishuRequest.queryRecords('任务表', { start_time: ['ExactDate', todayTimestamp] }),
						// 查询待审核打卡：review_status等于待审核
						feishuRequest.queryRecords('打卡记录表', { review_status: '待审核' }),
						// 查询待审核兑换：status等于待审核
						feishuRequest.queryRecords('兑换记录表', { status: '待审核' })
					])
					
					// 处理今日任务
					if (tasksResult.success && tasksResult.data) {
						const taskResults = tasksResult.data.sort((a, b) => 
							new Date(b.fields.created_at || 0) - new Date(a.fields.created_at || 0)
						)
						
						this.todayTasksList = taskResults.slice(0, 5).map(item => {
							const title = item.fields.title 
								? (Array.isArray(item.fields.title) && item.fields.title[0] && item.fields.title[0].text 
									? item.fields.title[0].text 
									: item.fields.title)
								: ''
							
							let childId = item.fields.child_id || ''
							if (Array.isArray(childId) && childId[0] && childId[0].text) {
								childId = childId[0].text
							} else if (typeof childId === 'object' && childId.type === 1 && childId.value && Array.isArray(childId.value) && childId.value.length > 0) {
								childId = childId.value[0].text || ''
							}
							
							return {
								id: item.record_id,
								title: title,
								type: item.fields.type || '',
								child_id: childId,
								child_name: this.getChildName(childId),
								base_points: item.fields.base_points || 0,
								reward_points: item.fields.reward_points || 0,
								status: item.fields.status || 'pending'
							}
						})
						this.todayTasks = this.todayTasksList.length
					} else {
						this.todayTasksList = []
						this.todayTasks = 0
					}
					
					// 处理待审核打卡列表
					if (checkinsResult.success && checkinsResult.data) {
						const sortedData = checkinsResult.data.sort((a, b) => 
							new Date(b.fields.created_time || 0) - new Date(a.fields.created_time || 0)
						)
						this.pendingCheckins = sortedData.slice(0, 5).map(item => {
							const title = item.fields.content 
								? (Array.isArray(item.fields.content) && item.fields.content[0] && item.fields.content[0].text 
									? item.fields.content[0].text 
									: item.fields.content)
								: ''
							
							let childId = item.fields.child_id || ''
							if (Array.isArray(childId) && childId[0] && childId[0].text) {
								childId = childId[0].text
							} else if (typeof childId === 'object' && childId.type === 1 && childId.value && Array.isArray(childId.value) && childId.value.length > 0) {
								childId = childId.value[0].text || ''
							}
							
							const childName = this.getChildName(childId)
							const createdAt = item.fields.created_time || ''
							const date = createdAt ? new Date(createdAt) : new Date()
							const timeStr = `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
							
							return {
								id: item.record_id,
								child_name: childName,
								task_title: title,
								checkin_time: timeStr
							}
						})
						this.pendingReviews = this.pendingCheckins.length
					} else {
						this.pendingCheckins = []
						this.pendingReviews = 0
					}
					
					// 处理待审核兑换列表
					if (redemptionsResult.success && redemptionsResult.data) {
						const sortedRedemptions = redemptionsResult.data.sort((a, b) => 
							new Date(b.fields.created_time || 0) - new Date(a.fields.created_time || 0)
						)
						this.pendingRedemptions = sortedRedemptions.slice(0, 5).map(item => {
							const giftName = this.parseTextField(item.fields.gift_name)
							const basePoints = item.fields.base_points || 0
							const rewardPoints = item.fields.reward_points || 0
							const remark = this.parseTextField(item.fields.remark)
							const giftImage = item.fields.gift_image ? (item.fields.gift_image[0]?.url || '') : ''
							
							let childId = item.fields.child_id || ''
							if (Array.isArray(childId) && childId[0] && childId[0].text) {
								childId = childId[0].text
							} else if (typeof childId === 'object' && childId.type === 1 && childId.value && Array.isArray(childId.value) && childId.value.length > 0) {
								childId = childId.value[0].text || ''
							}
							
							const childName = this.getChildName(childId)
							const createdAt = item.fields.created_time || ''
							const date = createdAt ? new Date(createdAt) : new Date()
							const timeStr = `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
							
							return {
								id: item.record_id,
								child_id: childId,
								child_name: childName,
								gift_name: giftName,
								gift_image: giftImage,
								base_points: basePoints,
								reward_points: rewardPoints,
								remark: remark,
								created_time: timeStr
							}
						})
						this.pendingRedemptionCount = this.pendingRedemptions.length
					} else {
						this.pendingRedemptions = []
						this.pendingRedemptionCount = 0
					}
					
					console.log('[Dashboard] 今日任务:', this.todayTasksList)
					console.log('[Dashboard] 待审核打卡:', this.pendingCheckins)
					console.log('[Dashboard] 待审核兑换:', this.pendingRedemptions)
				} catch (error) {
					console.error('[Dashboard] 加载数据失败:', error)
					this.todayTasksList = []
					this.todayTasks = 0
					this.pendingCheckins = []
					this.pendingReviews = 0
					this.pendingRedemptions = []
					this.pendingRedemptionCount = 0
				} finally {
					uni.hideLoading()
				}
			},
			async loadCategories() {
				await CategoryManager.loadCategories('dashboard')
			},
			getTaskIcon(type) {
				const icons = {
					reading: '📖',
					math: '🧮',
					english: '🔤',
					art: '🎨',
					sports: '⚽',
					default: '📝'
				}
				return icons[type] || icons.default
			},
			getStatusText(status) {
				const texts = {
					pending: '待完成',
					completed: '已完成',
					reviewing: '审核中'
				}
				return texts[status] || status
			},
			
			/**
			 * 解析多维表格文本字段
			 */
			parseTextField(field) {
				if (!field) return ''
				if (typeof field === 'object' && field.type === 1 && field.value && Array.isArray(field.value) && field.value.length > 0) {
					return field.value[0].text || ''
				}
				if (Array.isArray(field) && field[0] && field[0].text) {
					return field[0].text
				}
				if (typeof field === 'string') {
					return field
				}
				return ''
			},
			
			/**
			 * 显示兑换审核弹框
			 */
			showRedemptionModal(redemption) {
				this.currentRedemption = redemption
				this.showRedemptionReview = true
			},
			
			/**
			 * 关闭兑换审核弹框
			 */
			closeRedemptionModal() {
				this.showRedemptionReview = false
				this.currentRedemption = null
			},
			
			/**
			 * 通过兑换申请
			 */
			async acceptRedemption() {
				if (!this.currentRedemption) return
				
				// 保存引用，避免异步回调中丢失
				const redemption = this.currentRedemption
				
				uni.showModal({
					title: '确认通过',
					content: `确定要通过 ${redemption.child_name} 的兑换申请吗？`,
					success: async (res) => {
						if (res.confirm) {
							uni.showLoading({ title: '处理中...' })
							try {
								// 更新兑换记录状态为已通过
								const result = await feishuRequest.updateRecord('兑换记录表', redemption.id, {
									status: '已通过'
								})
								
								if (result.success) {
									// 在积分记录表添加一条记录（负数表示扣除）
									const pointsRecord = {
										child_id: redemption.child_id,
										type: '消费',
										description: `兑换礼品: ${redemption.gift_name}`,
										base_points: -redemption.base_points,
										reward_points: -redemption.reward_points,
										created_time: Date.now()
									}
									await feishuRequest.addRecord('积分记录表', pointsRecord)
									
									// 从列表中移除已审核的兑换记录
									this.pendingRedemptions = this.pendingRedemptions.filter(r => r.id !== redemption.id)
									this.pendingRedemptionCount = this.pendingRedemptions.length
									uni.showToast({ title: '审核通过', icon: 'success' })
								} else {
									console.error('[Dashboard] 更新兑换状态失败:', result.message)
									uni.showToast({ title: '审核失败', icon: 'none' })
								}
							} catch (error) {
								console.error('[Dashboard] 审核兑换异常:', error)
								uni.showToast({ title: '审核失败', icon: 'none' })
							} finally {
								uni.hideLoading()
								this.closeRedemptionModal()
							}
						}
					}
				})
			},
			
			/**
			 * 拒绝兑换申请
			 */
			async rejectRedemption() {
				if (!this.currentRedemption) return
				
				uni.showModal({
					title: '确认拒绝',
					content: `确定要拒绝 ${this.currentRedemption.child_name} 的兑换申请吗？`,
					success: async (res) => {
						if (res.confirm) {
							uni.showLoading({ title: '处理中...' })
							try {
								// 更新兑换记录状态为已拒绝
								const result = await feishuRequest.updateRecord('兑换记录表', this.currentRedemption.id, {
									status: '已拒绝'
								})
								
								if (result.success) {
									// 从列表中移除已审核的兑换记录
									this.pendingRedemptions = this.pendingRedemptions.filter(r => r.id !== this.currentRedemption.id)
									this.pendingRedemptionCount = this.pendingRedemptions.length
									uni.showToast({ title: '已拒绝', icon: 'none' })
								} else {
									console.error('[Dashboard] 更新兑换状态失败:', result.message)
									uni.showToast({ title: '操作失败', icon: 'none' })
								}
							} catch (error) {
								console.error('[Dashboard] 拒绝兑换异常:', error)
								uni.showToast({ title: '操作失败', icon: 'none' })
							} finally {
								uni.hideLoading()
								this.closeRedemptionModal()
							}
						}
					}
				})
			},
			
			goToChildren() {
				uni.navigateTo({ url: '/pages/parent/children' })
			},
			goToChildDetail(child) {
				uni.navigateTo({ url: `/pages/parent/child-detail?id=${child.id}` })
			},
			goToTasks() {
				uni.navigateTo({ url: '/pages/parent/tasks' })
			},
			goToCheckins() {
				uni.navigateTo({ url: '/pages/parent/checkins' })
			},
			goToRedemptions() {
				uni.navigateTo({ url: '/pages/parent/redemptions' })
			},
			goToUcenter() {
				uni.navigateTo({ url: '/pages/ucenter/ucenter' })
			}
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		min-height: 100vh;
		background-color: #f5f5f5;
		padding-bottom: 120rpx;
	}

	.header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 80rpx 30rpx 60rpx;
	}

	.user-section {
		display: flex;
		align-items: center;
		gap: 20rpx;
	}

	.avatar {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		background-color: rgba(255, 255, 255, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 36rpx;
	}

	.user-info {
		flex: 1;
	}

	.greeting {
		font-size: 40rpx;
		font-weight: bold;
		color: #fff;
		display: block;
		margin-bottom: 8rpx;
	}

	.date {
		font-size: 26rpx;
		color: rgba(255, 255, 255, 0.8);
	}

	.quick-stats {
		display: flex;
		gap: 20rpx;
		padding: 0 20rpx;
		margin-top: -40rpx;
	}

	.stat-card {
		flex: 1;
		background-color: #fff;
		border-radius: 16rpx;
		padding: 25rpx 15rpx;
		text-align: center;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
		position: relative;
		overflow: hidden;

		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 4rpx;
			background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
		}

		&.points {
			&::before {
				background: linear-gradient(90deg, #ff9500 0%, #ffb74d 100%);
			}
			.stat-value {
				color: #ff9500;
			}
		}

		&.coins {
			&::before {
				background: linear-gradient(90deg, #ffd700 0%, #ffec8b 100%);
			}
			.stat-value {
				color: #ffd700;
			}
		}
	}

	.stat-value {
		font-size: 44rpx;
		font-weight: bold;
		color: #667eea;
		display: block;
		line-height: 1.2;
	}

	.stat-label {
		font-size: 22rpx;
		color: #999;
		margin-top: 8rpx;
	}

	.section {
		background-color: #fff;
		margin: 20rpx;
		border-radius: 16rpx;
		padding: 25rpx;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.section-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #333;
	}

	.section-link {
		font-size: 26rpx;
		color: #667eea;
	}

	.children-list {
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}

	.child-card {
		display: flex;
		align-items: center;
		gap: 20rpx;
		padding: 20rpx;
		background-color: #fafafa;
		border-radius: 12rpx;
	}
	
	.arrow {
		font-size: 32rpx;
		color: #ccc;
		margin-left: auto;
	}

	.child-avatar {
		width: 70rpx;
		height: 70rpx;
		border-radius: 50%;
		background-color: #667eea;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32rpx;
		color: #fff;
		overflow: hidden;
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}

	.child-info {
		flex: 1;
	}

	.child-name {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		display: block;
	}

	.child-detail {
		font-size: 24rpx;
		color: #999;
	}

	.child-points {
		display: flex;
		gap: 12rpx;
	}

	.point-tag {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 10rpx 16rpx;
		border-radius: 10rpx;
		background-color: #f8f8f8;

		&.points {
			.point-value {
				color: #ff9500;
			}
			background: linear-gradient(135deg, #fff8f0 0%, #fff0e0 100%);
		}

		&.coins {
			.point-value {
				color: #ffd700;
			}
			background: linear-gradient(135deg, #fffef5 0%, #fff8dc 100%);
		}
	}

	.point-value {
		font-size: 28rpx;
		font-weight: bold;
		display: block;
	}

	.point-label {
		font-size: 20rpx;
		color: #999;
	}

	.task-list {
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}

	.task-item {
		display: flex;
		align-items: center;
		gap: 20rpx;
		padding: 20rpx;
		background-color: #fafafa;
		border-radius: 12rpx;
	}

	.task-icon {
		font-size: 40rpx;
	}

	.task-info {
		flex: 1;
	}

	.task-title {
		font-size: 28rpx;
		color: #333;
		display: block;
	}

	.task-detail {
		font-size: 24rpx;
		color: #999;
	}

	.task-status {
		font-size: 24rpx;
		padding: 8rpx 20rpx;
		border-radius: 20rpx;

		&.pending {
			background-color: #fff3e0;
			color: #ff9500;
		}

		&.completed {
			background-color: #e8f5e9;
			color: #4caf50;
		}

		&.reviewing {
			background-color: #e3f2fd;
			color: #2196f3;
		}
	}

	.checkin-list {
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}

	.checkin-item {
		display: flex;
		align-items: center;
		gap: 20rpx;
		padding: 20rpx;
		background-color: #fafafa;
		border-radius: 12rpx;
	}

	.checkin-child {
		width: 60rpx;
		height: 60rpx;
		border-radius: 50%;
		background-color: #667eea;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24rpx;
		color: #fff;
		font-weight: bold;
	}

	.checkin-task {
		flex: 1;
		font-size: 28rpx;
		color: #333;
	}

	.checkin-time {
		font-size: 24rpx;
		color: #999;
	}

	.redemption-list {
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}

	.redemption-item {
		display: flex;
		align-items: center;
		gap: 15rpx;
		padding: 20rpx;
		background-color: #fafafa;
		border-radius: 12rpx;
	}

	.redemption-info {
		flex: 1;
	}

	.redemption-gift {
		font-size: 28rpx;
		color: #333;
		display: block;
		margin-bottom: 5rpx;
	}

	.redemption-points {
		font-size: 22rpx;
		color: #999;
	}

	.review-btn {
		padding: 10rpx 25rpx;
		font-size: 24rpx;
		background-color: #667eea;
		color: #fff;
		border: none;
		border-radius: 20rpx;
	}

	.redemption-time {
		font-size: 22rpx;
		color: #999;
		margin-right: 15rpx;
	}

	/* 弹框样式 */
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
		z-index: 10000;
	}

	.modal-content {
		width: 600rpx;
		background-color: #fff;
		border-radius: 20rpx;
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #eee;
	}

	.modal-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.modal-close {
		font-size: 48rpx;
		color: #999;
		line-height: 1;
	}

	.modal-body {
		padding: 30rpx;
	}

	.modal-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 0;
		border-bottom: 1rpx solid #f0f0f0;

		&:last-child {
			border-bottom: none;
		}
	}

	.modal-label {
		font-size: 28rpx;
		color: #999;
	}

	.modal-value {
		font-size: 28rpx;
		color: #333;
		font-weight: 500;
	}

	.modal-footer {
		display: flex;
		gap: 20rpx;
		padding: 30rpx;
		border-top: 1rpx solid #eee;
	}

	.modal-btn {
		flex: 1;
		height: 80rpx;
		font-size: 30rpx;
		border: none;
		border-radius: 40rpx;

		&.cancel {
			background-color: #f5f5f5;
			color: #666;
		}

		&.confirm {
			background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
			color: #fff;
		}
	}

	.empty-state {
		text-align: center;
		padding: 40rpx;
	}

	.empty-icon {
		font-size: 60rpx;
		display: block;
		margin-bottom: 15rpx;
	}

	.empty-text {
		font-size: 28rpx;
		color: #999;
	}

	.gift-info {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 10rpx;
	}

	.gift-image {
		width: 120rpx;
		height: 120rpx;
		border-radius: 12rpx;
		background-color: #f5f5f5;
	}

	.coin-icon {
		width: 28rpx;
		height: 28rpx;
		vertical-align: middle;
		margin-right: 4rpx;
	}
</style>

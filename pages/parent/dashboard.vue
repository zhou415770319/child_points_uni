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
			<view class="stat-card">
				<text class="stat-value">{{ totalPoints }}</text>
				<text class="stat-label">总积分</text>
			</view>
		</view>

		<view class="section">
			<view class="section-header">
				<text class="section-title">👧 我的孩子</text>
				<text class="section-link" @click="goToChildren">查看全部 ›</text>
			</view>
			<view class="children-list">
				<view class="child-card" v-for="child in children" :key="child.id">
					<view class="child-avatar">
						<image v-if="child.avatar && child.avatar.startsWith('http')" class="avatar-img" :src="child.avatar" mode="aspectFill" />
						<text v-else>{{ child.name.charAt(0) }}</text>
					</view>
					<view class="child-info">
						<text class="child-name">{{ child.name }}</text>
						<text class="child-detail">{{ child.grade }}年级 · {{ child.age }}岁</text>
					</view>
					<view class="child-points">
						<text class="points-value">{{ child.total_points }}</text>
						<text class="points-label">积分</text>
					</view>
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
						<text class="task-detail">{{ task.child_name }} · {{ task.base_points }}积分</text>
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
				todayTasks: 5,
				pendingReviews: 2,
				totalPoints: 0,
				children: [],
				todayTasksList: [
					{ id: 1, title: '语文阅读 30 分钟', type: 'reading', child_name: '小明', base_points: 10, status: 'pending' },
					{ id: 2, title: '数学练习 10 题', type: 'math', child_name: '小明', base_points: 15, status: 'completed' },
					{ id: 3, title: '英语单词背诵', type: 'english', child_name: '小红', base_points: 10, status: 'pending' },
					{ id: 4, title: '画画练习', type: 'art', child_name: '小红', base_points: 8, status: 'pending' }
				],
				pendingCheckins: [
					{ id: 1, child_name: '小明', task_title: '语文阅读 30 分钟', checkin_time: '今天 14:30' },
					{ id: 2, child_name: '小红', task_title: '英语单词背诵', checkin_time: '今天 15:00' }
				]
			}
		},
		async onLoad() {
			const now = new Date()
			this.currentDate = `${now.getMonth() + 1}月${now.getDate()}日 ${['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()]}`
			
			// 先加载用户信息和儿童列表，等待完成后再加载今日任务列表
			await this.loadUserData()
			// 加载今日任务列表
			await this.loadTodayTasks()
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
						
						// 计算总积分
						this.totalPoints = this.children.reduce((sum, child) => sum + (child.total_points || 0), 0)
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
			 * 加载今日任务（从多维表格获取）
			 */
			async loadTodayTasks() {
				try {
					const result = await feishuRequest.queryRecords('任务表')
					
					if (result.success && result.data && result.data.length > 0) {
						this.todayTasksList = result.data.slice(0, 5).map(item => {
							// 处理title字段：飞书多维表格返回格式可能是[{text: "值"}]
							const title = item.fields.title 
								? (Array.isArray(item.fields.title) && item.fields.title[0] && item.fields.title[0].text 
									? item.fields.title[0].text 
									: item.fields.title)
								: ''
							
							// 处理child_id字段：飞书多维表格返回格式可能是[{text: "值"}]
							let childId = item.fields.child_id || ''
							if (Array.isArray(childId) && childId[0] && childId[0].text) {
								childId = childId[0].text
							}
							
							return {
								id: item.record_id,
								title: title,
								type: item.fields.type || '',
								child_id: childId,
								child_name: this.getChildName(childId),
								base_points: item.fields.base_points || 0,
								status: item.fields.status || 'pending'
							}
						})
						this.todayTasks = this.todayTasksList.length
						console.log('[Dashboard] 今日任务列表:', this.todayTasksList)
					}
				} catch (error) {
					console.error('[Dashboard] 加载今日任务失败:', error)
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
			goToChildren() {
				uni.navigateTo({ url: '/pages/parent/children' })
			},
			goToTasks() {
				uni.switchTab({ url: '/pages/parent/tasks' })
			},
			goToCheckins() {
				uni.navigateTo({ url: '/pages/parent/checkins' })
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
		padding: 25rpx;
		text-align: center;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
	}

	.stat-value {
		font-size: 48rpx;
		font-weight: bold;
		color: #667eea;
		display: block;
	}

	.stat-label {
		font-size: 24rpx;
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
		text-align: right;
	}

	.points-value {
		font-size: 32rpx;
		font-weight: bold;
		color: #ff9500;
		display: block;
	}

	.points-label {
		font-size: 22rpx;
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
</style>

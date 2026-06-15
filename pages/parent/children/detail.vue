<template>
	<view class="container">
		<view class="header">
			<view class="back-btn" @click="goBack">
				<text class="back-icon">‹</text>
			</view>
			<text class="header-title">儿童详情</text>
			<view class="header-right"></view>
		</view>

		<view class="profile-section">
			<view class="avatar-wrap">
				<view class="avatar">{{ childInfo.name?.charAt(0) || '👶' }}</view>
				<view class="edit-btn" @click="editChild">
					<text>✏️</text>
				</view>
			</view>
			<view class="profile-info">
				<text class="child-name">{{ childInfo.name }}</text>
				<text class="child-detail">{{ childInfo.grade }}年级 · {{ childInfo.age }}岁 · {{ childInfo.gender }}</text>
			</view>
			<view class="points-badge">
				<text class="points-value">{{ childInfo.total_points }}</text>
				<text class="points-label">积分</text>
			</view>
		</view>

		<view class="section">
			<view class="section-header">
				<text class="section-title">📊 数据统计</text>
			</view>
			<view class="stats-grid">
				<view class="stat-item">
					<text class="stat-value">{{ stats.completedTasks }}</text>
					<text class="stat-label">完成任务</text>
				</view>
				<view class="stat-item">
					<text class="stat-value">{{ stats.totalDays }}</text>
					<text class="stat-label">连续天数</text>
				</view>
				<view class="stat-item">
					<text class="stat-value">{{ stats.rewards }}</text>
					<text class="stat-label">兑换奖励</text>
				</view>
				<view class="stat-item">
					<text class="stat-value">{{ stats.learningProgress }}%</text>
					<text class="stat-label">学习进度</text>
				</view>
			</view>
		</view>

		<view class="section">
			<view class="section-header">
				<text class="section-title">📋 近期任务</text>
				<text class="section-link" @click="goToTasks">查看全部 ›</text>
			</view>
			<view class="task-list">
				<view class="task-item" v-for="task in recentTasks" :key="task.id">
					<view class="task-icon">{{ getTaskIcon(task.type) }}</view>
					<view class="task-info">
						<text class="task-title">{{ task.title }}</text>
						<text class="task-time">{{ task.time }}</text>
					</view>
					<view class="task-status" :class="task.status">
						{{ task.status === 'completed' ? '已完成' : task.status === 'pending' ? '待完成' : '进行中' }}
					</view>
				</view>
			</view>
		</view>

		<view class="section">
			<view class="section-header">
				<text class="section-title">🎁 兑换记录</text>
				<text class="section-link" @click="goToRewards">查看全部 ›</text>
			</view>
			<view class="reward-list">
				<view class="reward-item" v-for="reward in recentRewards" :key="reward.id">
					<image v-if="reward.gift_image" class="reward-image" :src="reward.gift_image" mode="aspectFill" />
					<view v-else class="reward-icon">{{ reward.icon }}</view>
					<view class="reward-info">
						<text class="reward-name">{{ reward.name }}</text>
						<text class="reward-detail">{{ reward.price }}积分 · {{ reward.status }}</text>
					</view>
				</view>
				<view class="empty-state" v-if="recentRewards.length === 0">
					<text class="empty-icon">🎁</text>
					<text class="empty-text">暂无兑换记录</text>
				</view>
			</view>
		</view>

		<view class="section">
			<view class="section-header">
				<text class="section-title">📚 正在学习</text>
			</view>
			<view class="learning-list">
				<view class="learning-item" v-for="book in learningBooks" :key="book.id">
					<view class="book-icon">{{ book.icon }}</view>
					<view class="book-info">
						<text class="book-title">{{ book.title }}</text>
						<view class="book-progress-bar">
							<view class="progress-fill" :style="{ width: book.progress + '%' }"></view>
						</view>
						<text class="book-progress-text">{{ book.currentPage }}/{{ book.totalPages }}页</text>
					</view>
				</view>
				<view class="empty-state" v-if="learningBooks.length === 0">
					<text class="empty-icon">📚</text>
					<text class="empty-text">暂无学习教材</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { feishuRequest } from '@/common/feishu-request.js'
	import UserManager from '@/common/user-manager.js'
	export default {
		data() {
			return {
				childId: '',
				childInfo: {
					name: '',
					age: '',
					grade: '',
					gender: '',
					total_points: 0,
					avatar: ''
				},
				stats: {
					completedTasks: 0,
					totalDays: 0,
					rewards: 0,
					learningProgress: 0
				},
				recentTasks: [],
				recentRewards: [],
				learningBooks: []
			}
		},
		async onLoad(options) {
			if (options && options.id) {
				this.childId = options.id
				// 优先从缓存获取儿童信息
				this.loadChildFromCache()
				// 并行加载其他数据
				await Promise.all([
					this.loadStats(),
					this.loadRecentTasks(),
					this.loadRecentRewards(),
					this.loadLearningBooks()
				])
			}
		},
		methods: {
			goBack() {
				uni.navigateBack()
			},
			editChild() {
				uni.showToast({ title: '编辑功能开发中', icon: 'none' })
			},
			goToTasks() {
				uni.navigateTo({ url: '/pages/parent/tasks' })
			},
			goToRewards() {
				uni.navigateTo({ url: '/pages/parent/mall' })
			},
			loadChildFromCache() {
				try {
					// 从缓存获取儿童列表
					const children = UserManager.getChildren() || []
					console.log('[Child Detail] 从缓存获取儿童列表:', children)
					
					// 查找匹配的儿童
					const child = children.find(c => {
						const childKey = c.child_id || c.id || ''
						return childKey === this.childId || 
							   (typeof childKey === 'object' && childKey.value && childKey.value[0] && childKey.value[0].text === this.childId)
					})
					
					if (child) {
						console.log('[Child Detail] 找到匹配的儿童:', child)
						this.childInfo = {
							name: typeof child.name === 'object' && child.name.value && child.name.value[0] && child.name.value[0].text 
								? child.name.value[0].text 
								: (Array.isArray(child.name) && child.name[0] && child.name[0].text 
									? child.name[0].text 
									: (child.name || '未知')),
							age: child.age || '',
							grade: child.grade || '',
							gender: child.gender || '',
							total_points: child.total_points || 0,
							avatar: child.avatar || ''
						}
					} else {
						console.warn('[Child Detail] 缓存中未找到儿童，将从API获取:', this.childId)
						this.loadChildFromAPI()
					}
				} catch (error) {
					console.error('[Child Detail] 从缓存加载儿童信息失败:', error)
					this.loadChildFromAPI()
				}
			},
			async loadChildFromAPI() {
				try {
					const result = await feishuRequest.queryRecords('儿童表', { child_id: this.childId })
					if (result.success && result.data && result.data.length > 0) {
						const item = result.data[0].fields
						this.childInfo = {
							name: item.name ? (Array.isArray(item.name) && item.name[0] && item.name[0].text ? item.name[0].text : item.name) : '未知',
							age: item.age || '',
							grade: item.grade || '',
							gender: item.gender || '',
							total_points: item.total_points || 0,
							avatar: item.avatar || ''
						}
					}
				} catch (error) {
					console.error('[Child Detail] 从API加载儿童信息失败:', error)
				}
			},
			async loadStats() {
				try {
					const taskResult = await feishuRequest.queryRecords('任务表', { child_id: this.childId })
					const completedTasks = taskResult.success && taskResult.data 
						? taskResult.data.filter(t => t.fields.status === '已完成').length 
						: 0
					
					const rewardResult = await feishuRequest.queryRecords('兑换记录表', { child_id: this.childId })
					const rewards = rewardResult.success && rewardResult.data ? rewardResult.data.length : 0

					this.stats = {
						completedTasks: completedTasks,
						totalDays: 7,
						rewards: rewards,
						learningProgress: 45
					}
				} catch (error) {
					console.error('[Child Detail] 加载统计数据失败:', error)
				}
			},
			async loadRecentTasks() {
				try {
					const result = await feishuRequest.queryRecords('任务表', { child_id: this.childId })
					if (result.success && result.data && result.data.length > 0) {
						// 按创建时间倒序排序
						const sortedTasks = result.data.sort((a, b) => 
							new Date(b.fields.created_time || b.fields.created_at || 0) - new Date(a.fields.created_time || a.fields.created_at || 0)
						)
						
						this.recentTasks = sortedTasks.slice(0, 5).map(item => {
							const title = item.fields.title 
								? (Array.isArray(item.fields.title) && item.fields.title[0] && item.fields.title[0].text 
									? item.fields.title[0].text 
									: item.fields.title)
								: ''
							
							// 使用 created_time 或 created_at
							const timeField = item.fields.created_time || item.fields.created_at || item.fields.start_time
							
							return {
								id: item.record_id,
								title: title,
								type: item.fields.type || '',
								status: item.fields.status === '已完成' ? 'completed' : (item.fields.status === '进行中' ? 'active' : 'pending'),
								time: this.formatTime(timeField)
							}
						})
					}
				} catch (error) {
					console.error('[Child Detail] 加载任务失败:', error)
					this.recentTasks = []
				}
			},
			async loadRecentRewards() {
				try {
					const result = await feishuRequest.queryRecords('兑换记录表', { child_id: this.childId })
					if (result.success && result.data && result.data.length > 0) {
						// 提取所有图片的 file_token
						const fileTokens = []
						result.data.forEach(item => {
							if (item.fields.gift_image && item.fields.gift_image.type === 17 && 
								item.fields.gift_image.value && item.fields.gift_image.value.length > 0) {
								item.fields.gift_image.value.forEach(img => {
									if (img.file_token) {
										fileTokens.push(img.file_token)
									}
								})
							}
						})
						
						// 批量获取图片URL
						let imageUrlMap = {}
						if (fileTokens.length > 0) {
							await feishuRequest.initCloudObject()
							const urlResult = await feishuRequest.feishutools.getImageUrls({
								fileTokens: fileTokens
							})
							if (urlResult.success && urlResult.urlMap) {
								imageUrlMap = urlResult.urlMap
							}
						}
						
						this.recentRewards = result.data.slice(0, 3).map(item => {
							// 解析礼品名称
							let giftName = '未知礼品'
							if (item.fields.gift_name) {
								if (typeof item.fields.gift_name === 'object' && item.fields.gift_name.value && 
									Array.isArray(item.fields.gift_name.value) && item.fields.gift_name.value[0]) {
									giftName = item.fields.gift_name.value[0].text || '未知礼品'
								} else if (Array.isArray(item.fields.gift_name) && item.fields.gift_name[0] && item.fields.gift_name[0].text) {
									giftName = item.fields.gift_name[0].text
								} else if (typeof item.fields.gift_name === 'string') {
									giftName = item.fields.gift_name
								}
							}
							
							// 解析礼品图片
							let giftImageUrl = ''
							if (item.fields.gift_image && item.fields.gift_image.type === 17 && 
								item.fields.gift_image.value && item.fields.gift_image.value.length > 0) {
								const imageData = item.fields.gift_image.value[0]
								giftImageUrl = imageUrlMap[imageData.file_token] || imageData.tmp_download_url || ''
							}
							
							return {
								id: item.record_id,
								name: giftName,
								price: item.fields.points || 0,
								status: item.fields.status || '待处理',
								icon: this.getRewardIcon(item.fields.category),
								gift_image: giftImageUrl
							}
						})
					}
				} catch (error) {
					console.error('[Child Detail] 加载奖励失败:', error)
				}
			},
			async loadLearningBooks() {
				try {
					const result = await feishuRequest.queryRecords('教材表', { child_id: this.childId })
					if (result.success && result.data && result.data.length > 0) {
						this.learningBooks = result.data.map(item => {
							const title = item.fields.name 
								? (Array.isArray(item.fields.name) && item.fields.name[0] && item.fields.name[0].text 
									? item.fields.name[0].text 
									: item.fields.name)
								: '未知教材'
							const currentPage = item.fields.current_page || 0
							const totalPages = item.fields.total_pages || 1
							const progress = Math.round((currentPage / totalPages) * 100)
							return {
								id: item.record_id,
								title: title,
								currentPage: currentPage,
								totalPages: totalPages,
								progress: Math.min(progress, 100),
								icon: this.getBookIcon(item.fields.subject)
							}
						})
					}
				} catch (error) {
					console.error('[Child Detail] 加载教材失败:', error)
					this.learningBooks = [
						{ id: 1, title: '一年级数学教材', currentPage: 35, totalPages: 78, progress: 45, icon: '🧮' },
						{ id: 2, title: '一年级语文教材', currentPage: 20, totalPages: 80, progress: 25, icon: '📖' }
					]
				}
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
			getRewardIcon(category) {
				const icons = {
					'toy': '🧩',
					'book': '📚',
					'food': '🍬',
					'stationery': '✏️',
					default: '🎁'
				}
				return icons[category] || icons.default
			},
			getBookIcon(subject) {
				const icons = {
					'语文': '📖',
					'math': '🧮',
					'maths': '🧮',
					'数学': '🧮',
					'english': '🔤',
					'英语': '🔤',
					'science': '🔬',
					'科学': '🔬',
					default: '📚'
				}
				return icons[subject] || icons.default
			},
			formatTime(dateStr) {
				if (!dateStr) return '未知时间'
				
				// 处理时间戳（毫秒）
				let date
				if (typeof dateStr === 'number') {
					date = new Date(dateStr)
				} else {
					date = new Date(dateStr)
				}
				
				// 检查日期是否有效
				if (isNaN(date.getTime())) {
					return '未知时间'
				}
				
				const now = new Date()
				const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
				const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
				
				const diffDays = Math.floor((today - taskDate) / (1000 * 60 * 60 * 24))
				
				const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
				
				if (diffDays === 0) {
					return '今天 ' + timeStr
				} else if (diffDays === 1) {
					return '昨天 ' + timeStr
				} else {
					return `${date.getMonth() + 1}月${date.getDate()}日 ${timeStr}`
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		min-height: 100vh;
		background-color: #f5f5f5;
		padding-bottom: 40rpx;
	}

	.header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 80rpx 30rpx 40rpx;
		display: flex;
		align-items: center;
	}

	.back-btn {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		margin-right: 20rpx;
	}

	.back-icon {
		font-size: 40rpx;
		color: #fff;
		font-weight: bold;
	}

	.header-title {
		flex: 1;
		font-size: 32rpx;
		font-weight: bold;
		color: #fff;
		text-align: center;
	}

	.header-right {
		width: 60rpx;
	}

	.profile-section {
		display: flex;
		align-items: center;
		background-color: #fff;
		margin: -40rpx 20rpx 20rpx;
		border-radius: 20rpx;
		padding: 40rpx 30rpx;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
	}

	.avatar-wrap {
		position: relative;
		margin-right: 25rpx;
	}

	.avatar {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 48rpx;
		color: #fff;
	}

	.edit-btn {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 40rpx;
		height: 40rpx;
		background-color: #4caf50;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20rpx;
	}

	.profile-info {
		flex: 1;
	}

	.child-name {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 10rpx;
	}

	.child-detail {
		font-size: 26rpx;
		color: #999;
	}

	.points-badge {
		text-align: center;
		padding: 15rpx 25rpx;
		background: linear-gradient(135deg, #ff9500 0%, #ffcc00 100%);
		border-radius: 16rpx;
	}

	.points-value {
		font-size: 36rpx;
		font-weight: bold;
		color: #fff;
		display: block;
	}

	.points-label {
		font-size: 22rpx;
		color: rgba(255, 255, 255, 0.8);
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

	.stats-grid {
		display: flex;
		gap: 15rpx;
	}

	.stat-item {
		flex: 1;
		text-align: center;
		padding: 20rpx;
		background-color: #fafafa;
		border-radius: 12rpx;
	}

	.stat-value {
		font-size: 40rpx;
		font-weight: bold;
		color: #667eea;
		display: block;
	}

	.stat-label {
		font-size: 22rpx;
		color: #999;
		margin-top: 8rpx;
	}

	.task-list {
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}

	.task-item {
		display: flex;
		align-items: center;
		padding: 20rpx;
		background-color: #fafafa;
		border-radius: 12rpx;
	}

	.task-icon {
		font-size: 36rpx;
		margin-right: 20rpx;
	}

	.task-info {
		flex: 1;
	}

	.task-title {
		font-size: 28rpx;
		color: #333;
		display: block;
	}

	.task-time {
		font-size: 24rpx;
		color: #999;
	}

	.task-status {
		font-size: 22rpx;
		padding: 8rpx 20rpx;
		border-radius: 20rpx;

		&.completed {
			background-color: #e8f5e9;
			color: #4caf50;
		}

		&.pending {
			background-color: #fff3e0;
			color: #ff9500;
		}

		&.active {
			background-color: #e3f2fd;
			color: #2196f3;
		}
	}

	.reward-list {
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}

	.reward-item {
		display: flex;
		align-items: center;
		padding: 20rpx;
		background-color: #fafafa;
		border-radius: 12rpx;
	}

	.reward-image {
		width: 80rpx;
		height: 80rpx;
		border-radius: 8rpx;
		margin-right: 20rpx;
		background-color: #f0f0f0;
	}

	.reward-icon {
		font-size: 40rpx;
		margin-right: 20rpx;
	}

	.reward-info {
		flex: 1;
	}

	.reward-name {
		font-size: 28rpx;
		color: #333;
		display: block;
	}

	.reward-detail {
		font-size: 24rpx;
		color: #999;
	}

	.learning-list {
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}

	.learning-item {
		display: flex;
		align-items: center;
		padding: 20rpx;
		background-color: #fafafa;
		border-radius: 12rpx;
	}

	.book-icon {
		font-size: 40rpx;
		margin-right: 20rpx;
	}

	.book-info {
		flex: 1;
	}

	.book-title {
		font-size: 28rpx;
		color: #333;
		display: block;
		margin-bottom: 10rpx;
	}

	.book-progress-bar {
		height: 8rpx;
		background-color: #e0e0e0;
		border-radius: 4rpx;
		overflow: hidden;
		margin-bottom: 8rpx;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #4caf50 0%, #8bc34a 100%);
		border-radius: 4rpx;
	}

	.book-progress-text {
		font-size: 22rpx;
		color: #666;
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
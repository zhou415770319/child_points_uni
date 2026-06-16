<template>
	<view class="container">
		<!-- 顶部导航 -->
		<view class="header">
			<view class="back-btn" @click="goBack">
				<text class="back-icon">‹</text>
			</view>
			<text class="header-title">儿童详情</text>
			<view class="header-right">
				<text class="edit-btn" @click="editChild">✏️</text>
			</view>
		</view>

		<!-- 顶部信息卡片 -->
		<view class="info-card">
			<view class="avatar-section">
				<view class="child-avatar">
					<image v-if="childInfo.avatar && childInfo.avatar.startsWith('http')" class="avatar-img" :src="childInfo.avatar" mode="aspectFill" />
					<text v-else>{{ childInfo.name?.charAt(0) || '👦' }}</text>
				</view>
				<view class="child-info">
					<text class="child-name">{{ childInfo.name }}</text>
					<text class="child-detail">{{ childInfo.grade }} · {{ childInfo.age }}岁 · {{ childInfo.gender }}</text>
				</view>
			</view>
			
			<!-- 余额信息 -->
			<view class="balance-section">
				<view class="balance-item points" @click="openPointsRecord">
					<view class="balance-header">
						<text class="balance-label">积分余额</text>
						<text class="balance-arrow">›</text>
					</view>
					<text class="balance-value">{{ childInfo.total_points || 0 }}</text>
				</view>
				<view class="balance-divider"></view>
				<view class="balance-item coins" @click="openCoinsRecord">
					<view class="balance-header">
						<text class="balance-label">金币余额</text>
						<text class="balance-arrow">›</text>
					</view>
					<view class="balance-value coins">
						<image class="coin-icon" src="/static/svg/jinbi.svg" mode="aspectFit" />
						{{ childInfo.total_reward_points || 0 }}
					</view>
				</view>
			</view>
		</view>

		<!-- 操作按钮 -->
		<view class="action-section">
			<view class="action-card" @click="openAdjustModal('points')">
				<view class="action-icon">⭐</view>
				<view class="action-info">
					<text class="action-title">调整积分</text>
					<text class="action-desc">增加或减少积分余额</text>
				</view>
				<text class="action-arrow">›</text>
			</view>
			<view class="action-card" @click="openAdjustModal('coins')">
				<view class="action-icon coin-icon">💰</view>
				<view class="action-info">
					<text class="action-title">调整金币</text>
					<text class="action-desc">增加或减少金币余额</text>
				</view>
				<text class="action-arrow">›</text>
			</view>
		</view>

		<!-- 数据统计 -->
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

		<!-- 近期任务 -->
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
				<view v-if="recentTasks.length === 0" class="empty-state">
					<text class="empty-icon">📝</text>
					<text class="empty-text">暂无任务记录</text>
				</view>
			</view>
		</view>

		<!-- 兑换记录 -->
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
				<view v-if="recentRewards.length === 0" class="empty-state">
					<text class="empty-icon">🎁</text>
					<text class="empty-text">暂无兑换记录</text>
				</view>
			</view>
		</view>

		<!-- 正在学习 -->
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
				<view v-if="learningBooks.length === 0" class="empty-state">
					<text class="empty-icon">📚</text>
					<text class="empty-text">暂无学习教材</text>
				</view>
			</view>
		</view>

		<!-- 调整弹窗 -->
		<view class="modal-overlay" v-if="showAdjustModal" @click="closeAdjustModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">{{ adjustType === 'points' ? '⭐ 调整积分' : '💰 调整金币' }}</text>
					<text class="modal-close" @click="closeAdjustModal">✕</text>
				</view>
				<view class="modal-body">
					<view class="form-item">
						<text class="form-label">当前余额</text>
						<view class="current-balance">
							<template v-if="adjustType === 'points'">
								<text class="balance-value">{{ childInfo.total_points || 0 }} 积分</text>
							</template>
							<template v-else>
								<image class="coin-icon" src="/static/svg/jinbi.svg" mode="aspectFit" />
								<text class="balance-value">{{ childInfo.total_reward_points || 0 }} 金币</text>
							</template>
						</view>
					</view>
					
					<view class="form-item">
						<text class="form-label">调整类型</text>
						<view class="adjust-type">
							<view 
								class="type-btn" 
								:class="{ active: adjustAction === 'add' }" 
								@click="adjustAction = 'add'"
							>增加</view>
							<view 
								class="type-btn" 
								:class="{ active: adjustAction === 'subtract' }" 
								@click="adjustAction = 'subtract'"
							>减少</view>
						</view>
					</view>
					
					<view class="form-item">
						<text class="form-label">调整数量</text>
						<input 
							class="form-input" 
							type="number" 
							v-model="adjustAmount" 
							placeholder="请输入调整数量" 
						/>
					</view>
					
					<view class="form-item">
						<text class="form-label">调整原因</text>
						<textarea 
							class="form-textarea" 
							v-model="adjustReason" 
							placeholder="请输入调整原因（例如：奖励积分、扣除违规积分等）" 
						/>
					</view>
					
					<view class="adjust-preview" v-if="adjustAmount">
						<text class="preview-label">调整预览：</text>
						<text class="preview-value" :class="adjustAction === 'add' ? 'positive' : 'negative'">
							{{ adjustAction === 'add' ? '+' : '-' }}{{ adjustAmount }}
							{{ adjustType === 'points' ? '积分' : '金币' }}
						</text>
						<text class="preview-balance">调整后余额：{{ getNewBalance() }} {{ adjustType === 'points' ? '积分' : '金币' }}</text>
					</view>
				</view>
				<view class="modal-footer">
					<button class="btn btn-secondary" @click="closeAdjustModal">取消</button>
					<button class="btn btn-primary" @click="confirmAdjust">确认调整</button>
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
					id: '',
					name: '',
					age: '',
					grade: '',
					gender: '',
					total_points: 0,
					total_reward_points: 0,
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
				learningBooks: [],
				showAdjustModal: false,
				adjustType: 'points',
				adjustAction: 'add',
				adjustAmount: '',
				adjustReason: ''
			}
		},
		async onLoad(options) {
			if (options && (options.id || options.childId)) {
				this.childId = options.id || options.childId
				
				// 优先从传入的 childData 获取数据
				if (options.childData) {
					try {
						const childData = JSON.parse(decodeURIComponent(options.childData))
						this.childInfo = {
							id: childData.id || childData.child_id || '',
							name: childData.name || '',
							age: childData.age || '',
							grade: childData.grade || '',
							gender: '',
							total_points: childData.total_points || 0,
							total_reward_points: childData.total_reward_points || 0,
							avatar: childData.avatar || ''
						}
					} catch (e) {
						console.warn('[ChildDetail] 解析 childData 失败，尝试从缓存加载:', e)
						this.loadChildFromCache()
					}
				} else {
					this.loadChildFromCache()
				}
				
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
					const children = UserManager.getChildren() || []
					const child = children.find(c => {
						const childKey = c.child_id || c.id || ''
						return childKey === this.childId || 
							   (typeof childKey === 'object' && childKey.value && childKey.value[0] && childKey.value[0].text === this.childId)
					})
					
					if (child) {
						this.childInfo = {
							id: child.id || child.child_id || '',
							name: typeof child.name === 'object' && child.name.value && child.name.value[0] && child.name.value[0].text 
								? child.name.value[0].text 
								: (Array.isArray(child.name) && child.name[0] && child.name[0].text 
									? child.name[0].text 
									: (child.name || '未知')),
							age: child.age || '',
							grade: child.grade || '',
							gender: child.gender || '',
							total_points: child.total_points || 0,
							total_reward_points: child.total_reward_points || 0,
							avatar: child.avatar || ''
						}
					} else {
						this.loadChildFromAPI()
					}
				} catch (error) {
					console.error('[ChildDetail] 从缓存加载儿童信息失败:', error)
					this.loadChildFromAPI()
				}
			},
			async loadChildFromAPI() {
				try {
					const result = await feishuRequest.queryRecords('儿童表', { child_id: this.childId })
					if (result.success && result.data && result.data.length > 0) {
						const item = result.data[0]
						const fields = item.fields
						this.childInfo = {
							id: item.record_id,
							name: fields.name ? (Array.isArray(fields.name) && fields.name[0] && fields.name[0].text ? fields.name[0].text : fields.name) : '未知',
							age: fields.age || '',
							grade: fields.grade || '',
							gender: fields.gender || '',
							total_points: fields.total_points || 0,
							total_reward_points: fields.total_reward_points || 0,
							avatar: ''
						}
					}
				} catch (error) {
					console.error('[ChildDetail] 从API加载儿童信息失败:', error)
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
					console.error('[ChildDetail] 加载统计数据失败:', error)
				}
			},
			async loadRecentTasks() {
				try {
					const result = await feishuRequest.queryRecords('任务表', { child_id: this.childId })
					if (result.success && result.data && result.data.length > 0) {
						const sortedTasks = result.data.sort((a, b) => 
							new Date(b.fields.created_time || b.fields.created_at || 0) - new Date(a.fields.created_time || a.fields.created_at || 0)
						)
						
						this.recentTasks = sortedTasks.slice(0, 5).map(item => {
							const title = item.fields.title 
								? (Array.isArray(item.fields.title) && item.fields.title[0] && item.fields.title[0].text 
									? item.fields.title[0].text 
									: item.fields.title)
								: ''
							
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
					console.error('[ChildDetail] 加载任务失败:', error)
					this.recentTasks = []
				}
			},
			async loadRecentRewards() {
				try {
					const result = await feishuRequest.queryRecords('兑换记录表', { child_id: this.childId })
					if (result.success && result.data && result.data.length > 0) {
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
					console.error('[ChildDetail] 加载奖励失败:', error)
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
					console.error('[ChildDetail] 加载教材失败:', error)
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
			formatTime(timestamp) {
				if (!timestamp) return '未知时间'
				
				let date
				if (typeof timestamp === 'number') {
					date = new Date(timestamp)
				} else {
					date = new Date(timestamp)
				}
				
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
			},
			openPointsRecord() {
				uni.navigateTo({
					url: `/pages/parent/points-record?childId=${this.childId}&childName=${encodeURIComponent(this.childInfo.name)}`
				})
			},
			openCoinsRecord() {
				uni.navigateTo({
					url: `/pages/parent/points-record?childId=${this.childId}&childName=${encodeURIComponent(this.childInfo.name)}&type=coins`
				})
			},
			openAdjustModal(type) {
				this.adjustType = type
				this.adjustAction = 'add'
				this.adjustAmount = ''
				this.adjustReason = ''
				this.showAdjustModal = true
			},
			closeAdjustModal() {
				this.showAdjustModal = false
				this.adjustAmount = ''
				this.adjustReason = ''
			},
			getNewBalance() {
				const current = this.adjustType === 'points' ? (this.childInfo.total_points || 0) : (this.childInfo.total_reward_points || 0)
				const amount = parseInt(this.adjustAmount) || 0
				return this.adjustAction === 'add' ? current + amount : current - amount
			},
			async confirmAdjust() {
				const amount = parseInt(this.adjustAmount)
				if (!amount || amount <= 0) {
					uni.showToast({ title: '请输入有效的调整数量', icon: 'none' })
					return
				}
				if (!this.adjustReason.trim()) {
					uni.showToast({ title: '请输入调整原因', icon: 'none' })
					return
				}
				
				const newBalance = this.getNewBalance()
				if (newBalance < 0) {
					uni.showToast({ title: '调整后余额不能为负数', icon: 'none' })
					return
				}
				
				uni.showLoading({ title: '处理中...' })
				try {
					// 1. 先添加积分记录
					const recordType = this.adjustAction === 'add' ? '奖励' : '扣除'
					const recordData = {
						child_id: this.childId,
						related_type: recordType,
						description: this.adjustReason,
						created_time: Date.now()
					}
					if (this.adjustType === 'points') {
						recordData.base_points = this.adjustAction === 'add' ? amount : -amount
					} else {
						recordData.reward_points = this.adjustAction === 'add' ? amount : -amount
					}
					
					const addRecordResult = await feishuRequest.addRecord('积分记录表', recordData)
					
					if (!addRecordResult.success) {
						uni.showToast({ title: '添加记录失败', icon: 'none' })
						return
					}
					
					// 2. 再更新儿童表（使用 record_id 而不是 child_id）
					const updateData = {}
					if (this.adjustType === 'points') {
						updateData.total_points = newBalance
					} else {
						updateData.total_reward_points = newBalance
					}
					
					const updateResult = await feishuRequest.updateRecord('儿童表', this.childInfo.id, updateData)
					
					if (updateResult.success) {
						if (this.adjustType === 'points') {
							this.childInfo.total_points = newBalance
						} else {
							this.childInfo.total_reward_points = newBalance
						}
						
						uni.showToast({ title: '调整成功', icon: 'success' })
					} else {
						uni.showToast({ title: updateResult.message || '调整失败', icon: 'none' })
					}
				} catch (error) {
					console.error('[ChildDetail] 调整失败:', error)
					uni.showToast({ title: '调整失败', icon: 'none' })
				} finally {
					uni.hideLoading()
					this.closeAdjustModal()
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
		text-align: right;
	}

	.edit-btn {
		font-size: 32rpx;
	}

	.info-card {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 40rpx;
		border-radius: 0 0 30rpx 30rpx;
		color: #fff;
	}

	.avatar-section {
		display: flex;
		align-items: center;
		margin-bottom: 30rpx;
	}

	.child-avatar {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		background-color: rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 48rpx;
		margin-right: 25rpx;
		overflow: hidden;
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}

	.child-info {
		display: flex;
		flex-direction: column;
	}

	.child-name {
		font-size: 36rpx;
		font-weight: bold;
	}

	.child-detail {
		font-size: 26rpx;
		opacity: 0.8;
		margin-top: 8rpx;
	}

	.balance-section {
		display: flex;
		background-color: rgba(255, 255, 255, 0.15);
		border-radius: 20rpx;
		padding: 25rpx;
	}

	.balance-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		cursor: pointer;
	}

	.balance-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.balance-label {
		font-size: 24rpx;
		opacity: 0.8;
	}

	.balance-arrow {
		font-size: 28rpx;
		opacity: 0.6;
	}

	.balance-value {
		font-size: 40rpx;
		font-weight: bold;
		margin-top: 10rpx;
		display: flex;
		align-items: center;
		gap: 8rpx;
	}

	.balance-value.coins {
		color: #ffd700;
	}

	.balance-divider {
		width: 1rpx;
		background-color: rgba(255, 255, 255, 0.3);
		margin: 0 20rpx;
	}

	.coin-icon {
		width: 36rpx;
		height: 36rpx;
	}

	.action-section {
		padding: 20rpx;
		display: flex;
		gap: 20rpx;
		margin-top: -20rpx;
	}

	.action-card {
		flex: 1;
		background-color: #fff;
		border-radius: 20rpx;
		padding: 25rpx;
		display: flex;
		align-items: center;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
	}

	.action-icon {
		width: 80rpx;
		height: 80rpx;
		border-radius: 20rpx;
		background-color: #fff3e0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 36rpx;
		margin-right: 20rpx;

		&.coin-icon {
			background-color: #fff8e1;
		}
	}

	.action-info {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.action-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
	}

	.action-desc {
		font-size: 22rpx;
		color: #999;
		margin-top: 5rpx;
	}

	.action-arrow {
		font-size: 32rpx;
		color: #ccc;
	}

	.section {
		background-color: #fff;
		margin: 20rpx;
		border-radius: 20rpx;
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
		margin-bottom: 15rpx;
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

	.form-textarea {
		width: 100%;
		height: 160rpx;
		padding: 20rpx;
		border: 2rpx solid #e8e8e8;
		border-radius: 10rpx;
		font-size: 28rpx;
		box-sizing: border-box;
	}

	.current-balance {
		display: flex;
		align-items: center;
		gap: 10rpx;
		padding: 20rpx;
		background-color: #f8f9fa;
		border-radius: 10rpx;
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.adjust-type {
		display: flex;
		gap: 20rpx;
	}

	.type-btn {
		flex: 1;
		height: 70rpx;
		border-radius: 35rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;
		background-color: #f5f5f5;
		color: #666;
		transition: all 0.3s;

		&.active {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: #fff;
		}
	}

	.adjust-preview {
		padding: 20rpx;
		background-color: #fff3e0;
		border-radius: 10rpx;
		margin-top: 10rpx;
	}

	.preview-label {
		font-size: 24rpx;
		color: #666;
	}

	.preview-value {
		font-size: 32rpx;
		font-weight: bold;
		margin-left: 10rpx;

		&.positive {
			color: #4caf50;
		}

		&.negative {
			color: #f44336;
		}
	}

	.preview-balance {
		display: block;
		font-size: 24rpx;
		color: #666;
		margin-top: 10rpx;
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
</style>

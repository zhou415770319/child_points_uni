<template>
	<view class="container">
		<view class="header">
			<view class="user-section" @click="showChildSwitch">
				<view class="avatar">
					<image v-if="currentChild?.avatar && currentChild.avatar.startsWith('http')" class="avatar-img" :src="currentChild.avatar" mode="aspectFill" />
					<text v-else>{{ currentChild?.name?.charAt(0) || '?' }}</text>
				</view>
				<view class="greeting">
					<text class="hello">👋 你好，{{ currentChild?.name || '小朋友' }}</text>
					<text class="date">{{ currentDate }}</text>
				</view>
				<text class="switch-icon">↕️</text>
			</view>
			<view class="points-badge" @click="goToPointsHistory">
					<text class="points-value">{{ totalPoints || 0 }}</text>
					<text class="points-label">积分</text>
					<text class="points-arrow">›</text>
				</view>
		</view>

		<view class="streak-card">
			<view class="streak-icon">🔥</view>
			<view class="streak-info">
				<text class="streak-title">连续打卡</text>
				<text class="streak-days">{{ streakDays }} 天</text>
			</view>
			<view class="streak-progress">
				<view class="progress-bar">
					<view class="progress-fill" :style="{ width: streakProgress + '%' }"></view>
				</view>
				<text class="progress-text">再坚持 {{ 7 - (streakDays % 7) }} 天获得奖励</text>
			</view>
		</view>

		<view class="section">
			<view class="section-header">
				<text class="section-title">📋 今日任务</text>
				<text class="section-count">{{ completedTasks }}/{{ totalTasks }}</text>
			</view>
			<view class="task-list">
				<view class="task-item" v-for="task in todayTasks" :key="task.id" :class="{ completed: task.completed }">
					<view class="task-checkbox">
						<text v-if="task.completed">✓</text>
					</view>
					<view class="task-content" @click="goToTaskDetail(task)">
						<text class="task-icon">{{ getTaskIcon(task.type) }}</text>
						<view class="task-info">
							<text class="task-title">{{ task.title }}</text>
							<text class="task-points">+{{ task.base_points }} 积分</text>
						</view>
					</view>
					<view class="task-actions">
						<!-- 未开始状态：显示switch -->
						<view v-if="task.status === '未开始'" class="task-switch">
							<switch :checked="false" @change="startTask(task)" color="#667eea" />
						</view>
						
						<!-- 进行中状态：显示计时器和暂停/完成按钮 -->
						<view v-else-if="task.status === '进行中'" class="timer-section">
							<view class="timer-display">{{ formatTime(task.elapsed_time || 0) }}</view>
							<view class="timer-buttons">
								<button class="timer-btn pause" @click="pauseTask(task)">暂停</button>
								<button class="timer-btn complete" @click="completeTask(task)">完成</button>
							</view>
						</view>
						
						<!-- 暂停状态：显示计时器和继续/完成按钮 -->
						<view v-else-if="task.status === '暂停'" class="timer-section">
							<view class="timer-display">{{ formatTime(task.elapsed_time || 0) }}</view>
							<view class="timer-buttons">
								<button class="timer-btn resume" @click="resumeTask(task)">继续</button>
								<button class="timer-btn complete" @click="completeTask(task)">完成</button>
							</view>
						</view>
						
						<!-- 已完成状态：显示完成时间 -->
						<view v-else-if="task.status === '已完成'" class="task-status">
							<text class="status-completed">已完成</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view class="section">
			<text class="section-title">🎁 我的奖励</text>
			<view class="reward-list">
				<view class="reward-item" v-for="reward in rewards" :key="reward.id">
					<view class="reward-icon">{{ reward.icon }}</view>
					<view class="reward-info">
						<text class="reward-name">{{ reward.name }}</text>
						<text class="reward-desc">{{ reward.description }}</text>
					</view>
					<view class="reward-right">
						<text class="reward-price">{{ reward.price }}积分</text>
						<view class="reward-status" :class="reward.status">{{ reward.status }}</view>
					</view>
				</view>
			</view>
			<button class="go-mall-btn" @click="goToMall">去商城兑换</button>
		</view>

		<view class="section" v-if="learningBook">
			<text class="section-title">📚 正在学习</text>
			<view class="learning-card">
				<view class="learning-icon">{{ learningBook.icon }}</view>
				<view class="learning-info">
					<text class="learning-title">{{ learningBook.title }}</text>
					<view class="learning-progress">
						<view class="progress-bar">
							<view class="progress-fill" :style="{ width: learningBook.progress + '%' }"></view>
						</view>
						<text class="progress-text">{{ learningBook.currentPage }}/{{ learningBook.totalPages }} ({{ learningBook.progress }}%)</text>
					</view>
				</view>
				<button class="continue-btn" @click="continueLearning">继续学习</button>
			</view>
		</view>

		<view class="modal-overlay" v-if="showChildSwitchModal" @click="closeChildSwitchModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">👧 切换儿童账号</text>
					<text class="modal-close" @click="closeChildSwitchModal">✕</text>
				</view>
				<view class="modal-body">
					<view class="child-list">
						<view class="child-item" v-for="child in children" :key="child.id" :class="{ active: child.child_id === currentChild?.child_id }" @click="switchChild(child)">
							<view class="child-avatar">
								<image v-if="child.avatar && child.avatar.startsWith('http')" class="avatar-img" :src="child.avatar" mode="aspectFill" />
								<text v-else>{{ getAvatar(child.name) }}</text>
							</view>
							<view class="child-info">
								<text class="child-name">{{ child.name }}</text>
								<text class="child-detail">{{ child.age }}岁 · {{ child.grade }}</text>
							</view>
							<view class="child-check" v-if="child.child_id === currentChild?.child_id">✓</view>
						</view>
					</view>
				</view>
				<view class="modal-footer">
					<button class="logout-btn" @click="logoutFromChild">🚪 退出儿童账号</button>
				</view>
			</view>
		</view>

		<custom-tab-bar ref="tabBar"></custom-tab-bar>
	</view>
</template>

<script>
	import customTabBar from '@/custom-tab-bar/index.vue'
	import UserManager from '@/common/user-manager.js'
	import { feishuRequest } from '@/common/feishu-request.js'
	
	const AVATARS = ['👦', '👧', '🧒', '👶']
	
	export default {
		components: { customTabBar },
		data() {
			return {
				currentChild: null,
				children: [],
				currentDate: '',
				showChildSwitchModal: false,
				streakDays: 15,
				streakProgress: 71,
				todayTasks: [],
				rewards: [],
				learningBook: {
					title: '小学语文三年级上册',
					progress: 65,
					icon: '📖'
				},
				totalPoints: 0,
				timers: {}
			}
		},
		computed: {
			completedTasks() {
				return this.todayTasks.filter(t => t.completed).length
			},
			totalTasks() {
				return this.todayTasks.length
			}
		},
		async onLoad() {
			const now = new Date()
			this.currentDate = `${now.getMonth() + 1}月${now.getDate()}日`
			
			// 先加载当前儿童信息（必须先获取）
			await this.loadCurrentChild()
			
			// 批量加载首页数据（只调用一次云函数）
			await this.loadHomeData()
			
			// 监听任务详情页返回后的刷新事件
			uni.$on('refreshTasks', async () => {
				await this.loadTodayTasks()
				// 如果有任务正在进行中，重新启动计时器
				this.todayTasks.forEach(task => {
					if (task.status === '进行中') {
						this.startTimer(task)
					}
				})
			})
		},
		onUnload() {
			// 清理所有计时器
			if (this.timers) {
				Object.keys(this.timers).forEach(key => {
					clearInterval(this.timers[key])
				})
				this.timers = {}
			}
			
			// 移除事件监听
			uni.$off('refreshTasks')
		},
		methods: {
			/**
			 * 批量加载首页数据（只调用一次云函数，减少调用次数）
			 */
			async loadHomeData() {
				try {
					if (!this.currentChild || !this.currentChild.id) {
						// 如果没有当前儿童，使用mock数据
						this.todayTasks = this.getMockTasks()
						this.rewards = this.getMockRewards()
						this.learningBook = null
						return
					}
					
					uni.showLoading({ title: '加载中...' })
					
					// 一次云函数调用获取所有数据
					const result = await feishuRequest.getHomeData(this.currentChild.child_id || this.currentChild.id)
					
					if (result.success && result.data) {
						// 1. 处理任务数据
						if (result.data.tasks && result.data.tasks.length > 0) {
							this.todayTasks = result.data.tasks.map(item => {
								const title = item.fields.title 
									? (Array.isArray(item.fields.title) && item.fields.title[0] && item.fields.title[0].text 
										? item.fields.title[0].text 
										: item.fields.title)
									: ''
								const description = item.fields.description 
									? (Array.isArray(item.fields.description) && item.fields.description[0] && item.fields.description[0].text 
										? item.fields.description[0].text 
										: item.fields.description)
									: ''
								return {
									id: item.record_id,
									title: title,
									description: description,
									type: item.fields.type || '',
									type_text: item.fields.type_text || '',
									difficulty: item.fields.difficulty || '简单',
									base_points: item.fields.base_points || 10,
									child_id: item.fields.child_id || '',
									status: item.fields.status || '未开始',
									completed: item.fields.status === '已完成',
									elapsed_time: item.fields.elapsed_time || 0
								}
							})
						} else {
							this.todayTasks = this.getMockTasks()
						}
						
						// 2. 处理奖励数据
						if (result.data.rewards && result.data.rewards.length > 0) {
							this.rewards = result.data.rewards
								.sort((a, b) => new Date(b.fields.created_at || 0) - new Date(a.fields.created_at || 0))
								.slice(0, 3)
								.map(item => ({
									id: item.record_id,
									name: this.parseTextField(item.fields.gift_name) || '未知礼品',
									description: this.parseTextField(item.fields.description) || '',
									price: item.fields.points || 0,
									status: item.fields.status || '待处理',
									icon: this.getRewardIcon(item.fields.category)
								}))
						} else {
							this.rewards = this.getMockRewards()
						}
						
						// 3. 处理教材数据
						if (result.data.textbooks && result.data.textbooks.length > 0) {
							const latestBook = result.data.textbooks.sort((a, b) => 
								(b.fields.current_page || 0) - (a.fields.current_page || 0)
							)[0]
							
							if (latestBook) {
								const currentPage = latestBook.fields.current_page || 0
								const totalPages = latestBook.fields.total_pages || 1
								const progress = Math.round((currentPage / totalPages) * 100)
								
								this.learningBook = {
									title: this.parseTextField(latestBook.fields.name) || '未知教材',
									progress: Math.min(progress, 100),
									icon: this.getBookIcon(latestBook.fields.subject),
									currentPage: currentPage,
									totalPages: totalPages
								}
							} else {
								this.learningBook = null
							}
						} else {
							this.learningBook = null
						}
					} else {
						this.todayTasks = this.getMockTasks()
						this.rewards = this.getMockRewards()
						this.learningBook = null
					}
					
					uni.hideLoading()
				} catch (error) {
					console.error('[Child Home] 批量加载首页数据失败:', error)
					// 失败时降级到单个方法加载
					await Promise.all([
						this.loadTodayTasks(),
						this.loadRewards(),
						this.loadLearningBook()
					])
				}
			},
			
			/**
			 * 加载当前儿童信息（从儿童表获取）
			 */
			async loadCurrentChild() {
				try {
					this.currentChild = await UserManager.getCurrentChild()
					console.log('[Child Home] 当前儿童信息:', this.currentChild)
					
					if (this.currentChild) {
						// 并行加载儿童列表和积分信息（两者无依赖）
						await Promise.all([
							this.loadChildrenList(),
							this.loadChildPoints()
						])
					}
				} catch (error) {
					console.error('[Child Home] 加载儿童信息失败:', error)
				}
			},
			
			/**
			 * 加载儿童积分（从多维表格获取）
			 */
			async loadChildPoints() {
				try {
					if (this.currentChild && this.currentChild.id) {
						// 从儿童表获取积分信息
						this.totalPoints = this.currentChild.total_points || 0
					}
				} catch (error) {
					console.error('[Child Home] 加载积分失败:', error)
				}
			},
			
			/**
			 * 解析多维表格文本字段
			 * @param {any} field - 字段值
			 * @returns {string} 解析后的文本
			 */
			parseTextField(field) {
				if (!field) return ''
				// 处理新格式：{ type: 1, value: [{ text: 'xxx', type: 'text' }] }
				if (typeof field === 'object' && field.type === 1 && field.value && Array.isArray(field.value) && field.value.length > 0) {
					return field.value[0].text || ''
				}
				// 处理旧格式：[{ text: 'xxx' }]
				if (Array.isArray(field) && field[0] && field[0].text) {
					return field[0].text
				}
				// 处理字符串
				if (typeof field === 'string') {
					return field
				}
				return ''
			},
			
			/**
			 * 加载我的奖励（从兑换记录表获取最近3条）
			 */
			async loadRewards() {
				try {
					if (!this.currentChild || !this.currentChild.id) {
						this.rewards = this.getMockRewards()
						return
					}
					
					const filter = { child_id: this.currentChild.child_id || this.currentChild.id }
					const result = await feishuRequest.queryRecords('兑换记录表', filter)
					
					if (result.success && result.data && result.data.length > 0) {
						// 按时间倒序排列，取最近3条
						this.rewards = result.data
							.sort((a, b) => new Date(b.fields.created_at || 0) - new Date(a.fields.created_at || 0))
							.slice(0, 3)
							.map(item => ({
								id: item.record_id,
								name: this.parseTextField(item.fields.gift_name) || '未知礼品',
								description: this.parseTextField(item.fields.description) || '',
								price: item.fields.points || 0,
								status: item.fields.status || '待处理',
								icon: this.getRewardIcon(item.fields.category)
							}))
					} else {
						this.rewards = this.getMockRewards()
					}
				} catch (error) {
					console.error('[Child Home] 加载奖励记录失败:', error)
					this.rewards = this.getMockRewards()
				}
			},
			
			/**
			 * 获取奖励图标
			 */
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
			
			/**
			 * 获取mock奖励数据
			 */
			getMockRewards() {
				return [
					{ id: 1, name: '糖果礼包', description: '美味糖果', price: 100, icon: '🍬', status: '已完成' },
					{ id: 2, name: '卡通贴纸', description: '可爱贴纸', price: 50, icon: '🎨', status: '待发货' },
					{ id: 3, name: '小玩具', description: '益智玩具', price: 200, icon: '🧩', status: '待处理' }
				]
			},
			
			/**
			 * 加载正在学习的教材（从教材表获取最近学习的教材）
			 */
			async loadLearningBook() {
				try {
					if (!this.currentChild || !this.currentChild.id) {
						this.learningBook = null
						return
					}
					
					const filter = { child_id: this.currentChild.child_id || this.currentChild.id }
					const result = await feishuRequest.queryRecords('教材表', filter)
					
					if (result.success && result.data && result.data.length > 0) {
						// 按当前页码排序，取进度最大的一条（最近学习的）
						const latestBook = result.data.sort((a, b) => 
							(b.fields.current_page || 0) - (a.fields.current_page || 0)
						)[0]
						
						if (latestBook) {
							// 计算学习进度：(current_page / total_pages) * 100
							const currentPage = latestBook.fields.current_page || 0
							const totalPages = latestBook.fields.total_pages || 1
							const progress = Math.round((currentPage / totalPages) * 100)
							
							this.learningBook = {
								title: this.parseTextField(latestBook.fields.name) || '未知教材',
								progress: Math.min(progress, 100),
								icon: this.getBookIcon(latestBook.fields.subject),
								currentPage: currentPage,
								totalPages: totalPages
							}
						} else {
							this.learningBook = null
						}
					} else {
						this.learningBook = null
					}
				} catch (error) {
					console.error('[Child Home] 加载教材失败:', error)
					this.learningBook = null
				}
			},
			
			/**
			 * 获取教材图标
			 */
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
					'history': '📜',
					'历史': '📜',
					default: '📚'
				}
				return icons[subject] || icons.default
			},
			
			/**
			 * 加载今日任务（从多维表格获取）
			 */
			async loadTodayTasks() {
				try {
					if (!this.currentChild || !this.currentChild.id) {
						// 如果没有当前儿童，使用mock数据
						this.todayTasks = this.getMockTasks()
						return
					}
					
					uni.showLoading({ title: '加载中...' })
					
					// 根据当前儿童ID获取任务（添加child_id筛选条件）
					const filter = { child_id: this.currentChild.child_id || this.currentChild.id }
					const result = await feishuRequest.queryRecords('任务表', filter)
					console.log('任务表----', result,this.currentChild);
					
					if (result.success && result.data && result.data.length > 0) {
						this.todayTasks = result.data.map(item => {
							const title = item.fields.title 
								? (Array.isArray(item.fields.title) && item.fields.title[0] && item.fields.title[0].text 
									? item.fields.title[0].text 
									: item.fields.title)
								: ''
							const description = item.fields.description 
								? (Array.isArray(item.fields.description) && item.fields.description[0] && item.fields.description[0].text 
									? item.fields.description[0].text 
									: item.fields.description)
								: ''
							return {
								id: item.record_id,
								title: title,
								description: description,
								type: item.fields.type || '',
								type_text: item.fields.type_text || '',
								difficulty: item.fields.difficulty || '简单',
								base_points: item.fields.base_points || 10,
								child_id: item.fields.child_id || '',
								status: item.fields.status || '未开始',
								completed: item.fields.status === '已完成',
								elapsed_time: item.fields.elapsed_time || 0  // 初始化累计时间
							}
						})
					} else {
						this.todayTasks = this.getMockTasks()
					}
					
					uni.hideLoading()
				} catch (error) {
					console.error('[Child Home] 加载任务失败:', error)
					this.todayTasks = this.getMockTasks()
				}
			},
			
			/**
			 * 获取mock任务数据
			 */
			getMockTasks() {
				return [
					{ id: 1, title: '语文阅读30分钟', type: 'reading', type_text: '阅读', difficulty: '简单', base_points: 10, completed: true, status: '已完成' },
					{ id: 2, title: '数学练习10题', type: 'math', type_text: '数学', difficulty: '中等', base_points: 15, completed: true, status: '已完成' },
					{ id: 3, title: '英语单词背诵', type: 'english', type_text: '英语', difficulty: '简单', base_points: 10, completed: false, status: '未开始' },
					{ id: 4, title: '画画练习', type: 'art', type_text: '美术', difficulty: '简单', base_points: 8, completed: false, status: '未开始' }
				]
			},
			
			/**
			 * 加载家长绑定的所有儿童列表（从儿童表获取）
			 */
			async loadChildrenList() {
				try {
					// 获取当前家长信息
					const parent = await UserManager.getCurrentParent()
					if (parent && parent.phone) {
						this.children = await UserManager.getChildrenByParent(parent.phone)
						console.log('[Child Home] 儿童列表:', this.children)
					}
				} catch (error) {
					console.error('[Child Home] 加载儿童列表失败:', error)
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
			
			getAvatar(name) {
				const index = name ? name.charCodeAt(0) % AVATARS.length : 0
				return AVATARS[index]
			},
			
			goToTaskDetail(task) {
				// 如果任务正在进行中，暂停首页的计时器
				if (task.status === '进行中') {
					this.stopTimer(task)
				}
				uni.navigateTo({ url: `/pages/child/task-detail?id=${task.id}` })
			},
			
			/**
			 * 开始任务
			 */
			async startTask(task) {
				try {
					uni.showLoading({ title: '更新中...' })
					
					// 检查是否已有进行中的任务
					const runningTask = this.todayTasks.find(t => t.status === '进行中' && t.id !== task.id)
					if (runningTask) {
						uni.hideLoading()
						uni.showToast({ title: '只能有一个任务进行中', icon: 'none' })
						return
					}
					
					const result = await feishuRequest.updateRecord('任务表', task.id, {
						status: '进行中'
					})
					
					if (result.success) {
						task.status = '进行中'
						task.elapsed_time = task.elapsed_time || 0
						task.start_time = Date.now()
						// 启动计时器
						this.startTimer(task)
						uni.showToast({ title: '任务已开始', icon: 'success' })
					} else {
						uni.showToast({ title: '更新失败', icon: 'none' })
					}
				} catch (error) {
					console.error('[Child Home] 开始任务失败:', error)
					uni.showToast({ title: '更新失败', icon: 'none' })
				}
				
				uni.hideLoading()
			},
			
			/**
			 * 暂停任务
			 */
			async pauseTask(task) {
				try {
					uni.showLoading({ title: '更新中...' })
					
					// 停止计时器
					this.stopTimer(task)
					
					const result = await feishuRequest.updateRecord('任务表', task.id, {
						status: '暂停',
						elapsed_time: task.elapsed_time || 0  // 保存累计时间
					})
					
					if (result.success) {
						task.status = '暂停'
						uni.showToast({ title: '任务已暂停', icon: 'success' })
					} else {
						uni.showToast({ title: '更新失败', icon: 'none' })
					}
				} catch (error) {
					console.error('[Child Home] 暂停任务失败:', error)
					uni.showToast({ title: '更新失败', icon: 'none' })
				}
				
				uni.hideLoading()
			},
			
			/**
			 * 继续任务
			 */
			async resumeTask(task) {
				try {
					uni.showLoading({ title: '更新中...' })
					
					const result = await feishuRequest.updateRecord('任务表', task.id, {
						status: '进行中'
					})
					
					if (result.success) {
						task.status = '进行中'
						task.start_time = Date.now()
						this.startTimer(task)
						uni.showToast({ title: '任务已继续', icon: 'success' })
					} else {
						uni.showToast({ title: '更新失败', icon: 'none' })
					}
				} catch (error) {
					console.error('[Child Home] 继续任务失败:', error)
					uni.showToast({ title: '更新失败', icon: 'none' })
				}
				
				uni.hideLoading()
			},
			
			/**
			 * 完成任务
			 */
			async completeTask(task) {
				try {
					uni.showLoading({ title: '更新中...' })
					
					// 停止计时器
					this.stopTimer(task)
					
					const result = await feishuRequest.updateRecord('任务表', task.id, {
						status: '已完成'
					})
					
					if (result.success) {
						task.status = '已完成'
						task.completed = true
						// 完成任务增加积分
						this.totalPoints += task.base_points
						uni.showToast({ title: `+${task.base_points} 积分`, icon: 'success' })
					} else {
						uni.showToast({ title: '更新失败', icon: 'none' })
					}
				} catch (error) {
					console.error('[Child Home] 完成任务失败:', error)
					uni.showToast({ title: '更新失败', icon: 'none' })
				}
				
				uni.hideLoading()
			},
			
			/**
			 * 启动计时器
			 */
			startTimer(task) {
				if (this.timers[task.id]) {
					clearInterval(this.timers[task.id])
				}
				
				// 使用局部变量记录上次计时时间，避免修改task.start_time
				let lastTime = Date.now()
				
				this.timers[task.id] = setInterval(() => {
					const now = Date.now()
					const delta = Math.floor((now - lastTime) / 1000) // 转换为秒
					task.elapsed_time = (task.elapsed_time || 0) + delta
					lastTime = now
				}, 1000)
			},
			
			/**
			 * 停止计时器
			 */
			stopTimer(task) {
				if (this.timers[task.id]) {
					clearInterval(this.timers[task.id])
					delete this.timers[task.id]
				}
			},
			
			/**
			 * 格式化时间
			 */
			formatTime(seconds) {
				// elapsed_time 现在存储的是秒数
				const totalSeconds = Math.floor(seconds)
				const minutes = Math.floor(totalSeconds / 60)
				const hours = Math.floor(minutes / 60)
				
				const displaySeconds = totalSeconds % 60
				const displayMinutes = minutes % 60
				
				if (hours > 0) {
					return `${String(hours).padStart(2, '0')}:${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`
				}
				return `${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`
			},
			goToMall() {
				uni.switchTab({ url: '/pages/child/mall' })
			},
			goToPointsHistory() {
				uni.navigateTo({ url: '/pages/child/points-history' })
			},
			continueLearning() {
				uni.showToast({ title: '继续学习', icon: 'none' })
			},
			goToUcenter() {
				uni.navigateTo({ url: '/pages/ucenter/ucenter' })
			},
			showChildSwitch() {
				this.showChildSwitchModal = true
			},
			closeChildSwitchModal() {
				this.showChildSwitchModal = false
			},
			async switchChild(child) {
				// 更新缓存
				UserManager.setCurrentChild(child)
				this.currentChild = child
				this.showChildSwitchModal = false
				
				// 重新加载积分和任务数据
				this.loadChildPoints()
				this.loadTodayTasks()
				
				uni.showToast({ title: `已切换到${child.name}`, icon: 'success' })
			},
			/**
			 * 退出儿童账号，返回登录页面
			 */
			logoutFromChild() {
				// 先关闭切换儿童账号的弹框，避免确认对话框被遮罩层遮住
				this.showChildSwitchModal = false
				
				uni.showModal({
					title: '确认退出',
					content: '确定要退出当前儿童账号吗？',
					success: (res) => {
						if (res.confirm) {
							// 使用UserManager清除用户缓存（保留飞书配置）
							UserManager.clearUserCache()
							
							// 跳转到登录页面
							uni.reLaunch({
								url: '/pages/login'
							})
						}
					}
				})
			}
		},
		onShow() {
			if (this.$refs.tabBar) {
				this.$refs.tabBar.updateSelected('/pages/child/home')
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
		padding: 60rpx 30rpx 40rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
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
		font-size: 32rpx;
		font-weight: bold;
		color: #fff;
		overflow: hidden;
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}

	.greeting {
		color: #fff;
	}

	.hello {
		font-size: 30rpx;
		font-weight: bold;
		display: block;
	}

	.date {
		font-size: 24rpx;
		opacity: 0.8;
	}

	.points-badge {
		background-color: rgba(255, 255, 255, 0.2);
		border-radius: 20rpx;
		padding: 15rpx 25rpx;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.points-value {
		font-size: 36rpx;
		font-weight: bold;
		color: #ffd700;
	}

	.points-label {
		font-size: 22rpx;
		color: #fff;
		opacity: 0.8;
	}

	.points-arrow {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.6);
		margin-top: 5rpx;
	}

	.streak-card {
		background-color: #fff;
		margin: -30rpx 20rpx 20rpx;
		border-radius: 20rpx;
		padding: 25rpx;
		display: flex;
		align-items: center;
		box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
	}

	.streak-icon {
		font-size: 50rpx;
		margin-right: 20rpx;
	}

	.streak-info {
		flex: 1;
	}

	.streak-title {
		font-size: 26rpx;
		color: #999;
		display: block;
	}

	.streak-days {
		font-size: 36rpx;
		font-weight: bold;
		color: #ff6b35;
	}

	.streak-progress {
		text-align: right;
	}

	.progress-bar {
		width: 100rpx;
		height: 10rpx;
		background-color: #f0f0f0;
		border-radius: 5rpx;
		overflow: hidden;
		margin-bottom: 8rpx;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #ff6b35 0%, #f7931e 100%);
		border-radius: 5rpx;
	}

	.progress-text {
		font-size: 20rpx;
		color: #999;
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

	.section-count {
		font-size: 26rpx;
		color: #667eea;
		font-weight: bold;
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
		border-left: 6rpx solid #667eea;

		&.completed {
			border-left-color: #4caf50;
			opacity: 0.7;
		}
	}

	.task-checkbox {
		width: 44rpx;
		height: 44rpx;
		border-radius: 50%;
		border: 2rpx solid #ddd;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 15rpx;
		font-size: 24rpx;
		color: #4caf50;
		background-color: #fff;

		.task-item.completed & {
			background-color: #4caf50;
			border-color: #4caf50;
			color: #fff;
		}
	}

	.task-content {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 15rpx;
	}

	.task-icon {
		font-size: 36rpx;
	}

	.task-info {
		flex: 1;
	}

	.task-title {
		font-size: 28rpx;
		color: #333;
		display: block;
		margin-bottom: 5rpx;
	}

	.task-points {
		font-size: 22rpx;
		color: #ff9500;
	}

	.task-actions {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	
	.task-switch {
		display: flex;
		align-items: center;
	}
	
	.timer-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10rpx;
	}
	
	.timer-display {
		font-size: 32rpx;
		font-weight: bold;
		color: #667eea;
		font-family: monospace;
	}
	
	.timer-buttons {
		display: flex;
		gap: 10rpx;
	}
	
	.timer-btn {
		padding: 8rpx 20rpx;
		border-radius: 20rpx;
		font-size: 24rpx;
		border: none;
		
		&.pause {
			background-color: #ff9500;
			color: #fff;
		}
		
		&.resume {
			background-color: #2196f3;
			color: #fff;
		}
		
		&.complete {
			background-color: #4caf50;
			color: #fff;
		}
	}
	
	.task-status {
		font-size: 22rpx;
		padding: 8rpx 16rpx;
		border-radius: 20rpx;
	}

	.status-pending {
		background-color: #e3f2fd;
		color: #2196f3;
	}

	.status-completed {
		background-color: #e8f5e9;
		color: #4caf50;
	}

	.reward-list {
		display: flex;
		flex-direction: column;
		gap: 15rpx;
		margin-bottom: 20rpx;
	}

	.reward-item {
		display: flex;
		align-items: center;
		padding: 20rpx;
		background-color: #fff3e0;
		border-radius: 12rpx;
	}

	.reward-icon {
		font-size: 45rpx;
		margin-right: 20rpx;
	}

	.reward-info {
		flex: 1;
	}

	.reward-name {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		display: block;
	}

	.reward-desc {
		font-size: 24rpx;
		color: #999;
	}

	.reward-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 8rpx;
	}

	.reward-price {
		font-size: 26rpx;
		font-weight: bold;
		color: #ff9500;
	}

	.reward-status {
		font-size: 22rpx;
		padding: 6rpx 12rpx;
		border-radius: 15rpx;
		background-color: #e0e0e0;
		color: #666;

		&.待处理 {
			background-color: #fff3e0;
			color: #ff9500;
		}

		&.待发货 {
			background-color: #e3f2fd;
			color: #2196f3;
		}

		&.已发货 {
			background-color: #e8f5e9;
			color: #4caf50;
		}

		&.已完成 {
			background-color: #e8f5e9;
			color: #4caf50;
		}

		&.已取消 {
			background-color: #f5f5f5;
			color: #999;
		}
	}

	.go-mall-btn {
		width: 100%;
		height: 70rpx;
		border-radius: 35rpx;
		font-size: 28rpx;
		background: linear-gradient(135deg, #ff9500 0%, #ff6b35 100%);
		color: #fff;
		border: none;
	}

	.learning-card {
		display: flex;
		align-items: center;
		padding: 20rpx;
		background-color: #fafafa;
		border-radius: 12rpx;
	}

	.learning-icon {
		font-size: 50rpx;
		margin-right: 20rpx;
	}

	.learning-info {
		flex: 1;
	}

	.learning-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 10rpx;
	}

	.learning-progress {
		display: flex;
		align-items: center;
		gap: 15rpx;
	}

	.learning-progress .progress-bar {
		flex: 1;
		height: 12rpx;
	}

	.learning-progress .progress-fill {
		background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
	}

	.learning-progress .progress-text {
		font-size: 24rpx;
		color: #667eea;
		font-weight: bold;
	}

	.continue-btn {
		padding: 15rpx 30rpx;
		border-radius: 30rpx;
		font-size: 24rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		border: none;
	}

	.switch-icon {
		font-size: 32rpx;
		margin-left: 10rpx;
		opacity: 0.8;
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
		font-size: 34rpx;
		font-weight: bold;
		color: #333;
	}

	.modal-close {
		font-size: 36rpx;
		color: #999;
		padding: 10rpx;
	}

	.modal-body {
		padding: 20rpx;
		max-height: 60vh;
		overflow-y: auto;
	}

	.modal-footer {
		padding: 20rpx 30rpx;
		border-top: 1rpx solid #f0f0f0;
	}

	.logout-btn {
		width: 100%;
		height: 88rpx;
		border-radius: 44rpx;
		font-size: 32rpx;
		background-color: #fff;
		color: #f44336;
		border: 2rpx solid #f44336;
	}

	.child-list {
		display: flex;
		flex-direction: column;
	}

	.child-item {
		display: flex;
		align-items: center;
		padding: 25rpx 20rpx;
		border-radius: 15rpx;
		margin-bottom: 15rpx;
		background-color: #fafafa;

		&:active {
			background-color: #f0f0f0;
		}

		&.active {
			background-color: #e3f2fd;
			border: 2rpx solid #667eea;
		}
	}

	.child-avatar {
		width: 100rpx;
		height: 100rpx;
		border-radius: 50%;
		background-color: #667eea;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 48rpx;
		margin-right: 20rpx;
	}

	.child-info {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.child-name {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.child-detail {
		font-size: 24rpx;
		color: #999;
		margin-top: 8rpx;
	}

	.child-check {
		width: 48rpx;
		height: 48rpx;
		border-radius: 50%;
		background-color: #667eea;
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;
		font-weight: bold;
	}
</style>

<template>
	<view class="container">
		<!-- 头部组件 -->
		<ChildHeader 
			:currentChild="currentChild"
			:currentDate="currentDate"
			:totalPoints="totalPoints"
			@goToProfile="goToProfile"
			@showChildSwitch="showChildSwitch"
			@goToPointsHistory="goToPointsHistory"
		/>

		<!-- 连续打卡组件 -->
		<StreakCard 
			:streakDays="streakDays"
			:streakProgress="streakProgress"
		/>

		<!-- 今日任务列表 -->
		<TaskList 
			:tasks="todayTasks"
			type="today"
			title="今日任务"
			:countText="`${completedTasks}/${totalTasks}`"
			emptyText="今日暂无任务"
			emptyHint="请等待家长为您布置任务"
			@goToTaskDetail="goToTaskDetail"
			@startTask="startTask"
			@pauseTask="pauseTask"
			@resumeTask="resumeTask"
			@completeTask="completeTask"
		/>

		<!-- 其他任务列表 -->
		<TaskList 
			v-if="otherTasks.length > 0"
			:tasks="otherTasks"
			type="other"
			title="其他任务"
			:countText="`${otherTasks.length} 个待认领`"
			@goToTaskDetail="goToTaskDetail"
			@claimTask="claimTask"
		/>

		<!-- 奖励列表 -->
		<RewardList 
			:rewards="rewards"
			@goToMall="goToMall"
		/>

		<!-- 教材学习 -->
		<LearningBooks 
			:books="learningBooks"
			@goToBookDetail="goToBookDetail"
		/>

		<!-- 能力测试 -->
		<TestEntry 
			@goToTests="goToTests"
		/>

		<!-- 切换儿童账号弹框 -->
		<ChildSwitchModal 
			:visible="showChildSwitchModal"
			:children="children"
			:currentChild="currentChild"
			@close="closeChildSwitchModal"
			@switchChild="switchChild"
			@logout="logoutFromChild"
		/>

		<!-- 提交任务弹框 -->
		<TaskSubmitModal 
			:visible="showSubmitModal"
			:task="currentSubmitTask"
			@close="closeSubmitModal"
			@submit="handleTaskSubmit"
		/>

		<custom-tab-bar ref="tabBar"></custom-tab-bar>
	</view>
</template>

<script>
	import customTabBar from '@/custom-tab-bar/index.vue'
	import UserManager from '@/common/user-manager.js'
	import { feishuRequest } from '@/common/feishu-request.js'
	
	// 导入子组件
	import ChildHeader from '@/components/child/ChildHeader.vue'
	import StreakCard from '@/components/child/StreakCard.vue'
	import TaskList from '@/components/child/TaskList.vue'
	import RewardList from '@/components/child/RewardList.vue'
	import LearningBooks from '@/components/child/LearningBooks.vue'
	import TestEntry from '@/components/child/TestEntry.vue'
	import ChildSwitchModal from '@/components/child/ChildSwitchModal.vue'
	import TaskSubmitModal from '@/components/child/TaskSubmitModal.vue'
	
	export default {
		name: 'ChildHome',
		components: { 
			customTabBar,
			ChildHeader,
			StreakCard,
			TaskList,
			RewardList,
			LearningBooks,
			TestEntry,
			ChildSwitchModal,
			TaskSubmitModal
		},
		data() {
			return {
				currentChild: null,
				children: [],
				currentDate: '',
				showChildSwitchModal: false,
				streakDays: 15,
				streakProgress: 71,
				todayTasks: [],
				otherTasks: [],
				rewards: [],
				learningBooks: [],
				totalPoints: 0,
				timers: {},
				// 提交任务弹框相关
				showSubmitModal: false,
				currentSubmitTask: null
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
				await this.loadHomeData()
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
						this.todayTasks = []
						this.otherTasks = []
						this.rewards = []
						this.learningBooks = []
						return
					}
					
					uni.showLoading({ title: '加载中...' })
					
					const childId = this.currentChild.child_id || this.currentChild.id
					console.log('[Child Home] 开始加载首页数据，childId:', childId)
					
					// 一次云函数调用获取所有数据
					const result = await feishuRequest.getHomeData(childId)
					
					console.log('[Child Home] 云函数返回结果:', JSON.stringify(result, null, 2))
					
					if (result.success && result.data) {
						console.log('[Child Home] 数据解析成功，tasks数量:', result.data.tasks?.length || 0, 'otherTasks数量:', result.data.otherTasks?.length || 0)
						
						// 1. 处理任务数据
						if (result.data.tasks && result.data.tasks.length > 0) {
							this.todayTasks = result.data.tasks.map(item => {
								const title = this.parseTextField(item.fields.title)
								const description = this.parseTextField(item.fields.description)
								
								// 处理 child_id 字段，确保是字符串格式
								let childIdValue = item.fields.child_id || ''
								if (Array.isArray(childIdValue)) {
									if (childIdValue[0] && childIdValue[0].text) {
										childIdValue = childIdValue[0].text
									} else if (childIdValue[0] && typeof childIdValue[0] === 'object' && childIdValue[0].record_id) {
										childIdValue = childIdValue[0].record_id
									} else if (childIdValue[0]) {
										childIdValue = String(childIdValue[0])
									} else {
										childIdValue = ''
									}
								} else if (typeof childIdValue === 'object') {
									childIdValue = childIdValue.text || childIdValue.record_id || ''
								}
								
								return {
									id: item.fields.id || '', // 使用用户自定义的任务ID（fields.id）
									record_id: item.record_id, // 飞书系统的record_id（用于更新记录）
									title: title,
									description: description,
									type: item.fields.type || '',
									type_text: item.fields.type_text || '',
									difficulty: item.fields.difficulty || '简单',
									base_points: item.fields.base_points || 10,
									child_id: String(childIdValue).trim(), // 确保是字符串格式
									status: item.fields.status || '未开始',
									completed: item.fields.status === '已完成',
									elapsed_time: item.fields.elapsed_time || 0,
									start_time: item.fields.start_time || 0,
									need_audit: item.fields.need_audit || false
								}
							})
							console.log('[Child Home] 今日任务处理完成，共', this.todayTasks.length, '条')
						} else {
							this.todayTasks = []
							console.log('[Child Home] 今日任务为空')
						}
						
						// 1.5 处理其他任务数据
						if (result.data.otherTasks && result.data.otherTasks.length > 0) {
							this.otherTasks = result.data.otherTasks.map(item => {
								const title = this.parseTextField(item.fields.title)
								const description = this.parseTextField(item.fields.description)
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
									elapsed_time: item.fields.elapsed_time || 0,
									start_time: item.fields.start_time || 0
								}
							})
							console.log('[Child Home] 其他任务处理完成，共', this.otherTasks.length, '条')
						} else {
							this.otherTasks = []
							console.log('[Child Home] 其他任务为空')
						}
						
						// 2. 处理奖励数据
						if (result.data.rewards && result.data.rewards.length > 0) {
							this.rewards = result.data.rewards
								.sort((a, b) => new Date(b.fields.created_at || 0) - new Date(a.fields.created_at || 0))
								.slice(0, 10)
								.map(item => {
									let giftImageUrl = ''
									if (item.fields.gift_image && item.fields.gift_image.type === 17 && item.fields.gift_image.value && item.fields.gift_image.value.length > 0) {
										const imageData = item.fields.gift_image.value[0]
										giftImageUrl = imageData.tmp_download_url || imageData.tmp_url || imageData.url || ''
									}
									
									return {
										id: item.record_id,
										name: this.parseTextField(item.fields.gift_name) || '未知礼品',
										description: this.parseTextField(item.fields.description) || '',
										price: item.fields.points || 0,
										status: item.fields.status || '待处理',
										icon: this.getRewardIcon(item.fields.category),
										gift_image: giftImageUrl
									}
								})
						} else {
							this.rewards = []
						}
						
						// 3. 处理教材数据
						if (result.data.textbooks && result.data.textbooks.length > 0) {
							const sortedBooks = result.data.textbooks.sort((a, b) => 
								(b.fields.current_page || 0) - (a.fields.current_page || 0)
							).slice(0, 10)
							
							this.learningBooks = sortedBooks.map(book => {
								const currentPage = book.fields.current_page || 0
								const totalPages = book.fields.total_pages || 1
								const progress = Math.round((currentPage / totalPages) * 100)
								const subject = this.parseTextField(book.fields.subject) || '其他'
								
								return {
									id: book.record_id,
									title: this.parseTextField(book.fields.name) || '未知教材',
									subject: subject,
									progress: Math.min(progress, 100),
									icon: this.getBookIcon(subject),
									currentPage: currentPage,
									totalPages: totalPages,
									lastStudyTime: book.fields.last_study_time || null
								}
							})
						} else {
							this.learningBooks = []
						}
					} else {
						this.todayTasks = []
						this.otherTasks = []
						this.rewards = []
						this.learningBooks = []
					}
					
					uni.hideLoading()
				} catch (error) {
					console.error('[Child Home] 批量加载首页数据失败:', error)
					this.todayTasks = []
					this.otherTasks = []
					this.rewards = []
					this.learningBooks = []
					uni.hideLoading()
				}
			},
			
			/**
			 * 加载当前儿童信息
			 */
			async loadCurrentChild() {
				try {
					this.currentChild = await UserManager.getCurrentChild()
					console.log('[Child Home] 当前儿童信息:', this.currentChild)
					
					if (this.currentChild) {
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
			 * 加载儿童积分
			 */
			async loadChildPoints() {
				try {
					if (this.currentChild && this.currentChild.id) {
						this.totalPoints = this.currentChild.total_points || 0
					}
				} catch (error) {
					console.error('[Child Home] 加载积分失败:', error)
				}
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
			 * 获取奖励图标
			 */
			getRewardIcon(category) {
				const icons = {
					'玩具': '🧸',
					'文具': '✏️',
					'零食': '🍬',
					'书籍': '📚',
					'体验': '🎟️',
					'其他': '🎁'
				}
				return icons[category] || icons['其他']
			},
			
			/**
			 * 获取教材图标
			 */
			getBookIcon(subject) {
				const icons = {
					'语文': '📖',
					'数学': '📐',
					'英语': '🔤',
					'科学': '🔬',
					'美术': '🎨',
					'音乐': '🎵',
					'体育': '⚽',
					'其他': '📚'
				}
				return icons[subject] || icons['其他']
			},
			
			/**
			 * 加载儿童列表
			 */
			async loadChildrenList() {
				try {
					// 先尝试从缓存获取
					this.children = UserManager.getChildren()
					
					// 如果缓存为空，尝试从家长账号获取
					if (!this.children || this.children.length === 0) {
						const parent = await UserManager.getCurrentParent()
						if (parent && parent.phone) {
							this.children = await UserManager.getChildrenByParent(parent.phone)
							UserManager.setChildren(this.children)
						}
					}
					console.log('[Child Home] 儿童列表:', this.children)
				} catch (error) {
					console.error('[Child Home] 加载儿童列表失败:', error)
				}
			},
			
			/**
			 * 开始任务
			 */
			async startTask(task) {
				try {
					uni.showLoading({ title: '启动中...' })
					
					const childId = this.currentChild.child_id || this.currentChild.id
					const result = await feishuRequest.updateRecord('任务表', task.id, {
						status: '进行中',
						child_id: childId,
						start_time: Date.now(),
						elapsed_time: 0
					})
					
					if (result.success) {
						task.status = '进行中'
						task.child_id = childId
						task.start_time = Date.now()
						task.elapsed_time = 0
						this.startTimer(task)
						uni.showToast({ title: '任务已开始', icon: 'success' })
					} else {
						uni.showToast({ title: '启动失败', icon: 'none' })
					}
					
					uni.hideLoading()
				} catch (error) {
					console.error('[Child Home] 开始任务失败:', error)
					uni.showToast({ title: '启动失败', icon: 'none' })
					uni.hideLoading()
				}
			},
			
			/**
			 * 暂停任务
			 */
			async pauseTask(task) {
				try {
					uni.showLoading({ title: '暂停中...' })
					this.stopTimer(task)
					
					const result = await feishuRequest.updateRecord('任务表', task.id, {
						status: '暂停'
					})
					
					if (result.success) {
						task.status = '暂停'
						uni.showToast({ title: '任务已暂停', icon: 'success' })
					} else {
						uni.showToast({ title: '暂停失败', icon: 'none' })
					}
					
					uni.hideLoading()
				} catch (error) {
					console.error('[Child Home] 暂停任务失败:', error)
					uni.showToast({ title: '暂停失败', icon: 'none' })
					uni.hideLoading()
				}
			},
			
			/**
			 * 继续任务
			 */
			async resumeTask(task) {
				try {
					uni.showLoading({ title: '继续中...' })
					
					const result = await feishuRequest.updateRecord('任务表', task.id, {
						status: '进行中'
					})
					
					if (result.success) {
						task.status = '进行中'
						this.startTimer(task)
						uni.showToast({ title: '任务已继续', icon: 'success' })
					} else {
						uni.showToast({ title: '继续失败', icon: 'none' })
					}
					
					uni.hideLoading()
				} catch (error) {
					console.error('[Child Home] 继续任务失败:', error)
					uni.showToast({ title: '继续失败', icon: 'none' })
					uni.hideLoading()
				}
			},
			
			/**
			 * 完成任务
			 */
			async completeTask(task) {
				try {
					uni.showLoading({ title: '更新中...' })
					
					// 停止计时器
					this.stopTimer(task)
					
					// 判断是否需要审核
					if (task.need_audit) {
						// 需要审核，显示提交弹框
						this.showSubmitModal = true
						this.currentSubmitTask = task
						uni.hideLoading()
						return
					}
					
					// 不需要审核，直接完成
					const result = await feishuRequest.updateRecord('任务表', task.id, {
						status: '已完成'
					})
					
					if (result.success) {
						task.status = '已完成'
						task.completed = true
						this.totalPoints += task.base_points
						uni.showToast({ title: `+${task.base_points} 积分`, icon: 'success' })
					} else {
						uni.showToast({ title: '更新失败', icon: 'none' })
					}
					
					uni.hideLoading()
				} catch (error) {
					console.error('[Child Home] 完成任务失败:', error)
					uni.showToast({ title: '更新失败', icon: 'none' })
					uni.hideLoading()
				}
			},
			
			/**
			 * 处理任务提交（带审核）
			 */
			async handleTaskSubmit({ task, files, remark }) {
				try {
					uni.showLoading({ title: '提交中...' })
					
					const updateData = {
						status: '待审核',
						elapsed_time: task.elapsed_time || 0
					}
					
					const result = await feishuRequest.updateRecord('任务表', task.id, updateData)
					
					if (result.success) {
						task.status = '待审核'
						task.completed = true
						uni.showToast({ title: '提交成功，等待审核', icon: 'success' })
						this.showSubmitModal = false
						this.currentSubmitTask = null
					} else {
						uni.showToast({ title: '提交失败', icon: 'none' })
					}
					
					uni.hideLoading()
				} catch (error) {
					console.error('[Child Home] 提交任务失败:', error)
					uni.showToast({ title: '提交失败', icon: 'none' })
					uni.hideLoading()
				}
			},
			
			/**
			 * 认领任务
			 */
			async claimTask(task) {
				try {
					uni.showLoading({ title: '认领中...' })
					
					const childId = this.currentChild.child_id || this.currentChild.id
					const result = await feishuRequest.updateRecord('任务表', task.id, {
						child_id: childId,
						status: '未开始'
					})
					
					if (result.success) {
						// 将任务从otherTasks移到todayTasks
						const index = this.otherTasks.findIndex(t => t.id === task.id)
						if (index > -1) {
							this.otherTasks.splice(index, 1)
						}
						task.child_id = childId
						task.status = '未开始'
						this.todayTasks.push(task)
						uni.showToast({ title: '认领成功', icon: 'success' })
					} else {
						uni.showToast({ title: '认领失败', icon: 'none' })
					}
					
					uni.hideLoading()
				} catch (error) {
					console.error('[Child Home] 认领任务失败:', error)
					uni.showToast({ title: '认领失败', icon: 'none' })
					uni.hideLoading()
				}
			},
			
			/**
			 * 启动计时器
			 */
			startTimer(task) {
				if (this.timers[task.id]) {
					clearInterval(this.timers[task.id])
				}
				
				this.timers[task.id] = setInterval(() => {
					task.elapsed_time = (task.elapsed_time || 0) + 1
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
			 * 关闭提交弹框
			 */
			closeSubmitModal() {
				this.showSubmitModal = false
				this.currentSubmitTask = null
			},
			
			/**
			 * 显示切换儿童账号弹框
			 */
			showChildSwitch() {
				this.showChildSwitchModal = true
			},
			
			/**
			 * 关闭切换儿童账号弹框
			 */
			closeChildSwitchModal() {
				this.showChildSwitchModal = false
			},
			
			/**
			 * 切换儿童账号
			 */
			async switchChild(child) {
				try {
					await UserManager.setCurrentChild(child)
					this.currentChild = child
					this.showChildSwitchModal = false
					await this.loadChildPoints()
					await this.loadHomeData()
					uni.showToast({ title: `已切换到 ${child.name}`, icon: 'success' })
				} catch (error) {
					console.error('[Child Home] 切换儿童失败:', error)
					uni.showToast({ title: '切换失败', icon: 'none' })
				}
			},
			
			/**
			 * 退出儿童账号
			 */
			async logoutFromChild() {
				try {
					await UserManager.logoutChild()
					// 跳转到登录页面（pages.json 中配置的首页是 pages/login）
					uni.reLaunch({ url: '/pages/login' })
				} catch (error) {
					console.error('[Child Home] 退出失败:', error)
				}
			},
			
			/**
			 * 跳转到个人信息页面
			 */
			goToProfile() {
				uni.navigateTo({ url: '/pages/child/profile' })
			},
			
			/**
			 * 跳转到积分历史页面
			 */
			goToPointsHistory() {
				uni.navigateTo({ url: '/pages/child/points-history' })
			},
			
			/**
			 * 跳转到任务详情页面
			 */
			goToTaskDetail(task) {
				console.log('[Home] 点击任务，跳转详情页:', task)
				console.log('[Home] 任务ID:', task.id, 'record_id:', task.record_id, 'child_id:', task.child_id)
				
				// 将任务信息序列化为JSON字符串传递
				const taskData = encodeURIComponent(JSON.stringify(task))
				uni.navigateTo({ url: `/pages/child/task-detail?task=${taskData}` })
			},
			
			/**
			 * 跳转到商城
			 */
			goToMall() {
				uni.navigateTo({ url: '/pages/child/mall' })
			},
			
			/**
			 * 跳转到教材详情
			 */
			goToBookDetail(book) {
				uni.navigateTo({ url: `/pages/child/book-detail?id=${book.id}` })
			},
			
			/**
			 * 跳转到能力测试
			 */
			goToTests() {
				uni.navigateTo({ url: '/pages/child/tests' })
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
</style>
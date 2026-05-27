<template>
	<view class="container">
		<view class="header">
			<view class="back-btn" @click="goBack">
				<text>‹</text>
			</view>
			<text class="header-title">任务详情</text>
			<view class="placeholder"></view>
		</view>

		<view class="task-card" v-if="task">
			<view class="task-icon-large">{{ getTaskIcon(task.type) }}</view>
			<text class="task-title">{{ task.title }}</text>
			<text class="task-desc">{{ task.description || '暂无描述' }}</text>
			
			<view class="task-info">
				<view class="info-item">
					<text class="info-label">关联儿童</text>
					<text class="info-value">{{ task.child_name || '未关联' }}</text>
				</view>
				<view class="info-item">
					<text class="info-label">类型</text>
					<text class="info-value">{{ task.type_text || task.type }}</text>
				</view>
				<view class="info-item">
					<text class="info-label">难度</text>
					<text class="info-value difficulty" :class="task.difficulty">{{ task.difficulty }}</text>
				</view>
				<view class="info-item">
					<text class="info-label">积分</text>
					<text class="info-value points">+{{ task.base_points }}</text>
				</view>
				<view class="info-item">
					<text class="info-label">状态</text>
					<text class="info-value status" :class="task.status">{{ getStatusText(task.status) }}</text>
				</view>
			</view>

			<!-- 计时器显示 -->
			<view class="timer-display-large" v-if="task.status === '进行中' || task.status === '暂停'">
				<text class="timer-label">已用时</text>
				<text class="timer-value">{{ formatTime(task.elapsed_time || 0) }}</text>
			</view>

			<view class="task-actions">
				<!-- 未开始状态 -->
				<template v-if="task.status === '未开始'">
					<button class="action-btn secondary" @click="goBack">返回</button>
					<button class="action-btn primary" @click="startTask">开始任务</button>
				</template>
				
				<!-- 进行中状态 -->
				<template v-else-if="task.status === '进行中'">
					<button class="action-btn pause" @click="pauseTask">暂停</button>
					<button class="action-btn complete" @click="completeTask">完成</button>
				</template>
				
				<!-- 暂停状态 -->
				<template v-else-if="task.status === '暂停'">
					<button class="action-btn resume" @click="resumeTask">继续</button>
					<button class="action-btn complete" @click="completeTask">完成</button>
				</template>
				
				<!-- 已完成状态 -->
				<template v-else-if="task.status === '已完成'">
					<button class="action-btn secondary" @click="goBack">返回</button>
					<button class="action-btn disabled">已完成</button>
				</template>
			</view>
		</view>

		<view class="section">
			<text class="section-title">📝 任务说明</text>
			<view class="instruction-content">
				<text class="instruction-text">{{ task?.description || '暂无说明' }}</text>
			</view>
		</view>

		<view class="section">
			<text class="section-title">🏆 完成奖励</text>
			<view class="reward-card">
				<view class="reward-icon">⭐</view>
				<view class="reward-info">
					<text class="reward-title">任务积分</text>
					<text class="reward-value">+{{ task?.base_points || 0 }} 积分</text>
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
				task: null,
				taskId: '',
				timer: null,
				children: []  // 儿童列表，用于根据child_id获取儿童名称
			}
		},
		onLoad(options) {
			if (options && options.id) {
				this.taskId = options.id
				this.loadChildren()  // 先加载儿童列表
				this.loadTaskDetail()
			}
		},
		onUnload() {
			// 清理计时器
			if (this.timer) {
				clearInterval(this.timer)
				this.timer = null
			}
			
			// 如果任务正在进行中，保存当前累计时间
			if (this.task && this.task.status === '进行中') {
				this.saveElapsedTime()
			}
			
			// 触发首页刷新任务列表
			uni.$emit('refreshTasks')
		},
		methods: {
			/**
			 * 加载儿童列表（用于根据child_id获取儿童名称）
			 */
			async loadChildren() {
				try {
					const currentParent = await UserManager.getCurrentParent()
					if (currentParent && currentParent.phone) {
						this.children = await UserManager.getChildrenByParent(currentParent.phone)
						console.log('[Task Detail] 儿童列表:', this.children)
					}
				} catch (error) {
					console.error('[Task Detail] 加载儿童列表失败:', error)
				}
			},
			
			/**
			 * 根据child_id获取儿童名称
			 */
			getChildName(childId) {
				if (!childId) return '未关联'
				const child = this.children.find(c => c.child_id === childId || c.id === childId)
				return child ? child.name : '未知儿童'
			},
			
			async loadTaskDetail() {
				try {
					uni.showLoading({ title: '加载中...' })
					
					const result = await feishuRequest.queryRecords('任务表')
					
					if (result.success && result.data && result.data.length > 0) {
						const taskData = result.data.find(item => item.record_id === this.taskId)
						
						if (taskData) {
							const title = taskData.fields.title 
								? (Array.isArray(taskData.fields.title) && taskData.fields.title[0] && taskData.fields.title[0].text 
									? taskData.fields.title[0].text 
									: taskData.fields.title)
								: ''
							const description = taskData.fields.description 
								? (Array.isArray(taskData.fields.description) && taskData.fields.description[0] && taskData.fields.description[0].text 
									? taskData.fields.description[0].text 
									: taskData.fields.description)
								: ''
							
							// 处理child_id字段
							let childId = taskData.fields.child_id || ''
							if (Array.isArray(childId) && childId[0] && childId[0].text) {
								childId = childId[0].text
							}
							
							this.task = {
								id: taskData.record_id,
								title: title,
								description: description,
								type: taskData.fields.type || '',
								type_text: taskData.fields.type_text || '',
								difficulty: taskData.fields.difficulty || '简单',
								base_points: taskData.fields.base_points || 10,
								status: taskData.fields.status || '未开始',
								completed: taskData.fields.status === '已完成',
								elapsed_time: taskData.fields.elapsed_time || 0,  // 初始化累计时间
								child_id: childId,
								child_name: this.getChildName(childId)
							}
						} else {
							this.task = this.getMockTask()
						}
					} else {
						this.task = this.getMockTask()
					}
				} catch (error) {
					console.error('[Task Detail] 加载任务详情失败:', error)
					this.task = this.getMockTask()
				}
				
				uni.hideLoading()
			},
			
			getMockTask() {
				return {
					id: this.taskId,
					title: '语文阅读30分钟',
					description: '阅读一篇课文，并回答课后问题',
					type: 'reading',
					type_text: '阅读',
					difficulty: '简单',
					base_points: 10,
					status: '未开始',
					completed: false
				}
			},
			
			getTaskIcon(type) {
				const icons = {
					reading: '📖',
					math: '🧮',
					english: '🔤',
					art: '🎨',
					sports: '⚽',
					music: '🎵',
					science: '🔬',
					default: '📝'
				}
				return icons[type] || icons.default
			},
			
			getStatusText(status) {
				const texts = {
					'未开始': '未开始',
					'进行中': '进行中',
					'已完成': '已完成',
					'暂停': '暂停'
				}
				return texts[status] || status
			},
			
			/**
			 * 开始任务
			 */
			async startTask() {
				if (!this.task) return
				
				try {
					uni.showLoading({ title: '更新中...' })
					
					const result = await feishuRequest.updateRecord('任务表', this.task.id, {
						status: '进行中'
					})
					
					if (result.success) {
						this.task.status = '进行中'
						this.task.elapsed_time = this.task.elapsed_time || 0
						this.task.start_time = Date.now()
						this.startTimer()
						uni.showToast({ title: '任务已开始', icon: 'success' })
					} else {
						uni.showToast({ title: '更新失败', icon: 'none' })
					}
				} catch (error) {
					console.error('[Task Detail] 开始任务失败:', error)
					uni.showToast({ title: '更新失败', icon: 'none' })
				}
				
				uni.hideLoading()
			},
			
			/**
			 * 暂停任务
			 */
			async pauseTask() {
				if (!this.task) return
				
				try {
					uni.showLoading({ title: '更新中...' })
					
					this.stopTimer()
					
					const result = await feishuRequest.updateRecord('任务表', this.task.id, {
						status: '暂停',
						elapsed_time: this.task.elapsed_time || 0  // 保存累计时间
					})
					
					if (result.success) {
						this.task.status = '暂停'
						uni.showToast({ title: '任务已暂停', icon: 'success' })
					} else {
						uni.showToast({ title: '更新失败', icon: 'none' })
					}
				} catch (error) {
					console.error('[Task Detail] 暂停任务失败:', error)
					uni.showToast({ title: '更新失败', icon: 'none' })
				}
				
				uni.hideLoading()
			},
			
			/**
			 * 继续任务
			 */
			async resumeTask() {
				if (!this.task) return
				
				try {
					uni.showLoading({ title: '更新中...' })
					
					const result = await feishuRequest.updateRecord('任务表', this.task.id, {
						status: '进行中'
					})
					
					if (result.success) {
						this.task.status = '进行中'
						this.task.start_time = Date.now()
						this.startTimer()
						uni.showToast({ title: '任务已继续', icon: 'success' })
					} else {
						uni.showToast({ title: '更新失败', icon: 'none' })
					}
				} catch (error) {
					console.error('[Task Detail] 继续任务失败:', error)
					uni.showToast({ title: '更新失败', icon: 'none' })
				}
				
				uni.hideLoading()
			},
			
			/**
			 * 完成任务
			 */
			async completeTask() {
				if (!this.task || this.task.completed) return
				
				try {
					uni.showLoading({ title: '提交中...' })
					
					this.stopTimer()
					
					const result = await feishuRequest.updateRecord('任务表', this.task.id, {
						status: '已完成'
					})
					
					if (result.success) {
						this.task.status = '已完成'
						this.task.completed = true
						uni.showToast({ title: `+${this.task.base_points} 积分`, icon: 'success' })
					} else {
						uni.showToast({ title: '提交失败', icon: 'none' })
					}
				} catch (error) {
					console.error('[Task Detail] 完成任务失败:', error)
					uni.showToast({ title: '提交失败', icon: 'none' })
				}
				
				uni.hideLoading()
			},
			
			/**
			 * 启动计时器
			 */
			startTimer() {
				if (this.timer) {
					clearInterval(this.timer)
				}
				
				// 使用局部变量记录上次计时时间，避免修改task.start_time
				let lastTime = Date.now()
				
				this.timer = setInterval(() => {
					if (this.task) {
						const now = Date.now()
						const delta = Math.floor((now - lastTime) / 1000) // 转换为秒
						this.task.elapsed_time = (this.task.elapsed_time || 0) + delta
						lastTime = now
					}
				}, 1000)
			},
			
			/**
			 * 停止计时器
			 */
			stopTimer() {
				if (this.timer) {
					clearInterval(this.timer)
					this.timer = null
				}
			},
			
			/**
			 * 保存累计时间到后端
			 */
			async saveElapsedTime() {
				if (this.task && this.task.id && this.task.elapsed_time) {
					try {
						await feishuRequest.updateRecord('任务表', this.task.id, {
							elapsed_time: this.task.elapsed_time
						})
						console.log('[Task Detail] 保存累计时间成功:', this.task.elapsed_time)
					} catch (error) {
						console.error('[Task Detail] 保存累计时间失败:', error)
					}
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
			
			goBack() {
				uni.navigateBack()
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
		padding: 60rpx 30rpx 30rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.back-btn {
		width: 60rpx;
		height: 60rpx;
		background-color: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 40rpx;
		color: #fff;
	}

	.header-title {
		font-size: 34rpx;
		font-weight: bold;
		color: #fff;
	}

	.placeholder {
		width: 60rpx;
	}

	.task-card {
		background-color: #fff;
		margin: -30rpx 20rpx 20rpx;
		border-radius: 20rpx;
		padding: 40rpx 30rpx;
		text-align: center;
		box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
	}

	.task-icon-large {
		font-size: 100rpx;
		margin-bottom: 20rpx;
	}

	.task-title {
		font-size: 40rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 15rpx;
	}

	.task-desc {
		font-size: 28rpx;
		color: #666;
		display: block;
		margin-bottom: 30rpx;
		line-height: 1.6;
	}

	.task-info {
		background-color: #fafafa;
		border-radius: 15rpx;
		padding: 25rpx;
		margin-bottom: 30rpx;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 15rpx 0;
		border-bottom: 1rpx solid #eee;

		&:last-child {
			border-bottom: none;
		}
	}

	.info-label {
		font-size: 26rpx;
		color: #999;
	}

	.info-value {
		font-size: 28rpx;
		color: #333;
		font-weight: bold;

		&.difficulty {
			&.简单 { color: #4caf50; }
			&.中等 { color: #ff9500; }
			&.困难 { color: #f44336; }
		}

		&.points {
			color: #ff9500;
		}

		&.status {
			&.未开始 { color: #999; }
			&.进行中 { color: #2196f3; }
			&.已完成 { color: #4caf50; }
			&.暂停 { color: #ff9500; }
		}
	}

	.task-actions {
		display: flex;
		gap: 20rpx;
	}

	.action-btn {
		flex: 1;
		height: 80rpx;
		border-radius: 40rpx;
		font-size: 30rpx;
		border: none;

		&.primary {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: #fff;
		}

		&.secondary {
			background-color: #f0f0f0;
			color: #333;
		}

		&.disabled {
			background-color: #f0f0f0;
			color: #999;
		}
		
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
	
	.timer-display-large {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 30rpx 0;
		background-color: #fafafa;
		border-radius: 15rpx;
		margin-bottom: 20rpx;
	}
	
	.timer-label {
		font-size: 24rpx;
		color: #999;
		margin-bottom: 10rpx;
	}
	
	.timer-value {
		font-size: 48rpx;
		font-weight: bold;
		color: #667eea;
		font-family: monospace;
	}

	.section {
		background-color: #fff;
		margin: 20rpx;
		border-radius: 16rpx;
		padding: 25rpx;
	}

	.section-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 20rpx;
	}

	.instruction-content {
		background-color: #fafafa;
		border-radius: 12rpx;
		padding: 25rpx;
	}

	.instruction-text {
		font-size: 28rpx;
		color: #666;
		line-height: 1.8;
	}

	.reward-card {
		display: flex;
		align-items: center;
		background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
		border-radius: 15rpx;
		padding: 30rpx;
	}

	.reward-icon {
		font-size: 50rpx;
		margin-right: 20rpx;
	}

	.reward-info {
		flex: 1;
	}

	.reward-title {
		font-size: 26rpx;
		color: #999;
		display: block;
		margin-bottom: 8rpx;
	}

	.reward-value {
		font-size: 36rpx;
		font-weight: bold;
		color: #ff9500;
	}
</style>
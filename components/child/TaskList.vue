<template>
	<view class="section">
		<view class="section-header">
			<text class="section-title">📋 {{ title }}</text>
			<text class="section-count">{{ countText }}</text>
		</view>
		<view class="task-list" v-if="tasks.length > 0">
			<view class="task-item" v-for="task in tasks" :key="task.id" :class="{ completed: task.completed }">
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
					<template v-if="type === 'today'">
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

						<!-- 待审核状态 -->
						<view v-else-if="task.status === '待审核'" class="task-status">
							<text class="status-pending">待审核</text>
						</view>
					</template>
					<template v-else>
						<!-- 其他任务：显示认领按钮 -->
						<view class="task-claim-btn" @click="claimTask(task)">
							<text>认领</text>
						</view>
					</template>
				</view>
			</view>
		</view>
		<view class="empty-state" v-else>
			<text class="empty-icon">📭</text>
			<text class="empty-text">{{ emptyText }}</text>
			<text class="empty-hint">{{ emptyHint }}</text>
		</view>
	</view>
</template>

<script>
	const TASK_ICONS = {
		'学习': '📚',
		'运动': '⚽',
		'阅读': '📖',
		'家务': '🧹',
		'社交': '👫',
		'创意': '🎨',
		'健康': '💪',
		'其他': '📋'
	}

	export default {
		name: 'TaskList',
		props: {
			tasks: {
				type: Array,
				default: () => []
			},
			type: {
				type: String,
				default: 'today', // 'today' or 'other'
				validator: (value) => ['today', 'other'].includes(value)
			},
			title: {
				type: String,
				default: '今日任务'
			},
			countText: {
				type: String,
				default: ''
			},
			emptyText: {
				type: String,
				default: '暂无任务'
			},
			emptyHint: {
				type: String,
				default: ''
			}
		},
		methods: {
			getTaskIcon(type) {
				return TASK_ICONS[type] || TASK_ICONS['其他']
			},
			formatTime(seconds) {
				const h = Math.floor(seconds / 3600)
				const m = Math.floor((seconds % 3600) / 60)
				const s = seconds % 60
				if (h > 0) {
					return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
				}
				return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
			},
			goToTaskDetail(task) {
				this.$emit('goToTaskDetail', task)
			},
			startTask(task) {
				this.$emit('startTask', task)
			},
			pauseTask(task) {
				this.$emit('pauseTask', task)
			},
			resumeTask(task) {
				this.$emit('resumeTask', task)
			},
			completeTask(task) {
				this.$emit('completeTask', task)
			},
			claimTask(task) {
				this.$emit('claimTask', task)
			}
		}
	}
</script>

<style lang="scss" scoped>
	.section {
		padding: 30rpx;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.section-count {
		font-size: 26rpx;
		color: #999;
	}

	.task-list {
		background-color: #fff;
		border-radius: 16rpx;
		padding: 10rpx 0;
	}

	.task-item {
		display: flex;
		align-items: center;
		padding: 25rpx 20rpx;
		border-bottom: 1rpx solid #f0f0f0;
		transition: background-color 0.2s;
		
		&:last-child {
			border-bottom: none;
		}
		
		&.completed {
			opacity: 0.6;
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
		margin-right: 20rpx;
		background-color: #fff;
		
		text {
			color: #667eea;
			font-size: 24rpx;
			font-weight: bold;
		}
	}

	.task-content {
		display: flex;
		align-items: center;
		flex: 1;
	}

	.task-icon {
		font-size: 36rpx;
		margin-right: 15rpx;
	}

	.task-info {
		flex: 1;
	}

	.task-title {
		display: block;
		font-size: 28rpx;
		color: #333;
		font-weight: 500;
		margin-bottom: 5rpx;
	}

	.task-points {
		font-size: 22rpx;
		color: #ff6b6b;
	}

	.task-actions {
		display: flex;
		align-items: center;
	}

	.task-switch {
		transform: scale(0.8);
	}

	.timer-section {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 10rpx;
	}

	.timer-display {
		font-size: 24rpx;
		color: #667eea;
		font-family: 'Courier New', monospace;
		font-weight: bold;
	}

	.timer-buttons {
		display: flex;
		gap: 10rpx;
	}

	.timer-btn {
		padding: 8rpx 16rpx;
		border-radius: 20rpx;
		font-size: 22rpx;
		border: none;
		
		&.pause {
			background-color: #f5f5f5;
			color: #666;
		}
		
		&.resume {
			background-color: #667eea;
			color: #fff;
		}
		
		&.complete {
			background-color: #52c41a;
			color: #fff;
		}
	}

	.task-status {
		text {
			font-size: 24rpx;
			padding: 8rpx 16rpx;
			border-radius: 20rpx;
			
			&.status-completed {
				background-color: #e6f7ff;
				color: #1890ff;
			}
			
			&.status-pending {
				background-color: #fff7e6;
				color: #fa8c16;
			}
		}
	}

	.task-claim-btn {
		background-color: #667eea;
		color: #fff;
		padding: 10rpx 25rpx;
		border-radius: 25rpx;
		font-size: 24rpx;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 60rpx 0;
		background-color: #fff;
		border-radius: 16rpx;
	}

	.empty-icon {
		font-size: 60rpx;
		margin-bottom: 20rpx;
	}

	.empty-text {
		font-size: 28rpx;
		color: #666;
		margin-bottom: 10rpx;
	}

	.empty-hint {
		font-size: 24rpx;
		color: #999;
	}
</style>
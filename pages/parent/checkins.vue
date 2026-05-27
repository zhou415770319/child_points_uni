<template>
	<view class="container">
		<view class="toolbar">
			<button class="toolbar-btn active">待审核</button>
			<button class="toolbar-btn">已通过</button>
			<button class="toolbar-btn">已拒绝</button>
		</view>

		<view class="checkin-list">
			<view class="checkin-card" v-for="checkin in checkins" :key="checkin.id">
				<view class="checkin-header">
					<view class="checkin-child">
						<view class="child-avatar">{{ checkin.child_name.charAt(0) }}</view>
						<text class="child-name">{{ checkin.child_name }}</text>
					</view>
					<text class="checkin-time">{{ checkin.checkin_time }}</text>
				</view>
				<view class="checkin-task">
					<text class="task-icon">{{ getTaskIcon(checkin.task_type) }}</text>
					<text class="task-title">{{ checkin.task_title }}</text>
				</view>
				<view class="checkin-content" v-if="checkin.content">
					<text class="content-label">打卡内容</text>
					<text class="content-text">{{ checkin.content }}</text>
				</view>
				<view class="checkin-ai" v-if="checkin.ai_score !== null">
					<view class="ai-score">
						<text class="score-label">AI评分</text>
						<text class="score-value" :class="getScoreClass(checkin.ai_score)">{{ checkin.ai_score }}分</text>
					</view>
					<text class="ai-comment">{{ checkin.ai_comment }}</text>
				</view>
				<view class="checkin-actions">
					<button class="action-btn reject" @click="rejectCheckin(checkin)">❌ 拒绝</button>
					<button class="action-btn accept" @click="acceptCheckin(checkin)">✅ 通过</button>
				</view>
			</view>
		</view>

		<view class="empty-state" v-if="checkins.length === 0">
			<text class="empty-icon">🎉</text>
			<text class="empty-title">暂无待审核打卡</text>
			<text class="empty-text">所有打卡都已审核完成</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				checkins: [
					{ id: 1, child_name: '小明', task_title: '语文阅读30分钟', task_type: 'reading', checkin_time: '今天 14:30', content: '今天阅读了《安徒生童话》中的《丑小鸭》故事，学到了不要看不起自己，每个人都有自己的闪光点。', ai_score: 90, ai_comment: '阅读认真，理解深刻，继续保持！', review_status: 'pending' },
					{ id: 2, child_name: '小红', task_title: '英语单词背诵', task_type: 'english', checkin_time: '今天 15:00', content: '背诵了apple, banana, cat, dog, egg, fish, girl, hand, ice, jump 十个单词', ai_score: 85, ai_comment: '发音标准，记得很牢！', review_status: 'pending' },
					{ id: 3, child_name: '小华', task_title: '数学练习10题', task_type: 'math', checkin_time: '今天 16:30', content: '完成了数学练习册第23页的10道计算题，全部正确', ai_score: 100, ai_comment: '全部正确，太棒了！', review_status: 'pending' }
				]
			}
		},
		methods: {
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
			getScoreClass(score) {
				if (score >= 90) return 'high'
				if (score >= 70) return 'medium'
				return 'low'
			},
			acceptCheckin(checkin) {
				uni.showModal({
					title: '确认通过',
					content: `确定要通过 ${checkin.child_name} 的打卡吗？`,
					success: (res) => {
						if (res.confirm) {
							checkin.review_status = 'approved'
							uni.showToast({ title: '审核通过', icon: 'success' })
						}
					}
				})
			},
			rejectCheckin(checkin) {
				uni.showModal({
					title: '确认拒绝',
					content: `确定要拒绝 ${checkin.child_name} 的打卡吗？`,
					success: (res) => {
						if (res.confirm) {
							checkin.review_status = 'rejected'
							uni.showToast({ title: '已拒绝', icon: 'none' })
						}
					}
				})
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

	.toolbar {
		display: flex;
		background-color: #fff;
		padding: 20rpx;
		gap: 10rpx;
	}

	.toolbar-btn {
		flex: 1;
		height: 70rpx;
		border-radius: 35rpx;
		font-size: 26rpx;
		border: 2rpx solid #e8e8e8;
		background-color: #fff;
		color: #666;

		&.active {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: #fff;
			border: none;
		}
	}

	.checkin-list {
		padding: 20rpx;
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.checkin-card {
		background-color: #fff;
		border-radius: 16rpx;
		padding: 25rpx;
	}

	.checkin-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.checkin-child {
		display: flex;
		align-items: center;
	}

	.child-avatar {
		width: 60rpx;
		height: 60rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24rpx;
		font-weight: bold;
		color: #fff;
		margin-right: 15rpx;
	}

	.child-name {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
	}

	.checkin-time {
		font-size: 24rpx;
		color: #999;
	}

	.checkin-task {
		display: flex;
		align-items: center;
		margin-bottom: 15rpx;
		padding: 15rpx;
		background-color: #fafafa;
		border-radius: 12rpx;
	}

	.task-icon {
		font-size: 40rpx;
		margin-right: 15rpx;
	}

	.task-title {
		font-size: 28rpx;
		color: #333;
	}

	.checkin-content {
		margin-bottom: 15rpx;
	}

	.content-label {
		font-size: 24rpx;
		color: #999;
		display: block;
		margin-bottom: 8rpx;
	}

	.content-text {
		font-size: 26rpx;
		color: #333;
		line-height: 1.6;
	}

	.checkin-ai {
		background-color: #fff3e0;
		border-radius: 12rpx;
		padding: 15rpx;
		margin-bottom: 20rpx;
	}

	.ai-score {
		display: flex;
		align-items: center;
		margin-bottom: 10rpx;
	}

	.score-label {
		font-size: 24rpx;
		color: #999;
		margin-right: 15rpx;
	}

	.score-value {
		font-size: 32rpx;
		font-weight: bold;

		&.high {
			color: #4caf50;
		}

		&.medium {
			color: #ff9500;
		}

		&.low {
			color: #f44336;
		}
	}

	.ai-comment {
		font-size: 24rpx;
		color: #666;
	}

	.checkin-actions {
		display: flex;
		gap: 20rpx;
	}

	.action-btn {
		flex: 1;
		height: 70rpx;
		border-radius: 35rpx;
		font-size: 26rpx;
		border: none;

		&.accept {
			background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
			color: #fff;
		}

		&.reject {
			background-color: #f5f5f5;
			color: #666;
			border: 2rpx solid #e8e8e8;
		}
	}

	.empty-state {
		text-align: center;
		padding: 100rpx 40rpx;
	}

	.empty-icon {
		font-size: 100rpx;
		display: block;
		margin-bottom: 25rpx;
	}

	.empty-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 15rpx;
	}

	.empty-text {
		font-size: 26rpx;
		color: #999;
	}
</style>
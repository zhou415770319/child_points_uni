<template>
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
</template>

<script>
	export default {
		name: 'StreakCard',
		props: {
			streakDays: {
				type: Number,
				default: 0
			},
			streakProgress: {
				type: Number,
				default: 0
			}
		}
	}
</script>

<style lang="scss" scoped>
	.streak-card {
		display: flex;
		flex-direction: column;
		padding: 30rpx;
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
		border-radius: 20rpx;
		margin: 0 30rpx;
		margin-top: -20rpx;
		position: relative;
		z-index: 10;
	}

	.streak-icon {
		font-size: 48rpx;
		margin-bottom: 15rpx;
	}

	.streak-info {
		display: flex;
		align-items: baseline;
		gap: 15rpx;
		margin-bottom: 20rpx;
	}

	.streak-title {
		font-size: 26rpx;
		color: rgba(255, 255, 255, 0.9);
	}

	.streak-days {
		font-size: 36rpx;
		font-weight: bold;
		color: #fff;
	}

	.streak-progress {
		display: flex;
		align-items: center;
		gap: 15rpx;
	}

	.progress-bar {
		flex: 1;
		height: 12rpx;
		background-color: rgba(255, 255, 255, 0.3);
		border-radius: 6rpx;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background-color: #fff;
		border-radius: 6rpx;
		transition: width 0.3s ease;
	}

	.progress-text {
		font-size: 22rpx;
		color: rgba(255, 255, 255, 0.9);
	}
</style>
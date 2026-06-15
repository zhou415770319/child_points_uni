<template>
	<view class="section">
		<text class="section-title">🎁 我的奖励</text>
		<view class="reward-list">
			<view class="reward-item" v-for="reward in rewards" :key="reward.id">
				<image v-if="reward.gift_image" class="reward-image" :src="reward.gift_image" mode="aspectFill"></image>
				<view v-else class="reward-icon">{{ reward.icon }}</view>
				<view class="reward-info">
					<text class="reward-name">{{ reward.name }}</text>
					<text class="reward-desc">{{ reward.description }}</text>
				</view>
				<view class="reward-right">
				<view class="reward-price-row">
					<text class="reward-price points">{{ reward.price || reward.base_points || 0 }} 积分</text>
					<text class="reward-price coins">{{ (reward.coins || reward.reward_points || 0).toFixed(1) }} 金币</text>
				</view>
				<view class="reward-status" :class="reward.status">{{ reward.status }}</view>
			</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'RewardList',
		props: {
			rewards: {
				type: Array,
				default: () => []
			}
		}
	}
</script>

<style lang="scss" scoped>
	.section {
		padding: 30rpx;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 20rpx;
	}

	.reward-list {
		background-color: #fff;
		border-radius: 16rpx;
		overflow: hidden;
	}

	.reward-item {
		display: flex;
		align-items: center;
		padding: 25rpx 20rpx;
		border-bottom: 1rpx solid #f0f0f0;
		
		&:last-child {
			border-bottom: none;
		}
	}

	.reward-image {
		width: 100rpx;
		height: 100rpx;
		border-radius: 12rpx;
		object-fit: cover;
	}

	.reward-icon {
		width: 100rpx;
		height: 100rpx;
		border-radius: 12rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 48rpx;
	}

	.reward-info {
		flex: 1;
		margin-left: 20rpx;
	}

	.reward-name {
		display: block;
		font-size: 28rpx;
		font-weight: 500;
		color: #333;
		margin-bottom: 8rpx;
	}

	.reward-desc {
		font-size: 24rpx;
		color: #999;
	}

	.reward-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 10rpx;
	}

	.reward-price-row {
		display: flex;
		flex-direction: column;
		gap: 5rpx;
	}

	.reward-price {
		font-size: 26rpx;
		font-weight: bold;

		&.points {
			color: #ff6b6b;
		}

		&.coins {
			color: #ffd700;
		}
	}

	.reward-status {
		font-size: 22rpx;
		padding: 6rpx 15rpx;
		border-radius: 15rpx;
		
		&.已兑换 {
			background-color: #f0f0f0;
			color: #999;
		}
		
		&.未兑换 {
			background-color: #fff7e6;
			color: #fa8c16;
		}
		
		&.已领取 {
			background-color: #e6f7ff;
			color: #1890ff;
		}
	}
</style>
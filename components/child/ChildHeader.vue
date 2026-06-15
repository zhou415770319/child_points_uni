<template>
	<view class="header">
		<view class="user-section">
			<view class="avatar-wrapper" @click="goToProfile">
				<view class="avatar">
					<image v-if="currentChild?.avatar && currentChild.avatar.startsWith('http')" class="avatar-img" :src="currentChild.avatar" mode="aspectFill" />
					<text v-else>{{ currentChild?.name?.charAt(0) || '?' }}</text>
				</view>
				<view class="greeting">
					<text class="hello">👋 你好，{{ currentChild?.name || '小朋友' }}</text>
					<text class="date">{{ currentDate }}</text>
				</view>
			</view>
			<text class="switch-icon" @click="showChildSwitch">↕️</text>
		</view>
		<view class="points-section">
			<view class="points-badge" @click="goToPointsHistory">
				<text class="points-value">{{ totalPoints || 0 }}</text>
				<text class="points-label">积分</text>
			</view>
			<view class="coins-badge">
				<text class="coins-value">{{ formatCoins(totalCoins) }}</text>
				<text class="coins-label">金币</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'ChildHeader',
		props: {
			currentChild: {
				type: Object,
				default: null
			},
			currentDate: {
				type: String,
				default: ''
			},
			totalPoints: {
				type: Number,
				default: 0
			},
			totalCoins: {
				type: Number,
				default: 0
			}
		},
		methods: {
			formatCoins(value) {
				return Number(value || 0).toFixed(1)
			},
			goToProfile() {
				this.$emit('goToProfile')
			},
			showChildSwitch() {
				this.$emit('showChildSwitch')
			},
			goToPointsHistory() {
				this.$emit('goToPointsHistory')
			}
		}
	}
</script>

<style lang="scss" scoped>
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 60rpx 30rpx 30rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 0 0 30rpx 30rpx;
	}

	.user-section {
		display: flex;
		align-items: center;
		gap: 15rpx;
	}

	.avatar-wrapper {
		display: flex;
		align-items: center;
	}

	.avatar {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		border: 3rpx solid rgba(255, 255, 255, 0.5);
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(255, 255, 255, 0.2);
		font-size: 32rpx;
		color: #fff;
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.greeting {
		margin-left: 20rpx;
	}

	.hello {
		display: block;
		font-size: 28rpx;
		color: #fff;
		font-weight: bold;
	}

	.date {
		display: block;
		font-size: 22rpx;
		color: rgba(255, 255, 255, 0.8);
		margin-top: 5rpx;
	}

	.switch-icon {
		font-size: 36rpx;
		color: rgba(255, 255, 255, 0.8);
	}

	.points-section {
		display: flex;
		flex-direction: column;
		gap: 10rpx;
	}

	.points-badge {
		background-color: rgba(255, 255, 255, 0.2);
		padding: 10rpx 20rpx;
		border-radius: 20rpx;
		display: flex;
		align-items: center;
		gap: 8rpx;
	}

	.points-value {
		font-size: 26rpx;
		font-weight: bold;
		color: #fff;
	}

	.points-label {
		font-size: 18rpx;
		color: rgba(255, 255, 255, 0.8);
	}

	.coins-badge {
		background-color: rgba(255, 215, 0, 0.3);
		padding: 10rpx 20rpx;
		border-radius: 20rpx;
		display: flex;
		align-items: center;
		gap: 8rpx;
	}

	.coins-value {
		font-size: 26rpx;
		font-weight: bold;
		color: #ffd700;
	}

	.coins-label {
		font-size: 18rpx;
		color: rgba(255, 215, 0, 0.8);
	}
</style>
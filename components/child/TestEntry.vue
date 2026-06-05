<template>
	<view class="section">
		<text class="section-title">🎯 能力测试</text>
		<view class="test-entry-card" @click="goToTests">
			<view class="test-card-left">
				<view class="test-icon">🧪</view>
				<view class="test-info">
					<text class="test-title">发现你的潜力</text>
					<text class="test-desc">知识测试 · 性格测试 · 职业测试</text>
				</view>
			</view>
			<view class="test-arrow">›</view>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'TestEntry',
		methods: {
			goToTests() {
				this.$emit('goToTests')
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

	.test-entry-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
		padding: 30rpx;
		border-radius: 16rpx;
	}

	.test-card-left {
		display: flex;
		align-items: center;
		flex: 1;
	}

	.test-icon {
		font-size: 50rpx;
		margin-right: 20rpx;
	}

	.test-info {
		flex: 1;
	}

	.test-title {
		display: block;
		font-size: 30rpx;
		font-weight: bold;
		color: #fff;
		margin-bottom: 8rpx;
	}

	.test-desc {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.8);
	}

	.test-arrow {
		font-size: 40rpx;
		color: rgba(255, 255, 255, 0.8);
	}
</style>
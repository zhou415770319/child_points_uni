<template>
	<view class="stat-card" @click="handleClick">
		<text class="stat-value">{{ value }}</text>
		<text class="stat-label">{{ label }}</text>
	</view>
</template>

<script>
export default {
	name: 'StatCard',
	props: {
		value: {
			type: [String, Number],
			default: '0'
		},
		label: {
			type: String,
			default: ''
		}
	},
	methods: {
		handleClick() {
			this.$emit('click')
		}
	}
}
</script>

<style lang="scss" scoped>
.stat-card {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 20rpx;
	padding: 30rpx;
	flex: 1;
	text-align: center;
	
	.stat-value {
		display: block;
		font-size: 48rpx;
		font-weight: bold;
		color: #fff;
		margin-bottom: 10rpx;
	}
	
	.stat-label {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.8);
	}
}
</style>
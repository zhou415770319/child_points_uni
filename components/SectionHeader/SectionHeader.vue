<template>
	<view class="section-header">
		<text class="section-title">{{ title }}</text>
		<view v-if="count" class="section-count">{{ count }}</view>
		<text v-else-if="linkText" class="section-link" @click="handleLinkClick">{{ linkText }}</text>
	</view>
</template>

<script>
export default {
	name: 'SectionHeader',
	props: {
		title: {
			type: String,
			default: ''
		},
		count: {
			type: [String, Number],
			default: ''
		},
		linkText: {
			type: String,
			default: ''
		}
	},
	methods: {
		handleLinkClick() {
			this.$emit('linkClick')
		}
	}
}
</script>

<style lang="scss" scoped>
.section-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20rpx 0;
	
	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}
	
	.section-count {
		font-size: 28rpx;
		color: #667eea;
		font-weight: bold;
	}
	
	.section-link {
		font-size: 26rpx;
		color: #667eea;
	}
}
</style>
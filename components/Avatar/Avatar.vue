<template>
	<view class="avatar" :class="[sizeClass, { 'avatar-clickable': clickable }]" @click="handleClick">
		<image v-if="src && isUrl(src)" class="avatar-img" :src="src" mode="aspectFill" />
		<text v-else class="avatar-text">{{ initials }}</text>
	</view>
</template>

<script>
export default {
	name: 'Avatar',
	props: {
		src: {
			type: String,
			default: ''
		},
		name: {
			type: String,
			default: ''
		},
		size: {
			type: String,
			default: 'medium',
			validator: (value) => ['small', 'medium', 'large'].includes(value)
		},
		clickable: {
			type: Boolean,
			default: false
		}
	},
	computed: {
		sizeClass() {
			return `avatar-${this.size}`
		},
		initials() {
			if (this.name) {
				return this.name.charAt(0)
			}
			return '?'
		}
	},
	methods: {
		isUrl(str) {
			return str.startsWith('http')
		},
		handleClick() {
			if (this.clickable) {
				this.$emit('click')
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.avatar {
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	
	&.avatar-small {
		width: 80rpx;
		height: 80rpx;
		
		.avatar-text {
			font-size: 28rpx;
		}
	}
	
	&.avatar-medium {
		width: 100rpx;
		height: 100rpx;
		
		.avatar-text {
			font-size: 36rpx;
		}
	}
	
	&.avatar-large {
		width: 140rpx;
		height: 140rpx;
		
		.avatar-text {
			font-size: 48rpx;
		}
	}
	
	&.avatar-clickable {
		cursor: pointer;
		opacity: 0.9;
		
		&:active {
			opacity: 0.7;
		}
	}
	
	.avatar-img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}
	
	.avatar-text {
		color: #fff;
		font-weight: bold;
	}
}
</style>
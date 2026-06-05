<template>
	<view class="modal-overlay" v-if="visible" @click="close">
		<view class="modal-content" @click.stop>
			<view class="modal-header">
				<text class="modal-title">👧 切换儿童账号</text>
				<text class="modal-close" @click="close">✕</text>
			</view>
			<view class="modal-body">
				<view class="child-list">
					<view class="child-item" v-for="child in children" :key="child.id" :class="{ active: child.child_id === currentChild?.child_id }" @click="switchChild(child)">
						<view class="child-avatar">
							<image v-if="child.avatar && child.avatar.startsWith('http')" class="avatar-img" :src="child.avatar" mode="aspectFill" />
							<text v-else>{{ getAvatar(child.name) }}</text>
						</view>
						<view class="child-info">
							<text class="child-name">{{ child.name }}</text>
							<text class="child-detail">{{ child.age }}岁 · {{ child.grade }}</text>
						</view>
						<view class="child-check" v-if="child.child_id === currentChild?.child_id">✓</view>
					</view>
				</view>
			</view>
			<view class="modal-footer">
				<button class="logout-btn" @click="logout">🚪 退出儿童账号</button>
			</view>
		</view>
	</view>
</template>

<script>
	const AVATARS = ['👦', '👧', '🧒', '👶']

	export default {
		name: 'ChildSwitchModal',
		props: {
			visible: {
				type: Boolean,
				default: false
			},
			children: {
				type: Array,
				default: () => []
			},
			currentChild: {
				type: Object,
				default: null
			}
		},
		methods: {
			getAvatar(name) {
				if (!name) return '👦'
				const index = name.charCodeAt(0) % AVATARS.length
				return AVATARS[index]
			},
			close() {
				this.$emit('close')
			},
			switchChild(child) {
				this.$emit('switchChild', child)
			},
			logout() {
				this.$emit('logout')
			}
		}
	}
</script>

<style lang="scss" scoped>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		width: 80%;
		max-width: 600rpx;
		background-color: #fff;
		border-radius: 20rpx;
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.modal-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.modal-close {
		font-size: 32rpx;
		color: #999;
	}

	.modal-body {
		padding: 20rpx;
		max-height: 50vh;
		overflow-y: auto;
	}

	.child-list {
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}

	.child-item {
		display: flex;
		align-items: center;
		padding: 20rpx;
		border-radius: 12rpx;
		transition: background-color 0.2s;
		
		&:active, &.active {
			background-color: #f5f5f5;
		}
	}

	.child-avatar {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 36rpx;
		margin-right: 20rpx;
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
	}

	.child-info {
		flex: 1;
	}

	.child-name {
		display: block;
		font-size: 28rpx;
		font-weight: 500;
		color: #333;
		margin-bottom: 5rpx;
	}

	.child-detail {
		font-size: 24rpx;
		color: #999;
	}

	.child-check {
		width: 40rpx;
		height: 40rpx;
		border-radius: 50%;
		background-color: #667eea;
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24rpx;
	}

	.modal-footer {
		padding: 20rpx 30rpx;
		border-top: 1rpx solid #f0f0f0;
	}

	.logout-btn {
		width: 100%;
		padding: 20rpx;
		background-color: #f5f5f5;
		color: #666;
		font-size: 28rpx;
		border-radius: 12rpx;
		border: none;
	}
</style>
<template>
	<view class="container">
		<view class="header">
			<view class="user-section">
				<view class="avatar">{{ userName.charAt(0) }}</view>
				<view class="user-info">
					<text class="user-name">{{ userName }}</text>
					<text class="user-role">{{ role === 'parent' ? '家长' : '儿童' }}账号</text>
				</view>
			</view>
		</view>

		<view class="section">
			<view class="section-title">📋 账号信息</view>
			<view class="info-list">
				<view class="info-item">
					<text class="info-label">账号类型</text>
					<text class="info-value">{{ role === 'parent' ? '家长' : '儿童' }}</text>
				</view>
				<view class="info-item">
					<text class="info-label">当前积分</text>
					<text class="info-value points">{{ currentPoints }} 积分</text>
				</view>
			</view>
		</view>

		<view class="section">
			<view class="section-title">⚙️ 设置</view>
			<view class="menu-list">
				<view class="menu-item" @click="goToSettings">
					<text class="menu-icon">⚙️</text>
					<text class="menu-text">系统设置</text>
					<text class="menu-arrow">›</text>
				</view>
				<view class="menu-item" @click="goToAbout">
					<text class="menu-icon">ℹ️</text>
					<text class="menu-text">关于我们</text>
					<text class="menu-arrow">›</text>
				</view>
			</view>
		</view>

		<view class="logout-section">
			<button class="logout-btn" @click="logout">退出登录</button>
		</view>
	</view>
</template>

<script>
	import UserManager from '@/common/user-manager.js'

	export default {
		data() {
			return {
				userName: '用户',
				role: 'parent',
				currentPoints: 0
			}
		},
		onLoad() {
			this.loadUserInfo()
		},
		methods: {
			async loadUserInfo() {
				this.role = UserManager.getUserRole()

				try {
					if (this.role === 'parent') {
						// 从用户表获取家长信息
						const parent = await UserManager.getCurrentParent()
						if (parent) {
							this.userName = parent.name[0].text || '家长'
						} else {
							this.userName = '家长'
						}
						this.currentPoints = 0  // 家长账号暂不显示积分
					} else {
						// 从儿童表获取儿童信息
						const child = await UserManager.getCurrentChild()
						if (child) {
							this.userName = child.name[0].text || '儿童'
							this.currentPoints = child.total_points || 0
						} else {
							this.userName = '儿童'
							this.currentPoints = 0
						}
					}
					console.log('[UCenter] 用户信息加载完成:', { userName: this.userName, role: this.role, currentPoints: this.currentPoints })
				} catch (error) {
					console.error('[UCenter] 加载用户信息失败:', error)
					// 使用默认值
					this.userName = this.role === 'parent' ? '家长' : '儿童'
					this.currentPoints = 0
				}
			},
			goToSettings() {
				uni.showToast({ title: '系统设置功能开发中', icon: 'none' })
			},
			goToAbout() {
				uni.showToast({ title: '关于我们功能开发中', icon: 'none' })
			},
			logout() {
					uni.showModal({
						title: '确认退出',
						content: '确定要退出当前账号吗？',
						success: (res) => {
							if (res.confirm) {
								// 使用UserManager清除用户缓存
								UserManager.clearUserCache()
								
								uni.reLaunch({
									url: '/pages/login'
								})
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
	}

	.header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 80rpx 30rpx 60rpx;
	}

	.user-section {
		display: flex;
		align-items: center;
		gap: 30rpx;
	}

	.avatar {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		background-color: rgba(255, 255, 255, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 48rpx;
		font-weight: bold;
		color: #fff;
	}

	.user-info {
		flex: 1;
	}

	.user-name {
		font-size: 36rpx;
		font-weight: bold;
		color: #fff;
		display: block;
		margin-bottom: 10rpx;
	}

	.user-role {
		font-size: 26rpx;
		color: rgba(255, 255, 255, 0.8);
	}

	.section {
		background-color: #fff;
		margin: 20rpx;
		border-radius: 16rpx;
		padding: 25rpx;
	}

	.section-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 20rpx;
	}

	.info-list {
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx;
		background-color: #fafafa;
		border-radius: 12rpx;
	}

	.info-label {
		font-size: 28rpx;
		color: #666;
	}

	.info-value {
		font-size: 28rpx;
		color: #333;
		font-weight: bold;

		&.points {
			color: #ff9500;
		}
	}

	.menu-list {
		display: flex;
		flex-direction: column;
		gap: 10rpx;
	}

	.menu-item {
		display: flex;
		align-items: center;
		padding: 25rpx 20rpx;
		background-color: #fafafa;
		border-radius: 12rpx;
	}

	.menu-icon {
		font-size: 32rpx;
		margin-right: 20rpx;
	}

	.menu-text {
		flex: 1;
		font-size: 28rpx;
		color: #333;
	}

	.menu-arrow {
		font-size: 32rpx;
		color: #ccc;
	}

	.logout-section {
		padding: 40rpx 20rpx;
	}

	.logout-btn {
		width: 100%;
		height: 88rpx;
		border-radius: 44rpx;
		font-size: 32rpx;
		background-color: #fff;
		color: #f44336;
		border: 2rpx solid #f44336;
	}
</style>

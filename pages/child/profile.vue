<template>
	<view class="container">
		<view class="profile-header">
			<view class="avatar-section">
				<view class="avatar">
					<image v-if="userInfo.avatar && userInfo.avatar.startsWith('http')" class="avatar-img" :src="userInfo.avatar" mode="aspectFill" />
					<text v-else>{{ userInfo.name?.charAt(0) || '?' }}</text>
				</view>
				<text class="user-name">{{ userInfo.name || '小朋友' }}</text>
			</view>
		</view>

		<view class="info-card">
			<view class="section-title">👤 基本信息</view>
			<view class="info-row">
				<text class="info-label">姓名</text>
				<text class="info-value">{{ userInfo.name || '-' }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">年龄</text>
				<text class="info-value">{{ userInfo.age || '-' }} 岁</text>
			</view>
			<view class="info-row">
				<text class="info-label">年级</text>
				<text class="info-value">{{ userInfo.grade || '-' }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">性别</text>
				<text class="info-value">{{ userInfo.gender || '-' }}</text>
			</view>
		</view>

		<view class="info-card">
			<view class="section-title">⭐ 积分信息</view>
			<view class="points-row">
				<view class="points-item">
					<text class="points-label">总积分</text>
					<text class="points-value">{{ userInfo.total_points || 0 }}</text>
				</view>
				<view class="points-divider"></view>
				<view class="points-item">
					<text class="points-label">金币</text>
					<text class="points-value reward">{{ userInfo.total_reward_points || 0 }}</text>
				</view>
			</view>
		</view>

		<view class="info-card">
			<view class="section-title">📞 联系方式</view>
			<view class="info-row">
				<text class="info-label">家长电话</text>
				<text class="info-value">{{ userInfo.parent_phone || userInfo.parentPhone || '-' }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">家庭住址</text>
				<text class="info-value">{{ userInfo.address || '-' }}</text>
			</view>
		</view>

		<view class="info-card">
			<view class="section-title">🏫 学校信息</view>
			<view class="info-row">
				<text class="info-label">学校名称</text>
				<text class="info-value">{{ userInfo.school || '-' }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">班级</text>
				<text class="info-value">{{ userInfo.class || userInfo.class_name || '-' }}</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				userInfo: {}
			}
		},
		onLoad() {
			this.loadUserInfo()
		},
		methods: {
			loadUserInfo() {
				try {
					const cached = uni.getStorageSync('currentChild')
					console.log('[Profile] localStorage currentChild:', cached)
					
					if (cached) {
						try {
							const child = JSON.parse(cached)
							console.log('[Profile] 解析后的儿童信息:', child)
							
							this.userInfo = {
								id: child.id || child.record_id || '',
								child_id: child.child_id || '',
								name: this.parseName(child) || '',
								age: child.age || child.age_num || '',
								grade: child.grade || '',
								gender: child.gender || '',
								avatar: child.avatar || '',
								total_points: child.total_points || child.points || 0,
								total_reward_points: child.total_reward_points || child.reward_points || 0,
								parent_phone: child.parent_phone || child.parentPhone || '',
								address: child.address || '',
								school: child.school || '',
								class: child.class || child.class_name || ''
							}
							
							console.log('[Profile] 格式化后的用户信息:', this.userInfo)
						} catch (e) {
							console.warn('[Profile] 解析缓存失败:', e)
						}
					} else {
						console.warn('[Profile] localStorage 中没有 currentChild')
					}
				} catch (error) {
					console.error('[Profile] 加载用户信息失败:', error)
				}
			},
			parseName(child) {
				// 处理可能的名称字段格式
				if (!child.name) return ''
				if (typeof child.name === 'string') return child.name
				if (Array.isArray(child.name) && child.name[0]?.text) return child.name[0].text
				return ''
			}
		}
	}
</script>

<style lang="scss">
	.container {
		min-height: 100vh;
		background-color: #f5f5f5;
		padding-bottom: 40rpx;
	}

	.profile-header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 60rpx 30rpx 80rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.avatar-section {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.avatar {
		width: 160rpx;
		height: 160rpx;
		border-radius: 50%;
		background-color: rgba(255, 255, 255, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 64rpx;
		font-weight: bold;
		color: #fff;
		margin-bottom: 20rpx;
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}

	.user-name {
		font-size: 36rpx;
		font-weight: bold;
		color: #fff;
	}

	.info-card {
		background-color: #fff;
		margin: 20rpx;
		border-radius: 16rpx;
		padding: 20rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
	}

	.section-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 20rpx;
		padding-bottom: 15rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 18rpx 0;
		border-bottom: 1rpx solid #f8f8f8;

		&:last-child {
			border-bottom: none;
		}
	}

	.info-label {
		font-size: 26rpx;
		color: #999;
	}

	.info-value {
		font-size: 26rpx;
		color: #333;
		font-weight: 500;
	}

	.points-row {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20rpx 0;
	}

	.points-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.points-item .points-label {
		font-size: 24rpx;
		color: #999;
		margin-bottom: 10rpx;
	}

	.points-item .points-value {
		font-size: 48rpx;
		font-weight: bold;
		color: #ff9500;

		&.reward {
			color: #4caf50;
		}
	}

	.points-divider {
		width: 1rpx;
		height: 80rpx;
		background-color: #eee;
		margin: 0 40rpx;
	}
</style>
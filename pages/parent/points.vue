<template>
	<view class="container">
		<view class="points-header">
			<view class="points-info">
				<text class="points-label">总积分</text>
				<text class="points-value">{{ totalPoints }}</text>
			</view>
			<view class="points-actions">
				<button class="action-btn" @click="goToHistory">📋 积分记录</button>
				<button class="action-btn" @click="goToRules">⚙️ 规则</button>
			</view>
		</view>

		<view class="section">
			<text class="section-title">👧 选择儿童</text>
			<view class="children-tabs">
				<view class="child-tab" v-for="child in children" :key="child.id" :class="{ active: selectedChild === child.child_id }" @click="selectChild(child.child_id)">
					<view class="tab-avatar">
						<image v-if="child.avatar && child.avatar.startsWith('http')" class="avatar-img" :src="child.avatar" mode="aspectFill" />
						<text v-else>{{ child.name.charAt(0) }}</text>
					</view>
					<text class="tab-name">{{ child.name }}</text>
					<text class="tab-points">{{ child.total_points }}积分</text>
				</view>
			</view>
		</view>

		<view class="section">
			<text class="section-title">📈 积分趋势</text>
			<view class="chart-container">
				<view class="chart-bar">
					<view class="bar-item" v-for="(item, index) in weeklyData" :key="index">
						<view class="bar-wrapper">
							<view class="bar-fill" :style="{ height: item.percent + '%' }"></view>
						</view>
						<text class="bar-label">{{ item.day }}</text>
					</view>
				</view>
			</view>
			<view class="trend-summary">
				<view class="trend-item">
					<text class="trend-value positive">+{{ weeklyEarn }}</text>
					<text class="trend-label">本周获得</text>
				</view>
				<view class="trend-item">
					<text class="trend-value negative">-{{ weeklySpend }}</text>
					<text class="trend-label">本周消费</text>
				</view>
				<view class="trend-item">
					<text class="trend-value">{{ weeklyNet }}</text>
					<text class="trend-label">净增长</text>
				</view>
			</view>
		</view>

		<view class="section">
			<text class="section-title">🏆 近期获取</text>
			<view class="history-list">
				<view class="history-item" v-for="item in recentHistory" :key="item.id">
					<view class="history-icon earn">🎁</view>
					<view class="history-info">
						<text class="history-title">{{ item.description }}</text>
						<text class="history-time">{{ item.created_at }}</text>
					</view>
					<text class="history-amount">+{{ item.amount }}</text>
				</view>
			</view>
		</view>

		<view class="section">
			<view class="section-header">
				<text class="section-title">🛒 去兑换</text>
			</view>
			<view class="gift-preview">
				<view class="gift-item">
					<view class="gift-icon">🎮</view>
					<view class="gift-info">
						<text class="gift-name">儿童玩具</text>
						<text class="gift-price">500积分</text>
					</view>
				</view>
				<view class="gift-item">
					<view class="gift-icon">📚</view>
					<view class="gift-info">
						<text class="gift-name">故事书</text>
						<text class="gift-price">300积分</text>
					</view>
				</view>
				<view class="gift-item">
					<view class="gift-icon">🍭</view>
					<view class="gift-info">
						<text class="gift-name">糖果礼包</text>
						<text class="gift-price">100积分</text>
					</view>
				</view>
			</view>
			<button class="go-mall-btn" @click="goToMall">🎁 去礼品商城</button>
		</view>
		<custom-tab-bar ref="tabBar"></custom-tab-bar>
	</view>
</template>

<script>
	import customTabBar from '@/custom-tab-bar/index.vue'
	import UserManager from '@/common/user-manager.js'
	import { feishuRequest } from '@/common/feishu-request.js'
	export default {
		components: { customTabBar },
		data() {
			return {
				totalPoints: 0,
				selectedChild: null,
				children: [],
				weeklyData: [
					{ day: '周一', value: 50, percent: 50 },
					{ day: '周二', value: 80, percent: 80 },
					{ day: '周三', value: 30, percent: 30 },
					{ day: '周四', value: 100, percent: 100 },
					{ day: '周五', value: 60, percent: 60 },
					{ day: '周六', value: 90, percent: 90 },
					{ day: '周日', value: 40, percent: 40 }
				],
				weeklyEarn: 450,
				weeklySpend: 120,
				weeklyNet: 330,
				recentHistory: []
			}
		},
		methods: {
			/**
			 * 加载儿童列表（从儿童表获取）
			 */
			async loadChildren() {
				try {
					const parent = await UserManager.getCurrentParent()
					if (parent && parent.phone) {
						this.children = await UserManager.getChildrenByParent(parent.phone)
						console.log('[Points] 儿童列表:', this.children)
						
						// 默认选择第一个儿童
						if (this.children.length > 0 && !this.selectedChild) {
							this.selectedChild = this.children[0].child_id || this.children[0].id
							this.totalPoints = this.children[0].total_points || 0
						}
					}
				} catch (error) {
					console.error('[Points] 加载儿童列表失败:', error)
				}
			},
			/**
			 * 加载积分历史记录（从多维表格获取）
			 */
			async loadPointsHistory() {
				try {
					uni.showLoading({ title: '加载中...' })
					
					// 根据选中的儿童获取积分记录
					const filter = { child_id: this.selectedChild }
					const result = await feishuRequest.queryRecords('积分记录表', filter)
					
					if (result.success && result.data && result.data.length > 0) {
						// 按时间倒序排列，取最近的记录
						this.recentHistory = result.data
							.sort((a, b) => new Date(b.fields.created_at || 0) - new Date(a.fields.created_at || 0))
							.slice(0, 20)
							.map(item => ({
								id: item.record_id,
								description: item.fields.description ? (Array.isArray(item.fields.description) && item.fields.description[0]?.text ? item.fields.description[0].text : item.fields.description) : '',
								amount: item.fields.amount || 0,
								created_at: this.formatTime(item.fields.created_at)
							}))
					} else {
						// 使用默认数据作为fallback
						this.recentHistory = [
							{ id: 1, description: '完成语文阅读任务', amount: 10, created_at: '今天 14:30' },
							{ id: 2, description: '完成数学练习任务', amount: 15, created_at: '今天 10:00' },
							{ id: 3, description: '连续打卡奖励', amount: 20, created_at: '昨天 20:00' },
							{ id: 4, description: '完成英语背诵任务', amount: 10, created_at: '昨天 15:30' }
						]
					}
				} catch (error) {
					console.error('[Points] 加载积分历史失败:', error)
					// 使用默认数据作为fallback
					this.recentHistory = [
						{ id: 1, description: '完成语文阅读任务', amount: 10, created_at: '今天 14:30' },
						{ id: 2, description: '完成数学练习任务', amount: 15, created_at: '今天 10:00' },
						{ id: 3, description: '连续打卡奖励', amount: 20, created_at: '昨天 20:00' },
						{ id: 4, description: '完成英语背诵任务', amount: 10, created_at: '昨天 15:30' }
					]
				} finally {
					uni.hideLoading()
				}
			},
			/**
			 * 格式化时间显示
			 */
			formatTime(timestamp) {
				if (!timestamp) return '未知时间'
				
				const date = new Date(timestamp)
				const now = new Date()
				const diff = now.getTime() - date.getTime()
				const days = Math.floor(diff / (1000 * 60 * 60 * 24))
				
				if (days === 0) {
					// 今天
					return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
				} else if (days === 1) {
					// 昨天
					return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
				} else {
					// 更早的时间
					return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
				}
			},
			selectChild(childId) {
				this.selectedChild = childId
				const child = this.children.find(c => c.child_id === childId || c.id === childId)
				if (child) {
					this.totalPoints = child.total_points || 0
				}
				// 切换儿童时重新加载积分历史
				this.loadPointsHistory()
			},
			goToHistory() {
				uni.navigateTo({ url: '/pages/parent/points-history' })
			},
			goToRules() {
				uni.showToast({ title: '积分规则功能开发中', icon: 'none' })
			},
			goToMall() {
				uni.navigateTo({ url: '/pages/parent/mall' })
			}
		},
		onLoad() {
			this.loadChildren()
			this.loadPointsHistory()
		},
		onShow() {
			if (this.$refs.tabBar) {
				this.$refs.tabBar.updateSelected('/pages/parent/points')
			}
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		min-height: 100vh;
		background-color: #f5f5f5;
		padding-bottom: 120rpx;
	}

	.points-header {
		background: linear-gradient(135deg, #ff9500 0%, #ff6b35 100%);
		padding: 40rpx 30rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.points-info {
		color: #fff;
	}

	.points-label {
		font-size: 26rpx;
		display: block;
		margin-bottom: 10rpx;
		opacity: 0.9;
	}

	.points-value {
		font-size: 56rpx;
		font-weight: bold;
	}

	.points-actions {
		display: flex;
		flex-direction: column;
		gap: 10rpx;
	}

	.action-btn {
		height: 55rpx;
		padding: 0 20rpx;
		border-radius: 27rpx;
		font-size: 22rpx;
		background-color: rgba(255, 255, 255, 0.2);
		color: #fff;
		border: none;
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
		display: block;
		margin-bottom: 20rpx;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.children-tabs {
		display: flex;
		gap: 15rpx;
	}

	.child-tab {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20rpx 15rpx;
		background-color: #fafafa;
		border-radius: 12rpx;
		border: 2rpx solid transparent;

		&.active {
			background-color: #fff3e0;
			border-color: #ff9500;
		}
	}

	.tab-avatar {
		width: 60rpx;
		height: 60rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24rpx;
		font-weight: bold;
		color: #fff;
		margin-bottom: 10rpx;
		overflow: hidden;
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}

	.tab-name {
		font-size: 24rpx;
		font-weight: bold;
		color: #333;
	}

	.tab-points {
		font-size: 22rpx;
		color: #ff9500;
	}

	.chart-container {
		padding: 20rpx 0;
	}

	.chart-bar {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		height: 200rpx;
	}

	.bar-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.bar-wrapper {
		width: 30rpx;
		height: 180rpx;
		background-color: #f0f0f0;
		border-radius: 15rpx;
		display: flex;
		align-items: flex-end;
		overflow: hidden;
	}

	.bar-fill {
		width: 100%;
		background: linear-gradient(180deg, #ff9500 0%, #ff6b35 100%);
		border-radius: 15rpx;
		transition: height 0.3s ease;
	}

	.bar-label {
		font-size: 20rpx;
		color: #999;
		margin-top: 10rpx;
	}

	.trend-summary {
		display: flex;
		justify-content: space-around;
		margin-top: 20rpx;
		padding-top: 20rpx;
		border-top: 1rpx solid #f0f0f0;
	}

	.trend-item {
		text-align: center;
	}

	.trend-value {
		font-size: 32rpx;
		font-weight: bold;
		display: block;
		margin-bottom: 5rpx;

		&.positive {
			color: #4caf50;
		}

		&.negative {
			color: #f44336;
		}
	}

	.trend-label {
		font-size: 22rpx;
		color: #999;
	}

	.history-list {
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}

	.history-item {
		display: flex;
		align-items: center;
		padding: 15rpx;
		background-color: #fafafa;
		border-radius: 12rpx;
	}

	.history-icon {
		width: 50rpx;
		height: 50rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24rpx;
		margin-right: 15rpx;

		&.earn {
			background-color: #e8f5e9;
		}

		&.spend {
			background-color: #ffebee;
		}
	}

	.history-info {
		flex: 1;
	}

	.history-title {
		font-size: 26rpx;
		color: #333;
		display: block;
	}

	.history-time {
		font-size: 22rpx;
		color: #999;
	}

	.history-amount {
		font-size: 28rpx;
		font-weight: bold;
		color: #4caf50;
	}

	.gift-preview {
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}

	.gift-item {
		display: flex;
		align-items: center;
		padding: 20rpx;
		background-color: #fafafa;
		border-radius: 12rpx;
	}

	.gift-icon {
		font-size: 45rpx;
		margin-right: 20rpx;
	}

	.gift-info {
		flex: 1;
	}

	.gift-name {
		font-size: 28rpx;
		color: #333;
		display: block;
	}

	.gift-price {
		font-size: 24rpx;
		color: #ff9500;
	}

	.go-mall-btn {
		width: 100%;
		height: 80rpx;
		border-radius: 40rpx;
		font-size: 30rpx;
		background: linear-gradient(135deg, #ff9500 0%, #ff6b35 100%);
		color: #fff;
		border: none;
		margin-top: 20rpx;
	}
</style>
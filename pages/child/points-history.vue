<template>
	<view class="container">
		<view class="header">
			<view class="header-content">
				<view class="back-btn" @click="goBack">
					<text class="back-icon">‹</text>
				</view>
				<view class="header-center">
					<text class="header-title">积分记录</text>
					<text class="child-name">{{ currentChild?.name || '未知儿童' }}</text>
				</view>
				<view class="header-right">
					<view class="points-info">
						<text class="total-points">{{ totalPoints }} 积分</text>
						<text class="total-coins">{{ totalCoins.toFixed(1) }} 金币</text>
					</view>
					<text class="update-tip">每日0点更新</text>
				</view>
			</view>
		</view>

		<view class="tabs">
			<view class="tab-item" :class="{ active: activeTab === 'all' }" @click="switchTab('all')">全部</view>
			<view class="tab-item" :class="{ active: activeTab === 'earn' }" @click="switchTab('earn')">获得</view>
			<view class="tab-item" :class="{ active: activeTab === 'spend' }" @click="switchTab('spend')">消费</view>
		</view>

		<view class="time-filter">
			<view 
				class="filter-item" 
				v-for="item in timeFilters" 
				:key="item.value"
				:class="{ active: activeTimeFilter === item.value }"
				@click="switchTimeFilter(item.value)"
			>
				{{ item.label }}
			</view>
		</view>

		<scroll-view class="history-list" scroll-y>
			<view class="list-empty" v-if="filteredHistory.length === 0">
				<text class="empty-icon">📭</text>
				<text class="empty-text">暂无积分记录</text>
			</view>
			<view class="history-item" v-for="item in filteredHistory" :key="item.id">
				<view class="item-icon" :class="item.type">
					{{ item.type === 'earn' ? '+' : '-' }}
				</view>
				<view class="item-info">
					<text class="item-title">{{ item.description }}</text>
					<text class="item-time">{{ item.time }}</text>
					<view class="points-detail" v-if="item.base_points > 0 || item.reward_points > 0">
					<text class="base-points" v-if="item.base_points > 0">积分: {{ item.base_points }}</text>
					<text class="reward-points" v-if="item.reward_points > 0">金币: {{ item.reward_points.toFixed(1) }}</text>
				</view>
				</view>
				<view class="item-amount" :class="item.type">
					{{ item.type === 'earn' ? '+' : '-' }}{{ item.amount }}
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
import UserManager from '@/common/user-manager.js'
import { feishuRequest } from '@/common/feishu-request.js'

export default {
	data() {
		return {
			currentChild: null,
			totalPoints: 0,
			totalCoins: 0,
			activeTab: 'all',
			activeTimeFilter: 'all',
			historyList: [],
			timeFilters: [
				{ label: '全部', value: 'all' },
				{ label: '今日', value: 'today' },
				{ label: '本周', value: 'week' },
				{ label: '本月', value: 'month' },
				{ label: '本年', value: 'year' }
			]
		}
	},
	computed: {
		filteredHistory() {
			let filtered = this.historyList
			
			// 类型筛选
			if (this.activeTab !== 'all') {
				filtered = filtered.filter(item => item.type === this.activeTab)
			}
			
			// 时间筛选
			filtered = this.filterByTime(filtered)
			
			return filtered
		}
	},
	onLoad() {
		this.loadCurrentChild().then(() => {
			this.loadHistory()
		})
	},
	methods: {
		async loadCurrentChild() {
			try {
				this.currentChild = await UserManager.getCurrentChild()
				if (this.currentChild) {
					this.totalPoints = this.currentChild.total_points || this.currentChild.base_points || 0
					this.totalCoins = this.currentChild.total_coins || this.currentChild.reward_points || 0
				}
			} catch (error) {
				console.error('[Points History] 加载儿童信息失败:', error)
			}
		},

		async loadHistory() {
			try {
				uni.showLoading({ title: '加载中...' })
				
				if (!this.currentChild) {
					this.historyList = []
					return
				}

				// 获取当前儿童的ID（支持 child_id 和 id 两种格式）
				const childId = this.currentChild.child_id || this.currentChild.id
				if (!childId) {
					this.historyList = []
					return
				}

				// 查询积分记录表，筛选当前儿童的积分记录
				const filter = { child_id: String(childId) }
				const result = await feishuRequest.queryRecords('积分记录表', filter)

				if (result.success && result.data && result.data.length > 0) {
					this.historyList = result.data
						.sort((a, b) => new Date(b.fields.created_time || 0) - new Date(a.fields.created_time || 0))
						.map(item => {
							// 获取基础积分和奖励积分
							const basePoints = item.fields.base_points || 0
							const rewardPoints = item.fields.reward_points || 0
							const totalAmount = basePoints + rewardPoints
							
							return {
								id: item.record_id,
								description: this.parseTextField(item.fields.description) || '积分变动',
								amount: totalAmount,
								base_points: basePoints,
								reward_points: rewardPoints,
								type: this.parseTextField(item.fields.type) === '消费' ? 'spend' : 'earn',
								time: this.formatTime(item.fields.created_time),
								created_time: item.fields.created_time
							}
						})
				} else {
					this.historyList = []
				}
			} catch (error) {
				console.error('[Points History] 加载积分记录失败:', error)
				this.historyList = []
			} finally {
				uni.hideLoading()
			}
		},

		filterByTime(list) {
			if (this.activeTimeFilter === 'all') {
				return list
			}

			const now = new Date()
			let startTime = null

			switch (this.activeTimeFilter) {
				case 'today':
					startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate())
					break
				case 'week':
					// 获取本周一
					const dayOfWeek = now.getDay()
					const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
					startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset)
					break
				case 'month':
					startTime = new Date(now.getFullYear(), now.getMonth(), 1)
					break
				case 'year':
					startTime = new Date(now.getFullYear(), 0, 1)
					break
				default:
					return list
			}

			return list.filter(item => {
				if (!item.created_time) return false
				return new Date(item.created_time) >= startTime
			})
		},

		parseTextField(field) {
			if (!field) return ''
			if (typeof field === 'object' && field.type === 1 && field.value && Array.isArray(field.value) && field.value.length > 0) {
				return field.value[0].text || ''
			}
			if (Array.isArray(field) && field[0] && field[0].text) {
				return field[0].text
			}
			if (typeof field === 'string') {
				return field
			}
			return ''
		},

		formatTime(dateStr) {
			if (!dateStr) return ''
			const date = new Date(dateStr)
			const month = date.getMonth() + 1
			const day = date.getDate()
			const hour = date.getHours().toString().padStart(2, '0')
			const minute = date.getMinutes().toString().padStart(2, '0')
			return `${month}月${day}日 ${hour}:${minute}`
		},

		switchTab(tab) {
			this.activeTab = tab
		},

		switchTimeFilter(filter) {
			this.activeTimeFilter = filter
		},

		goBack() {
			uni.navigateBack()
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
	padding: 60rpx 30rpx 30rpx;
}

.header-content {
	display: flex;
	align-items: center;
}

.back-btn {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: rgba(255, 255, 255, 0.2);
	border-radius: 50%;
	margin-right: 20rpx;
}

.back-icon {
	font-size: 40rpx;
	color: #fff;
	font-weight: bold;
}

.header-center {
	flex: 1;
	text-align: center;
}

.header-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #fff;
	display: block;
}

.child-name {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.8);
	display: block;
	margin-top: 5rpx;
}

.header-right {
	margin-left: 20rpx;
	display: flex;
	flex-direction: column;
	align-items: flex-end;
}

.points-info {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.total-points {
	font-size: 28rpx;
	color: #fff;
	font-weight: bold;
	background-color: rgba(255, 255, 255, 0.2);
	padding: 10rpx 20rpx;
	border-radius: 20rpx;
}

.total-coins {
	font-size: 28rpx;
	color: #ffd700;
	font-weight: bold;
	background-color: rgba(255, 215, 0, 0.2);
	padding: 10rpx 20rpx;
	border-radius: 20rpx;
}

.update-tip {
	font-size: 20rpx;
	color: rgba(255, 255, 255, 0.7);
	margin-top: 5rpx;
}

.tabs {
	display: flex;
	background-color: #fff;
	padding: 20rpx 30rpx;
	border-bottom: 1rpx solid #eee;
}

.tab-item {
	flex: 1;
	text-align: center;
	font-size: 28rpx;
	color: #666;
	padding: 15rpx 0;
	border-radius: 30rpx;
	transition: all 0.3s;

	&.active {
		background-color: #667eea;
		color: #fff;
	}
}

.time-filter {
	display: flex;
	background-color: #fff;
	padding: 15rpx 20rpx;
	border-bottom: 1rpx solid #eee;
	gap: 15rpx;
	flex-wrap: wrap;
}

.filter-item {
	font-size: 24rpx;
	color: #666;
	padding: 10rpx 20rpx;
	border-radius: 20rpx;
	background-color: #f5f5f5;
	transition: all 0.3s;

	&.active {
		background-color: #667eea;
		color: #fff;
	}
}

.history-list {
	height: calc(100vh - 300rpx);
	padding: 20rpx;
}

.list-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 0;
}

.empty-icon {
	font-size: 80rpx;
	margin-bottom: 20rpx;
}

.empty-text {
	font-size: 28rpx;
	color: #999;
}

.history-item {
	display: flex;
	align-items: center;
	background-color: #fff;
	padding: 25rpx;
	border-radius: 12rpx;
	margin-bottom: 15rpx;
}

.item-icon {
	width: 50rpx;
	height: 50rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	font-size: 28rpx;
	font-weight: bold;
	margin-right: 20rpx;

	&.earn {
		background-color: #e8f5e9;
		color: #4caf50;
	}

	&.spend {
		background-color: #ffebee;
		color: #f44336;
	}
}

.item-info {
	flex: 1;
}

.item-title {
	font-size: 28rpx;
	color: #333;
	display: block;
	margin-bottom: 8rpx;
}

.item-time {
	font-size: 24rpx;
	color: #999;
	display: block;
	margin-bottom: 8rpx;
}

.points-detail {
	display: flex;
	gap: 15rpx;
}

.base-points {
	font-size: 22rpx;
	color: #666;
	background-color: #f0f0f0;
	padding: 4rpx 12rpx;
	border-radius: 10rpx;
}

.reward-points {
	font-size: 22rpx;
	color: #ffd700;
	background-color: #fffef5;
	padding: 4rpx 12rpx;
	border-radius: 10rpx;
}

.item-amount {
	font-size: 30rpx;
	font-weight: bold;

	&.earn {
		color: #4caf50;
	}

	&.spend {
		color: #f44336;
	}
}
</style>
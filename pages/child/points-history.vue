<template>
	<view class="container">
		<view class="header">
			<view class="header-content">
				<view class="back-btn" @click="goBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="header-title">积分记录</text>
				<view class="header-right">
					<text class="total-points">{{ totalPoints }} 积分</text>
				</view>
			</view>
		</view>

		<view class="tabs">
			<view class="tab-item" :class="{ active: activeTab === 'all' }" @click="switchTab('all')">全部</view>
			<view class="tab-item" :class="{ active: activeTab === 'earn' }" @click="switchTab('earn')">获得</view>
			<view class="tab-item" :class="{ active: activeTab === 'spend' }" @click="switchTab('spend')">消费</view>
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
				</view>
				<view class="item-amount" :class="item.type">
					{{ item.type === 'earn' ? '+' : '-' }}{{ item.amount }}
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
import { UserManager } from '@/common/UserManager.js'
import feishuRequest from '@/common/feishu-request.js'

export default {
	data() {
		return {
			currentChild: null,
			totalPoints: 0,
			activeTab: 'all',
			historyList: []
		}
	},
	computed: {
		filteredHistory() {
			if (this.activeTab === 'all') {
				return this.historyList
			}
			return this.historyList.filter(item => item.type === this.activeTab)
		}
	},
	async onLoad() {
		await this.loadCurrentChild()
		await this.loadHistory()
	},
	methods: {
		async loadCurrentChild() {
			try {
				this.currentChild = await UserManager.getCurrentChild()
				if (this.currentChild) {
					this.totalPoints = this.currentChild.total_points || 0
				}
			} catch (error) {
				console.error('[Points History] 加载儿童信息失败:', error)
			}
		},

		async loadHistory() {
			try {
				uni.showLoading({ title: '加载中...' })
				
				if (!this.currentChild || !this.currentChild.id) {
					this.historyList = []
					return
				}

				const filter = { child_id: this.currentChild.child_id || this.currentChild.id }
				const result = await feishuRequest.queryRecords('积分记录表', filter)

				if (result.success && result.data && result.data.length > 0) {
					this.historyList = result.data
						.sort((a, b) => new Date(b.fields.created_at || 0) - new Date(a.fields.created_at || 0))
						.map(item => ({
							id: item.record_id,
							description: this.parseTextField(item.fields.description) || '积分变动',
							amount: item.fields.amount || 0,
							type: item.fields.type === 'spend' ? 'spend' : 'earn',
							time: this.formatTime(item.fields.created_at)
						}))
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

.header-title {
	flex: 1;
	font-size: 32rpx;
	font-weight: bold;
	color: #fff;
	text-align: center;
}

.header-right {
	margin-left: 20rpx;
}

.total-points {
	font-size: 28rpx;
	color: #fff;
	font-weight: bold;
	background-color: rgba(255, 255, 255, 0.2);
	padding: 10rpx 20rpx;
	border-radius: 20rpx;
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

.history-list {
	height: calc(100vh - 240rpx);
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
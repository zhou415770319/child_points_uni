<template>
	<view class="container">
		<!-- 头部信息 -->
		<view class="header">
			<view class="header-bg"></view>
			<view class="header-content">
				<view class="back-btn" @click="goBack">
					<text class="back-icon">&lt;</text>
				</view>
				<text class="page-title">积分金币记录</text>
				<text class="child-name">{{ childName }}</text>
			</view>
		</view>

		<!-- 统计信息 - 积分 -->
		<view class="stats-card points-card">
			<view class="card-header">
				<text class="card-title">⭐ 积分</text>
			</view>
			<view class="stats-row">
				<view class="stat-item">
					<text class="stat-label">累计积分</text>
					<text class="stat-value main">{{ totalPoints }}</text>
				</view>
				<view class="stat-item">
					<text class="stat-label">获得积分</text>
					<text class="stat-value positive">+{{ earnedPoints }}</text>
				</view>
				<view class="stat-item">
					<text class="stat-label">消费积分</text>
					<text class="stat-value negative">{{ spentPoints }}</text>
				</view>
			</view>
		</view>

		<!-- 统计信息 - 金币 -->
		<view class="stats-card coins-card">
			<view class="card-header">
				<text class="card-title">💰 金币</text>
			</view>
			<view class="stats-row">
				<view class="stat-item">
					<text class="stat-label">累计金币</text>
					<text class="stat-value main">{{ totalCoins }}</text>
				</view>
				<view class="stat-item">
					<text class="stat-label">获得金币</text>
					<text class="stat-value positive">+{{ earnedCoins }}</text>
				</view>
				<view class="stat-item">
					<text class="stat-label">消费金币</text>
					<text class="stat-value negative">{{ spentCoins }}</text>
				</view>
			</view>
		</view>

		<!-- 记录列表 -->
		<view class="section">
			<view class="section-header">
				<text class="section-title">全部记录</text>
				<view class="filter-tabs">
					<view 
						class="filter-tab" 
						:class="{ active: filterType === 'all' }" 
						@click="filterType = 'all'"
					>全部</view>
					<view 
						class="filter-tab" 
						:class="{ active: filterType === 'earn' }" 
						@click="filterType = 'earn'"
					>获得</view>
					<view 
						class="filter-tab" 
						:class="{ active: filterType === 'spend' }" 
						@click="filterType = 'spend'"
					>消费</view>
				</view>
			</view>
			<view class="record-list">
				<view class="record-item" v-for="record in filteredRecords" :key="record.id">
					<view class="record-icon" :class="record.isEarn ? 'earn' : 'spend'">
						<text v-if="record.isEarn">+</text>
						<text v-else>-</text>
					</view>
					<view class="record-info">
						<text class="record-title">{{ record.description }}</text>
						<text class="record-time">{{ formatTime(record.created_time) }}</text>
					</view>
					<view class="record-amounts">
						<view class="amount-item points" v-if="record.pointsAmount !== 0">
							<text class="amount-label">积分</text>
							<text :class="record.pointsAmount > 0 ? 'positive' : 'negative'">
								{{ record.pointsAmount > 0 ? '+' : '' }}{{ record.pointsAmount }}
							</text>
						</view>
						<view class="amount-item coins" v-if="record.coinsAmount !== 0">
							<text class="amount-label">金币</text>
							<text :class="record.coinsAmount > 0 ? 'positive' : 'negative'">
								{{ record.coinsAmount > 0 ? '+' : '' }}{{ record.coinsAmount }}
							</text>
						</view>
					</view>
				</view>
				<view v-if="filteredRecords.length === 0" class="empty-state">
					<text class="empty-icon">📋</text>
					<text class="empty-text">暂无{{ filterType === 'all' ? '' : (filterType === 'earn' ? '获得' : '消费') }}记录</text>
				</view>
			</view>
		</view>

		<!-- 下拉加载更多 -->
		<view class="load-more" v-if="hasMore">
			<text class="load-more-text">下拉加载更多...</text>
		</view>
	</view>
</template>

<script>
	import { feishuRequest } from '@/common/feishu-request.js'

	export default {
		data() {
			return {
				childId: '',
				childName: '',
				records: [],
				filterType: 'all',
				pageSize: 20,
				pageToken: '',
				hasMore: true,
				totalPoints: 0,
				totalCoins: 0,
				earnedPoints: 0,
				earnedCoins: 0,
				spentPoints: 0,
				spentCoins: 0
			}
		},
		onLoad(options) {
			this.childId = options.childId
			this.childName = decodeURIComponent(options.childName || '')
			this.loadRecords()
		},
		computed: {
			filteredRecords() {
				if (this.filterType === 'all') {
					return this.records
				}
				return this.records.filter(r => {
					if (this.filterType === 'earn') {
						return r.isEarn
					}
					return !r.isEarn
				})
			}
		},
		methods: {
			goBack() {
				uni.navigateBack()
			},
			async loadRecords() {
				uni.showLoading({ title: '加载中...' })
				try {
					const result = await feishuRequest.queryRecords('积分记录表', {
						child_id: this.childId
					}, { pageSize: this.pageSize, pageToken: this.pageToken })

					if (result.success && result.data) {
						const newRecords = result.data.map(item => {
							const pointsAmount = item.fields.base_points || 0
							const coinsAmount = item.fields.reward_points || 0
							return {
								id: item.record_id,
								description: item.fields.description?.[0]?.text || item.fields.description || '',
								pointsAmount: pointsAmount,
								coinsAmount: coinsAmount,
								isEarn: pointsAmount > 0 || coinsAmount > 0,
								created_time: item.fields.created_time || item.created_time
							}
						}).sort((a, b) => new Date(b.created_time) - new Date(a.created_time))

						this.records = [...this.records, ...newRecords]
						this.pageToken = result.pageToken || ''
						this.hasMore = !!this.pageToken

						this.calculateStats()
					} else {
						this.hasMore = false
					}
				} catch (error) {
					console.error('[PointsRecord] 加载记录失败:', error)
					uni.showToast({ title: '加载失败', icon: 'none' })
				} finally {
					uni.hideLoading()
				}
			},
			calculateStats() {
				let totalPoints = 0
				let totalCoins = 0
				let earnedPoints = 0
				let earnedCoins = 0
				let spentPoints = 0
				let spentCoins = 0
				
				this.records.forEach(record => {
					if (record.pointsAmount > 0) {
						earnedPoints += record.pointsAmount
					} else if (record.pointsAmount < 0) {
						spentPoints += Math.abs(record.pointsAmount)
					}
					
					if (record.coinsAmount > 0) {
						earnedCoins += record.coinsAmount
					} else if (record.coinsAmount < 0) {
						spentCoins += Math.abs(record.coinsAmount)
					}
					
					totalPoints += record.pointsAmount
					totalCoins += record.coinsAmount
				})
				
				this.totalPoints = totalPoints
				this.totalCoins = totalCoins
				this.earnedPoints = earnedPoints
				this.earnedCoins = earnedCoins
				this.spentPoints = -spentPoints
				this.spentCoins = -spentCoins
			},
			formatTime(timestamp) {
				if (!timestamp) return ''
				const date = new Date(timestamp)
				return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
			},
			onReachBottom() {
				if (this.hasMore) {
					this.loadRecords()
				}
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

	.header {
		position: relative;
		height: 200rpx;
	}

	.header-bg {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 0 0 30rpx 30rpx;
	}

	.header-content {
		position: relative;
		height: 100%;
		display: flex;
		align-items: center;
		padding: 0 30rpx;
	}

	.back-btn {
		width: 60rpx;
		height: 60rpx;
		background-color: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 20rpx;
	}

	.back-icon {
		font-size: 40rpx;
		color: #fff;
		font-weight: bold;
	}

	.page-title {
		flex: 1;
		font-size: 34rpx;
		font-weight: bold;
		color: #fff;
	}

	.child-name {
		font-size: 26rpx;
		color: rgba(255, 255, 255, 0.8);
	}

	.stats-card {
		background-color: #fff;
		border-radius: 20rpx;
		padding: 25rpx;
		margin: 20rpx;
		box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
		
		&.points-card {
			border-top: 6rpx solid #FFD700;
		}
		
		&.coins-card {
			border-top: 6rpx solid #FFA500;
		}
	}

	.card-header {
		margin-bottom: 20rpx;
		padding-bottom: 15rpx;
		border-bottom: 1rpx solid #f5f5f5;
	}

	.card-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #333;
	}

	.stats-row {
		display: flex;
		justify-content: space-around;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex: 1;
	}

	.stat-label {
		font-size: 24rpx;
		color: #999;
		margin-bottom: 10rpx;
	}

	.stat-value {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;

		&.main {
			font-size: 40rpx;
		}

		&.positive {
			color: #4caf50;
		}

		&.negative {
			color: #f44336;
		}
	}

	.section {
		margin: 20rpx;
		background-color: #fff;
		border-radius: 20rpx;
		overflow: hidden;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 25rpx;
		border-bottom: 1rpx solid #f5f5f5;
	}

	.section-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #333;
	}

	.filter-tabs {
		display: flex;
		gap: 15rpx;
	}

	.filter-tab {
		padding: 10rpx 20rpx;
		border-radius: 20rpx;
		font-size: 24rpx;
		background-color: #f5f5f5;
		color: #666;
		transition: all 0.3s;

		&.active {
			background-color: #667eea;
			color: #fff;
		}
	}

	.record-list {
		display: flex;
		flex-direction: column;
	}

	.record-item {
		display: flex;
		align-items: center;
		padding: 25rpx;
		border-bottom: 1rpx solid #f5f5f5;

		&:last-child {
			border-bottom: none;
		}
	}

	.record-icon {
		width: 60rpx;
		height: 60rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 26rpx;
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

	.record-info {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.record-title {
		font-size: 28rpx;
		color: #333;
	}

	.record-time {
		font-size: 24rpx;
		color: #999;
		margin-top: 8rpx;
	}

	.record-amounts {
		display: flex;
		flex-direction: column;
		gap: 8rpx;
		align-items: flex-end;
	}

	.amount-item {
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 6rpx 12rpx;
		border-radius: 10rpx;
		font-size: 24rpx;

		&.points {
			background-color: #FFF8DC;
			border: 1rpx solid #FFD700;
			
			.amount-label {
				color: #B8860B;
				font-weight: bold;
			}
		}

		&.coins {
			background-color: #FFF5E6;
			border: 1rpx solid #FFA500;
			
			.amount-label {
				color: #CC7A00;
				font-weight: bold;
			}
		}

		.positive {
			color: #4caf50;
			font-weight: bold;
		}

		.negative {
			color: #f44336;
			font-weight: bold;
		}
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 80rpx 0;
	}

	.empty-icon {
		font-size: 80rpx;
		margin-bottom: 20rpx;
	}

	.empty-text {
		font-size: 28rpx;
		color: #999;
	}

	.load-more {
		text-align: center;
		padding: 30rpx;
	}

	.load-more-text {
		font-size: 26rpx;
		color: #999;
	}
</style>

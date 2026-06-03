<template>
	<view class="container">
		<view class="header">
			<text class="header-title">📊 学习报告</text>
			<picker :value="periodIndex" :range="periods" @change="onPeriodChange">
				<view class="period-selector">
					{{ periods[periodIndex] }}
					<text class="selector-arrow">▼</text>
				</view>
			</picker>
		</view>

		<view class="section">
			<view class="section-header">
				<text class="section-title">👧 选择儿童</text>
			</view>
			<view class="children-tabs">
				<view class="child-tab" v-for="child in children" :key="child.id" :class="{ active: selectedChild === child.child_id }" @click="selectChild(child.child_id)">
					<view class="tab-avatar">{{ child.name.charAt(0) }}</view>
					<text class="tab-name">{{ child.name }}</text>
				</view>
			</view>
		</view>

		<view class="stats-grid">
			<view class="stat-card">
				<text class="stat-icon">✅</text>
				<text class="stat-value">{{ report.completed_tasks }}</text>
				<text class="stat-label">完成任务</text>
			</view>
			<view class="stat-card">
				<text class="stat-icon">⭐</text>
				<text class="stat-value">{{ report.total_points }}</text>
				<text class="stat-label">获得积分</text>
			</view>
			<view class="stat-card">
				<text class="stat-icon">🔥</text>
				<text class="stat-value">{{ report.streak_days }}</text>
				<text class="stat-label">连续天数</text>
			</view>
			<view class="stat-card">
				<text class="stat-icon">⏱️</text>
				<text class="stat-value">{{ report.total_time }}</text>
				<text class="stat-label">学习时长</text>
			</view>
		</view>

		<view class="section">
			<text class="section-title">📈 任务完成趋势</text>
			<view class="chart-container">
				<view class="chart-bar">
					<view class="bar-item" v-for="(item, index) in dailyData" :key="index">
						<view class="bar-wrapper">
							<view class="bar-fill" :style="{ height: item.percent + '%' }"></view>
						</view>
						<text class="bar-label">{{ item.day }}</text>
					</view>
				</view>
			</view>
		</view>

		<view class="section">
			<text class="section-title">📚 任务分类统计</text>
			<view class="category-stats">
				<view class="category-item" v-for="item in categoryStats" :key="item.type">
					<view class="category-info">
						<text class="category-icon">{{ item.icon }}</text>
						<text class="category-name">{{ item.name }}</text>
					</view>
					<view class="category-bar">
						<view class="bar-fill" :style="{ width: item.percent + '%', backgroundColor: item.color }"></view>
					</view>
					<view class="category-meta">
						<text class="category-count">{{ item.count }}项</text>
						<text class="category-percent">{{ item.percent }}%</text>
					</view>
				</view>
			</view>
		</view>

		<view class="section">
			<text class="section-title">🏅 成就徽章</text>
			<view class="badge-grid">
				<view class="badge-item" v-for="badge in badges" :key="badge.id" :class="{ locked: !badge.unlocked }">
					<text class="badge-icon">{{ badge.icon }}</text>
					<text class="badge-name">{{ badge.name }}</text>
					<text class="badge-desc">{{ badge.desc }}</text>
				</view>
			</view>
		</view>

		<view class="section">
			<text class="section-title">💬 AI评语</text>
			<view class="ai-comment-box">
				<text class="ai-comment">{{ report.ai_comment }}</text>
			</view>
		</view>
		<custom-tab-bar ref="tabBar"></custom-tab-bar>
	</view>
</template>

<script>
	import customTabBar from '@/custom-tab-bar/index.vue'
	import UserManager from '@/common/user-manager.js'
	export default {
		components: { customTabBar },
		data() {
			return {
				periods: ['本周', '本月', '本季度', '本年'],
				periodIndex: 0,
				selectedChild: null,
				children: [],
				report: {
					completed_tasks: 23,
					total_points: 350,
					streak_days: 15,
					total_time: '12小时30分',
					ai_comment: '表现非常出色！继续保持学习的好习惯！'
				},
				dailyData: [
					{ day: '周一', value: 3, percent: 60 },
					{ day: '周二', value: 4, percent: 80 },
					{ day: '周三', value: 2, percent: 40 },
					{ day: '周四', value: 5, percent: 100 },
					{ day: '周五', value: 3, percent: 60 },
					{ day: '周六', value: 4, percent: 80 },
					{ day: '周日', value: 2, percent: 40 }
				],
				categoryStats: [
					{ type: 'reading', name: '阅读', icon: '📖', count: 8, percent: 35, color: '#667eea' },
					{ type: 'math', name: '数学', icon: '🧮', count: 6, percent: 26, color: '#4caf50' },
					{ type: 'english', name: '英语', icon: '🔤', count: 5, percent: 22, color: '#ff9500' },
					{ type: 'art', name: '美术', icon: '🎨', count: 4, percent: 17, color: '#f44336' }
				],
				badges: [
					{ id: 1, name: '初学者', icon: '🌱', desc: '完成首次任务', unlocked: true },
					{ id: 2, name: '连续7天', icon: '🔥', desc: '连续打卡7天', unlocked: true },
					{ id: 3, name: '阅读达人', icon: '📚', desc: '完成50次阅读', unlocked: true },
					{ id: 4, name: '数学天才', icon: '🧮', desc: '完成100道数学题', unlocked: false },
					{ id: 5, name: '全能选手', icon: '🏆', desc: '完成所有类型任务', unlocked: true },
					{ id: 6, name: '积分王者', icon: '👑', desc: '累计获得1000积分', unlocked: false }
				]
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
						console.log('[Report] 儿童列表:', this.children)
						
						// 默认选择第一个儿童
						if (this.children.length > 0 && !this.selectedChild) {
							this.selectedChild = this.children[0].child_id || this.children[0].id
						}
					}
				} catch (error) {
					console.error('[Report] 加载儿童列表失败:', error)
				}
			},
			selectChild(childId) {
				this.selectedChild = childId
			},
			onPeriodChange(e) {
				const value = e?.detail?.value !== undefined ? e.detail.value : e
				this.periodIndex = value
			}
		},
		onLoad() {
			this.loadChildren()
		},
		onShow() {
			if (this.$refs.tabBar) {
				this.$refs.tabBar.updateSelected('/pages/parent/report')
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
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 40rpx 30rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.header-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #fff;
	}

	.period-selector {
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 12rpx 20rpx;
		background-color: rgba(255, 255, 255, 0.2);
		border-radius: 20rpx;
		font-size: 24rpx;
		color: #fff;
	}

	.selector-arrow {
		font-size: 16rpx;
	}

	.section {
		background-color: #fff;
		margin: 20rpx;
		border-radius: 16rpx;
		padding: 25rpx;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.section-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 20rpx;
	}

	.children-tabs {
		display: flex;
		gap: 20rpx;
	}

	.child-tab {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20rpx 30rpx;
		background-color: #fafafa;
		border-radius: 12rpx;
		border: 2rpx solid transparent;

		&.active {
			background-color: #e3f2fd;
			border-color: #667eea;
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
	}

	.tab-name {
		font-size: 24rpx;
		font-weight: bold;
		color: #333;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 15rpx;
		padding: 0 20rpx;
	}

	.stat-card {
		background-color: #fff;
		border-radius: 16rpx;
		padding: 25rpx;
		text-align: center;
	}

	.stat-icon {
		font-size: 40rpx;
		display: block;
		margin-bottom: 10rpx;
	}

	.stat-value {
		font-size: 40rpx;
		font-weight: bold;
		color: #667eea;
		display: block;
	}

	.stat-label {
		font-size: 24rpx;
		color: #999;
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
		width: 35rpx;
		height: 180rpx;
		background-color: #f0f0f0;
		border-radius: 17rpx;
		display: flex;
		align-items: flex-end;
		overflow: hidden;
	}

	.bar-fill {
		width: 100%;
		background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
		border-radius: 17rpx;
	}

	.bar-label {
		font-size: 20rpx;
		color: #999;
		margin-top: 10rpx;
	}

	.category-stats {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.category-item {
		display: flex;
		flex-direction: column;
		gap: 10rpx;
	}

	.category-info {
		display: flex;
		align-items: center;
		gap: 10rpx;
	}

	.category-icon {
		font-size: 28rpx;
	}

	.category-name {
		font-size: 26rpx;
		color: #333;
	}

	.category-bar {
		height: 16rpx;
		background-color: #f0f0f0;
		border-radius: 8rpx;
		overflow: hidden;
	}

	.category-bar .bar-fill {
		height: 100%;
		border-radius: 8rpx;
	}

	.category-meta {
		display: flex;
		justify-content: space-between;
	}

	.category-count, .category-percent {
		font-size: 22rpx;
		color: #999;
	}

	.badge-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 15rpx;
	}

	.badge-item {
		background-color: #fafafa;
		border-radius: 12rpx;
		padding: 20rpx 10rpx;
		text-align: center;
		opacity: 1;

		&.locked {
			opacity: 0.4;
			filter: grayscale(1);
		}
	}

	.badge-icon {
		font-size: 40rpx;
		display: block;
		margin-bottom: 8rpx;
	}

	.badge-name {
		font-size: 24rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 5rpx;
	}

	.badge-desc {
		font-size: 20rpx;
		color: #999;
	}

	.ai-comment-box {
		background-color: #fff3e0;
		border-radius: 12rpx;
		padding: 20rpx;
	}

	.ai-comment {
		font-size: 26rpx;
		color: #666;
		line-height: 1.7;
	}
</style>
<template>
	<view class="tab-bar">
		<view class="tab-bar-item" v-for="(item, index) in tabList" :key="index" @click="switchTab(item)">
			<view class="icon-wrapper">
				<text :class="['icon', { active: selected === index }]">{{ item.icon }}</text>
			</view>
			<text :class="['tab-text', { active: selected === index }]">{{ item.text }}</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				selected: 0,
				role: 'parent'
			}
		},
		computed: {
			tabList() {
				if (this.role === 'parent') {
					return [
						{
							pagePath: '/pages/parent/dashboard',
							text: '首页',
							icon: '🏠'
						},
						{
							pagePath: '/pages/parent/tasks',
							text: '任务',
							icon: '📋'
						},
						{
							pagePath: '/pages/parent/manage',
							text: '管理',
							icon: '⚙️'
						},
						{
							pagePath: '/pages/parent/points',
							text: '积分',
							icon: '⭐'
						},
						{
							pagePath: '/pages/parent/report',
							text: '报告',
							icon: '📊'
						}
					]
				} else {
					return [
						{
							pagePath: '/pages/child/home',
							text: '首页',
							icon: '🏠'
						},
						{
							pagePath: '/pages/child/mall',
							text: '商城',
							icon: '🛍️'
						}
					]
				}
			}
		},
		created() {
			this.role = uni.getStorageSync('userRole') || 'parent'
		},
		onShow() {
			// 自动检测当前页面并更新选中状态
			this.updateSelectedFromCurrentPage()
		},
		methods: {
			switchTab(item) {
				// 先更新选中状态
				const index = this.tabList.findIndex(tab => tab.pagePath === item.pagePath)
				if (index !== -1) {
					this.selected = index
				}
				// 然后跳转
				uni.switchTab({
					url: item.pagePath
				})
			},
			updateSelected(pagePath) {
				const index = this.tabList.findIndex(item => item.pagePath === pagePath)
				if (index !== -1) {
					this.selected = index
				}
				this.role = uni.getStorageSync('userRole') || 'parent'
			},
			// 从当前页面自动更新选中状态（通用方法）
			updateSelectedFromCurrentPage() {
				try {
					// 获取当前页面路由
					const pages = getCurrentPages()
					if (pages.length > 0) {
						const currentPage = pages[pages.length - 1]
						const currentRoute = '/' + currentPage.route
						this.updateSelected(currentRoute)
					}
				} catch (error) {
					console.error('[TabBar] 更新选中状态失败:', error)
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.tab-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 100rpx;
		background-color: #FFFFFF;
		display: flex;
		justify-content: space-around;
		align-items: center;
		padding-bottom: env(safe-area-inset-bottom);
		border-top: 1rpx solid #E5E5E5;
		z-index: 999;
	}

	.tab-bar-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
	}

	.icon-wrapper {
		height: 50rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.icon {
		font-size: 40rpx;
		opacity: 0.6;

		&.active {
			opacity: 1;
		}
	}

	.tab-text {
		font-size: 22rpx;
		color: #7A7E83;
		margin-top: 4rpx;

		&.active {
			color: #667eea;
		}
	}
</style>

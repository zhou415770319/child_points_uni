<template>
	<view class="tab-bar">
		<view class="tab-bar-item" v-for="(item, index) in tabList" :key="index" @click="switchTab(item)">
			<image :src="selected === index ? item.selectedIconPath : item.iconPath" class="icon" mode="aspectFit"></image>
			<text :class="['tab-text', { active: selected === index }]">{{ item.text }}</text>
		</view>
	</view>
</template>

<script>
	const icons = {
		list: require('../static/tabbar/list.png'),
		listActive: require('../static/tabbar/list_active.png'),
		grid: require('../static/tabbar/grid.png'),
		gridActive: require('../static/tabbar/grid_active.png'),
		me: require('../static/tabbar/me.png'),
		meActive: require('../static/tabbar/me_active.png')
	}

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
							iconPath: icons.list,
							selectedIconPath: icons.listActive
						},
						{
							pagePath: '/pages/parent/manage',
							text: '管理',
							iconPath: icons.grid,
							selectedIconPath: icons.gridActive
						},
						{
							pagePath: '/pages/parent/report',
							text: '报告',
							iconPath: icons.me,
							selectedIconPath: icons.meActive
						}
					]
				} else {
					return [
						{
							pagePath: '/pages/child/home',
							text: '首页',
							iconPath: icons.list,
							selectedIconPath: icons.listActive
						},
						{
							pagePath: '/pages/child/mall',
							text: '商城',
							iconPath: icons.me,
							selectedIconPath: icons.meActive
						}
					]
				}
			}
		},
		created() {
			this.updateSelectedFromCurrentPage()
		},
		onShow() {
			this.updateSelectedFromCurrentPage()
		},
		methods: {
			switchTab(item) {
				const index = this.tabList.findIndex(tab => tab.pagePath === item.pagePath)
				if (index !== -1 && index !== this.selected) {
					this.selected = index
					uni.switchTab({
						url: item.pagePath
					})
				}
			},
			updateSelected(pagePath) {
				if (pagePath.includes('/parent/')) {
					this.role = 'parent'
				} else if (pagePath.includes('/child/')) {
					this.role = 'child'
				} else {
					this.role = uni.getStorageSync('userRole') || 'parent'
				}
				
				const index = this.tabList.findIndex(item => item.pagePath === pagePath)
				if (index !== -1) {
					this.selected = index
				}
			},
			updateSelectedFromCurrentPage() {
				try {
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
		z-index: 9999;
	}

	.tab-bar-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
	}

	.icon {
		width: 48rpx;
		height: 48rpx;
		opacity: 0.6;

		.active {
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

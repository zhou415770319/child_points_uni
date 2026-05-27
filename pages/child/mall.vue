<template>
	<view class="container">
		<view class="header">
			<text class="header-title">🎁 礼品商城</text>
			<view class="balance">
				<text class="balance-label">我的积分</text>
				<text class="balance-value">{{ balance }}</text>
			</view>
		</view>

		<view class="category-tabs">
			<scroll-view scroll-x class="tabs-scroll">
				<view class="tabs-inner">
					<view class="category-tab" v-for="cat in categories" :key="cat.id" :class="{ active: selectedCategory === cat.id }" @click="selectedCategory = cat.id">
						{{ cat.icon }} {{ cat.name }}
					</view>
				</view>
			</scroll-view>
		</view>

		<view class="gift-grid">
			<view class="gift-card" v-for="gift in filteredGifts" :key="gift.id" @click="showGiftDetail(gift)">
				<view class="gift-image">
					<image v-if="gift.image" class="gift-img" :src="gift.image" mode="aspectFill" />
					<text v-else class="gift-icon">🎁</text>
				</view>
				<text class="gift-name">{{ gift.name }}</text>
				<text class="gift-price">⭐ {{ gift.price }} 积分</text>
				<text class="gift-stock" :class="gift.stock > 0 ? 'available' : 'unavailable'">
					{{ gift.stock > 0 ? '有货' : '缺货' }}
				</text>
				<button class="exchange-btn" :class="{ disabled: gift.stock <= 0 || balance < gift.price }" @click.stop="exchangeGift(gift)">
					兑换
				</button>
			</view>
		</view>

		<view class="modal-overlay" v-if="showDetailModal" @click="closeDetailModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">{{ selectedGift?.name }}</text>
					<text class="modal-close" @click="closeDetailModal">✕</text>
				</view>
				<view class="modal-body">
					<view class="detail-image">
						<image v-if="selectedGift?.image" class="detail-img" :src="selectedGift.image" mode="aspectFill" />
						<text v-else class="detail-icon">🎁</text>
					</view>
					<text class="detail-desc">{{ selectedGift?.description }}</text>
					<view class="detail-info">
						<view class="info-row">
							<text class="info-label">需要积分</text>
							<text class="info-value price">⭐ {{ selectedGift?.price }}</text>
						</view>
						<view class="info-row">
							<text class="info-label">剩余库存</text>
							<text class="info-value" :class="selectedGift?.stock > 0 ? 'stock-available' : 'stock-unavailable'">
								{{ selectedGift?.stock }} 件
							</text>
						</view>
					</view>
				</view>
				<view class="modal-footer">
					<button class="btn btn-secondary" @click="closeDetailModal">取消</button>
					<button class="btn btn-primary" :class="{ disabled: selectedGift?.stock <= 0 || balance < selectedGift?.price }" @click="confirmExchange">
						确认兑换
					</button>
				</view>
			</view>
		</view>
		<custom-tab-bar ref="tabBar"></custom-tab-bar>
	</view>
</template>

<script>
	import customTabBar from '@/custom-tab-bar/index.vue'
	import { feishuRequest } from '@/common/feishu-request.js'
	import UserManager from '@/common/user-manager.js'
	export default {
		components: { customTabBar },
		data() {
			return {
				balance: 0,
				selectedCategory: 'all',
				categories: [
					{ id: 'all', name: '全部', icon: '🎯' },
					{ id: 'toy', name: '玩具', icon: '🎮' },
					{ id: 'book', name: '图书', icon: '📚' },
					{ id: 'food', name: '零食', icon: '🍭' },
					{ id: 'stationery', name: '文具', icon: '✏️' }
				],
				gifts: [],
				showDetailModal: false,
				selectedGift: null
			}
		},
		computed: {
			filteredGifts() {
				if (this.selectedCategory === 'all') {
					return this.gifts
				}
				return this.gifts.filter(gift => gift.category === this.selectedCategory)
			}
		},
		methods: {
			/**
			 * 加载礼品数据（从多维表格获取）
			 */
			async loadGifts() {
				try {
					uni.showLoading({ title: '加载中...' })
					const result = await feishuRequest.queryRecords('礼品表')
					
					if (result.success && result.data && result.data.length > 0) {
						// 先保存 file_token，后续批量获取下载URL
						const giftsWithFileToken = result.data.map(item => ({
							id: item.record_id,
							name: item.fields.name ? (Array.isArray(item.fields.name) && item.fields.name[0]?.text ? item.fields.name[0].text : item.fields.name) : '',
							description: item.fields.description ? (Array.isArray(item.fields.description) && item.fields.description[0]?.text ? item.fields.description[0].text : item.fields.description) : '',
							price: item.fields.price || 0,
							stock: item.fields.stock || 0,
							category: item.fields.category || 'other',
							fileToken: item.fields.image ? (item.fields.image[0]?.file_token || '') : ''
						}))
						
						this.gifts = giftsWithFileToken
						
						// 收集需要获取URL的 file_tokens
						const fileTokens = giftsWithFileToken
							.filter(gift => gift.fileToken)
							.map(gift => gift.fileToken)
						
						// 批量获取图片下载URL
						if (fileTokens.length > 0) {
							await this.fetchImageUrls(fileTokens)
						}
					} else {
						this.gifts = []
					}
				} catch (error) {
					console.error('[Child Mall] 加载礼品失败:', error)
					this.gifts = []
				} finally {
					uni.hideLoading()
				}
			},
			/**
			 * 批量获取图片临时下载URL（通过云对象）
			 */
			async fetchImageUrls(fileTokens) {
				try {
					await feishuRequest.initCloudObject()
					const result = await feishuRequest.feishutools.getImageUrls({
						fileTokens: fileTokens
					})
					
					if (result.success && result.urlMap) {
						// 将URL映射到礼品数据
						this.gifts.forEach(gift => {
							if (gift.fileToken && result.urlMap[gift.fileToken]) {
								gift.image = result.urlMap[gift.fileToken]
							}
						})
					}
				} catch (error) {
					console.error('[Child Mall] 获取图片URL失败:', error)
				}
			},
			/**
			 * 加载当前儿童的积分余额
			 */
			async loadBalance() {
				try {
					const child = await UserManager.getCurrentChild()
					if (child) {
						this.balance = child.total_points || 0
					}
				} catch (error) {
					console.error('[Child Mall] 加载积分失败:', error)
				}
			},
			showGiftDetail(gift) {
				this.selectedGift = gift
				this.showDetailModal = true
			},
			closeDetailModal() {
				this.showDetailModal = false
				this.selectedGift = null
			},
			exchangeGift(gift) {
				if (gift.stock <= 0) {
					uni.showToast({ title: '该商品已缺货', icon: 'none' })
					return
				}
				if (this.balance < gift.price) {
					uni.showToast({ title: '积分不足', icon: 'none' })
					return
				}
				this.showGiftDetail(gift)
			},
			async confirmExchange() {
				if (!this.selectedGift) return
				if (this.selectedGift.stock <= 0 || this.balance < this.selectedGift.price) {
					return
				}

				uni.showModal({
					title: '确认兑换',
					content: `确定用 ${this.selectedGift.price} 积分兑换 "${this.selectedGift.name}" 吗？`,
					success: async (res) => {
						if (res.confirm) {
							try {
								uni.showLoading({ title: '兑换中...' })
								
								const child = await UserManager.getCurrentChild()
								if (child) {
									// 更新礼品库存
									await feishuRequest.updateRecord('礼品表', this.selectedGift.id, {
										stock: this.selectedGift.stock - 1
									})
									
									// 更新儿童积分
									await feishuRequest.updateRecord('儿童表', child.id, {
										total_points: this.balance - this.selectedGift.price
									})
								}
								
								this.balance -= this.selectedGift.price
								this.selectedGift.stock -= 1
								this.closeDetailModal()
								uni.showToast({ title: '🎉 兑换成功！', icon: 'success' })
							} catch (error) {
								console.error('[Child Mall] 兑换失败:', error)
								uni.showToast({ title: '兑换失败', icon: 'none' })
							} finally {
								uni.hideLoading()
							}
						}
					}
				})
			}
		},
		onShow() {
			if (this.$refs.tabBar) {
				this.$refs.tabBar.updateSelected('/pages/child/mall')
			}
		},
		onLoad() {
			this.loadGifts()
			this.loadBalance()
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
		background: linear-gradient(135deg, #ff9500 0%, #ff6b35 100%);
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

	.balance {
		background-color: rgba(255, 255, 255, 0.2);
		border-radius: 20rpx;
		padding: 15rpx 25rpx;
		text-align: center;
	}

	.balance-label {
		font-size: 22rpx;
		color: rgba(255, 255, 255, 0.8);
		display: block;
	}

	.balance-value {
		font-size: 36rpx;
		font-weight: bold;
		color: #ffd700;
	}

	.category-tabs {
		background-color: #fff;
		padding: 20rpx 0;
	}

	.tabs-scroll {
		white-space: nowrap;
	}

	.tabs-inner {
		display: inline-flex;
		padding: 0 20rpx;
		gap: 15rpx;
	}

	.category-tab {
		padding: 15rpx 25rpx;
		border-radius: 30rpx;
		font-size: 26rpx;
		background-color: #f5f5f5;
		color: #666;
		display: inline-block;

		&.active {
			background: linear-gradient(135deg, #ff9500 0%, #ff6b35 100%);
			color: #fff;
		}
	}

	.gift-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 15rpx;
		padding: 20rpx;
	}

	.gift-card {
		background-color: #fff;
		border-radius: 16rpx;
		padding: 20rpx;
		text-align: center;
		position: relative;
	}

	.gift-image {
		width: 180rpx;
		height: 180rpx;
		background-color: #fff3e0;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 15rpx;
		overflow: hidden;
	}

	.gift-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.gift-icon {
		font-size: 80rpx;
	}

	.gift-name {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 10rpx;
	}

	.gift-price {
		font-size: 24rpx;
		color: #ff9500;
		display: block;
		margin-bottom: 8rpx;
	}

	.gift-stock {
		font-size: 22rpx;
		display: block;
		margin-bottom: 15rpx;

		&.available {
			color: #4caf50;
		}

		&.unavailable {
			color: #999;
		}
	}

	.exchange-btn {
		width: 100%;
		height: 60rpx;
		border-radius: 30rpx;
		font-size: 26rpx;
		background: linear-gradient(135deg, #ff9500 0%, #ff6b35 100%);
		color: #fff;
		border: none;

		&.disabled {
			background-color: #f0f0f0;
			color: #999;
		}
	}

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
		padding: 40rpx;
	}

	.modal-content {
		width: 100%;
		max-width: 640rpx;
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
		font-size: 36rpx;
		color: #999;
		padding: 10rpx;
	}

	.modal-body {
		padding: 30rpx;
	}

	.detail-image {
		width: 160rpx;
		height: 160rpx;
		background-color: #fff3e0;
		border-radius: 20rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 25rpx;
	}

	.detail-icon {
		font-size: 80rpx;
	}

	.detail-desc {
		font-size: 28rpx;
		color: #666;
		line-height: 1.6;
		display: block;
		margin-bottom: 25rpx;
		text-align: center;
	}

	.detail-info {
		background-color: #fafafa;
		border-radius: 12rpx;
		padding: 20rpx;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 15rpx 0;
		border-bottom: 1rpx solid #f0f0f0;

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
		font-weight: bold;

		&.price {
			color: #ff9500;
		}
	}

	.stock-available {
		color: #4caf50;
	}

	.stock-unavailable {
		color: #999;
	}

	.modal-footer {
		display: flex;
		gap: 20rpx;
		padding: 20rpx 30rpx 30rpx;
	}

	.btn {
		flex: 1;
		height: 80rpx;
		border-radius: 40rpx;
		font-size: 30rpx;
		border: none;

		&.btn-primary {
			background: linear-gradient(135deg, #ff9500 0%, #ff6b35 100%);
			color: #fff;
		}

		&.btn-secondary {
			background-color: #f0f0f0;
			color: #333;
		}

		&.disabled {
			background-color: #f0f0f0;
			color: #999;
		}
	}
</style>
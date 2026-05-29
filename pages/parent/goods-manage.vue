<template>
	<view class="container">
		<view class="header">
			<view class="back-btn" @click="goBack">
				<text class="back-icon">‹</text>
			</view>
			<text class="header-title">🛒 商品管理</text>
			<view class="header-right">
				<button class="add-btn" @click="showAddModal = true">+ 新增</button>
			</view>
		</view>

		<view class="search-bar">
			<input class="search-input" v-model="searchKeyword" placeholder="搜索商品名称" />
			<button class="search-btn" @click="searchGoods">搜索</button>
		</view>

		<view class="filter-bar">
			<button 
				class="filter-btn" 
				:class="{ active: currentCategory === 'all' }" 
				@click="setCategory('all')"
			>全部</button>
			<button 
				v-for="cat in categories" 
				:key="cat.id"
				class="filter-btn" 
				:class="{ active: currentCategory === cat.id }" 
				@click="setCategory(cat.id)"
			>{{ cat.name }}</button>
		</view>

		<view class="goods-list">
			<view class="goods-card" v-for="good in filteredGoods" :key="good.id">
				<view class="goods-image">
					<image v-if="good.image && good.image.startsWith('http')" class="goods-img" :src="good.image" mode="aspectFill" />
					<text v-else class="goods-icon">{{ getGoodsIcon(good.category) }}</text>
				</view>
				<view class="goods-info">
					<view class="goods-header">
						<text class="goods-name">{{ good.name }}</text>
						<text class="goods-category">{{ getCategoryName(good.category) }}</text>
					</view>
					<text class="goods-desc">{{ good.description }}</text>
					<view class="goods-footer">
						<text class="goods-price">¥{{ good.price }}</text>
						<text class="goods-points">{{ good.points }}积分</text>
						<view class="goods-stock" :class="getStockClass(good.stock)">
							库存: {{ good.stock }}
						</view>
					</view>
				</view>
				<view class="goods-actions">
					<text class="action-btn edit" @click="editGoods(good)">✏️</text>
					<text class="action-btn delete" @click="deleteGoods(good)">🗑️</text>
				</view>
			</view>
		</view>

		<view class="empty-state" v-if="filteredGoods.length === 0">
			<text class="empty-icon">📦</text>
			<text class="empty-text">暂无商品</text>
		</view>

		<view class="modal-overlay" v-if="showAddModal" @click="closeModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">{{ editingGoods ? '编辑商品' : '新增商品' }}</text>
					<text class="modal-close" @click="closeModal">✕</text>
				</view>
				<view class="modal-body">
					<view class="form-item">
						<text class="form-label">商品图片</text>
						<view class="image-upload" @click="chooseImage">
							<image v-if="uploadedImage" class="uploaded-img" :src="uploadedImage" mode="aspectFill" />
							<view v-else class="upload-placeholder">
								<text class="upload-icon">📷</text>
								<text class="upload-text">点击上传图片</text>
							</view>
						</view>
					</view>
					<view class="form-item">
						<text class="form-label">商品名称</text>
						<input class="form-input" v-model="formData.name" placeholder="请输入商品名称" />
					</view>
					<view class="form-item">
						<text class="form-label">商品描述</text>
						<textarea class="form-textarea" v-model="formData.description" placeholder="请输入商品描述"></textarea>
					</view>
					<view class="form-item">
						<text class="form-label">商品分类</text>
						<CustomPicker 
							:options="categories" 
							v-model="categoryIndex" 
							:title="'选择商品分类'" 
							:placeholder="'请选择分类'"
							:auto-select-first="false"
							label-field="name"
							value-field="id"
							@change="onCategoryChange"
						/>
					</view>
					<view class="form-item">
						<text class="form-label">商品价格</text>
						<input class="form-input" type="number" v-model="formData.price" placeholder="请输入商品价格" />
					</view>
					<view class="form-item">
						<text class="form-label">所需积分</text>
						<input class="form-input" type="number" v-model="formData.points" placeholder="请输入所需积分" />
					</view>
					<view class="form-item">
						<text class="form-label">库存数量</text>
						<input class="form-input" type="number" v-model="formData.stock" placeholder="请输入库存数量" />
					</view>
					<view class="form-item">
						<text class="form-label">商品状态</text>
						<CustomPicker 
							:options="giftStatuses" 
							v-model="statusIndex" 
							:title="'选择商品状态'" 
							:placeholder="'请选择状态'"
							:auto-select-first="false"
							label-field="name"
							value-field="id"
							@change="onStatusChange"
						/>
					</view>
				</view>
				<view class="modal-footer">
					<button class="btn btn-secondary" @click="closeModal">取消</button>
					<button class="btn btn-primary" @click="saveGoods">保存</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { feishuRequest } from '@/common/feishu-request.js'
	import CacheManager from '@/common/cache-manager.js'
	import CustomPicker from '@/components/CustomPicker.vue'
	export default {
		components: { CustomPicker },
		data() {
			return {
				goods: [],
				categories: [
					{ id: '玩具', name: '玩具' },
					{ id: '图书', name: '图书' },
					{ id: '文具', name: '文具' },
					{ id: '运动', name: '运动' },
					{ id: '美术', name: '美术' },
					{ id: '学习', name: '学习' }
				],
				categoryNames: ['玩具', '图书', '文具', '运动', '美术', '学习'],
				giftStatuses: [
					{ id: '开启', name: '开启' },
					{ id: '关闭', name: '关闭' }
				],
				statusNames: ['开启', '关闭'],
				currentCategory: 'all',
				searchKeyword: '',
				showAddModal: false,
				editingGoods: null,
				formData: {
					name: '',
					description: '',
					category: '',
					price: '',
					points: '',
					stock: '',
					status: ''
				},
				categoryIndex: -1,
				statusIndex: -1,
				uploadedImage: '',
				imageFileToken: ''
			}
		},
		computed: {
			filteredGoods() {
				let result = this.goods
				if (this.searchKeyword.trim()) {
					const keyword = this.searchKeyword.toLowerCase()
					result = result.filter(g => g.name.toLowerCase().includes(keyword))
				}
				return result
			}
		},
		methods: {
			goBack() {
				uni.navigateBack()
			},
			getGoodsIcon(category) {
				const icons = {
					toy: '🧸',
					book: '📚',
					stationery: '✏️',
					sports: '⚽',
					art: '🎨',
					learning: '📖',
					default: '🎁'
				}
				return icons[category] || icons.default
			},
			getCategoryName(categoryId) {
				const cat = this.categories.find(c => c.id === categoryId)
				return cat ? cat.name : categoryId
			},
			getStockClass(stock) {
				if (stock <= 0) return 'empty'
				if (stock < 10) return 'low'
				return 'normal'
			},
			setCategory(categoryId) {
				this.currentCategory = categoryId
				this.loadGoods(categoryId)
			},
			searchGoods() {
				this.loadGoods()
			},
			editGoods(good) {
				this.editingGoods = good
				this.formData = {
					name: good.name,
					description: good.description,
					category: good.category,
					price: good.price.toString(),
					points: good.points.toString(),
					stock: good.stock.toString(),
					status: good.status
				}
				this.categoryIndex = this.categories.findIndex(c => c.id === good.category || c.name === good.category)
				this.statusIndex = this.giftStatuses.findIndex(s => s.id === good.status || s.name === good.status)
				this.showAddModal = true
			},
			deleteGoods(good) {
				uni.showModal({
					title: '确认删除',
					content: `确定要删除商品 "${good.name}" 吗？`,
					success: async (res) => {
						if (res.confirm) {
							uni.showLoading({ title: '删除中...' })
							try {
								const result = await feishuRequest.deleteRecord('礼品表', good.id)
								if (result.success) {
									this.goods = this.goods.filter(g => g.id !== good.id)
									uni.showToast({ title: '删除成功', icon: 'success' })
								} else {
									uni.showToast({ title: '删除失败', icon: 'none' })
								}
							} catch (error) {
								console.error('[Goods] 删除商品失败:', error)
								uni.showToast({ title: '删除失败', icon: 'none' })
							}
							uni.hideLoading()
						}
					}
				})
			},
			onCategoryChange(index, option) {
				this.categoryIndex = index
				this.formData.category = option ? option.id : ''
			},
			onStatusChange(index, option) {
				this.statusIndex = index
				this.formData.status = option ? option.id : ''
			},
			closeModal() {
				this.showAddModal = false
				this.editingGoods = null
				this.formData = {
					name: '',
					description: '',
					category: '',
					price: '',
					points: '',
					stock: '',
					status: ''
				}
				this.categoryIndex = -1
				this.statusIndex = -1
				this.uploadedImage = ''
				this.imageFileToken = ''
			},
			chooseImage() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						this.uploadedImage = res.tempFilePaths[0]
						console.log('[Goods] 选择图片成功:', this.uploadedImage)
					},
					fail: (err) => {
						console.error('[Goods] 选择图片失败:', err)
						uni.showToast({ title: '选择图片失败', icon: 'none' })
					}
				})
			},
			async saveGoods() {
				if (!this.formData.name || !this.formData.category || !this.formData.points || !this.formData.stock) {
					uni.showToast({ title: '请填写完整信息', icon: 'none' })
					return
				}

				uni.showLoading({ title: '保存中...' })

				const goodsData = {
					name: this.formData.name,
					description: this.formData.description,
					category: this.formData.category,
					price: parseInt(this.formData.price) || 0,
					points: parseInt(this.formData.points) || 0,
					stock: parseInt(this.formData.stock) || 0,
					status: this.formData.status || '开启'
				}

				try {
					if (this.editingGoods) {
						const result = await feishuRequest.updateRecord('礼品表', this.editingGoods.id, goodsData)
						if (result.success) {
							const index = this.goods.findIndex(g => g.id === this.editingGoods.id)
							if (index >= 0) {
								this.goods[index] = { ...this.goods[index], ...goodsData }
							}
							uni.showToast({ title: '修改成功', icon: 'success' })
						} else {
							uni.showToast({ title: '修改失败', icon: 'none' })
						}
					} else {
						const result = await feishuRequest.addRecord('礼品表', goodsData)
						if (result.success) {
							this.goods.unshift({
								id: result.recordId,
								...goodsData
							})
							uni.showToast({ title: '创建成功', icon: 'success' })
						} else {
							uni.showToast({ title: '创建失败', icon: 'none' })
						}
					}
				} catch (error) {
					console.error('[Goods] 保存商品失败:', error)
					uni.showToast({ title: '保存失败', icon: 'none' })
				}

				uni.hideLoading()
				this.closeModal()
			},
			async loadCategories() {
				try {
					const categoryCacheKey = 'gift_category'
					const statusCacheKey = 'gift_status'
					
					let cachedCategories = CacheManager.getCache(categoryCacheKey)
					let cachedStatuses = CacheManager.getCache(statusCacheKey)
					
					console.log('[Goods] 缓存数据:', cachedCategories, cachedStatuses)

					if (cachedCategories && Array.isArray(cachedCategories)) {
						this.categories = cachedCategories.map(item => ({
							id: item.value,
							name: item.label
						}))
						console.log('[Goods] 使用缓存的礼品分类数据:', this.categories)
					}
					
					if (cachedStatuses && Array.isArray(cachedStatuses)) {
						this.giftStatuses = cachedStatuses.map(item => ({
							id: item.value,
							name: item.label
						}))
						console.log('[Goods] 使用缓存的状态数据:', this.giftStatuses)
					}
					
					if (!this.categories.length || !this.giftStatuses.length) {
						console.log('[Goods] 从飞书多维表格加载分类和状态数据')
						const result = await feishuRequest.queryRecords('分类表')
						
						if (result.success && result.data && result.data.length > 0) {
							const item = result.data[0]
							
							if (!this.categories.length && item.fields.gift_category && Array.isArray(item.fields.gift_category)) {
								this.categories = item.fields.gift_category.map(cat => ({
									id: cat.value,
									name: cat.label
								}))
								CacheManager.setCache(categoryCacheKey, item.fields.gift_category)
							}
							
							if (!this.giftStatuses.length && item.fields.book_status && Array.isArray(item.fields.book_status)) {
								this.giftStatuses = item.fields.book_status.map(status => ({
									id: status.value,
									name: status.label
								}))
								CacheManager.setCache(statusCacheKey, item.fields.book_status)
							}
						}
					}
					
					this.categoryNames = this.categories.map(c => c.name)
					this.statusNames = this.giftStatuses.map(s => s.name)
				} catch (error) {
					console.error('[Goods] 加载分类失败:', error)
				}
			},
			async loadGoods(category = 'all') {
				uni.showLoading({ title: '加载中...' })
				try {
					let filter = {}
					if (category !== 'all') {
						filter = { category: category }
					}
					const result = await feishuRequest.queryRecords('礼品表', filter)
					if (result.success && result.data && result.data.length > 0) {
						const goodsWithFileToken = result.data.map(item => {
							const name = item.fields.name 
								? (Array.isArray(item.fields.name) && item.fields.name[0] && item.fields.name[0].text 
									? item.fields.name[0].text 
									: item.fields.name)
								: ''
							const description = item.fields.description 
								? (Array.isArray(item.fields.description) && item.fields.description[0] && item.fields.description[0].text 
									? item.fields.description[0].text 
									: item.fields.description)
								: ''
							return {
								id: item.record_id,
								name: name,
								description: description,
								category: item.fields.category || '',
								price: item.fields.price || 0,
								points: item.fields.points || 0,
								stock: item.fields.stock || 0,
								status: item.fields.status || '开启',
								fileToken: item.fields.image ? (item.fields.image[0]?.file_token || '') : ''
							}
						})
						
						this.goods = goodsWithFileToken
						
						const fileTokens = goodsWithFileToken
							.filter(good => good.fileToken)
							.map(good => good.fileToken)
						
						if (fileTokens.length > 0) {
							await this.fetchImageUrls(fileTokens)
						}
					} else {
						this.goods = []
					}
				} catch (error) {
					console.error('[Goods] 加载商品列表失败:', error)
					this.goods = []
				}
				uni.hideLoading()
			},
			async fetchImageUrls(fileTokens) {
				try {
					await feishuRequest.initCloudObject()
					const result = await feishuRequest.feishutools.getImageUrls({
						fileTokens: fileTokens
					})
					
					if (result.success && result.urlMap) {
						this.goods.forEach(good => {
							if (good.fileToken && result.urlMap[good.fileToken]) {
								good.image = result.urlMap[good.fileToken]
							}
						})
					}
				} catch (error) {
					console.error('[Goods] 获取图片URL失败:', error)
				}
			}
		},
		async onLoad() {
			await this.loadCategories()
			await this.loadGoods()
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		min-height: 100vh;
		background-color: #f5f5f5;
		padding-bottom: 40rpx;
	}

	.header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 80rpx 30rpx 40rpx;
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
		width: 120rpx;
	}

	.add-btn {
		height: 60rpx;
		padding: 0 20rpx;
		border-radius: 30rpx;
		font-size: 26rpx;
		background-color: rgba(255, 255, 255, 0.2);
		color: #fff;
		border: none;
	}

	.search-bar {
		display: flex;
		gap: 15rpx;
		padding: 20rpx;
		background-color: #fff;
	}

	.search-input {
		flex: 1;
		height: 70rpx;
		padding: 0 20rpx;
		border: 2rpx solid #e8e8e8;
		border-radius: 35rpx;
		font-size: 26rpx;
	}

	.search-btn {
		height: 70rpx;
		padding: 0 30rpx;
		border-radius: 35rpx;
		font-size: 26rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		border: none;
	}

	.filter-bar {
		display: flex;
		gap: 10rpx;
		padding: 20rpx;
		background-color: #fff;
		overflow-x: auto;
	}

	.filter-btn {
		flex-shrink: 0;
		height: 60rpx;
		padding: 0 25rpx;
		border-radius: 30rpx;
		font-size: 24rpx;
		border: 2rpx solid #e8e8e8;
		background-color: #fff;
		color: #666;

		&.active {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: #fff;
			border: none;
		}
	}

	.goods-list {
		padding: 20rpx;
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}

	.goods-card {
		display: flex;
		align-items: center;
		padding: 20rpx;
		background-color: #fff;
		border-radius: 16rpx;
	}

	.goods-image {
		width: 100rpx;
		height: 100rpx;
		background-color: #f5f5f5;
		border-radius: 12rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 20rpx;
	}

	.goods-icon {
		font-size: 50rpx;
	}
	
	.goods-img {
		width: 100%;
		height: 100%;
		border-radius: 12rpx;
	}

	.goods-info {
		flex: 1;
	}

	.goods-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10rpx;
	}

	.goods-name {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
	}

	.goods-category {
		font-size: 22rpx;
		padding: 4rpx 12rpx;
		background-color: #e8eaf6;
		color: #667eea;
		border-radius: 8rpx;
	}

	.goods-desc {
		font-size: 24rpx;
		color: #999;
		display: block;
		margin-bottom: 10rpx;
	}

	.goods-footer {
		display: flex;
		gap: 15rpx;
		align-items: center;
	}

	.goods-price {
		font-size: 28rpx;
		font-weight: bold;
		color: #f44336;
	}

	.goods-points {
		font-size: 24rpx;
		color: #667eea;
	}

	.goods-stock {
		font-size: 22rpx;
		color: #4caf50;
		padding: 4rpx 12rpx;
		background-color: #e8f5e9;
		border-radius: 8rpx;

		&.low {
			color: #ff9500;
			background-color: #fff3e0;
		}

		&.empty {
			color: #f44336;
			background-color: #ffebee;
		}
	}

	.goods-actions {
		display: flex;
		flex-direction: column;
		gap: 10rpx;
		margin-left: 15rpx;
	}

	.action-btn {
		width: 50rpx;
		height: 50rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		font-size: 24rpx;

		&.edit {
			background-color: #e3f2fd;
		}

		&.delete {
			background-color: #ffebee;
		}
	}

	.empty-state {
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
		max-height: 80vh;
		overflow-y: auto;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
		position: sticky;
		top: 0;
		background-color: #fff;
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

	.form-item {
		margin-bottom: 25rpx;
	}

	.form-label {
		font-size: 26rpx;
		color: #666;
		display: block;
		margin-bottom: 10rpx;
	}

	.form-input {
		width: 100%;
		height: 80rpx;
		padding: 0 20rpx;
		border: 2rpx solid #e8e8e8;
		border-radius: 10rpx;
		font-size: 28rpx;
		box-sizing: border-box;
	}

	.form-textarea {
		width: 100%;
		height: 150rpx;
		padding: 20rpx;
		border: 2rpx solid #e8e8e8;
		border-radius: 10rpx;
		font-size: 28rpx;
		box-sizing: border-box;
	}

	.form-picker {
		width: 100%;
		height: 80rpx;
		padding: 0 20rpx;
		border: 2rpx solid #e8e8e8;
		border-radius: 10rpx;
		font-size: 28rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		color: #333;
	}

	.picker-arrow {
		font-size: 32rpx;
		color: #999;
	}

	.modal-footer {
		display: flex;
		gap: 20rpx;
		padding: 20rpx 30rpx 30rpx;
		position: sticky;
		bottom: 0;
		background-color: #fff;
	}

	.btn {
		flex: 1;
		height: 80rpx;
		border-radius: 40rpx;
		font-size: 30rpx;
		border: none;

		&.btn-primary {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: #fff;
		}

		&.btn-secondary {
			background-color: #f0f0f0;
			color: #333;
		}
	}

	.image-upload {
		width: 100%;
		height: 200rpx;
		border: 2rpx dashed #e8e8e8;
		border-radius: 10rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.uploaded-img {
		width: 100%;
		height: 100%;
		border-radius: 10rpx;
	}

	.upload-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.upload-icon {
		font-size: 50rpx;
		margin-bottom: 10rpx;
	}

	.upload-text {
		font-size: 26rpx;
		color: #999;
	}
</style>
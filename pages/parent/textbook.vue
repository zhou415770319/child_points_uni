<template>
	<view class="container">
		<view class="header">
			<text class="header-title">📚 教材管理</text>
			<button class="add-btn" @click="showAddModal = true">+ 添加教材</button>
		</view>

		<view class="filter-section">
			<view class="filter-item">
				<text class="filter-label">儿童：</text>
				<picker :value="childIndex" :range="childNames" @change="onChildChange">
					<view class="filter-picker">
						{{ currentChildName || '全部' }}
						<text class="picker-arrow">›</text>
					</view>
				</picker>
			</view>
		</view>

		<view class="toolbar">
			<button class="toolbar-btn" :class="{ active: currentFilter === 'all' }" @click="setFilter('all')">全部</button>
			<button class="toolbar-btn" :class="{ active: currentFilter === '语文' }" @click="setFilter('语文')">语文</button>
			<button class="toolbar-btn" :class="{ active: currentFilter === '数学' }" @click="setFilter('数学')">数学</button>
			<button class="toolbar-btn" :class="{ active: currentFilter === '英语' }" @click="setFilter('英语')">英语</button>
		</view>

		<view class="book-list">
			<view class="book-card" v-for="book in filteredBooks" :key="book.id" @click="showBookDetail(book)">
				<view class="book-cover">
					<image v-if="book.image" class="book-img" :src="book.image" mode="aspectFill" />
					<text v-else class="book-icon">{{ book.icon }}</text>
				</view>
				<view class="book-info">
					<view class="book-header">
						<text class="book-title">{{ book.name }}</text>
						<text class="book-status" :class="book.status">{{ book.status || '关闭' }}</text>
					</view>
					<text class="book-child" v-if="book.child_name">{{ book.child_name }}</text>
					<text class="book-subject">{{ book.subject }}</text>
					<view class="book-meta">
						<text class="meta-item">📖 {{ book.total_pages }}页</text>
						<text class="meta-item" v-if="book.pages_per_task">每任务{{ book.pages_per_task }}页</text>
					</view>
				</view>
				<view class="book-progress">
					<view class="progress-bar">
						<view class="progress-fill" :style="{ width: book.progress + '%' }"></view>
					</view>
					<text class="progress-text">{{ book.current_page || 0 }}/{{ book.total_pages || 0 }}</text>
				</view>
				<view class="book-actions">
					<text class="action-btn edit" :class="{ disabled: book.status === '开启' }" @click.stop="editBook(book)">✏️</text>
					<text class="action-btn toggle" @click.stop="toggleBookStatus(book)">{{ book.status === '开启' ? '⏸️' : '▶️' }}</text>
				</view>
			</view>
		</view>

		<view class="quick-actions">
			<view class="quick-card" @click="importBook">
				<text class="quick-icon">📥</text>
				<text class="quick-title">导入教材</text>
				<text class="quick-desc">从文件导入教材内容</text>
			</view>
			<view class="quick-card" @click="createBook">
				<text class="quick-icon">✏️</text>
				<text class="quick-title">创建教材</text>
				<text class="quick-desc">手动创建新教材</text>
			</view>
		</view>

		<view class="modal-overlay" v-if="showAddModal" @click="closeModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">{{ editingBook ? '编辑教材' : '添加教材' }}</text>
					<text class="modal-close" @click="closeModal">✕</text>
				</view>
				<view class="modal-body">
					<!-- 教材图片上传功能暂未启用
					<view class="form-item">
						<text class="form-label">教材图片</text>
						<view class="image-upload" @click="chooseImage">
							<image v-if="uploadedImage" class="uploaded-img" :src="uploadedImage" mode="aspectFill" />
							<view v-else class="upload-placeholder">
								<text class="upload-icon">📷</text>
								<text class="upload-text">点击上传图片</text>
							</view>
						</view>
					</view> -->
					<view class="form-item">
						<text class="form-label">教材名称</text>
						<input class="form-input" v-model="formData.name" placeholder="请输入教材名称" />
					</view>
					<view class="form-item">
						<text class="form-label">绑定儿童</text>
						<CustomPicker 
							:options="childOptions" 
							v-model="formChildIndex" 
							:title="'选择儿童'" 
							:placeholder="'请选择儿童'"
							:auto-select-first="false"
							label-field="name"
							value-field="id"
							@change="onFormChildChange"
						/>
					</view>
					<view class="form-item">
						<text class="form-label">科目</text>
						<CustomPicker 
							:options="subjectOptions" 
							v-model="formSubjectIndex" 
							:title="'选择科目'" 
							:placeholder="'请选择科目'"
							:auto-select-first="false"
							label-field="name"
							value-field="id"
							@change="onFormSubjectChange"
						/>
					</view>
					<view class="form-item">
						<text class="form-label">总页数</text>
						<input class="form-input" type="number" v-model="formData.total_pages" placeholder="请输入总页数" />
					</view>
					<view class="form-item">
						<text class="form-label">当前学到页数</text>
						<input class="form-input" type="number" v-model="formData.current_page" placeholder="当前学习进度" />
					</view>
					<view class="form-item">
						<text class="form-label">每任务页数</text>
						<input class="form-input" type="number" v-model="formData.pages_per_task" placeholder="每次任务学习页数" />
					</view>
					<view class="form-item">
						<text class="form-label">资源链接</text>
						<input class="form-input" v-model="formData.resource_url" placeholder="绑定相关资源地址，如纪录片、视频链接等" />
					</view>
				</view>
				<view class="modal-footer">
					<button class="btn btn-secondary" @click="closeModal">取消</button>
					<button class="btn btn-primary" @click="saveBook">保存</button>
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
				books: [],
				currentFilter: 'all',
				selectedChildId: '',
				childIndex: -1,
				children: [],
				subjectList: [],
				showAddModal: false,
				editingBook: null,
				formData: {
					name: '',
					child_id: '',
					subject: '',
					total_pages: '',
					current_page: '',
					pages_per_task: '',
					resource_url: '',
					image: '',
					status: '开启'
				},
				formChildIndex: -1,
				formSubjectIndex: -1,
				// uploadedImage: '',
				// imageFileToken: ''
			}
		},
		computed: {
			childNames() {
				return ['全部', ...this.children.map(c => c.name)]
			},
			childOptions() {
				return this.children.map(c => ({ id: c.child_id, name: c.name }))
			},
			subjectOptions() {
				return this.subjectList.map(s => ({ id: s, name: s }))
			},
			currentChildName() {
				if (this.childIndex <= 0) return ''
				return this.children[this.childIndex - 1]?.name || ''
			},
			filteredBooks() {
				let result = this.books
				
				if (this.selectedChildId) {
					result = result.filter(book => book.child_id === this.selectedChildId)
				}
				
				if (this.currentFilter !== 'all') {
					result = result.filter(book => book.subject === this.currentFilter)
				}
				
				return result
			}
		},
		onLoad() {
			this.loadChildren()
			this.loadSubjects()
			this.loadBooks()
		},
		methods: {
			async loadChildren() {
				try {
					const cachedChildren = CacheManager.getCache('children')
					if (cachedChildren && cachedChildren.length > 0) {
						this.children = cachedChildren
						return
					}
					
					const result = await feishuRequest.queryRecords('儿童表')
					if (result.success && result.data && result.data.length > 0) {
						this.children = result.data.map(item => {
							const name = this.parseTextField(item.fields.name)
							return {
								id: item.record_id,
								name: name,
								child_id: item.fields.id || item.fields.child_id || item.record_id
							}
						})
						CacheManager.setCache('children', this.children)
					}
				} catch (error) {
					console.error('[Textbook] 加载儿童列表失败:', error)
				}
			},
			async loadSubjects() {
				try {
					const categoryCacheKey = 'categories'
					let cachedCategories = CacheManager.getCache(categoryCacheKey)
					
					if (cachedCategories && Array.isArray(cachedCategories)) {
						console.log('[Textbook] 使用缓存的分类数据')
						const firstItem = cachedCategories[0]
						if (firstItem && firstItem.fields && firstItem.fields.task_type) {
							const taskTypeField = firstItem.fields.task_type
							if (Array.isArray(taskTypeField)) {
								this.subjectList = taskTypeField.map(s => {
									if (typeof s === 'string') return s
									return s.value || s.label || ''
								}).filter(Boolean)
							}
						}
					}
					
					if (!this.subjectList || this.subjectList.length === 0) {
						console.log('[Textbook] 从飞书多维表格加载分类数据')
						const result = await feishuRequest.queryRecords('分类表')
						if (result.success && result.data && result.data.length > 0) {
							const item = result.data[0]
							CacheManager.setCache(categoryCacheKey, result.data)
							
							if (item.fields.task_type) {
								const taskTypeField = item.fields.task_type
								if (Array.isArray(taskTypeField)) {
									this.subjectList = taskTypeField.map(s => {
										if (typeof s === 'string') return s
										return s.value || s.label || ''
									}).filter(Boolean)
								}
							}
						}
					}
					
					if (!this.subjectList || this.subjectList.length === 0) {
						this.subjectList = ['语文', '数学', '英语', '科学', '美术', '音乐']
					}
				} catch (error) {
					console.error('[Textbook] 加载科目列表失败:', error)
					this.subjectList = ['语文', '数学', '英语', '科学', '美术', '音乐']
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
			normalizeChildId(field) {
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
			setFilter(filter) {
				this.currentFilter = filter
			},
			onChildChange(e) {
				this.childIndex = e.detail.value
				if (this.childIndex === 0) {
					this.selectedChildId = ''
				} else {
					const child = this.children[this.childIndex - 1]
					this.selectedChildId = child?.child_id || ''
				}
			},
			onFormChildChange(index, option) {
				this.formChildIndex = index
				this.formData.child_id = option ? option.id : ''
			},
			onFormSubjectChange(index, option) {
				this.formSubjectIndex = index
				this.formData.subject = option ? option.id : ''
			},
			/* 教材图片上传功能暂未启用
			chooseImage() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						this.uploadedImage = res.tempFilePaths[0]
						console.log('[Textbook] 选择图片成功:', this.uploadedImage)
						this.uploadImageToFeishu(res.tempFilePaths[0])
					},
					fail: (err) => {
						console.error('[Textbook] 选择图片失败:', err)
						uni.showToast({ title: '选择图片失败', icon: 'none' })
					}
				})
			},
			async uploadImageToFeishu(filePath) {
				uni.showLoading({ title: '上传图片中...' })
				try {
					const result = await feishuRequest.uploadFile(filePath)
					if (result.success) {
						this.imageFileToken = result.fileToken
						console.log('[Textbook] 图片上传成功，token:', this.imageFileToken)
					} else {
						console.error('[Textbook] 图片上传失败:', result)
						uni.showToast({ title: '图片上传失败', icon: 'none' })
					}
				} catch (error) {
					console.error('[Textbook] 图片上传异常:', error)
					uni.showToast({ title: '图片上传失败', icon: 'none' })
				}
				uni.hideLoading()
			},
			*/
			async loadBooks() {
				uni.showLoading({ title: '加载中...' })
				try {
					const result = await feishuRequest.queryRecords('教材表')
					if (result.success && result.data && result.data.length > 0) {
						this.books = result.data.map(item => {
							const name = this.parseTextField(item.fields.name)
							const childId = this.normalizeChildId(item.fields.child_id)
							const child = this.children.find(c => c.child_id === childId)
							const totalPages = item.fields.total_pages || 0
							const currentPage = item.fields.current_page || 0
							const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0
							
							return {
								id: item.record_id,
								name: name,
								child_id: childId,
								child_name: child?.name || '',
								subject: item.fields.subject || '',
								total_pages: totalPages,
								current_page: currentPage,
								pages_per_task: item.fields.pages_per_task || 0,
								resource_url: item.fields.resource_url || '',
								status: item.fields.status || '',
								progress: progress,
								icon: this.getSubjectIcon(item.fields.subject),
								image: item.fields.image || ''
							}
						})
					} else {
						this.books = []
					}
				} catch (error) {
					console.error('[Textbook] 加载教材失败:', error)
					this.books = []
				}
				uni.hideLoading()
			},
			getSubjectIcon(subject) {
				const icons = {
					'语文': '📖',
					'数学': '🧮',
					'英语': '🔤',
					'科学': '🔬',
					'美术': '🎨',
					'音乐': '🎵'
				}
				return icons[subject] || '📚'
			},
			showBookDetail(book) {
				uni.showToast({ title: `查看 ${book.name}`, icon: 'none' })
			},
			editBook(book) {
				if (book.status === '开启') {
					uni.showToast({ title: '开启状态的教材不可修改', icon: 'none' })
					return
				}
				
				this.editingBook = book
				this.formData = {
					name: book.name,
					child_id: book.child_id,
					subject: book.subject,
					total_pages: book.total_pages.toString(),
					current_page: book.current_page.toString(),
					pages_per_task: book.pages_per_task.toString(),
					resource_url: book.resource_url || '',
					image: book.image,
					status: book.status
				}
				
				this.formChildIndex = this.children.findIndex(c => c.child_id === book.child_id)
				this.formSubjectIndex = this.subjectList.findIndex(s => s === book.subject)
				// this.uploadedImage = book.image
				this.showAddModal = true
			},
			async toggleBookStatus(book) {
				const newStatus = book.status === '开启' ? '关闭' : '开启'
				const statusText = newStatus === '开启' ? '开启' : '关闭'
				
				uni.showModal({
					title: '确认' + statusText,
					content: `确定要${statusText}教材「${book.name}」吗？`,
					success: async (res) => {
						if (res.confirm) {
							uni.showLoading({ title: statusText + '中...' })
							try {
								const result = await feishuRequest.updateRecord('教材表', book.id, { status: newStatus })
								if (result.success) {
									const index = this.books.findIndex(b => b.id === book.id)
									if (index >= 0) {
										this.books[index].status = newStatus
									}
									uni.showToast({ title: statusText + '成功', icon: 'success' })
								} else {
									uni.showToast({ title: statusText + '失败', icon: 'none' })
								}
							} catch (error) {
								console.error('[Textbook] 更新教材状态失败:', error)
								uni.showToast({ title: statusText + '失败', icon: 'none' })
							}
							uni.hideLoading()
						}
					}
				})
			},
			closeModal() {
				this.showAddModal = false
				this.editingBook = null
				this.formData = { 
					name: '', 
					child_id: '', 
					subject: '', 
					total_pages: '', 
					current_page: '',
					pages_per_task: '', 
					resource_url: '',
					image: '',
					status: '开启'
				}
				this.formChildIndex = -1
				this.formSubjectIndex = -1
				// this.uploadedImage = ''
				// this.imageFileToken = ''
			},
			async saveBook() {
				if (!this.formData.name || !this.formData.subject) {
					uni.showToast({ title: '请填写完整信息', icon: 'none' })
					return
				}

				uni.showLoading({ title: '保存中...' })

				const bookData = {
					name: this.formData.name,
					child_id: this.formData.child_id,
					subject: this.formData.subject,
					total_pages: parseInt(this.formData.total_pages) || 0,
					current_page: parseInt(this.formData.current_page) || 0,
					pages_per_task: parseFloat(this.formData.pages_per_task) || 0,
					resource_url: this.formData.resource_url || '',
					status: this.formData.status || '开启'
					// image: this.imageFileToken || ''
				}

				try {
					if (this.editingBook) {
						const result = await feishuRequest.updateRecord('教材表', this.editingBook.id, bookData)
						if (result.success) {
							const index = this.books.findIndex(b => b.id === this.editingBook.id)
							if (index >= 0) {
								this.books[index] = {
									...this.books[index],
									...bookData,
									child_name: this.children.find(c => c.child_id === bookData.child_id)?.name || ''
								}
							}
							uni.showToast({ title: '修改成功', icon: 'success' })
						} else {
							uni.showToast({ title: '修改失败', icon: 'none' })
						}
					} else {
						const result = await feishuRequest.addRecord('教材表', bookData)
						if (result.success) {
							this.books.unshift({
								id: result.recordId,
								...bookData,
								child_name: this.children.find(c => c.child_id === bookData.child_id)?.name || '',
								progress: 0,
								icon: this.getSubjectIcon(bookData.subject)
							})
							uni.showToast({ title: '添加成功', icon: 'success' })
						} else {
							uni.showToast({ title: '添加失败', icon: 'none' })
						}
					}
				} catch (error) {
					console.error('[Textbook] 保存教材失败:', error)
					uni.showToast({ title: '保存失败', icon: 'none' })
				}

				uni.hideLoading()
				this.closeModal()
			},
			importBook() {
				uni.showToast({ title: '导入教材功能开发中', icon: 'none' })
			},
			createBook() {
				this.showAddModal = true
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
		background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
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

	.add-btn {
		height: 60rpx;
		padding: 0 25rpx;
		border-radius: 30rpx;
		font-size: 26rpx;
		background-color: rgba(255, 255, 255, 0.2);
		color: #fff;
		border: none;
	}

	.filter-section {
		background-color: #fff;
		padding: 20rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.filter-item {
		display: flex;
		align-items: center;
	}

	.filter-label {
		font-size: 28rpx;
		color: #333;
		margin-right: 10rpx;
	}

	.filter-picker {
		flex: 1;
		height: 70rpx;
		padding: 0 20rpx;
		border: 2rpx solid #e8e8e8;
		border-radius: 35rpx;
		font-size: 26rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		color: #333;
	}

	.toolbar {
		display: flex;
		background-color: #fff;
		padding: 20rpx;
		gap: 10rpx;
	}

	.toolbar-btn {
		flex: 1;
		height: 70rpx;
		border-radius: 35rpx;
		font-size: 26rpx;
		border: 2rpx solid #e8e8e8;
		background-color: #fff;
		color: #666;

		&.active {
			background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
			color: #fff;
			border: none;
		}
	}

	.book-list {
		padding: 20rpx;
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.book-card {
		background-color: #fff;
		border-radius: 16rpx;
		padding: 25rpx;
		display: flex;
	}

	.book-cover {
		width: 100rpx;
		height: 140rpx;
		background-color: #f5f5f5;
		border-radius: 12rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 20rpx;
		overflow: hidden;
	}

	.book-img {
		width: 100%;
		height: 100%;
	}

	.book-icon {
		font-size: 50rpx;
	}

	.book-info {
		flex: 1;
	}

	.book-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8rpx;
	}

	.book-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
	}

	.book-status {
		font-size: 20rpx;
		padding: 4rpx 12rpx;
		border-radius: 8rpx;
		
		&.开启 {
			background-color: #e8f5e9;
			color: #4caf50;
		}
		
		&.关闭 {
			background-color: #fff3e0;
			color: #ff9800;
		}
	}

	.book-child {
		font-size: 24rpx;
		color: #667eea;
		display: block;
		margin-bottom: 8rpx;
	}

	.book-subject {
		font-size: 22rpx;
		padding: 4rpx 12rpx;
		background-color: #e8f5e9;
		color: #4caf50;
		border-radius: 8rpx;
		display: inline-block;
		margin-bottom: 15rpx;
	}

	.book-meta {
		display: flex;
		gap: 20rpx;
	}

	.meta-item {
		font-size: 22rpx;
		color: #666;
	}

	.book-progress {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		justify-content: center;
		gap: 10rpx;
	}

	.progress-bar {
		width: 80rpx;
		height: 12rpx;
		background-color: #f0f0f0;
		border-radius: 6rpx;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #4caf50 0%, #8bc34a 100%);
		border-radius: 6rpx;
	}

	.progress-text {
		font-size: 22rpx;
		color: #4caf50;
		font-weight: bold;
	}

	.book-actions {
		display: flex;
		flex-direction: column;
		gap: 10rpx;
		padding-left: 20rpx;
	}

	.action-btn {
		font-size: 36rpx;
		padding: 10rpx;
		border-radius: 10rpx;
		background-color: #f5f5f5;
		
		&.edit.disabled {
			opacity: 0.4;
			pointer-events: none;
		}
		
		&:active {
			background-color: #e8e8e8;
		}
	}

	.quick-actions {
		display: flex;
		padding: 0 20rpx;
		gap: 20rpx;
	}

	.quick-card {
		flex: 1;
		background-color: #fff;
		border-radius: 16rpx;
		padding: 30rpx;
		text-align: center;
	}

	.quick-icon {
		font-size: 50rpx;
		display: block;
		margin-bottom: 15rpx;
	}

	.quick-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 8rpx;
	}

	.quick-desc {
		font-size: 22rpx;
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
			background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
			color: #fff;
		}

		&.btn-secondary {
			background-color: #f0f0f0;
			color: #333;
		}
	}
</style>
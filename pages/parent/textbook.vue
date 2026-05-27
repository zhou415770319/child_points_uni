<template>
	<view class="container">
		<view class="header">
			<text class="header-title">📚 教材管理</text>
			<button class="add-btn" @click="showAddModal = true">+ 添加教材</button>
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
					<text class="book-icon">{{ book.icon }}</text>
				</view>
				<view class="book-info">
					<text class="book-title">{{ book.title }}</text>
					<text class="book-author">{{ book.author }}</text>
					<text class="book-subject">{{ book.subject }}</text>
					<view class="book-meta">
						<text class="meta-item">📖 {{ book.chapters }}章</text>
						<text class="meta-item">{{ book.status }}</text>
					</view>
				</view>
				<view class="book-progress">
					<view class="progress-bar">
						<view class="progress-fill" :style="{ width: book.progress + '%' }"></view>
					</view>
					<text class="progress-text">{{ book.progress }}%</text>
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
					<view class="form-item">
						<text class="form-label">教材名称</text>
						<input class="form-input" v-model="formData.title" placeholder="请输入教材名称" />
					</view>
					<view class="form-item">
						<text class="form-label">作者</text>
						<input class="form-input" v-model="formData.author" placeholder="请输入作者" />
					</view>
					<view class="form-item">
						<text class="form-label">科目</text>
						<picker :value="subjectIndex" :range="subjects" @change="onSubjectChange">
							<view class="form-picker">
								{{ formData.subject || '请选择科目' }}
								<text class="picker-arrow">›</text>
							</view>
						</picker>
					</view>
					<view class="form-item">
						<text class="form-label">章节数</text>
						<input class="form-input" type="number" v-model="formData.chapters" placeholder="请输入章节数" />
					</view>
					<view class="form-item">
						<text class="form-label">教材简介</text>
						<textarea class="form-textarea" v-model="formData.description" placeholder="请输入教材简介"></textarea>
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
	export default {
		data() {
			return {
				books: [],
				currentFilter: 'all',
				showAddModal: false,
				editingBook: null,
				formData: {
					title: '',
					author: '',
					subject: '',
					chapters: '',
					description: ''
				},
				subjects: ['语文', '数学', '英语', '科学', '美术', '音乐'],
				subjectIndex: 0
			}
		},
		computed: {
			filteredBooks() {
				if (this.currentFilter === 'all') {
					return this.books
				}
				return this.books.filter(book => book.subject === this.currentFilter)
			}
		},
		onLoad() {
			this.loadBooks()
		},
		methods: {
			setFilter(filter) {
				this.currentFilter = filter
			},
			async loadBooks() {
				uni.showLoading({ title: '加载中...' })
				try {
					const result = await feishuRequest.queryRecords('教材表')
					if (result.success && result.data && result.data.length > 0) {
						this.books = result.data.map(item => {
							const title = item.fields.title 
								? (Array.isArray(item.fields.title) && item.fields.title[0] && item.fields.title[0].text 
									? item.fields.title[0].text 
									: item.fields.title)
								: ''
							return {
								id: item.record_id,
								title: title,
								author: item.fields.author || '',
								subject: item.fields.subject || '',
								chapters: item.fields.chapters || 0,
								progress: item.fields.progress || 0,
								status: item.fields.status || '待学习',
								icon: this.getSubjectIcon(item.fields.subject),
								description: item.fields.description || ''
							}
						})
					} else {
						this.books = this.getMockBooks()
					}
				} catch (error) {
					console.error('[Textbook] 加载教材失败:', error)
					this.books = this.getMockBooks()
				}
				uni.hideLoading()
			},
			getMockBooks() {
				return [
					{ id: 1, title: '小学语文三年级上册', author: '人教社', subject: '语文', chapters: 24, progress: 65, status: '学习中', icon: '📖', description: '' },
					{ id: 2, title: '小学数学三年级上册', author: '人教社', subject: '数学', chapters: 12, progress: 80, status: '学习中', icon: '🧮', description: '' },
					{ id: 3, title: '小学英语三年级上册', author: '人教社', subject: '英语', chapters: 10, progress: 45, status: '学习中', icon: '🔤', description: '' },
					{ id: 4, title: '唐诗三百首精选', author: '选编', subject: '语文', chapters: 50, progress: 30, status: '待学习', icon: '📜', description: '' },
					{ id: 5, title: '趣味数学', author: '科普读物', subject: '数学', chapters: 20, progress: 100, status: '已完成', icon: '🌟', description: '' }
				]
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
				uni.showToast({ title: `查看 ${book.title}`, icon: 'none' })
			},
			onSubjectChange(e) {
				this.subjectIndex = e.detail.value
				this.formData.subject = this.subjects[this.subjectIndex]
			},
			closeModal() {
				this.showAddModal = false
				this.editingBook = null
				this.formData = { title: '', author: '', subject: '', chapters: '', description: '' }
				this.subjectIndex = 0
			},
			saveBook() {
				if (!this.formData.title || !this.formData.author || !this.formData.subject) {
					uni.showToast({ title: '请填写完整信息', icon: 'none' })
					return
				}

				if (this.editingBook) {
					const index = this.books.findIndex(b => b.id === this.editingBook.id)
					if (index >= 0) {
						this.books[index] = {
							...this.books[index],
							title: this.formData.title,
							author: this.formData.author,
							subject: this.formData.subject,
							chapters: parseInt(this.formData.chapters) || this.books[index].chapters
						}
					}
					uni.showToast({ title: '修改成功', icon: 'success' })
				} else {
					this.books.unshift({
						id: Date.now(),
						title: this.formData.title,
						author: this.formData.author,
						subject: this.formData.subject,
						chapters: parseInt(this.formData.chapters) || 0,
						progress: 0,
						status: '待学习',
						icon: '📖'
					})
					uni.showToast({ title: '添加成功', icon: 'success' })
				}
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
	}

	.book-icon {
		font-size: 50rpx;
	}

	.book-info {
		flex: 1;
	}

	.book-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 8rpx;
	}

	.book-author {
		font-size: 24rpx;
		color: #999;
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
			background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
			color: #fff;
		}

		&.btn-secondary {
			background-color: #f0f0f0;
			color: #333;
		}
	}
</style>
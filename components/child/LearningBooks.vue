<template>
	<view class="section" v-if="books.length > 0">
		<text class="section-title">📚 正在学习</text>
		<view class="learning-grid">
			<view class="learning-card" v-for="book in books" :key="book.id" @click="goToBookDetail(book)">
				<view class="learning-icon">{{ book.icon }}</view>
				<view class="learning-info">
					<text class="learning-title">{{ book.title }}</text>
					<text class="learning-subject">{{ book.subject }}</text>
					<view class="learning-progress">
						<view class="progress-bar">
							<view class="progress-fill" :style="{ width: book.progress + '%' }"></view>
						</view>
						<text class="progress-text">{{ book.currentPage }}/{{ book.totalPages }} ({{ book.progress }}%)</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	const BOOK_ICONS = {
		'语文': '📖',
		'数学': '📐',
		'英语': '🔤',
		'科学': '🔬',
		'美术': '🎨',
		'音乐': '🎵',
		'体育': '⚽',
		'其他': '📚'
	}

	export default {
		name: 'LearningBooks',
		props: {
			books: {
				type: Array,
				default: () => []
			}
		},
		computed: {
			processedBooks() {
				return this.books.map(book => ({
					...book,
					icon: BOOK_ICONS[book.subject] || BOOK_ICONS['其他']
				}))
			}
		},
		methods: {
			goToBookDetail(book) {
				this.$emit('goToBookDetail', book)
			}
		}
	}
</script>

<style lang="scss" scoped>
	.section {
		padding: 30rpx;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 20rpx;
	}

	.learning-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 16rpx;
	}

	.learning-card {
		display: flex;
		flex-direction: column;
		padding: 20rpx;
		background-color: #fafafa;
		border-radius: 12rpx;
		align-items: center;
		text-align: center;
	}

	.learning-icon {
		font-size: 50rpx;
		margin-bottom: 12rpx;
	}

	.learning-info {
		width: 100%;
	}

	.learning-title {
		font-size: 26rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 8rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.learning-subject {
		font-size: 22rpx;
		color: #999;
		display: block;
		margin-bottom: 12rpx;
	}

	.learning-progress {
		display: flex;
		flex-direction: column;
		gap: 8rpx;
		width: 100%;
	}

	.progress-bar {
		width: 100%;
		height: 12rpx;
		background-color: #e0e0e0;
		border-radius: 6rpx;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
		border-radius: 6rpx;
	}

	.progress-text {
		font-size: 20rpx;
		color: #666;
		text-align: center;
	}
</style>
<template>
	<view class="container">
		<view class="header">
			<text class="back-btn" @click="goBack">‹</text>
			<text class="header-title">任务打卡</text>
			<view class="placeholder"></view>
		</view>

		<view class="task-info">
			<view class="task-icon">{{ taskIcon }}</view>
			<text class="task-title">{{ task.title }}</text>
			<text class="task-points">完成可获得 ⭐ {{ task.points }} 积分</text>
			<text class="task-desc">{{ task.description }}</text>
		</view>

		<view class="section">
			<text class="section-title">📝 打卡内容</text>
			<textarea class="checkin-textarea" v-model="checkinContent" placeholder="请描述你完成任务的过程和收获..."></textarea>
			<view class="word-count">
				<text>{{ checkinContent.length }}/500</text>
			</view>
		</view>

		<view class="section">
			<text class="section-title">📸 上传照片（可选）</text>
			<view class="upload-area">
				<view class="upload-item" v-for="(img, index) in uploadedImages" :key="index">
					<image :src="img" mode="aspectFill" class="upload-image" />
					<text class="remove-btn" @click="removeImage(index)">✕</text>
				</view>
				<view class="upload-btn" @click="uploadImage" v-if="uploadedImages.length < 3">
					<text class="upload-icon">+</text>
					<text class="upload-text">上传</text>
				</view>
			</view>
		</view>

		<view class="section">
			<text class="section-title">⏰ 打卡时间</text>
			<view class="time-display">
				<text class="time-value">{{ currentTime }}</text>
				<text class="time-label">当前时间</text>
			</view>
		</view>

		<view class="ai-preview" v-if="checkinContent">
			<view class="ai-header">
				<text class="ai-icon">🤖</text>
				<text class="ai-title">AI评价预览</text>
			</view>
			<view class="ai-content">
				<text class="ai-text">{{ aiComment }}</text>
				<view class="ai-score">
					<text class="score-label">预估评分</text>
					<text class="score-value">{{ aiScore }}分</text>
				</view>
			</view>
		</view>

		<view class="submit-btn-wrap">
			<button class="submit-btn" :class="{ disabled: !checkinContent.trim() }" @click="submitCheckin">
				提交打卡
			</button>
		</view>

		<custom-tab-bar ref="tabBar"></custom-tab-bar>
	</view>
</template>

<script>
	import customTabBar from '@/custom-tab-bar/index.vue'
	export default {
		components: { customTabBar },
		data() {
			return {
				task: {
					title: '语文阅读30分钟',
					points: 10,
					type: 'reading',
					description: '阅读课外书籍至少30分钟，记录阅读内容和感悟'
				},
				checkinContent: '',
				uploadedImages: [],
				currentTime: '',
				aiComment: '',
				aiScore: 0
			}
		},
		computed: {
			taskIcon() {
				const icons = {
					reading: '📖',
					math: '🧮',
					english: '🔤',
					art: '🎨',
					sports: '⚽',
					default: '📝'
				}
				return icons[this.task.type] || icons.default
			}
		},
		onLoad() {
			this.updateTime()
			setInterval(() => {
				this.updateTime()
			}, 1000)
		},
		onShow() {
			if (this.$refs.tabBar) {
				this.$refs.tabBar.updateSelected('/pages/child/checkin')
			}
		},
		methods: {
			updateTime() {
				const now = new Date()
				this.currentTime = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
			},
			goBack() {
				uni.navigateBack()
			},
			uploadImage() {
				uni.chooseImage({
					count: 3 - this.uploadedImages.length,
					success: (res) => {
						this.uploadedImages = [...this.uploadedImages, ...res.tempFilePaths]
					}
				})
			},
			removeImage(index) {
				this.uploadedImages.splice(index, 1)
			},
			submitCheckin() {
				if (!this.checkinContent.trim()) {
					uni.showToast({ title: '请填写打卡内容', icon: 'none' })
					return
				}

				uni.showLoading({ title: '提交中...' })
				setTimeout(() => {
					this.aiScore = Math.floor(Math.random() * 30) + 70
					this.aiComment = this.checkinContent.length > 50
						? '打卡内容丰富，阅读很认真！继续保持！'
						: '打卡完成，再接再厉！'

					uni.hideLoading()
					uni.showToast({ title: '打卡成功！', icon: 'success' })
					
					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
				}, 1000)
			}
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		min-height: 100vh;
		background-color: #f5f5f5;
		padding-bottom: 160rpx;
	}

	.header {
		background-color: #fff;
		padding: 60rpx 30rpx 20rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.back-btn {
		font-size: 48rpx;
		color: #333;
		padding: 10rpx;
	}

	.header-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.placeholder {
		width: 60rpx;
	}

	.task-info {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 40rpx 30rpx;
		text-align: center;
	}

	.task-icon {
		font-size: 80rpx;
		display: block;
		margin-bottom: 20rpx;
	}

	.task-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #fff;
		display: block;
		margin-bottom: 15rpx;
	}

	.task-points {
		font-size: 26rpx;
		color: #ffd700;
		display: block;
		margin-bottom: 15rpx;
	}

	.task-desc {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.8);
		line-height: 1.6;
	}

	.section {
		background-color: #fff;
		margin: 20rpx;
		border-radius: 16rpx;
		padding: 25rpx;
	}

	.section-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 20rpx;
	}

	.checkin-textarea {
		width: 100%;
		height: 200rpx;
		padding: 20rpx;
		border: 2rpx solid #e8e8e8;
		border-radius: 12rpx;
		font-size: 28rpx;
		box-sizing: border-box;
		background-color: #fafafa;
	}

	.word-count {
		text-align: right;
		margin-top: 10rpx;
		font-size: 24rpx;
		color: #999;
	}

	.upload-area {
		display: flex;
		flex-wrap: wrap;
		gap: 15rpx;
	}

	.upload-item {
		width: calc((100% - 30rpx) / 3);
		height: 180rpx;
		position: relative;
		border-radius: 12rpx;
		overflow: hidden;
	}

	.upload-image {
		width: 100%;
		height: 100%;
	}

	.remove-btn {
		position: absolute;
		top: 8rpx;
		right: 8rpx;
		width: 40rpx;
		height: 40rpx;
		background-color: rgba(0, 0, 0, 0.6);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20rpx;
		color: #fff;
	}

	.upload-btn {
		width: calc((100% - 30rpx) / 3);
		height: 180rpx;
		border: 2rpx dashed #ddd;
		border-radius: 12rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10rpx;
	}

	.upload-icon {
		font-size: 48rpx;
		color: #999;
	}

	.upload-text {
		font-size: 24rpx;
		color: #999;
	}

	.time-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 30rpx;
		background-color: #fafafa;
		border-radius: 12rpx;
	}

	.time-value {
		font-size: 48rpx;
		font-weight: bold;
		color: #667eea;
		display: block;
	}

	.time-label {
		font-size: 24rpx;
		color: #999;
		margin-top: 10rpx;
	}

	.ai-preview {
		background-color: #fff;
		margin: 20rpx;
		border-radius: 16rpx;
		overflow: hidden;
	}

	.ai-header {
		display: flex;
		align-items: center;
		padding: 20rpx 25rpx;
		background-color: #fff3e0;
		gap: 10rpx;
	}

	.ai-icon {
		font-size: 32rpx;
	}

	.ai-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
	}

	.ai-content {
		padding: 25rpx;
	}

	.ai-text {
		font-size: 26rpx;
		color: #666;
		line-height: 1.6;
		display: block;
		margin-bottom: 20rpx;
	}

	.ai-score {
		display: flex;
		align-items: center;
		gap: 20rpx;
		padding: 15rpx;
		background-color: #fafafa;
		border-radius: 10rpx;
	}

	.score-label {
		font-size: 24rpx;
		color: #999;
	}

	.score-value {
		font-size: 36rpx;
		font-weight: bold;
		color: #4caf50;
	}

	.submit-btn-wrap {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 20rpx 30rpx;
		background-color: #fff;
		box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
	}

	.submit-btn {
		width: 100%;
		height: 80rpx;
		border-radius: 40rpx;
		font-size: 32rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		border: none;

		&.disabled {
			background-color: #f0f0f0;
			color: #999;
		}
	}
</style>
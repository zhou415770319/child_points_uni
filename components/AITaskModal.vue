<template>
	<view class="modal-overlay" v-if="visible" @click="handleClose">
		<view class="modal-content" @click.stop>
			<view class="modal-header">
				<text class="modal-title">🤖 AI生成任务</text>
				<text class="modal-close" @click="handleClose">✕</text>
			</view>
			<view class="modal-body">
				<view class="form-item">
					<text class="form-label">生成主题</text>
					<input class="form-input" v-model="aiPrompt" placeholder="例如：为三年级学生生成一周阅读任务" />
				</view>
				<view class="form-item">
					<text class="form-label">任务数量</text>
					<picker :value="taskCountIndex" :range="taskCounts" @change="onTaskCountChange">
						<view class="form-picker">
							{{ taskCounts[taskCountIndex] }} 个
							<text class="picker-arrow">›</text>
						</view>
					</picker>
				</view>
				<view class="form-item">
					<text class="form-label">难度等级</text>
					<picker :value="aiDifficultyIndex" :range="difficulties" @change="onAIDifficultyChange">
						<view class="form-picker">
							{{ difficulties[aiDifficultyIndex] }}
							<text class="picker-arrow">›</text>
						</view>
					</picker>
				</view>
			</view>
			<view class="modal-footer">
				<button class="btn btn-secondary" @click="handleClose">取消</button>
				<button class="btn btn-primary" @click="handleGenerate">生成</button>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'AITaskModal',
		props: {
			visible: {
				type: Boolean,
				default: false
			},
			difficulties: {
				type: Array,
				default: () => ['简单', '中等', '困难']
			}
		},
		emits: ['close', 'generate'],
		data() {
			return {
				aiPrompt: '',
				taskCounts: [3, 5, 7, 10],
				taskCountIndex: 1,
				aiDifficultyIndex: 1
			}
		},
		methods: {
			handleClose() {
				this.resetForm()
				this.$emit('close')
			},
			resetForm() {
				this.aiPrompt = ''
				this.taskCountIndex = 1
				this.aiDifficultyIndex = 1
			},
			onTaskCountChange(e) {
				this.taskCountIndex = e.detail.value
			},
			onAIDifficultyChange(e) {
				this.aiDifficultyIndex = e.detail.value
			},
			handleGenerate() {
				if (!this.aiPrompt) {
					uni.showToast({ title: '请输入生成主题', icon: 'none' })
					return
				}

				this.$emit('generate', {
					prompt: this.aiPrompt,
					count: this.taskCounts[this.taskCountIndex],
					difficulty: this.difficulties[this.aiDifficultyIndex]
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
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

	.form-picker {
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 80rpx;
		padding: 0 20rpx;
		border: 2rpx solid #e8e8e8;
		border-radius: 10rpx;
		font-size: 28rpx;
		color: #333;
	}

	.picker-arrow {
		font-size: 32rpx;
		color: #999;
	}

	.modal-footer {
		display: flex;
		gap: 20rpx;
		padding: 30rpx;
		border-top: 1rpx solid #f0f0f0;
	}

	.btn {
		flex: 1;
		height: 80rpx;
		border-radius: 40rpx;
		font-size: 28rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
	}

	.btn-primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
	}

	.btn-secondary {
		background-color: #f5f5f5;
		color: #666;
	}
</style>
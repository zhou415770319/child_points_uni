<template>
	<view class="modal-overlay" v-if="visible" @click="close">
		<view class="modal-content" @click.stop>
			<view class="modal-header">
				<text class="modal-title">提交任务</text>
				<text class="modal-close" @click="close">✕</text>
			</view>
			<view class="modal-body">
				<view class="upload-section">
					<text class="upload-title">📷 上传证明图片</text>
					<view class="upload-list">
						<view class="upload-item" v-for="(file, index) in files" :key="index">
							<image class="upload-image" :src="file.path" mode="aspectFill" />
							<view class="upload-delete" @click="removeFile(index)">✕</view>
						</view>
						<view class="upload-add" @click="chooseImage" v-if="files.length < 9">
							<text class="add-icon">+</text>
							<text class="add-text">添加图片</text>
						</view>
					</view>
				</view>

				<view class="remark-section">
					<text class="remark-title">📝 备注信息</text>
					<textarea 
						class="remark-input" 
						v-model="remark" 
						placeholder="请输入完成任务的备注信息..."
						:maxlength="500"
					></textarea>
					<text class="remark-count">{{ remark.length }}/500</text>
				</view>
			</view>
			<view class="modal-footer">
				<button class="btn btn-secondary" @click="close">取消</button>
				<button class="btn btn-primary" @click="submit">确认提交</button>
			</view>
		</view>
	</view>
</template>

<script>
	import { feishuRequest } from '@/common/feishu-request.js'
	
	export default {
		name: 'TaskSubmitModal',
		props: {
			visible: {
				type: Boolean,
				default: false
			},
			task: {
				type: Object,
				default: null
			}
		},
		data() {
			return {
				files: [],
				remark: '',
				isUploading: false
			}
		},
		watch: {
			visible(val) {
				if (val) {
					this.files = []
					this.remark = ''
				}
			}
		},
		methods: {
			close() {
				this.$emit('close')
			},
			async chooseImage() {
			if (this.isUploading) return
			
			uni.chooseImage({
				count: 9 - this.files.length,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: async (res) => {
					this.isUploading = true
					try {
						// 先获取 objToken
						let objToken = null
						const nodeResult = await feishuRequest.getNodeByToken()
						if (nodeResult.success && nodeResult.objToken) {
							objToken = nodeResult.objToken
						} else {
							console.error('[TaskSubmitModal] 获取 objToken 失败:', nodeResult.message || '未知错误')
							uni.showToast({ title: '上传失败', icon: 'none' })
							this.isUploading = false
							return
						}
						
						// 上传图片到飞书并获取 fileToken
						const uploadPromises = res.tempFiles.map(async (file) => {
							let fileToken = null
							try {
								const result = await feishuRequest.uploadFile(file.path, objToken)
								if (result.success && result.fileToken) {
									fileToken = result.fileToken
								} else {
									console.error('[TaskSubmitModal] 图片上传失败:', result.message || '未知错误')
								}
							} catch (error) {
								console.error('[TaskSubmitModal] 图片上传异常:', error.message)
							}
							return {
								path: file.path,
								size: file.size,
								fileToken: fileToken
							}
						})
						
						const uploadedFiles = await Promise.all(uploadPromises)
						this.files = [...this.files, ...uploadedFiles]
					} catch (error) {
						console.error('[TaskSubmitModal] 图片上传失败:', error)
						uni.showToast({ title: '图片上传失败', icon: 'none' })
					} finally {
						this.isUploading = false
					}
				}
			})
		},
			removeFile(index) {
				this.files.splice(index, 1)
			},
			submit() {
				this.$emit('submit', {
					task: this.task,
					files: this.files,
					remark: this.remark
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
	}

	.modal-content {
		width: 90%;
		max-width: 680rpx;
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
		font-size: 32rpx;
		color: #999;
	}

	.modal-body {
		padding: 30rpx;
		max-height: 60vh;
		overflow-y: auto;
	}

	.upload-section {
		margin-bottom: 30rpx;
	}

	.upload-title {
		display: block;
		font-size: 28rpx;
		font-weight: 500;
		color: #333;
		margin-bottom: 20rpx;
	}

	.upload-list {
		display: flex;
		flex-wrap: wrap;
		gap: 15rpx;
	}

	.upload-item {
		width: 150rpx;
		height: 150rpx;
		position: relative;
		border-radius: 12rpx;
		overflow: hidden;
	}

	.upload-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.upload-delete {
		position: absolute;
		top: 5rpx;
		right: 5rpx;
		width: 36rpx;
		height: 36rpx;
		background-color: rgba(0, 0, 0, 0.6);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		font-size: 24rpx;
	}

	.upload-add {
		width: 150rpx;
		height: 150rpx;
		border: 2rpx dashed #ddd;
		border-radius: 12rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.add-icon {
		font-size: 48rpx;
		color: #ddd;
	}

	.add-text {
		font-size: 22rpx;
		color: #999;
		margin-top: 10rpx;
	}

	.remark-section {
		margin-bottom: 20rpx;
	}

	.remark-title {
		display: block;
		font-size: 28rpx;
		font-weight: 500;
		color: #333;
		margin-bottom: 15rpx;
	}

	.remark-input {
		width: 100%;
		height: 200rpx;
		padding: 20rpx;
		border: 1rpx solid #e0e0e0;
		border-radius: 12rpx;
		font-size: 28rpx;
		box-sizing: border-box;
	}

	.remark-count {
		display: block;
		text-align: right;
		font-size: 22rpx;
		color: #999;
		margin-top: 10rpx;
	}

	.modal-footer {
		display: flex;
		gap: 20rpx;
		padding: 20rpx 30rpx;
		border-top: 1rpx solid #f0f0f0;
	}

	.btn {
		flex: 1;
		padding: 25rpx;
		border-radius: 12rpx;
		font-size: 30rpx;
		font-weight: 500;
		border: none;
		
		&.btn-secondary {
			background-color: #f5f5f5;
			color: #666;
		}
		
		&.btn-primary {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: #fff;
		}
	}
</style>
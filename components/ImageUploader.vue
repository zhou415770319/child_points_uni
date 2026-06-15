<template>
	<view class="upload-section">
		<text class="upload-title">{{ title }}</text>
		<view class="upload-list">
			<!-- 已有图片（只读，不可删除） -->
			<view v-for="(item, index) in existing" :key="'existing-' + index" class="upload-item existing-item">
				<image class="upload-image" :src="item.url" mode="aspectFill" @click="previewExisting(index)" />
			</view>
			<!-- 用户已选择的图片（可删除） -->
			<view class="upload-item" v-for="(file, index) in localFiles" :key="'new-' + index">
				<image class="upload-image" :src="file.path" mode="aspectFill" @click="previewFile(index)" />
				<view class="upload-delete" @click="removeFile(index)">✕</view>
			</view>
			<!-- 添加按钮 -->
			<view class="upload-add" @click="chooseImage" v-if="canAddMore">
				<text class="add-icon">+</text>
				<text class="add-text">{{ addButtonText }}</text>
			</view>
		</view>
	</view>
</template>

<script>
	import { feishuRequest } from '@/common/feishu-request.js'

	export default {
		name: 'ImageUploader',
		props: {
			/** 标题文本 */
			title: {
				type: String,
				default: '📷 上传证明图片'
			},
			/** 最大上传数量（不含已有图片） */
			maxCount: {
				type: Number,
				default: 9
			},
			/** 外部传入的文件列表（v-model 支持） */
			value: {
				type: Array,
				default: () => []
			},
			/** 已有图片列表，格式为 [{ url: 'xxx', fileToken: 'yyy' }] */
			existing: {
				type: Array,
				default: () => []
			}
		},
		data() {
			return {
				// 本地文件列表，用于渲染和操作
				localFiles: [...this.value]
			}
		},
		watch: {
			// 监听外部 value 变化，同步到本地
			value: {
				handler(newVal) {
					console.log('[ImageUploader] value prop changed:', newVal)
					this.localFiles = [...newVal]
				},
				deep: true
			}
		},
		computed: {
			/** 是否还能继续添加图片 */
			canAddMore() {
				return this.localFiles.length < this.maxCount
			},
			/** 添加按钮文本：有已有图片时显示"修改头像" */
			addButtonText() {
				if (this.existing && this.existing.length > 0 && this.maxCount === 1) {
					return '修改头像'
				}
				return '添加图片'
			}
		},
		methods: {
			/**
			 * 选择图片
			 */
			chooseImage() {
				uni.chooseImage({
					count: this.maxCount - this.localFiles.length,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: async(res) => {
						console.log('[ImageUploader] 选择图片成功:', res.tempFiles)
						// 如果没有传入 objToken，先通过 wiki 接口获取
						let objToken = null
						if (!objToken) {
							console.log('[ImageUploader] 正在获取 objToken...')
							try {
								const nodeResult = await feishuRequest.getNodeByToken()
								if (nodeResult.success && nodeResult.objToken) {
									objToken = nodeResult.objToken
									console.log('[ImageUploader] 获取 objToken 成功:', objToken)
								} else {
									console.error('[ImageUploader] 获取 objToken 失败:', nodeResult.message || '未知错误')
									return
								}
							} catch (error) {
								console.error('[ImageUploader] 获取 objToken 异常:', error.message)
								return
							}
						}
						
						const fileTokens = []
						let successCount = 0
						// 使用 Promise.all 等待所有上传完成
						const newFiles = await Promise.all(res.tempFiles.map(async(file) => {
							let fileToken = null
							try {
								const result = await feishuRequest.uploadFile(file.path, objToken)
								if (result.success && result.fileToken) {
									fileToken = result.fileToken
									fileTokens.push({ file_token: result.fileToken })
									successCount++
									console.log('[ImageUploader] 图片上传成功，fileToken:', result.fileToken)
								} else {
									console.error('[ImageUploader] 图片上传失败:', result.message || '未知错误')
								}
							} catch (error) {
								console.error('[ImageUploader] 图片上传异常:', error.message)
							}
							return {
								path: file.path,
								size: file.size,
								fileToken: fileToken
							}
						}))
						// 更新本地列表并触发 v-model 更新
						this.localFiles = [...this.localFiles, ...newFiles]
						console.log('[ImageUploader] localFiles 更新后:', this.localFiles)
						// 使用 JSON 序列化/反序列化确保传递新引用
						this.$emit('input', JSON.parse(JSON.stringify(this.localFiles)))
						console.log('[ImageUploader] 已触发 input 事件')
					},
					fail: (err) => {
						console.error('[ImageUploader] 选择图片失败:', err)
						uni.showToast({ title: '选择图片失败', icon: 'none' })
					}
				})
			},

			/**
			 * 删除图片
			 */
			removeFile(index) {
				this.localFiles.splice(index, 1)
				console.log('[ImageUploader] 删除图片后:', this.localFiles)
				this.$emit('input', [...this.localFiles])
			},

			/**
			 * 预览已有图片
			 */
			previewExisting(index) {
				const urls = this.existing.map(f => f.url)
				uni.previewImage({
					current: urls[index],
					urls
				})
			},

			/**
			 * 预览新选择的图片
			 */
			previewFile(index) {
				const urls = this.localFiles.map(f => f.path)
				uni.previewImage({
					current: urls[index],
					urls
				})
			},

			/**
			 * 上传所有图片，返回飞书图片字段格式的数据
			 * @param {string|null} objToken - 上传用的 obj_token，为空则自动获取
			 * @returns {Promise<{value: Array, successCount: number}|null>}
			 */
			async uploadAndGetFieldValue(objToken = null) {
				console.log('this.localFiles---',this.localFiles);
				
				// 只上传用户新选择的文件（有 path 属性的）
				if (!this.localFiles || !Array.isArray(this.localFiles)) {
					return null
				}
				const filesToUpload = this.localFiles.filter(f => f.path)
				if (filesToUpload.length === 0) {
					return null
				}

				console.log('[ImageUploader] 开始上传图片，共', filesToUpload.length, '张')

				// 如果没有传入 objToken，先通过 wiki 接口获取
				if (!objToken) {
					console.log('[ImageUploader] 正在获取 objToken...')
					try {
						const nodeResult = await feishuRequest.getNodeByToken()
						if (nodeResult.success && nodeResult.objToken) {
							objToken = nodeResult.objToken
							console.log('[ImageUploader] 获取 objToken 成功:', objToken)
						} else {
							console.error('[ImageUploader] 获取 objToken 失败:', nodeResult.message || '未知错误')
							return null
						}
					} catch (error) {
						console.error('[ImageUploader] 获取 objToken 异常:', error.message)
						return null
					}
				}

				const fileTokens = []
				let successCount = 0

				for (let i = 0; i < filesToUpload.length; i++) {
					const file = filesToUpload[i]
					console.log('[ImageUploader] 上传第', i + 1, '张图片:', file.path)

					try {
						const result = await feishuRequest.uploadFile(file.path, objToken)
						if (result.success && result.fileToken) {
							fileTokens.push({ file_token: result.fileToken })
							successCount++
							console.log('[ImageUploader] 图片上传成功，fileToken:', result.fileToken)
						} else {
							console.error('[ImageUploader] 图片上传失败:', result.message || '未知错误')
						}
					} catch (error) {
						console.error('[ImageUploader] 图片上传异常:', error.message)
					}
				}

				if (fileTokens.length === 0) {
					return null
				}

				return {
					value: fileTokens,
					successCount
				}
			},

			/**
			 * 将 file_token 对象数组转换为飞书图片字段格式
			 * 飞书图片字段格式: { type: 17, value: ['token1', 'token2'] }
			 */
			convertToImageFieldValue(fileTokens) {
				if (!fileTokens || fileTokens.length === 0) {
					return null
				}
				const tokens = fileTokens
					.map(item => item.file_token)
					.filter(Boolean)
				if (tokens.length === 0) {
					return null
				}
				return {
					type: 17,
					value: tokens
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.upload-section {
		margin-bottom: 20rpx;
	}

	.upload-title {
		font-size: 28rpx;
		color: #333;
		font-weight: 500;
		display: block;
		margin-bottom: 16rpx;
	}

	.upload-list {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
	}

	.upload-item {
		width: 180rpx;
		height: 180rpx;
		border-radius: 12rpx;
		overflow: hidden;
		position: relative;
		border: 2rpx solid #eee;
	}

	.upload-image {
		width: 100%;
		height: 100%;
	}

	.upload-delete {
		position: absolute;
		top: 4rpx;
		right: 4rpx;
		width: 36rpx;
		height: 36rpx;
		background: rgba(0, 0, 0, 0.5);
		color: #fff;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20rpx;
		z-index: 1;
	}

	.upload-add {
		width: 180rpx;
		height: 180rpx;
		border: 2rpx dashed #ddd;
		border-radius: 12rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: #fafafa;
	}

	.add-icon {
		font-size: 48rpx;
		color: #ccc;
		line-height: 1;
	}

	.add-text {
		font-size: 24rpx;
		color: #999;
		margin-top: 8rpx;
	}
</style>

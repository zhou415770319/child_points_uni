<template>
	<view class="container">
		<view class="toolbar">
			<button 
				class="toolbar-btn" 
				:class="{ active: currentStatus === 'pending' }"
				@click="switchStatus('pending')"
			>待审核</button>
			<button 
				class="toolbar-btn" 
				:class="{ active: currentStatus === 'approved' }"
				@click="switchStatus('approved')"
			>已通过</button>
			<button 
				class="toolbar-btn" 
				:class="{ active: currentStatus === 'rejected' }"
				@click="switchStatus('rejected')"
			>已拒绝</button>
		</view>

		<view class="checkin-list">
			<view class="checkin-card" v-for="checkin in checkins" :key="checkin.id">
				<view class="checkin-header">
					<view class="checkin-child">
						<view class="child-avatar">{{ checkin.child_name.charAt(0) }}</view>
						<text class="child-name">{{ checkin.child_name }}</text>
					</view>
					<text class="checkin-time">{{ checkin.checkin_time }}</text>
				</view>
				<view class="checkin-task">
					<text class="task-icon">{{ getTaskIcon(checkin.task_type) }}</text>
					<text class="task-title">{{ checkin.task_title }}</text>
				</view>
				<view class="checkin-content" v-if="checkin.content">
					<text class="content-label">打卡内容</text>
					<text class="content-text">{{ checkin.content }}</text>
				</view>
				<view class="checkin-attachments" v-if="checkin.attachments && checkin.attachments.length > 0">
					<text class="attachments-label">打卡图片</text>
					<view class="attachments-grid">
						<image 
							v-for="(att, index) in checkin.attachments" 
							:key="index" 
							class="attachment-img"
							:src="att.url"
							mode="aspectFill"
							@click="previewImage(checkin.attachments, index)"
						/>
					</view>
				</view>
				<view class="checkin-ai" v-if="checkin.ai_score !== null && checkin.ai_score !== ''">
				<view class="ai-score">
					<text class="score-label">AI评分</text>
					<text class="score-value" :class="getScoreClass(checkin.ai_score)">{{ checkin.ai_score }}分</text>
				</view>
				<text class="ai-comment">{{ checkin.ai_comment }}</text>
				<view class="ai-detailed-container" v-if="checkin.ai_detailed && this.parseAiDetailed(checkin.ai_detailed)">
					<view class="ai-detailed-header" @click="toggleAiDetailed(checkin)">
						<text class="detailed-label">评价详情</text>
						<text class="toggle-icon" :class="{ expanded: checkin.detailedExpanded }">▼</text>
					</view>
					<view class="ai-detailed-content" v-if="checkin.detailedExpanded">
						<view class="detailed-item" v-for="(item, key) in this.parseAiDetailed(checkin.ai_detailed)" :key="key">
							<view class="item-header">
								<text class="item-question">{{ key }}</text>
								<text class="item-status" :class="item.correctness === '正确' ? 'correct' : 'wrong'">
									{{ item.correctness === '正确' ? '✓ 正确' : '✗ 错误' }}
								</text>
							</view>
							<text class="item-feedback">{{ item.feedback }}</text>
						</view>
					</view>
				</view>
			</view>
				<view class="checkin-actions" v-if="currentStatus === 'pending'">
					<button class="action-btn reject" @click="rejectCheckin(checkin)">❌ 拒绝</button>
					<button class="action-btn accept" @click="acceptCheckin(checkin)">✅ 通过</button>
				</view>
				<view class="checkin-status-tag" v-else>
					<text :class="['status-text', currentStatus]">{{ currentStatus === 'approved' ? '✅ 已通过' : '❌ 已拒绝' }}</text>
				</view>
			</view>
		</view>

		<view class="empty-state" v-if="checkins.length === 0">
			<text class="empty-icon">{{ currentStatus === 'pending' ? '🎉' : currentStatus === 'approved' ? '👍' : '📝' }}</text>
			<text class="empty-title">{{ emptyTitle }}</text>
			<text class="empty-text">{{ emptyText }}</text>
		</view>
	</view>
</template>

<script>
	import { feishuRequest } from '@/common/feishu-request.js'
	import UserManager from '@/common/user-manager.js'
	
	export default {
		data() {
			return {
				checkins: [],
				children: [],
				currentChild: null,
					currentStatus: 'pending'
			}
		},
		computed: {
			emptyTitle() {
				const titles = {
					pending: '暂无待审核打卡',
					approved: '暂无已通过打卡',
					rejected: '暂无已拒绝打卡'
				}
				return titles[this.currentStatus]
			},
			emptyText() {
				const texts = {
					pending: '所有打卡都已审核完成',
					approved: '还没有已通过的打卡记录',
					rejected: '还没有已拒绝的打卡记录'
				}
				return texts[this.currentStatus]
			}
		},
		onLoad() {
			this.loadCheckins()
		},
		methods: {
			/**
			 * 加载打卡记录列表
			 */
			async loadCheckins() {
				uni.showLoading({ title: '加载中...' })
				try {
					// 先加载儿童列表，用于获取儿童名称
					await this.loadChildren()
					
					// 根据当前状态查询对应的打卡记录
					const statusMap = {
						pending: '待审核',
						approved: '通过',
						rejected: '拒绝'
					}
					const filter = { review_status: statusMap[this.currentStatus] }
					const result = await feishuRequest.queryRecords('打卡记录表', filter)
					
					if (result.success && result.data) {
						// 提取所有附件的 file_token 用于批量获取图片URL
						const fileTokens = []
						result.data.forEach(item => {
							if (item.fields.attachments && Array.isArray(item.fields.attachments)) {
								item.fields.attachments.forEach(att => {
									if (att.file_token) {
										fileTokens.push(att.file_token)
									}
								})
							}
						})
						
						// 批量获取图片URL
						let imageUrlMap = {}
						if (fileTokens.length > 0) {
							await feishuRequest.initCloudObject()
							const urlResult = await feishuRequest.feishutools.getImageUrls({
								fileTokens: fileTokens
							})
							if (urlResult.success && urlResult.urlMap) {
								imageUrlMap = urlResult.urlMap
							}
						}
						
						// 映射数据并按时间倒序排序
						this.checkins = result.data.map(item => {
							// 处理 child_id 字段（可能是对象数组格式）
							let childId = item.fields.child_id || ''
							if (Array.isArray(childId)) {
								if (childId[0] && childId[0].text) {
									childId = childId[0].text
								} else if (childId[0] && typeof childId[0] === 'object' && childId[0].record_id) {
									childId = childId[0].record_id
								} else if (childId[0]) {
									childId = String(childId[0])
								} else {
									childId = ''
								}
							}
							childId = String(childId).trim()
							
							// 处理 attachments 字段（附件图片）
							let attachments = []
							if (item.fields.attachments && Array.isArray(item.fields.attachments)) {
								attachments = item.fields.attachments.map(att => ({
									file_token: att.file_token || '',
									name: att.name || '',
									url: imageUrlMap[att.file_token] || ''
								}))
							}
							
							return {
								id: item.record_id,
								child_id: childId,
								child_name: this.getChildName(childId),
								task_title: this.parseTextField(item.fields.content),
								task_type: item.fields.task_type || '',
								checkin_time: this.formatTime(item.fields.created_time),
								created_time: item.fields.created_time,
								content: this.parseTextField(item.fields.remark),
								ai_score: this.parseTextField(item.fields.ai_score),
								ai_comment: this.parseTextField(item.fields.ai_comment),
								ai_detailed: this.parseTextField(item.fields.ai_detailed),
								attachments: attachments,
								review_status: item.fields.review_status || '待审核',
								base_points: item.fields.base_points || 0,
								reward_points: item.fields.reward_points || 0
							}
						}).sort((a, b) => new Date(b.created_time) - new Date(a.created_time))
					} else {
						console.warn('[Checkins] 加载打卡记录失败:', result.message)
					}
				} catch (error) {
					console.error('[Checkins] 加载打卡记录异常:', error)
					uni.showToast({ title: '加载失败', icon: 'none' })
				} finally {
					uni.hideLoading()
				}
			},
			/**
			 * 加载儿童列表
			 */
			async loadChildren() {
				try {
					this.currentChild = await UserManager.getCurrentChild()
					
					const result = await feishuRequest.queryRecords('儿童表', null)
					if (result.success && result.data) {
						this.children = result.data.map(item => ({
							id: item.record_id,
							name: item.fields.name?.[0]?.text || '',
							child_id: item.fields.child_id || ''
						}))
					}
				} catch (error) {
					console.error('[Checkins] 加载儿童列表失败:', error)
				}
			},
			/**
			 * 根据child_id获取儿童名称
			 */
			getChildName(childId) {
				if (!childId) {
					return this.currentChild?.name || '未关联'
				}
				if (this.currentChild && (this.currentChild.child_id === childId || this.currentChild.id === childId || 
					String(this.currentChild.child_id) === String(childId) || String(this.currentChild.id) === String(childId))) {
					return this.currentChild.name
				}
				const child = this.children.find(c => 
					c.child_id === childId || c.id === childId ||
					String(c.child_id) === String(childId) || String(c.id) === String(childId)
				)
				return child ? child.name : '未知儿童'
			},
			/**
			 * 格式化时间
			 */
			formatTime(timestamp) {
				if (!timestamp) return ''
				const date = new Date(timestamp)
				const now = new Date()
				const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
				const checkinDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
				
				const diffDays = Math.floor((today - checkinDate) / (1000 * 60 * 60 * 24))
				
				if (diffDays === 0) {
					return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
				} else if (diffDays === 1) {
					return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
				} else {
					return date.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
				}
			},
			/**
			 * 切换审核状态
			 */
			switchStatus(status) {
				if (this.currentStatus === status) return
				this.currentStatus = status
				this.loadCheckins()
			},
			getTaskIcon(type) {
				const icons = {
					reading: '📖',
					math: '🧮',
					english: '🔤',
					art: '🎨',
					sports: '⚽',
					default: '📝'
				}
				return icons[type] || icons.default
			},
			/**
			 * 预览图片
			 */
			previewImage(attachments, currentIndex) {
				const urls = attachments.map(att => att.url || '')
				uni.previewImage({
					current: currentIndex,
					urls: urls
				})
			},
			getScoreClass(score) {
				if (!score) return ''
				score = parseInt(score) || 0
				if (score >= 90) return 'high'
				if (score >= 70) return 'medium'
				return 'low'
			},
			/**
			 * 解析多维表格文本字段
			 */
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
			/**
			 * 解析AI评价详情JSON
			 */
			parseAiDetailed(detailedStr) {
				if (!detailedStr) return null
				try {
					const parsed = JSON.parse(detailedStr)
					// 验证是否是预期的格式
					if (typeof parsed === 'object' && parsed !== null) {
						return parsed
					}
					return null
				} catch (error) {
					console.error('[Checkins] 解析AI评价详情失败:', error)
					return null
				}
			},
			/**
			 * 切换评价详情折叠状态
			 */
			toggleAiDetailed(checkin) {
				checkin.detailedExpanded = !checkin.detailedExpanded
			},
			async acceptCheckin(checkin) {
				uni.showModal({
					title: '确认通过',
					content: `确定要通过 ${checkin.child_name} 的打卡吗？`,
					success: async (res) => {
						if (res.confirm) {
							uni.showLoading({ title: '处理中...' })
							try {
								// 更新飞书多维表格中的审核状态
								const result = await feishuRequest.updateRecord('打卡记录表', checkin.id, {
									review_status: '通过'
								})
								if (result.success) {
									// 计算总积分
									
									// 如果有积分，添加积分记录
									if (checkin.child_id) {
										const pointsRecord = {
											child_id: checkin.child_id,
											type: '挣得',
											description: `完成任务: ${checkin.task_title}`,
											created_time: Date.now(),
											base_points: checkin.base_points,
											reward_points:checkin.reward_points
										}
										const pointsResult = await feishuRequest.addRecord('积分记录表', pointsRecord)
										if (!pointsResult.success) {
											console.error('[Checkins] 添加积分记录失败:', pointsResult.message)
										}
									}
									
									checkin.review_status = '通过'
										// 刷新列表数据
									this.loadCheckins()
									uni.showToast({ title: '审核通过', icon: 'success' })
								} else {
									console.error('[Checkins] 更新审核状态失败:', result.message)
									uni.showToast({ title: '审核失败', icon: 'none' })
								}
							} catch (error) {
								console.error('[Checkins] 审核异常:', error)
								uni.showToast({ title: '审核失败', icon: 'none' })
							} finally {
								uni.hideLoading()
							}
						}
					}
				})
			},
			async rejectCheckin(checkin) {
				uni.showModal({
					title: '确认拒绝',
					content: `确定要拒绝 ${checkin.child_name} 的打卡吗？`,
					success: async (res) => {
						if (res.confirm) {
							uni.showLoading({ title: '处理中...' })
							try {
								// 更新飞书多维表格中的审核状态
								const result = await feishuRequest.updateRecord('打卡记录表', checkin.id, {
									review_status: '拒绝'
								})
								if (result.success) {
									checkin.review_status = '拒绝'
									// 刷新列表数据
									this.loadCheckins()
									uni.showToast({ title: '已拒绝', icon: 'none' })
								} else {
									console.error('[Checkins] 更新审核状态失败:', result.message)
									uni.showToast({ title: '操作失败', icon: 'none' })
								}
							} catch (error) {
								console.error('[Checkins] 操作异常:', error)
								uni.showToast({ title: '操作失败', icon: 'none' })
							} finally {
								uni.hideLoading()
							}
						}
					}
				})
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
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: #fff;
			border: none;
		}
	}

	.checkin-list {
		padding: 20rpx;
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.checkin-card {
		background-color: #fff;
		border-radius: 16rpx;
		padding: 25rpx;
	}

	.checkin-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.checkin-child {
		display: flex;
		align-items: center;
	}

	.child-avatar {
		width: 60rpx;
		height: 60rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24rpx;
		font-weight: bold;
		color: #fff;
		margin-right: 15rpx;
	}

	.child-name {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
	}

	.checkin-time {
		font-size: 24rpx;
		color: #999;
	}

	.checkin-task {
		display: flex;
		align-items: center;
		margin-bottom: 15rpx;
		padding: 15rpx;
		background-color: #fafafa;
		border-radius: 12rpx;
	}

	.task-icon {
		font-size: 40rpx;
		margin-right: 15rpx;
	}

	.task-title {
		font-size: 28rpx;
		color: #333;
	}

	.checkin-content {
		margin-bottom: 15rpx;
	}

	.checkin-attachments {
		margin-bottom: 15rpx;
	}

	.attachments-label {
		font-size: 24rpx;
		color: #999;
		display: block;
		margin-bottom: 8rpx;
	}

	.attachments-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 10rpx;
	}

	.attachment-img {
		width: 160rpx;
		height: 160rpx;
		border-radius: 8rpx;
		background-color: #f5f5f5;
	}

	.content-label {
		font-size: 24rpx;
		color: #999;
		display: block;
		margin-bottom: 8rpx;
	}

	.content-text {
		font-size: 26rpx;
		color: #333;
		line-height: 1.6;
	}

	.checkin-ai {
		background-color: #fff3e0;
		border-radius: 12rpx;
		padding: 15rpx;
		margin-bottom: 20rpx;
	}

	.ai-score {
		display: flex;
		align-items: center;
		margin-bottom: 10rpx;
	}

	.score-label {
		font-size: 24rpx;
		color: #999;
		margin-right: 15rpx;
	}

	.score-value {
		font-size: 32rpx;
		font-weight: bold;

		&.high {
			color: #4caf50;
		}

		&.medium {
			color: #ff9500;
		}

		&.low {
			color: #f44336;
		}
	}

	.ai-comment {
		font-size: 24rpx;
		color: #666;
		display: block;
		margin-bottom: 10rpx;
	}

	.ai-detailed-container {
		margin-top: 10rpx;
	}

	.ai-detailed-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background-color: rgba(255, 255, 255, 0.7);
		border-radius: 8rpx;
		padding: 12rpx;
	}

	.detailed-label {
		font-size: 22rpx;
		color: #999;
	}

	.toggle-icon {
		font-size: 20rpx;
		color: #999;
		transition: transform 0.3s ease;
		transform: rotate(-90deg);

		&.expanded {
			transform: rotate(0deg);
		}
	}

	.ai-detailed-content {
		background-color: rgba(255, 255, 255, 0.7);
		border-radius: 0 0 8rpx 8rpx;
		padding: 15rpx;
		margin-top: 4rpx;
	}

	.detailed-item {
		padding: 12rpx;
		background-color: #fff;
		border-radius: 8rpx;
		margin-bottom: 10rpx;

		&:last-child {
			margin-bottom: 0;
		}
	}

	.item-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8rpx;
	}

	.item-question {
		font-size: 24rpx;
		color: #333;
		font-weight: 500;
	}

	.item-status {
		font-size: 22rpx;
		padding: 4rpx 12rpx;
		border-radius: 20rpx;

		&.correct {
			background-color: #e8f5e9;
			color: #4caf50;
		}

		&.wrong {
			background-color: #ffebee;
			color: #f44336;
		}
	}

	.item-feedback {
		font-size: 22rpx;
		color: #666;
		line-height: 1.5;
	}

	.checkin-actions {
		display: flex;
		gap: 20rpx;
	}

	.checkin-status-tag {
		display: flex;
		justify-content: flex-end;
		padding-top: 10rpx;
	}

	.status-text {
		font-size: 26rpx;
		font-weight: bold;
		padding: 8rpx 20rpx;
		border-radius: 20rpx;

		&.approved {
			color: #4caf50;
			background-color: #e8f5e9;
		}

		&.rejected {
			color: #f44336;
			background-color: #ffebee;
		}
	}

	.action-btn {
		flex: 1;
		height: 70rpx;
		border-radius: 35rpx;
		font-size: 26rpx;
		border: none;

		&.accept {
			background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
			color: #fff;
		}

		&.reject {
			background-color: #f5f5f5;
			color: #666;
			border: 2rpx solid #e8e8e8;
		}
	}

	.empty-state {
		text-align: center;
		padding: 100rpx 40rpx;
	}

	.empty-icon {
		font-size: 100rpx;
		display: block;
		margin-bottom: 25rpx;
	}

	.empty-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 15rpx;
	}

	.empty-text {
		font-size: 26rpx;
		color: #999;
	}
</style>
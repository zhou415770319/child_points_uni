<template>
	<view class="container">
		<view class="header">
			<text class="header-title">⚙️ 管理中心</text>
		</view>

		<view class="menu-grid">
			<view class="menu-item" @click="navigateTo('/pages/parent/task-templates')">
				<view class="menu-icon">📋</view>
				<text class="menu-title">任务模板</text>
				<text class="menu-desc">管理任务模板</text>
			</view>
			<view class="menu-item" @click="navigateTo('/pages/parent/textbook')">
				<view class="menu-icon">📚</view>
				<text class="menu-title">教材管理</text>
				<text class="menu-desc">管理学习教材</text>
			</view>
			<view class="menu-item" @click="navigateTo('/pages/parent/children')">
				<view class="menu-icon">👶</view>
				<text class="menu-title">儿童管理</text>
				<text class="menu-desc">管理儿童账号</text>
			</view>
			<view class="menu-item" @click="navigateTo('/pages/parent/points')">
				<view class="menu-icon">💰</view>
				<text class="menu-title">积分管理</text>
				<text class="menu-desc">管理积分记录</text>
			</view>
			<view class="menu-item" @click="showAIGenerate">
				<view class="menu-icon">🤖</view>
				<text class="menu-title">AI生成</text>
				<text class="menu-desc">智能生成任务</text>
			</view>
			<view class="menu-item" @click="navigateTo('/pages/parent/learning-schedule')">
				<view class="menu-icon">⏰</view>
				<text class="menu-title">学习时间</text>
				<text class="menu-desc">设置学习时间段</text>
			</view>
			<view class="menu-item" @click="showCozeConfig">
				<view class="menu-icon">⚙️</view>
				<text class="menu-title">AI配置</text>
				<text class="menu-desc">配置Coze工作流</text>
			</view>
			<view class="menu-item" @click="navigateTo('/pages/parent/goods-manage')">
				<view class="menu-icon">🛒</view>
				<text class="menu-title">商城管理</text>
				<text class="menu-desc">管理商品信息</text>
			</view>
		</view>

		<view class="section">
			<text class="section-title">快捷操作</text>
			<view class="action-list">
				<view class="action-item" @click="batchCreateTasks">
					<view class="action-icon">➕</view>
					<view class="action-content">
						<text class="action-title">批量创建任务</text>
						<text class="action-desc">基于模板快速创建多个任务</text>
					</view>
					<text class="action-arrow">›</text>
				</view>
				<view class="action-item" @click="importTasks">
					<view class="action-icon">📥</view>
					<view class="action-content">
						<text class="action-title">导入任务</text>
						<text class="action-desc">从模板或文件导入任务</text>
					</view>
					<text class="action-arrow">›</text>
				</view>
				<view class="action-item" @click="exportTasks">
					<view class="action-icon">📤</view>
					<view class="action-content">
						<text class="action-title">导出任务</text>
						<text class="action-desc">导出任务数据</text>
					</view>
					<text class="action-arrow">›</text>
				</view>
			</view>
		</view>

		<view class="modal-overlay" v-if="showAIModal" @click="closeAIModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">🤖 AI生成任务</text>
					<text class="modal-close" @click="closeAIModal">✕</text>
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
						<picker :value="difficultyIndex" :range="difficulties" @change="onDifficultyChange">
							<view class="form-picker">
								{{ difficulties[difficultyIndex] }}
								<text class="picker-arrow">›</text>
							</view>
						</picker>
					</view>
				</view>
				<view class="modal-footer">
					<button class="btn btn-secondary" @click="closeAIModal">取消</button>
					<button class="btn btn-primary" @click="generateTasks">生成</button>
				</view>
			</view>
		</view>

		<view class="modal-overlay" v-if="showCozeModal" @click="closeCozeModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">⚙️ Coze配置</text>
					<text class="modal-close" @click="closeCozeModal">✕</text>
				</view>
				<view class="modal-body">
					<view class="form-item">
						<text class="form-label">工作流地址</text>
						<input class="form-input" v-model="cozeConfig.workflowUrl" placeholder="Coze工作流URL" />
					</view>
					<view class="form-item">
						<text class="form-label">API密钥</text>
						<input class="form-input" v-model="cozeConfig.apiKey" placeholder="Coze API Key" />
					</view>
					<view class="config-tip">
						<text class="tip-icon">💡</text>
						<text class="tip-text">配置后，AI生成任务功能将调用Coze工作流生成任务</text>
					</view>
				</view>
				<view class="modal-footer">
					<button class="btn btn-secondary" @click="closeCozeModal">取消</button>
					<button class="btn btn-primary" @click="saveCozeConfig">保存</button>
				</view>
			</view>
		</view>

		<custom-tab-bar ref="tabBar"></custom-tab-bar>
	</view>
</template>

<script>
	import customTabBar from '@/custom-tab-bar/index.vue'
	import { cozeRequest } from '@/common/coze-request.js'
	import { feishuRequest } from '@/common/feishu-request.js'
	export default {
		components: { customTabBar },
		data() {
			return {
				showAIModal: false,
				aiPrompt: '',
				taskCounts: [3, 5, 7, 10],
				taskCountIndex: 1,
				difficulties: ['简单', '中等', '困难'],
				difficultyIndex: 1,
				showCozeModal: false,
				cozeConfig: {
					workflowUrl: '',
					apiKey: ''
				}
			}
		},
		onShow() {
			if (this.$refs.tabBar) {
				this.$refs.tabBar.updateSelected('/pages/parent/manage')
			}
		},
		methods: {
			navigateTo(url) {
				uni.navigateTo({ url })
			},
			showAIGenerate() {
				this.showAIModal = true
			},
			closeAIModal() {
				this.showAIModal = false
				this.aiPrompt = ''
				this.taskCountIndex = 1
				this.difficultyIndex = 1
			},
			showCozeConfig() {
				const config = cozeRequest.getConfig()
				if (config) {
					this.cozeConfig = {
						workflowUrl: config.workflowUrl || '',
						apiKey: config.apiKey || ''
					}
				}
				this.showCozeModal = true
			},
			closeCozeModal() {
				this.showCozeModal = false
			},
			saveCozeConfig() {
				if (!this.cozeConfig.workflowUrl.trim()) {
					uni.showToast({ title: '请输入工作流地址', icon: 'none' })
					return
				}
				if (!this.cozeConfig.apiKey.trim()) {
					uni.showToast({ title: '请输入API密钥', icon: 'none' })
					return
				}

				cozeRequest.saveConfig({
					workflowUrl: this.cozeConfig.workflowUrl.trim(),
					apiKey: this.cozeConfig.apiKey.trim()
				})

				uni.showToast({ title: '配置保存成功', icon: 'success' })
				this.closeCozeModal()
			},
			onTaskCountChange(e) {
				const value = e?.detail?.value !== undefined ? e.detail.value : e
				this.taskCountIndex = value
			},
			onDifficultyChange(e) {
				const value = e?.detail?.value !== undefined ? e.detail.value : e
				this.difficultyIndex = value
			},
			async generateTasks() {
				if (!this.aiPrompt.trim()) {
					uni.showToast({ title: '请输入生成主题', icon: 'none' })
					return
				}

				uni.showLoading({ title: 'AI生成中...' })

				try {
					const params = cozeRequest.buildTaskParams(
						this.aiPrompt,
						this.taskCounts[this.taskCountIndex],
						this.difficulties[this.difficultyIndex]
					)

					const cozeResult = await cozeRequest.generateTasks(params)

					if (!cozeResult.success) {
						uni.hideLoading()
						uni.showToast({ title: cozeResult.message, icon: 'none' })
						return
					}

					const tasksData = cozeResult.data
					console.log('[AI生成] Coze返回的任务数据:', tasksData)

					if (!tasksData || !Array.isArray(tasksData.tasks)) {
						uni.hideLoading()
						uni.showToast({ title: '工作流返回数据格式不正确', icon: 'none' })
						return
					}

					const tasks = tasksData.tasks.map(task => ({
						title: task.title || task.name || '未命名任务',
						description: task.description || '',
						type: task.type || 'study',
						type_text: task.type_text || '学习',
						difficulty: task.difficulty || '中等',
						base_points: task.base_points || task.points || 10,
						status: '未开始',
						created_at: Date.now()
					}))

					if (tasks.length === 0) {
						uni.hideLoading()
						uni.showToast({ title: '未生成任何任务', icon: 'none' })
						return
					}

					const batchResult = await feishuRequest.batchAddRecords('任务表', tasks)

					if (batchResult.success) {
						uni.hideLoading()
						uni.showToast({ title: `成功生成 ${tasks.length} 个任务！`, icon: 'success' })
						this.closeAIModal()
						uni.navigateTo({ url: '/pages/parent/tasks' })
					} else {
						uni.hideLoading()
						uni.showToast({ title: '保存任务失败', icon: 'none' })
					}
				} catch (error) {
					console.error('[AI生成] 生成任务异常:', error)
					uni.hideLoading()
					uni.showToast({ title: '生成任务时发生异常', icon: 'none' })
				}
			},
			batchCreateTasks() {
				uni.navigateTo({ url: '/pages/parent/task-templates' })
			},
			importTasks() {
				uni.showToast({ title: '导入功能开发中', icon: 'none' })
			},
			exportTasks() {
				uni.showToast({ title: '导出功能开发中', icon: 'none' })
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
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 40rpx 30rpx;
	}

	.header-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #fff;
	}

	.menu-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20rpx;
		padding: 20rpx;
	}

	.menu-item {
		background-color: #fff;
		border-radius: 16rpx;
		padding: 30rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.menu-icon {
		font-size: 56rpx;
		margin-bottom: 15rpx;
	}

	.menu-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 5rpx;
	}

	.menu-desc {
		font-size: 22rpx;
		color: #999;
	}

	.section {
		padding: 20rpx;
	}

	.section-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 20rpx;
	}

	.action-list {
		background-color: #fff;
		border-radius: 16rpx;
		overflow: hidden;
	}

	.action-item {
		display: flex;
		align-items: center;
		padding: 25rpx;
		border-bottom: 1rpx solid #f0f0f0;

		&:last-child {
			border-bottom: none;
		}
	}

	.action-icon {
		width: 60rpx;
		height: 60rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 15rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30rpx;
		color: #fff;
		margin-right: 20rpx;
	}

	.action-content {
		flex: 1;
	}

	.action-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 5rpx;
	}

	.action-desc {
		font-size: 22rpx;
		color: #999;
	}

	.action-arrow {
		font-size: 32rpx;
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

	.config-tip {
		display: flex;
		align-items: flex-start;
		gap: 10rpx;
		padding: 20rpx;
		background-color: #e8f5e9;
		border-radius: 12rpx;
		margin-top: 10rpx;
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
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: #fff;
		}

		&.btn-secondary {
			background-color: #f0f0f0;
			color: #333;
		}
	}
</style>
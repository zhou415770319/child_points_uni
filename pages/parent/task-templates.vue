<template>
	<view class="container">
		<view class="header">
			<text class="header-title">📋 任务模板</text>
			<button class="add-btn" @click="showAddModal = true">+ 添加模板</button>
		</view>

		<view class="toolbar">
			<button class="toolbar-btn" :class="{ active: currentFilter === 'all' }" @click="setFilter('all')">全部</button>
			<button class="toolbar-btn" :class="{ active: currentFilter === 'reading' }" @click="setFilter('reading')">阅读</button>
			<button class="toolbar-btn" :class="{ active: currentFilter === 'math' }" @click="setFilter('math')">数学</button>
			<button class="toolbar-btn" :class="{ active: currentFilter === 'english' }" @click="setFilter('english')">英语</button>
		</view>

		<view class="template-list">
			<view class="template-card" v-for="template in filteredTemplates" :key="template.id" @click="useTemplate(template)">
				<view class="template-icon">{{ getTypeIcon(template.type) }}</view>
				<view class="template-info">
					<text class="template-title">{{ template.title }}</text>
					<text class="template-desc">{{ template.description }}</text>
					<view class="template-meta">
						<text class="meta-item">⭐ {{ template.base_points }}积分</text>
						<text class="meta-item">{{ getDifficultyText(template.difficulty) }}</text>
						<text class="meta-item">{{ template.type_text }}</text>
					</view>
				</view>
				<view class="template-action">
					<text class="use-btn">使用</text>
				</view>
			</view>
		</view>

		<view class="section">
			<text class="section-title">🎯 推荐模板</text>
			<view class="recommend-list">
				<view class="recommend-card" v-for="template in recommendTemplates" :key="template.id">
					<view class="recommend-icon">{{ template.icon }}</view>
					<view class="recommend-content">
						<text class="recommend-title">{{ template.title }}</text>
						<text class="recommend-desc">{{ template.description }}</text>
					</view>
				</view>
			</view>
		</view>

		<view class="modal-overlay" v-if="showAddModal" @click="closeModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">{{ editingTemplate ? '编辑模板' : '添加任务模板' }}</text>
					<text class="modal-close" @click="closeModal">✕</text>
				</view>
				<view class="modal-body">
					<view class="form-item">
						<text class="form-label">模板名称</text>
						<input class="form-input" v-model="formData.title" placeholder="请输入模板名称" />
					</view>
					<view class="form-item">
						<text class="form-label">任务类型</text>
						<picker :value="typeIndex" :range="taskTypes" @change="onTypeChange">
							<view class="form-picker">
								{{ formData.type_text || '请选择类型' }}
								<text class="picker-arrow">›</text>
							</view>
						</picker>
					</view>
					<view class="form-item">
						<text class="form-label">难度等级</text>
						<picker :value="difficultyIndex" :range="difficulties" @change="onDifficultyChange">
							<view class="form-picker">
								{{ formData.difficulty_text || '请选择难度' }}
								<text class="picker-arrow">›</text>
							</view>
						</picker>
					</view>
					<view class="form-item">
						<text class="form-label">基础积分</text>
						<input class="form-input" type="number" v-model="formData.base_points" placeholder="请输入基础积分" />
					</view>
					<view class="form-item">
						<text class="form-label">模板描述</text>
						<textarea class="form-textarea" v-model="formData.description" placeholder="请输入模板描述"></textarea>
					</view>
				</view>
				<view class="modal-footer">
					<button class="btn btn-secondary" @click="closeModal">取消</button>
					<button class="btn btn-primary" @click="saveTemplate">保存</button>
				</view>
			</view>
		</view>
		<custom-tab-bar ref="tabBar"></custom-tab-bar>
	</view>
</template>

<script>
	import customTabBar from '@/custom-tab-bar/index.vue'
	import CategoryManager from '@/common/category-manager.js'
	import { feishuRequest } from '@/common/feishu-request.js'
	export default {
		components: { customTabBar },
		data() {
			return {
				templates: [],
				currentFilter: 'all',
				showAddModal: false,
				editingTemplate: null,
				formData: {
					title: '',
					type: '',
					type_text: '',
					difficulty: '',
					difficulty_text: '',
					base_points: '',
					description: ''
				},
				taskTypes: ['阅读', '数学', '英语', '美术', '体育', '音乐', '科学'],
				typeIndex: 0,
				difficulties: ['简单', '中等', '困难'],
				difficultyIndex: 0
			}
		},
		computed: {
			filteredTemplates() {
				if (this.currentFilter === 'all') {
					return this.templates
				}
				return this.templates.filter(t => t.type === this.currentFilter)
			},
			recommendTemplates() {
				return [
					{ id: 'r1', icon: '📖', title: '337阅读法', description: '每天阅读3篇，每篇阅读3遍' },
					{ id: 'r2', icon: '🧮', title: '口算打卡', description: '每天100道口算练习' },
					{ id: 'r3', icon: '🔤', title: '单词背诵', description: '每天背诵20个单词' },
					{ id: 'r4', icon: '✍️', title: '日记写作', description: '每天写一篇日记' }
				]
			}
		},
		onLoad() {
			this.loadTemplates()
			this.loadCategories()
		},
		onShow() {
			if (this.$refs.tabBar) {
				this.$refs.tabBar.updateSelected('/pages/parent/task-templates')
			}
		},
		methods: {
			getTypeIcon(type) {
				const icons = {
					reading: '📖',
					math: '🧮',
					english: '🔤',
					art: '🎨',
					sports: '⚽',
					music: '🎵',
					science: '🔬',
					default: '📝'
				}
				return icons[type] || icons.default
			},
			getDifficultyText(difficulty) {
				const texts = { easy: '简单', medium: '中等', hard: '困难' }
				return texts[difficulty] || difficulty
			},
			setFilter(filter) {
				this.currentFilter = filter
			},
			async loadCategories() {
				try {
					const categories = await CategoryManager.loadCategories('task-templates')
					if (categories) {
						if (categories.task_type && categories.task_type.length > 0) {
							this.taskTypes = categories.task_type.map(t => t.label)
						}
						if (categories.task_difficulty && categories.task_difficulty.length > 0) {
							this.difficulties = categories.task_difficulty.map(d => d.label)
						}
					}
				} catch (error) {
					console.error('[TaskTemplates] 加载分类失败:', error)
				}
			},
			async loadTemplates() {
				uni.showLoading({ title: '加载中...' })
				try {
					const result = await feishuRequest.queryRecords('任务模板表')
					if (result.success && result.data && result.data.length > 0) {
						this.templates = result.data.map(item => {
							const title = item.fields.title 
								? (Array.isArray(item.fields.title) && item.fields.title[0] && item.fields.title[0].text 
									? item.fields.title[0].text 
									: item.fields.title)
								: ''
							const description = item.fields.description 
								? (Array.isArray(item.fields.description) && item.fields.description[0] && item.fields.description[0].text 
									? item.fields.description[0].text 
									: item.fields.description)
								: ''
							return {
								id: item.record_id,
								title: title,
								description: description,
								type: item.fields.type || '',
								type_text: item.fields.type_text || '',
								difficulty: item.fields.difficulty || 'easy',
								base_points: item.fields.base_points || 10
							}
						})
					} else {
						this.templates = this.getMockTemplates()
					}
				} catch (error) {
					console.error('[TaskTemplates] 加载模板失败:', error)
					this.templates = this.getMockTemplates()
				}
				uni.hideLoading()
			},
			getMockTemplates() {
				return [
					{ id: 1, title: '每日阅读', description: '每天阅读一篇课文，培养阅读习惯', type: 'reading', type_text: '阅读', difficulty: 'easy', base_points: 10 },
					{ id: 2, title: '数学练习', description: '完成10道数学练习题', type: 'math', type_text: '数学', difficulty: 'medium', base_points: 15 },
					{ id: 3, title: '英语背诵', description: '背诵当天学习的英语单词', type: 'english', type_text: '英语', difficulty: 'easy', base_points: 10 },
					{ id: 4, title: '美术创作', description: '完成一幅美术作品', type: 'art', type_text: '美术', difficulty: 'hard', base_points: 20 },
					{ id: 5, title: '体育锻炼', description: '每天锻炼30分钟', type: 'sports', type_text: '体育', difficulty: 'easy', base_points: 10 },
					{ id: 6, title: '音乐欣赏', description: '欣赏一首古典音乐', type: 'music', type_text: '音乐', difficulty: 'easy', base_points: 5 },
					{ id: 7, title: '科学实验', description: '完成一个科学小实验', type: 'science', type_text: '科学', difficulty: 'hard', base_points: 25 }
				]
			},
			useTemplate(template) {
				uni.setStorageSync('selectedTemplate', template)
				uni.switchTab({ url: '/pages/parent/tasks' })
			},
			onTypeChange(e) {
				this.typeIndex = e.detail.value
				this.formData.type_text = this.taskTypes[this.typeIndex]
				this.formData.type = this.taskTypes[this.typeIndex]
			},
			onDifficultyChange(e) {
				this.difficultyIndex = e.detail.value
				this.formData.difficulty_text = this.difficulties[this.difficultyIndex]
				this.formData.difficulty = this.difficulties[this.difficultyIndex]
			},
			closeModal() {
				this.showAddModal = false
				this.editingTemplate = null
				this.formData = { title: '', type: '', type_text: '', difficulty: '', difficulty_text: '', base_points: '', description: '' }
				this.typeIndex = 0
				this.difficultyIndex = 0
			},
			async saveTemplate() {
				if (!this.formData.title || !this.formData.type) {
					uni.showToast({ title: '请填写完整信息', icon: 'none' })
					return
				}

				uni.showLoading({ title: '保存中...' })

				const templateData = {
					title: this.formData.title,
					type: this.formData.type,
					type_text: this.formData.type_text,
					difficulty: this.formData.difficulty,
					base_points: parseInt(this.formData.base_points) || 10,
					description: this.formData.description
				}

				try {
					if (this.editingTemplate) {
						const success = await this.updateTemplateToTable(this.editingTemplate.id, templateData)
						if (success) {
							const index = this.templates.findIndex(t => t.id === this.editingTemplate.id)
							if (index >= 0) {
								this.templates[index] = { ...this.templates[index], ...templateData }
							}
							uni.showToast({ title: '修改成功', icon: 'success' })
						}
					} else {
						const recordId = await this.addTemplateToTable(templateData)
						if (recordId) {
							this.templates.unshift({ id: recordId, ...templateData })
							uni.showToast({ title: '添加成功', icon: 'success' })
						}
					}
				} catch (error) {
					console.error('[TaskTemplates] 保存模板失败:', error)
					uni.showToast({ title: '保存失败', icon: 'none' })
				}

				uni.hideLoading()
				this.closeModal()
			},
			async addTemplateToTable(templateData) {
				try {
					const data = {
						title: templateData.title,
						type: templateData.type,
						type_text: templateData.type_text,
						difficulty: templateData.difficulty,
						base_points: templateData.base_points,
						description: templateData.description
					}
					const result = await feishuRequest.addRecord('任务模板表', data)
					if (result.success) {
						return result.recordId
					}
					return null
				} catch (error) {
					console.error('[TaskTemplates] 添加模板失败:', error)
					return null
				}
			},
			async updateTemplateToTable(id, templateData) {
				try {
					const data = {
						title: templateData.title,
						type: templateData.type,
						type_text: templateData.type_text,
						difficulty: templateData.difficulty,
						base_points: templateData.base_points,
						description: templateData.description
					}
					const result = await feishuRequest.updateRecord('任务模板表', id, data)
					return result.success
				} catch (error) {
					console.error('[TaskTemplates] 更新模板失败:', error)
					return false
				}
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
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: #fff;
			border: none;
		}
	}

	.template-list {
		padding: 20rpx;
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.template-card {
		background-color: #fff;
		border-radius: 16rpx;
		padding: 25rpx;
		display: flex;
		align-items: center;
	}

	.template-icon {
		width: 80rpx;
		height: 80rpx;
		background-color: #f5f5f5;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 40rpx;
		margin-right: 20rpx;
	}

	.template-info {
		flex: 1;
	}

	.template-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 8rpx;
	}

	.template-desc {
		font-size: 24rpx;
		color: #999;
		display: block;
		margin-bottom: 12rpx;
	}

	.template-meta {
		display: flex;
		gap: 20rpx;
	}

	.meta-item {
		font-size: 22rpx;
		color: #666;
	}

	.template-action {
		margin-left: 20rpx;
	}

	.use-btn {
		padding: 15rpx 30rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		border-radius: 25rpx;
		font-size: 24rpx;
	}

	.section {
		padding: 0 20rpx 20rpx;
	}

	.section-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 20rpx;
	}

	.recommend-list {
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}

	.recommend-card {
		background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
		border-radius: 16rpx;
		padding: 25rpx;
		display: flex;
		align-items: center;
		border: 2rpx solid #e8e8e8;
	}

	.recommend-icon {
		font-size: 40rpx;
		margin-right: 20rpx;
	}

	.recommend-content {
		flex: 1;
	}

	.recommend-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 5rpx;
	}

	.recommend-desc {
		font-size: 24rpx;
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
</style>
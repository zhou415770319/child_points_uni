<template>
	<view class="container">
		<view class="header">
			<text class="header-title">📋 任务模板</text>
			<button class="add-btn" @click="showAddModal = true">+ 添加模板</button>
		</view>

		<view class="tabs">
			<view class="tab-item" :class="{ active: activeTab === 'my' }" @click="activeTab = 'my'">
				<text>我的模板</text>
			</view>
			<view class="tab-item" :class="{ active: activeTab === 'square' }" @click="activeTab = 'square'; loadSquareTemplates()">
				<text>模板广场</text>
			</view>
		</view>

		<view class="toolbar" v-if="activeTab === 'my'">
			<view class="filter-row">
				<view class="filter-item">
					<text class="filter-label">模板类型：</text>
					<uni-data-select
						v-model="templateTypeFilter"
						:localdata="templateTypeOptions"
						placeholder="全部"
					/>
				</view>
				<view class="filter-item">
					<text class="filter-label">任务类型：</text>
					<uni-data-select
						v-model="currentFilter"
						:localdata="taskTypeFilterOptions"
						placeholder="全部"
					/>
				</view>
			</view>
		</view>

		<view class="template-list" v-if="activeTab === 'my'">
			<view v-if="filteredTemplates.length === 0" class="empty-state">
				<text class="empty-icon">📋</text>
				<text class="empty-text">暂无任务模板</text>
				<text class="empty-hint">点击右上角添加新模板</text>
			</view>
			<view class="template-card" :class="{ 'custom': template.is_custom, 'expanded': expandedTemplates.includes(template.id) }" v-for="template in filteredTemplates" :key="template.id">
				<view class="template-main" @click="toggleExpand(template.id)">
					<view class="template-icon">{{ getTypeIcon(template.type) }}</view>
					<view class="template-info">
						<view class="template-header">
							<text class="template-title">{{ template.template_title || template.title }}</text>
							<view class="template-badges">
								<view class="template-type-badge" :class="template.is_custom ? 'custom' : 'default'">
									{{ template.is_custom ? '自定义' : '普通' }}
								</view>
							</view>
						</view>
						<text class="template-desc">{{ template.template_description || template.description }}</text>
						<view class="template-meta">
							<text class="meta-item">{{ template.type_text }}</text>
						</view>
					</view>
					<view class="expand-icon">
						<text>{{ expandedTemplates.includes(template.id) ? '▲' : '▼' }}</text>
					</view>
				</view>
				<view class="template-actions">
					<view 
						class="action-btn status-btn" 
						:class="{ enabled: template.enabled, disabled: !template.enabled }"
						@click="toggleTemplateStatus(template)"
					>
						<view class="status-dot" :class="{ active: template.enabled }"></view>
						<text>{{ template.enabled ? '开启' : '关闭' }}</text>
					</view>
					<text class="action-btn upload-btn" v-if="template.enabled" @click="uploadToSquare(template)">上传到广场</text>
					<text class="action-btn edit-btn" v-if="!template.enabled" @click="editTemplate(template)">编辑</text>
					<text class="action-btn delete-btn" @click="deleteTemplate(template)">删除</text>
				</view>
				<view class="template-detail" v-if="expandedTemplates.includes(template.id)">
					<view class="detail-grid">
						<view class="detail-column">
							<text class="detail-title">📝 任务信息</text>
							<view class="detail-row">
								<text class="detail-label">任务标题</text>
								<text class="detail-value">{{ template.title }}</text>
							</view>
							<view class="detail-row" v-if="template.description">
								<text class="detail-label">任务描述</text>
								<text class="detail-value">{{ template.description }}</text>
							</view>
							<view class="detail-row" v-if="template.type_text">
								<text class="detail-label">任务类型</text>
								<text class="detail-value">{{ template.type_text }}</text>
							</view>
							<view class="detail-row" v-if="template.difficulty">
								<text class="detail-label">难度等级</text>
								<text class="detail-value">{{ getDifficultyText(template.difficulty) }}</text>
							</view>
						</view>
						<view class="detail-column">
							<text class="detail-title">⚙️ 设置信息</text>
							<view class="detail-row" v-if="template.base_points">
								<text class="detail-label">基础积分</text>
								<text class="detail-value">{{ template.base_points }} 分</text>
							</view>
							<view class="detail-row" v-if="template.reward_points">
								<text class="detail-label">奖励积分</text>
								<text class="detail-value">{{ template.reward_points }} 分</text>
							</view>
							<view class="detail-row" v-if="template.deadline_time">
								<text class="detail-label">截止时间</text>
								<text class="detail-value">{{ formatDeadline(template.deadline_time) }}</text>
							</view>
							<view class="detail-row">
								<text class="detail-label">需要审核</text>
								<text class="detail-value">{{ template.need_audit ? '是' : '否' }}</text>
							</view>
							<view class="detail-row" v-if="template.child_name">
								<text class="detail-label">关联儿童</text>
								<text class="detail-value">{{ template.child_name }}</text>
							</view>
							<view class="detail-row" v-if="template.textbook_name">
								<text class="detail-label">绑定教材</text>
								<text class="detail-value">{{ template.textbook_name }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view class="template-list" v-if="activeTab === 'square'">
			<view class="template-card square-card" v-for="template in squareTemplates" :key="template.id">
				<view class="template-icon">{{ getTypeIcon(template.type) }}</view>
				<view class="template-info">
					<view class="template-header">
						<text class="template-title">{{ template.title }}</text>
						<view class="template-author">
							<text>👤 {{ template.author || '匿名' }}</text>
						</view>
					</view>
					<text class="template-desc">{{ template.description }}</text>
					<view class="template-meta">
						<text class="meta-item">⭐ {{ template.base_points }}积分</text>
						<text class="meta-item">{{ getDifficultyText(template.difficulty) }}</text>
						<text class="meta-item">{{ template.type_text }}</text>
						<text class="meta-item">⬇️ {{ template.download_count || 0 }}次下载</text>
					</view>
				</view>
				<view class="template-action">
					<text class="download-btn" @click.stop="downloadTemplate(template)">下载</text>
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

		<TaskFormModal
			:visible="showAddModal"
			page-type="template"
			:editing-task="editingTemplate"
			:task-types="taskTypes"
			:difficulties="difficulties"
			:children="children"
			:textbooks="textbooks"
			@close="closeModal"
			@save="handleTemplateSave"
		/>
		<custom-tab-bar ref="tabBar"></custom-tab-bar>
	</view>
</template>

<script>
	import customTabBar from '@/custom-tab-bar/index.vue'
	import TaskFormModal from '@/components/TaskFormModal.vue'
	import CategoryManager from '@/common/category-manager.js'
	import UserManager from '@/common/user-manager.js'
	import { feishuRequest } from '@/common/feishu-request.js'
	export default {
		components: { customTabBar, TaskFormModal },
		data() {
			return {
				templates: [],
				squareTemplates: [],
				currentFilter: 'all',
				templateTypeFilter: 'all',
				activeTab: 'my',
				showAddModal: false,
				editingTemplate: null,
				taskTypes: [],
				difficulties: [],
				children: [],
				textbooks: [],
				expandedTemplates: []
			}
		},
		computed: {
			// 任务类型选项（用于uni-data-select）
				taskTypeOptions() {
					return this.taskTypes.map(type => ({
						value: type,
						text: type
					}))
				},
				// 难度选项（用于uni-data-select）
				difficultyOptions() {
					return this.difficulties.map(diff => ({
						value: diff,
						text: diff
					}))
				},
				// 模板类型选项（用于uni-data-select）
				templateTypeOptions() {
					return [
						{ value: 'all', text: '全部' },
						{ value: 'default', text: '普通模板' },
						{ value: 'custom', text: '自定义模板' }
					]
				},
				// 任务类型筛选选项（从CategoryManager获取）
				taskTypeFilterOptions() {
					return CategoryManager.getTaskTypeOptions()
				},
			filteredTemplates() {
				let result = this.templates
				
				// 模板类型筛选
				if (this.templateTypeFilter === 'default') {
					result = result.filter(t => !t.is_custom)
				} else if (this.templateTypeFilter === 'custom') {
					result = result.filter(t => t.is_custom)
				}
				
				// 任务类型筛选
				if (this.currentFilter !== 'all') {
					result = result.filter(t => t.type === this.currentFilter)
				}
				
				return result
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
		async onLoad() {
			await this.loadTemplates()
			await this.loadCategories()
			await this.loadChildren()
			await this.loadTextbooks()
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
			toggleExpand(templateId) {
				const index = this.expandedTemplates.indexOf(templateId)
				if (index >= 0) {
					this.expandedTemplates.splice(index, 1)
				} else {
					this.expandedTemplates.push(templateId)
				}
			},
			deleteTemplate(template) {
				uni.showModal({
					title: '确认删除',
					content: `确定要删除模板"${template.title}"吗？`,
					success: async (res) => {
						if (res.confirm) {
							uni.showLoading({ title: '删除中...' })
							try {
								const result = await feishuRequest.deleteRecord('任务模板表', template.id)
								if (result.success) {
									const index = this.templates.findIndex(t => t.id === template.id)
									if (index >= 0) {
										this.templates.splice(index, 1)
									}
									uni.showToast({ title: '删除成功', icon: 'success' })
								} else {
									uni.showToast({ title: '删除失败', icon: 'none' })
								}
							} catch (error) {
								console.error('[TaskTemplates] 删除模板失败:', error)
								uni.showToast({ title: '删除失败', icon: 'none' })
							}
							uni.hideLoading()
						}
					}
				})
			},
			formatDeadline(timestamp) {
				if (!timestamp) return ''
				try {
					const date = new Date(parseInt(timestamp))
					return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
				} catch (error) {
					return timestamp
				}
			},
			async loadCategories() {
				try {
					const categories = await CategoryManager.loadCategories('task-templates')
					console.log('[TaskTemplates] 加载分类数据:', categories)
					if (categories && Array.isArray(categories) && categories.length > 0) {
						const fields = categories[0].fields
						if (fields.task_type && Array.isArray(fields.task_type) && fields.task_type.length > 0) {
							const types = fields.task_type.map(t => typeof t === 'object' ? (t.label || t.text || '') : t)
							this.taskTypes = types.filter(t => t)
							console.log('[TaskTemplates] 更新任务类型:', this.taskTypes)
						}
						if (fields.task_difficulty && Array.isArray(fields.task_difficulty) && fields.task_difficulty.length > 0) {
							const diffs = fields.task_difficulty.map(d => typeof d === 'object' ? (d.label || d.text || '') : d)
							this.difficulties = diffs.filter(d => d)
							console.log('[TaskTemplates] 更新难度等级:', this.difficulties)
						}
					}
				} catch (error) {
					console.error('[TaskTemplates] 加载分类失败:', error)
				}
			},
			async loadChildren() {
				try {
					const parent = await UserManager.getCurrentParent()
					if (parent && parent.phone) {
						const childList = await UserManager.getChildrenByParent(parent.phone)
						this.children = childList.map(child => ({
							...child,
							name: child.name 
								? (Array.isArray(child.name) && child.name[0] && child.name[0].text 
									? child.name[0].text 
									: child.name)
								: ''
						}))
					}
				} catch (error) {
					console.error('[TaskTemplates] 加载儿童列表失败:', error)
				}
			},
			async loadTextbooks() {
				try {
					const result = await feishuRequest.queryRecords('教材表')
					if (result.success && result.data && result.data.length > 0) {
						this.textbooks = result.data.map(item => {
							const name = item.fields.name 
								? (Array.isArray(item.fields.name) && item.fields.name[0] && item.fields.name[0].text 
									? item.fields.name[0].text 
									: item.fields.name)
								: ''
							return {
								id: item.fields.id || item.record_id,
								name: name,
								subject: item.fields.subject || '',
								grade: item.fields.grade || ''
							}
						})
					}
				} catch (error) {
					console.error('[TaskTemplates] 加载教材列表失败:', error)
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
							const templateTitle = item.fields.template_title 
								? (Array.isArray(item.fields.template_title) && item.fields.template_title[0] && item.fields.template_title[0].text 
									? item.fields.template_title[0].text 
									: item.fields.template_title)
								: ''
							const templateDescription = item.fields.template_description 
								? (Array.isArray(item.fields.template_description) && item.fields.template_description[0] && item.fields.template_description[0].text 
									? item.fields.template_description[0].text 
									: item.fields.template_description)
								: ''
							const childId = item.fields.child_id 
								? (Array.isArray(item.fields.child_id) && item.fields.child_id[0] && item.fields.child_id[0].text 
									? item.fields.child_id[0].text 
									: item.fields.child_id)
								: ''
							const childName = item.fields.child_name 
								? (item.fields.child_name.value && Array.isArray(item.fields.child_name.value) && item.fields.child_name.value[0] && item.fields.child_name.value[0].text
									? item.fields.child_name.value[0].text
									: (Array.isArray(item.fields.child_name) && item.fields.child_name[0] && item.fields.child_name[0].text
										? item.fields.child_name[0].text
										: item.fields.child_name))
								: ''
							const textbookId = item.fields.textbook_id 
								? (Array.isArray(item.fields.textbook_id) && item.fields.textbook_id[0] && item.fields.textbook_id[0].text 
									? item.fields.textbook_id[0].text 
									: item.fields.textbook_id)
								: ''
							const textbookName = item.fields.textbook_name 
								? (Array.isArray(item.fields.textbook_name) && item.fields.textbook_name[0] && item.fields.textbook_name[0].text 
									? item.fields.textbook_name[0].text 
									: item.fields.textbook_name)
								: ''
							return {
								id: item.record_id,
								title: title,
								description: description,
								template_title: templateTitle,
								template_description: templateDescription,
								type: item.fields.type || '',
								type_text: item.fields.type_text || '',
								difficulty: item.fields.difficulty || 'easy',
								base_points: item.fields.base_points || 10,
								enabled: item.fields.status !== undefined ? item.fields.status === '开启' : true,
								is_custom: item.fields.is_custom !== undefined ? !!item.fields.is_custom : true,
								child_id: childId,
								child_name: childName,
								textbook_id: textbookId,
								textbook_name: textbookName
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
					{ id: 1, title: '每日阅读', description: '每天阅读一篇课文，培养阅读习惯', type: 'reading', type_text: '阅读', difficulty: 'easy', base_points: 10, enabled: true, is_custom: false },
					{ id: 2, title: '数学练习', description: '完成10道数学练习题', type: 'math', type_text: '数学', difficulty: 'medium', base_points: 15, enabled: true, is_custom: false },
					{ id: 3, title: '英语背诵', description: '背诵当天学习的英语单词', type: 'english', type_text: '英语', difficulty: 'easy', base_points: 10, enabled: false, is_custom: false },
					{ id: 4, title: '美术创作', description: '完成一幅美术作品', type: 'art', type_text: '美术', difficulty: 'hard', base_points: 20, enabled: true, is_custom: true },
					{ id: 5, title: '体育锻炼', description: '每天锻炼30分钟', type: 'sports', type_text: '体育', difficulty: 'easy', base_points: 10, enabled: false, is_custom: true },
					{ id: 6, title: '音乐欣赏', description: '欣赏一首古典音乐', type: 'music', type_text: '音乐', difficulty: 'easy', base_points: 5, enabled: true, is_custom: false },
					{ id: 7, title: '科学实验', description: '完成一个科学小实验', type: 'science', type_text: '科学', difficulty: 'hard', base_points: 25, enabled: true, is_custom: true }
				]
			},
			editTemplate(template) {
				this.editingTemplate = {
					id: template.id,
					title: template.title,
					description: template.description,
					type: template.type,
					type_text: template.type_text,
					difficulty: template.difficulty,
					base_points: template.base_points,
					template_name: template.template_title,
					template_description: template.template_description,
					child_id: template.child_id || '',
					child_name: template.child_name || '',
					textbook_id: template.textbook_id || '',
					textbook_name: template.textbook_name || ''
				}
				this.showAddModal = true
			},
			async toggleTemplateStatus(template) {
				const newStatus = !template.enabled
				uni.showLoading({ title: '更新中...' })
				try {
					const result = await feishuRequest.updateRecord('任务模板表', template.id, {
						status: newStatus ? '开启' : '关闭'
					})
					if (result.success) {
						template.enabled = newStatus
						uni.showToast({ 
							title: newStatus ? '已开启' : '已关闭', 
							icon: 'success' 
						})
					} else {
						uni.showToast({ title: '更新失败', icon: 'none' })
					}
				} catch (error) {
					console.error('[TaskTemplates] 更新模板状态失败:', error)
					uni.showToast({ title: '更新失败', icon: 'none' })
				} finally {
					uni.hideLoading()
				}
			},
			closeModal() {
				this.showAddModal = false
				this.editingTemplate = null
			},
			async handleTemplateSave({ data, isEdit, editId }) {
				uni.showLoading({ title: '保存中...' })

				const templateData = {
					...data,
					status: '开启',
					is_custom: true
				}
console.log('handleTemplateSave----',templateData);

				try {
					if (isEdit && editId) {
						const success = await this.updateTemplateToTable(editId, templateData)
						if (success) {
							const index = this.templates.findIndex(t => t.id === editId)
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
			async uploadToSquare(template) {
				uni.showModal({
					title: '提示',
					content: `确定要将"${template.title}"上传到模板广场吗？`,
					success: async (res) => {
						if (res.confirm) {
							uni.showLoading({ title: '上传中...' })
							try {
								const squareData = {
									title: template.title,
									type: template.type,
									type_text: template.type_text,
									difficulty: template.difficulty,
									base_points: template.base_points,
									description: template.description,
									author: '我',
									download_count: 0
								}
								const result = await feishuRequest.addRecord('模板广场表', squareData)
								if (result.success) {
									uni.showToast({ title: '上传成功', icon: 'success' })
								} else {
									uni.showToast({ title: '上传失败', icon: 'none' })
								}
							} catch (error) {
								console.error('[TaskTemplates] 上传模板到广场失败:', error)
								uni.showToast({ title: '上传失败', icon: 'none' })
							}
							uni.hideLoading()
						}
					}
				})
			},
			async loadSquareTemplates() {
				if (this.squareTemplates.length > 0) return
				uni.showLoading({ title: '加载中...' })
				try {
					const result = await feishuRequest.queryRecords('模板广场表')
					if (result.success && result.data && result.data.length > 0) {
						this.squareTemplates = result.data.map(item => {
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
								base_points: item.fields.base_points || 10,
								author: item.fields.author || '匿名',
								download_count: item.fields.download_count || 0
							}
						})
					} else {
						this.squareTemplates = this.getMockSquareTemplates()
					}
				} catch (error) {
					console.error('[TaskTemplates] 加载广场模板失败:', error)
					this.squareTemplates = this.getMockSquareTemplates()
				}
				uni.hideLoading()
			},
			getMockSquareTemplates() {
				return [
					{ id: 's1', title: '高效阅读训练', description: '采用科学方法提升阅读速度和理解能力', type: 'reading', type_text: '语文', difficulty: 'easy', base_points: 15, author: '学习达人', download_count: 128 },
					{ id: 's2', title: '奥数思维训练', description: '培养数学思维，挑战奥数难题', type: 'math', type_text: '数学', difficulty: 'hard', base_points: 30, author: '数学老师', download_count: 89 },
					{ id: 's3', title: '英语口语练习', description: '每日口语对话练习，提升表达能力', type: 'english', type_text: '英语', difficulty: 'medium', base_points: 20, author: '外教John', download_count: 256 },
					{ id: 's4', title: '科学实验手册', description: '精选趣味科学实验，培养探索精神', type: 'science', type_text: '科学', difficulty: 'medium', base_points: 25, author: '科学爱好者', download_count: 167 },
					{ id: 's5', title: '书法练习', description: '硬笔书法基础练习，写一手好字', type: 'art', type_text: '美术', difficulty: 'easy', base_points: 10, author: '书法爱好者', download_count: 94 }
				]
			},
			async downloadTemplate(template) {
				uni.showModal({
					title: '提示',
					content: `确定要下载"${template.title}"模板吗？下载后将添加到您的模板列表中。`,
					success: async (res) => {
						if (res.confirm) {
							uni.showLoading({ title: '下载中...' })
							try {
								const templateData = {
								title: template.title,
								type: template.type,
								type_text: template.type_text,
								difficulty: template.difficulty,
								base_points: template.base_points,
								description: template.description,
								status: '开启',
								is_custom: true
							}
								const result = await feishuRequest.addRecord('任务模板表', templateData)
								if (result.success) {
									await this.updateDownloadCount(template.id)
									uni.showToast({ title: '下载成功', icon: 'success' })
								} else {
									uni.showToast({ title: '下载失败', icon: 'none' })
								}
							} catch (error) {
								console.error('[TaskTemplates] 下载模板失败:', error)
								uni.showToast({ title: '下载失败', icon: 'none' })
							}
							uni.hideLoading()
						}
					}
				})
			},
			async updateDownloadCount(recordId) {
				try {
					const result = await feishuRequest.queryRecord('模板广场表', recordId)
					if (result.success && result.data) {
						const currentCount = result.data.fields.download_count || 0
						await feishuRequest.updateRecord('模板广场表', recordId, {
							download_count: currentCount + 1
						})
					}
				} catch (error) {
					console.error('[TaskTemplates] 更新下载次数失败:', error)
				}
			},
			async addTemplateToTable(templateData) {
				try {
					const data = {
						title: templateData.title,
						type: templateData.type,
						difficulty: templateData.difficulty,
						base_points: templateData.base_points,
						description: templateData.description,
						template_title: templateData.template_name,
						template_description: templateData.template_description,
						child_id: templateData.child_id || '',
						child_name: templateData.child_name || '',
						textbook_id: templateData.textbook_id || '',
						textbook_name: templateData.textbook_name || '',
						reward_points: templateData.reward_points || 0,
						need_audit: templateData.need_audit || false
					}
					if (templateData.deadline_time) {
						data.deadline_time = parseInt(templateData.deadline_time)
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
						difficulty: templateData.difficulty,
						base_points: templateData.base_points,
						description: templateData.description,
						template_title: templateData.template_name,
						template_description: templateData.template_description,
						child_id: templateData.child_id,
						textbook_id: templateData.textbook_id,
						reward_points: templateData.reward_points || 0,
						need_audit: templateData.need_audit || false
					}
					if (templateData.deadline_time) {
						data.deadline_time = parseInt(templateData.deadline_time)
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

	.tabs {
		display: flex;
		background-color: #fff;
		margin: 20rpx;
		border-radius: 16rpx;
		padding: 8rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
	}

	.tab-item {
		flex: 1;
		text-align: center;
		padding: 20rpx;
		border-radius: 12rpx;
		font-size: 28rpx;
		color: #666;
		transition: all 0.2s ease;

		&.active {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: #fff;
		}
	}

	.toolbar {
		background-color: #fff;
		padding: 15rpx 20rpx;
	}

	.filter-row {
		display: flex;
		gap: 20rpx;
	}

	.filter-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8rpx;
	}

	.filter-label {
		font-size: 24rpx;
		color: #999;
		width: 120rpx;
	}

	.filter-tabs {
		display: flex;
		gap: 10rpx;
	}

	.filter-tab {
		padding: 10rpx 20rpx;
		border-radius: 20rpx;
		font-size: 24rpx;
		background-color: #f5f5f5;
		color: #666;

		&.active {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: #fff;
		}
	}

	.filter-options {
		display: flex;
		flex: 1;
		gap: 10rpx;
	}

	.toolbar-inner {
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
		overflow: hidden;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
		transition: all 0.3s ease;
	}
	
	.template-card.expanded {
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
	}
	
	.template-main {
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

	.template-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8rpx;
	}

	.template-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
	}

	.template-badges {
		display: flex;
		align-items: center;
		gap: 10rpx;
	}

	.template-type-badge {
		font-size: 20rpx;
		padding: 4rpx 12rpx;
		border-radius: 12rpx;

		&.default {
			background-color: #e3f2fd;
			color: #1976d2;
		}

		&.custom {
			background-color: #fce4ec;
			color: #c2185b;
		}
	}

	.status-btn {
		font-size: 22rpx;
		padding: 10rpx 20rpx;
		border-radius: 20rpx;
		display: flex;
		align-items: center;
		gap: 8rpx;
		cursor: pointer;
		transition: all 0.2s ease;

		&:active {
			transform: scale(0.95);
		}

		&.enabled {
			background-color: #e8f5e9;
			color: #4caf50;
			border: 1rpx solid #c8e6c9;
		}

		&.disabled {
			background-color: #fff5f5;
			color: #ef5350;
			border: 1rpx solid #ffcdd2;
		}
	}

	.status-dot {
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		background-color: #ddd;
		transition: background-color 0.2s ease;

		&.active {
			background-color: #4caf50;
		}
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
		display: flex;
		flex-direction: column;
		gap: 10rpx;
		margin-left: 20rpx;
	}
	
	.template-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 15rpx;
		padding: 15rpx 25rpx;
		background-color: #f8f9fa;
		border-top: 1rpx solid #f0f0f0;
	}
	
	.action-btn {
		padding: 10rpx 25rpx;
		border-radius: 20rpx;
		font-size: 22rpx;
		text-align: center;
		display: flex;
		align-items: center;
		gap: 8rpx;
		transition: all 0.2s ease;
		
		&:active {
			transform: scale(0.95);
		}
	}

	.use-btn {
		padding: 12rpx 25rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		border-radius: 20rpx;
		font-size: 22rpx;
		text-align: center;

		&.disabled {
			background-color: #e8e8e8;
			background: none;
			color: #999;
		}
	}

	.edit-btn {
		background-color: #f5f5f5;
		color: #666;
	}

	.upload-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
	}
	
	.delete-btn {
		background-color: #fff5f5;
		color: #ef5350;
		border: 1rpx solid #ffcdd2;
	}

	.download-btn {
		padding: 12rpx 25rpx;
		background-color: #4caf50;
		color: #fff;
		border-radius: 20rpx;
		font-size: 22rpx;
		text-align: center;
	}

	.square-card {
		border-left: 6rpx solid #667eea;
	}

	.template-author {
		font-size: 22rpx;
		color: #999;
		margin-top: 8rpx;
	}
	
	.expand-icon {
		width: 50rpx;
		height: 50rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20rpx;
		color: #999;
		transition: transform 0.3s ease;
	}
	
	.template-detail {
		background-color: #fafafa;
		padding: 25rpx;
		border-top: 1rpx solid #f0f0f0;
		animation: slideDown 0.3s ease;
	}
	
	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10rpx);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.detail-section {
		background-color: #fff;
		border-radius: 12rpx;
		padding: 20rpx;
	}
	
	.detail-grid {
		display: flex;
		gap: 20rpx;
		background-color: #fff;
		border-radius: 12rpx;
		padding: 20rpx;
	}
	
	.detail-column {
		flex: 1;
	}
	
	.detail-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 20rpx;
	}
	
	.detail-row {
		display: flex;
		padding: 15rpx 0;
		border-bottom: 1rpx solid #f5f5f5;
		
		&:last-child {
			border-bottom: none;
		}
	}
	
	.detail-label {
		width: 140rpx;
		font-size: 24rpx;
		color: #999;
		flex-shrink: 0;
	}
	
	.detail-value {
		flex: 1;
		font-size: 24rpx;
		color: #333;
	}
	
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 100rpx 40rpx;
		background-color: #fff;
		border-radius: 16rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
	}
	
	.empty-icon {
		font-size: 80rpx;
		margin-bottom: 20rpx;
	}
	
	.empty-text {
		font-size: 30rpx;
		color: #666;
		margin-bottom: 10rpx;
	}
	
	.empty-hint {
		font-size: 24rpx;
		color: #999;
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
</style>
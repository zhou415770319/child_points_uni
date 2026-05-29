<template>
	<view class="container">
		<view class="toolbar">
			<button class="toolbar-btn" :class="{ active: currentFilter === 'all' }" @click="setFilter('all')">全部任务</button>
			<button class="toolbar-btn" :class="{ active: currentFilter === '进行中' }" @click="setFilter('进行中')">进行中</button>
			<button class="toolbar-btn" :class="{ active: currentFilter === '已完成' }" @click="setFilter('已完成')">已完成</button>
		</view>
		
		<!-- 筛选区域 -->
		<view class="filter-section">
			<view class="filter-row">
				<view class="filter-item">
					<text class="filter-label">儿童</text>
					<picker :value="filterChildIndex" :range="['全部'].concat(childNames)" @change="onFilterChildChange">
						<view class="filter-picker">
							{{ filterChildIndex === 0 ? '全部' : childNames[filterChildIndex - 1] || '请选择' }}
							<text class="picker-arrow">›</text>
						</view>
					</picker>
				</view>
				<view class="filter-item">
					<text class="filter-label">类型</text>
					<picker :value="filterTypeIndex" :range="['全部'].concat(taskTypes)" @change="onFilterTypeChange">
						<view class="filter-picker">
							{{ filterTypeIndex === 0 ? '全部' : taskTypes[filterTypeIndex - 1] || '请选择' }}
							<text class="picker-arrow">›</text>
						</view>
					</picker>
				</view>
			</view>
		</view>

		<!-- AI生成任务浮动按钮 -->
		<view class="ai-float-btn" @click="showAIGenerate">
			<text class="ai-icon">🤖</text>
			<text class="ai-text">AI生成</text>
		</view>

		<view class="section">
			<view class="section-header">
				<text class="section-title">📋 任务列表</text>
				<button class="add-btn" @click="showAddModal = true">+ 新建任务</button>
			</view>
			<view class="task-list">
				<view class="task-card" v-for="task in filteredTasks" :key="task.id">
					<view class="task-icon">{{ getTaskIcon(task.type) }}</view>
					<view class="task-content">
						<view class="task-header">
							<text class="task-title">{{ task.title }}</text>
							<text class="task-difficulty" :class="task.difficulty">{{ getDifficultyText(task.difficulty) }}</text>
						</view>
						<text class="task-desc">{{ task.description }}</text>
						<view class="task-meta">
							<text class="meta-item">👧 {{ task.child_name }}</text>
							<text class="meta-item">⭐ {{ task.base_points }}积分</text>
							<text v-if="task.reward_points && (!task.need_audit || task.audit_status === 'approved')" class="meta-item reward">🎁 +{{ task.reward_points }}</text>
							<text v-if="task.reward_points && task.need_audit && task.audit_status !== 'approved'" class="meta-item audit-pending">🎁 待审核</text>
							<text class="meta-item type-tag">{{ task.type }}</text>
							<text v-if="task.textbook_name" class="meta-item textbook-tag">📚 {{ task.textbook_name }}</text>
						</view>
						<view class="task-footer">
							<text class="task-status" :class="task.status">{{ getStatusText(task.status) }}</text>
							<view class="task-actions">
								<text class="action-btn" @click="editTask(task)">✏️</text>
								<text class="action-btn" @click="deleteTask(task)">🗑️</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view class="modal-overlay" v-if="showAddModal" @click="closeModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">{{ editingTask ? '编辑任务' : '新建任务' }}</text>
					<text class="modal-close" @click="closeModal">✕</text>
				</view>
				<view class="modal-body">
					<view class="form-item" v-if="!editingTask">
						<view class="template-switch">
							<text class="form-label">使用模板</text>
							<switch :checked="useTemplate" @change="onUseTemplateChange" />
						</view>
					</view>
					<view class="form-item" v-if="useTemplate && !editingTask">
						<text class="form-label">选择模板</text>
						<CustomPicker 
							:options="templateNames" 
							v-model="templateIndex" 
							:title="'选择任务模板'" 
							:placeholder="'请选择模板'"
							:auto-select-first="false"
							@change="onTemplateChange"
						/>
					</view>
					<view class="form-item">
						<text class="form-label">任务标题</text>
						<input class="form-input" v-model="formData.title" placeholder="请输入任务标题" />
					</view>
					<view class="form-item">
						<text class="form-label">任务描述</text>
						<textarea class="form-textarea" v-model="formData.description" placeholder="请输入任务描述"></textarea>
					</view>
					<view class="form-item">
						<text class="form-label">任务类型</text>
						<CustomPicker 
							:options="taskTypes" 
							v-model="typeIndex" 
							:title="'选择任务类型'" 
							:placeholder="'请选择类型'"
							:auto-select-first="false"
							@change="onTypeChange"
						/>
					</view>
					<view class="form-item">
						<text class="form-label">难度等级</text>
						<CustomPicker 
							:options="difficulties" 
							v-model="difficultyIndex" 
							:title="'选择难度等级'" 
							:placeholder="'请选择难度'"
							:auto-select-first="false"
							@change="onDifficultyChange"
						/>
					</view>
					<view class="form-item">
						<text class="form-label">基础积分</text>
						<input class="form-input" type="number" v-model="formData.base_points" placeholder="请输入基础积分" />
					</view>
					<view class="form-item" v-if="formData.need_audit">
						<text class="form-label">奖励积分</text>
						<input class="form-input" type="number" v-model="formData.reward_points" placeholder="请输入奖励积分（完成任务额外奖励）" />
					</view>
					<view class="form-item">
						<text class="form-label">截止时间</text>
						<picker mode="date" :value="formatTimestampToDate(formData.deadline_time)" @change="onDeadlineChange">
							<view class="form-picker">
								{{ formatTimestampToDate(formData.deadline_time) || '请选择截止时间' }}
								<text class="picker-arrow">›</text>
							</view>
						</picker>
					</view>
					<view class="form-item">
						<view class="audit-switch">
							<text class="form-label">需要审核</text>
							<switch :checked="formData.need_audit" @change="onAuditChange" />
						</view>
					</view>
					<view class="form-item">
						<text class="form-label">关联儿童</text>
						<CustomPicker 
							:options="childNames" 
							v-model="childIndex" 
							:title="'选择关联儿童'" 
							:placeholder="'请选择儿童'"
							:auto-select-first="false"
							@change="onChildChange"
						/>
					</view>
					<view class="form-item">
						<text class="form-label">绑定教材</text>
						<CustomPicker 
							:options="textbookNames" 
							v-model="textbookIndex" 
							:title="'选择绑定教材'" 
							:placeholder="'请选择教材（可选）'"
							:auto-select-first="false"
							@change="onTextbookChange"
						/>
					</view>
				</view>
				<view class="modal-footer">
					<button class="btn btn-secondary" @click="closeModal">取消</button>
					<button class="btn btn-primary" @click="saveTask">保存</button>
				</view>
			</view>
		</view>

		<!-- AI生成任务弹窗 -->
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
						<picker :value="aiDifficultyIndex" :range="difficulties" @change="onAIDifficultyChange">
							<view class="form-picker">
								{{ difficulties[aiDifficultyIndex] }}
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
		
		<custom-tab-bar ref="tabBar"></custom-tab-bar>
	</view>
</template>

<script>
	import customTabBar from '@/custom-tab-bar/index.vue'
	import CustomPicker from '@/components/CustomPicker.vue'
	import UserManager from '@/common/user-manager.js'
	import { feishuRequest } from '@/common/feishu-request.js'
	import CategoryManager from '@/common/category-manager.js'
	export default {
		components: { customTabBar, CustomPicker },
		data() {
			return {
				tasks: [],
				currentFilter: 'all',  // 'all' | '进行中' | '已完成'
				showAddModal: false,
				editingTask: null,
				formData: {
					title: '',
					description: '',
					type: '',
					type_text: '',
					difficulty: '',
					base_points: '',
					reward_points: '',
					deadline_time: '',
					need_audit: false,
					child_name: '',
					child_id: '',
					textbook_id: '',
					textbook_name: ''
				},
				taskTypes: [],  // 任务类型选项（从localStorage获取）
				typeIndex: -1,
				difficulties: [],         // 难度选项（从localStorage获取）
				difficultyIndex: -1,
				children: [],            // 儿童列表
				childIndex: -1,
				childNames: [],
				parentPhone: '',
				// 模板相关
				useTemplate: false,
				templates: [],           // 任务模板列表
				templateIndex: -1,
				templateNames: [],       // 模板名称列表
				// AI生成任务相关
				showAIModal: false,
				aiPrompt: '',
				taskCounts: [3, 5, 7, 10],
				taskCountIndex: 1,
				aiDifficultyIndex: 1,  // AI弹窗专用的难度索引
				// 筛选相关
				filterChildIndex: 0,    // 儿童筛选索引，0表示全部
				filterTypeIndex: 0,     // 类型筛选索引，0表示全部
				// 教材相关
				textbooks: [],           // 教材列表
				textbookNames: [],       // 教材名称列表
				textbookIndex: -1        // 教材选择索引
			}
		},
		computed: {
			filteredTasks() {
				let result = this.tasks
				
				// 状态筛选
				if (this.currentFilter !== 'all') {
					result = result.filter(task => task.status === this.currentFilter)
				}
				
				// 儿童筛选
				if (this.filterChildIndex > 0) {
					const selectedChildName = this.childNames[this.filterChildIndex - 1]
					result = result.filter(task => task.child_name === selectedChildName)
				}
				
				// 类型筛选
				if (this.filterTypeIndex > 0) {
					const selectedType = this.taskTypes[this.filterTypeIndex - 1]
					result = result.filter(task => task.type === selectedType || task.type_text === selectedType)
				}
				
				return result
			}
		},
		methods: {
			getTaskIcon(type) {
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
				if (!difficulty) return '简单'
				// 如果 difficulty 已经是中文，直接返回
				if (['简单', '中等', '困难'].includes(difficulty)) {
					return difficulty
				}
				// 英文标识转中文，以及同义词映射
				const texts = { 
					easy: '简单', 
					medium: '中等', 
					hard: '困难',
					'适中': '中等',
					'moderate': '中等'
				}
				return texts[difficulty] || difficulty
			},
			getStatusText(status) {
				const texts = { active: '进行中', completed: '已完成', paused: '已暂停' }
				return texts[status] || status
			},
			editTask(task) {
				this.editingTask = task
				this.formData = {
					title: task.title,
					description: task.description,
					type: task.type,
					type_text: task.type_text,
					difficulty: task.difficulty,
					base_points: task.base_points.toString(),
					reward_points: task.reward_points ? task.reward_points.toString() : '',
					deadline_time: task.deadline_time || '',
					need_audit: task.need_audit || false,
					child_name: task.child_name,
					child_id: task.child_id,
					textbook_id: task.textbook_id || '',
					textbook_name: task.textbook_name || ''
				}
				// 任务类型回显：先匹配type_text，再匹配type，都找不到则设为-1
				let typeIdx = this.taskTypes.indexOf(task.type_text)
				if (typeIdx === -1) {
					typeIdx = this.taskTypes.indexOf(task.type)
				}
				this.typeIndex = typeIdx
				console.log('[Tasks] 编辑任务类型回显:', task.type_text, task.type, typeIdx, this.taskTypes)
				
				// 难度回显：先将英文转换为中文，再匹配
				const difficultyText = this.getDifficultyText(task.difficulty)
				let difficultyIdx = this.difficulties.indexOf(difficultyText)
				if (difficultyIdx === -1) {
					difficultyIdx = this.difficulties.indexOf(task.difficulty)
				}
				this.difficultyIndex = difficultyIdx
				console.log('[Tasks] 编辑任务难度回显:', task.difficulty, difficultyText, difficultyIdx, this.difficulties)
				
				// 关联儿童回显：根据child_id匹配儿童索引，支持多种id格式
				const normalizedChildId = this.normalizeChildId(task.child_id)
				this.childIndex = this.children.findIndex(c => {
					const childKey = this.normalizeChildId(c.child_id || c.id || c.record_id)
					return childKey === normalizedChildId || 
						   childKey.includes(normalizedChildId) || 
						   normalizedChildId.includes(childKey)
				})
				console.log('[Tasks] 编辑任务儿童回显:', task.child_id, normalizedChildId, this.childIndex)
				
				// 绑定教材回显：根据textbook_id匹配教材索引
				this.textbookIndex = this.textbooks.findIndex(t => t.id === task.textbook_id)
				console.log('[Tasks] 编辑任务教材回显:', task.textbook_id, this.textbookIndex)
				
				this.showAddModal = true
			},
			deleteTask(task) {
				uni.showModal({
					title: '确认删除',
					content: `确定要删除任务 "${task.title}" 吗？`,
					success: async (res) => {
						if (res.confirm) {
							uni.showLoading({ title: '删除中...' })
							try {
								const success = await this.deleteTaskFromTable(task.id)
								if (success) {
									this.tasks = this.tasks.filter(t => t.id !== task.id)
									uni.showToast({ title: '删除成功', icon: 'success' })
								} else {
									uni.showToast({ title: '删除失败', icon: 'none' })
								}
							} catch (error) {
								console.error('[Tasks] 删除任务失败:', error)
								uni.showToast({ title: '删除失败', icon: 'none' })
							}
							uni.hideLoading()
						}
					}
				})
			},
			// 将时间戳转换为日期字符串 YYYY-MM-DD
			formatTimestampToDate(timestamp) {
				if (!timestamp) return ''
				const date = new Date(parseInt(timestamp))
				const year = date.getFullYear()
				const month = String(date.getMonth() + 1).padStart(2, '0')
				const day = String(date.getDate()).padStart(2, '0')
				return `${year}-${month}-${day}`
			},
			// CustomPicker的change事件处理 - 任务类型
			onTypeChange(index, option) {
				this.formData.type_text = option
				this.formData.type = option
			},
			// CustomPicker的change事件处理 - 难度等级
			onDifficultyChange(index, option) {
				this.formData.difficulty = option
			},
			// CustomPicker的change事件处理 - 关联儿童
			onChildChange(index, option) {
				this.formData.child_name = option
				this.formData.child_id = this.children[index]?.child_id || this.children[index]?.id || ''
			},
			// CustomPicker的change事件处理 - 绑定教材
			onTextbookChange(index, option) {
				this.formData.textbook_name = option
				this.formData.textbook_id = this.textbooks[index]?.id || ''
			},
			onAuditChange(e) {
				this.formData.need_audit = e.detail.value
			},
			onDeadlineChange(e) {
				const dateStr = e.detail.value
				if (dateStr) {
					// 将日期字符串转换为Unix时间戳（毫秒）
					const timestamp = new Date(dateStr).getTime()
					this.formData.deadline_time = timestamp
				} else {
					this.formData.deadline_time = ''
				}
			},
			onFilterChildChange(e) {
				this.filterChildIndex = e.detail.value
			},
			onFilterTypeChange(e) {
				this.filterTypeIndex = e.detail.value
			},
			closeModal() {
				this.showAddModal = false
				this.editingTask = null
				this.formData = {
					title: '',
					description: '',
					type: '',
					type_text: '',
					difficulty: '',
					base_points: '',
					reward_points: '',
					deadline_time: '',
					need_audit: false,
					child_name: '',
					child_id: '',
					textbook_id: '',
					textbook_name: ''
				}
				this.typeIndex = -1
				this.difficultyIndex = -1
				this.childIndex = -1
				this.textbookIndex = -1
				this.useTemplate = false
				this.templateIndex = -1
			},
			onUseTemplateChange(e) {
				this.useTemplate = e.detail.value
				if (this.useTemplate) {
					this.loadTemplates()
				} else {
					this.templateIndex = -1
				}
			},
			onTemplateChange(index, option) {
				const template = this.templates[index]
				if (template) {
					this.formData.title = template.title || ''
					this.formData.description = template.description || ''
					this.formData.type = template.type || ''
					this.formData.type_text = template.type_text || ''
					this.formData.difficulty = template.difficulty || ''
					this.formData.base_points = template.base_points ? template.base_points.toString() : ''
					
					if (template.type_text) {
						this.typeIndex = this.taskTypes.indexOf(template.type_text)
						if (this.typeIndex === -1) {
							this.typeIndex = this.taskTypes.indexOf(template.type)
						}
					}
					
					if (template.difficulty) {
						const difficultyText = this.getDifficultyText(template.difficulty)
						this.difficultyIndex = this.difficulties.indexOf(difficultyText)
						if (this.difficultyIndex === -1) {
							this.difficultyIndex = this.difficulties.indexOf(template.difficulty)
						}
					}
				}
			},
			async loadTemplates() {
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
								difficulty: item.fields.difficulty || '',
								base_points: item.fields.base_points || 0
							}
						})
						this.templateNames = this.templates.map(t => t.title || '未命名模板')
					} else {
						this.templates = []
						this.templateNames = []
					}
				} catch (error) {
					console.error('[Tasks] 加载模板列表失败:', error)
					this.templates = []
					this.templateNames = []
				}
			},
			async saveTask() {
				if (!this.formData.title || !this.formData.type || !this.formData.difficulty || !this.formData.base_points || !this.formData.child_id) {
					uni.showToast({ title: '请填写完整信息', icon: 'none' })
					return
				}

				uni.showLoading({ title: '保存中...' })

				const taskData = {
					title: this.formData.title,
					description: this.formData.description,
					type: this.formData.type,
					difficulty: this.formData.difficulty,
					base_points: parseInt(this.formData.base_points),
					reward_points: this.formData.reward_points ? parseInt(this.formData.reward_points) : 0,
					deadline_time: this.formData.deadline_time || '',
					need_audit: this.formData.need_audit || false,
					child_id: this.formData.child_id,
					textbook_id: this.formData.textbook_id || '',
					status: '未开始'
				}

				try {
					if (this.editingTask) {
						const success = await this.updateTaskToTable(this.editingTask.id, taskData)
						if (success) {
							const index = this.tasks.findIndex(t => t.id === this.editingTask.id)
							if (index >= 0) {
								this.tasks[index] = { ...this.tasks[index], ...taskData }
							}
							uni.showToast({ title: '修改成功', icon: 'success' })
						} else {
							uni.showToast({ title: '修改失败', icon: 'none' })
						}
					} else {
						const recordId = await this.addTaskToTable(taskData)
						if (recordId) {
							this.tasks.unshift({
								id: recordId,
								...taskData,
								status: '未开始'
							})
							uni.showToast({ title: '创建成功', icon: 'success' })
						} else {
							uni.showToast({ title: '创建失败', icon: 'none' })
						}
					}
				} catch (error) {
					console.error('[Tasks] 保存任务失败:', error)
					uni.showToast({ title: '保存失败', icon: 'none' })
				}

				uni.hideLoading()
				this.closeModal()
			},
			showAIGenerate() {
				this.showAIModal = true
			},
			closeAIModal() {
				this.showAIModal = false
				this.aiPrompt = ''
				this.taskCountIndex = 1
				this.aiDifficultyIndex = 1
			},
			onTaskCountChange(e) {
				this.taskCountIndex = e.detail.value
			},
			// AI弹窗中原生picker的难度变化处理
			onAIDifficultyChange(e) {
				this.aiDifficultyIndex = e.detail.value
			},
			generateTasks() {
				if (!this.aiPrompt.trim()) {
					uni.showToast({ title: '请输入生成主题', icon: 'none' })
					return
				}
				uni.showLoading({ title: 'AI生成中...' })
				setTimeout(() => {
					uni.hideLoading()
					uni.showToast({ title: '生成成功！', icon: 'success' })
					this.closeAIModal()
					this.loadTasks()
				}, 2000)
			},
			async loadCategories() {
				try {
					const categories = await CategoryManager.loadCategories('tasks-page')
					if (categories) {
						// 任务类型从分类表的 task_type 字段获取
						if (categories.task_type && categories.task_type.length > 0) {
							this.taskTypes = categories.task_type.map(t => t.label)
						} else {
							this.loadCategoriesFromStorage()
						}
						// 难度等级从分类表的 task_difficulty 字段获取
						if (categories.task_difficulty && categories.task_difficulty.length > 0) {
							this.difficulties = categories.task_difficulty.map(d => d.label)
						} else {
							this.loadDifficultiesFromStorage()
						}
						// 任务状态从分类表的 task_status 字段获取
						if (categories.task_status && categories.task_status.length > 0) {
							this.taskStatuses = categories.task_status.map(s => s.label)
						} else {
							this.taskStatuses = ['未开始', '进行中', '已完成', '已取消']
						}
					} else {
						// 分类数据加载失败，从 localStorage 获取
						this.loadCategoriesFromStorage()
						this.loadDifficultiesFromStorage()
						this.taskStatuses = ['未开始', '进行中', '已完成', '已取消']
					}
				} catch (error) {
					console.error('[Tasks] 加载分类数据失败:', error)
					// 异常情况从 localStorage 获取
					this.loadCategoriesFromStorage()
					this.loadDifficultiesFromStorage()
					this.taskStatuses = ['未开始', '进行中', '已完成', '已取消']
				}
			},
			loadCategoriesFromStorage() {
				try {
					const categoriesStr = localStorage.getItem('categories')
					console.log('categoriesStr------',categoriesStr);
					
					if (categoriesStr) {
						const categories = JSON.parse(categoriesStr)
						if (categories[0].fields.task_type && categories[0].fields.task_type.length > 0) {
							this.taskTypes = categories[0].fields.task_type
						}
					}
					console.log('this.taskTypes------',this.taskTypes);

					// 如果 localStorage 也没有数据，使用默认值
					if (!this.taskTypes || this.taskTypes.length === 0) {
						this.taskTypes = []
					}
				} catch (error) {
					console.error('[Tasks] 从localStorage加载任务类型失败:', error)
					this.taskTypes = []
				}
			},
			loadDifficultiesFromStorage() {
				try {
					const categoriesStr = localStorage.getItem('categories')
					console.log('categoriesStr------',categoriesStr);
					
					if (categoriesStr) {
						const categories = JSON.parse(categoriesStr)
						if (categories[0].fields.task_difficulty && categories[0].fields.task_difficulty.length > 0) {
							this.difficulties = categories[0].fields.task_difficulty
						}
					}
					console.log('this.difficulties------',this.difficulties);

					// 如果 localStorage 也没有数据，使用默认值
					if (!this.difficulties || this.difficulties.length === 0) {
						this.difficulties = []
					}
				} catch (error) {
					console.error('[Tasks] 从localStorage加载难度失败:', error)
					this.difficulties = []
				}
			},
			async loadChildren() {
				try {
					const parent = await UserManager.getCurrentParent()
					if (parent && parent.phone) {
						this.parentPhone = parent.phone
						const childList = await UserManager.getChildrenByParent(parent.phone)
						this.children = childList.map(child => ({
							...child,
							name: child.name 
								? (Array.isArray(child.name) && child.name[0] && child.name[0].text 
									? child.name[0].text 
									: child.name)
								: ''
						}))
						this.childNames = this.children.map(c => c.name)
					}
				} catch (error) {
					console.error('[Tasks] 加载儿童列表失败:', error)
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
								subject: item.fields.subject || ''
							}
						})
						this.textbookNames = this.textbooks.map(t => t.name)
					}
				} catch (error) {
					console.error('[Tasks] 加载教材列表失败:', error)
				}
			},
			getChildName(childId) {
				if (!childId) return '未关联'
				// 处理多种格式的childId
				const childIdStr = this.normalizeChildId(childId)
				const child = this.children.find(c => {
					const childKey = c.child_id || c.id || c.record_id
					const childKeyStr = this.normalizeChildId(childKey)
					return childKeyStr === childIdStr || 
						   childKeyStr.includes(childIdStr) || 
						   childIdStr.includes(childKeyStr)
				})
				return child ? child.name : '未知儿童'
			},
			normalizeChildId(id) {
				if (!id) return ''
				if (typeof id === 'string') return id.trim()
				if (Array.isArray(id)) {
					if (id[0] && id[0].text !== undefined) return id[0].text.trim()
					if (id[0] && typeof id[0] === 'string') return id[0].trim()
					return JSON.stringify(id)
				}
				if (typeof id === 'object') {
					if (id.value && Array.isArray(id.value) && id.value[0] && id.value[0].text) {
						return id.value[0].text.trim()
					}
					if (id.text) return String(id.text).trim()
					return JSON.stringify(id)
				}
				return String(id).trim()
			},
			parseChildName(childName) {
				if (!childName) return '未关联'
				// 支持数据结构：{ type: 1, value: [{ text: "顺顺" }] }
				if (typeof childName === 'object') {
					if (childName.value && Array.isArray(childName.value) && childName.value[0] && childName.value[0].text) {
						return childName.value[0].text.trim()
					}
					if (childName.text) return String(childName.text).trim()
					if (Array.isArray(childName) && childName[0] && childName[0].text) {
						return childName[0].text.trim()
					}
				}
				if (typeof childName === 'string') return childName.trim()
				return '未知儿童'
			},
			parseTextbookName(textbookId) {
				if (!textbookId) return ''
				// 从已加载的教材列表中查找教材名称
				const textbook = this.textbooks.find(t => t.id === textbookId)
				if (textbook) return textbook.name
				return ''
			},
			setFilter(filter) {
				this.currentFilter = filter
			},
			async loadTasks() {
				uni.showLoading({ title: '加载中...' })
				try {
					const result = await feishuRequest.queryRecords('任务表')
					
					if (result.success && result.data && result.data.length > 0) {
						this.tasks = result.data.map(item => {
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
							
							// 使用 normalizeChildId 统一处理 child_id
							const childId = this.normalizeChildId(item.fields.child_id || item.fields.childId || '')
							
							// 解析 child_name，支持多种数据结构
							const childName = this.parseChildName(item.fields.child_name)
							
							// 获取奖励积分和审核相关字段
								const reward_points = item.fields.reward_points || 0
								const need_audit = item.fields.need_audit || false
								const audit_status = item.fields.audit_status || 'pending'
								
								// 解析教材名称
								const textbookName = this.parseTextbookName(item.fields.textbook_id)
								
								return {
									id: item.record_id,
									title: title,
									description: description,
									type: item.fields.type || '',
									type_text: item.fields.type_text || '',
									difficulty: item.fields.difficulty || '简单',
									base_points: item.fields.base_points || 0,
									reward_points: reward_points,
									need_audit: need_audit,
									audit_status: audit_status,
									child_id: childId,
									child_name: childName,
									textbook_id: item.fields.textbook_id || '',
									textbook_name: textbookName,
									status: item.fields.status || '未开始',
									updated_at: item.fields.updated_at || item.created_at || Date.now()
								}
						})
						this.tasks.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
					} else {
						this.tasks = []
					}
				} catch (error) {
					console.error('[Tasks] 加载任务列表失败:', error)
					this.tasks = []
				}
				uni.hideLoading()
			},
			async addTaskToTable(taskData) {
				try {
					const data = {
						title: taskData.title,
						description: taskData.description,
						type: taskData.type,
						difficulty: taskData.difficulty,
						base_points: taskData.base_points,
						need_audit: taskData.need_audit || false,
						child_id: taskData.child_id,
						status: taskData.status || '进行中'
					}
					// 只有有值时才添加字段
					if (taskData.reward_points && taskData.reward_points > 0) {
						data.reward_points = taskData.reward_points
					}
					if (taskData.deadline_time) {
						data.deadline_time = taskData.deadline_time
					}
					if (taskData.textbook_id) {
						data.textbook_id = taskData.textbook_id
					}
					const result = await feishuRequest.addRecord('任务表', data)
					if (result.success) {
						return result.recordId
					}
					return null
				} catch (error) {
					console.error('[Tasks] 添加任务失败:', error)
					return null
				}
			},
			async updateTaskToTable(taskId, taskData) {
				try {
					const data = {
						title: taskData.title,
						description: taskData.description,
						type: taskData.type,
						type_text: taskData.type_text,
						difficulty: taskData.difficulty,
						base_points: taskData.base_points,
						need_audit: taskData.need_audit || false,
						child_id: taskData.child_id,
						child_name: taskData.child_name
					}
					// 只有有值时才添加字段
					if (taskData.reward_points && taskData.reward_points > 0) {
						data.reward_points = taskData.reward_points
					}
					if (taskData.deadline_time) {
						data.deadline_time = taskData.deadline_time
					}
					if (taskData.textbook_id) {
						data.textbook_id = taskData.textbook_id
					}
					const result = await feishuRequest.updateRecord('任务表', taskId, data)
					if (result.success) {
						return true
					}
					return false
				} catch (error) {
					console.error('[Tasks] 更新任务失败:', error)
					return false
				}
			},
			async deleteTaskFromTable(taskId) {
				try {
					const result = await feishuRequest.deleteRecord('任务表', taskId)
					if (result.success) {
						return true
					}
					return false
				} catch (error) {
					console.error('[Tasks] 删除任务失败:', error)
					return false
				}
			}
		},
		async onLoad() {
			await this.loadChildren()
			await this.loadCategories()
			await this.loadTextbooks()
		},
		async onShow() {
			if (this.$refs.tabBar) {
				this.$refs.tabBar.updateSelected('/pages/parent/tasks')
			}
			await this.loadTasks()
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

	.filter-section {
		background-color: #fff;
		margin: 20rpx;
		border-radius: 16rpx;
		padding: 25rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
	}

	.filter-row {
		display: flex;
		gap: 30rpx;
	}

	.filter-item {
		flex: 1;
	}

	.filter-label {
		font-size: 26rpx;
		color: #666;
		display: block;
		margin-bottom: 12rpx;
		font-weight: 500;
	}

	.filter-picker {
		width: 100%;
		height: 80rpx;
		padding: 0 24rpx;
		border: 2rpx solid #f0f0f0;
		border-radius: 12rpx;
		font-size: 28rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		color: #333;
		background-color: #fafafa;
		transition: all 0.2s ease;

		&:active {
			background-color: #f0f0f0;
			border-color: #667eea;
		}
	}

	.ai-float-btn {
		position: fixed;
		top: 200rpx;
		right: 30rpx;
		width: 120rpx;
		height: 120rpx;
		background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
		border-radius: 50%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 32rpx rgba(79, 172, 254, 0.4);
		z-index: 100;
	}

	.ai-icon {
		font-size: 40rpx;
		margin-bottom: 4rpx;
	}

	.ai-text {
		font-size: 20rpx;
		color: #fff;
	}

	.section {
		background-color: #fff;
		margin: 20rpx;
		border-radius: 16rpx;
		padding: 25rpx;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 25rpx;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.add-btn {
		height: 60rpx;
		padding: 0 25rpx;
		border-radius: 30rpx;
		font-size: 26rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		border: none;
	}

	.task-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.task-card {
		display: flex;
		padding: 25rpx;
		background-color: #fafafa;
		border-radius: 16rpx;
	}

	.task-icon {
		font-size: 50rpx;
		margin-right: 20rpx;
	}

	.task-content {
		flex: 1;
	}

	.task-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10rpx;
	}

	.task-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
	}

	.task-difficulty {
		font-size: 22rpx;
		padding: 6rpx 12rpx;
		border-radius: 10rpx;

		&.easy {
			background-color: #e8f5e9;
			color: #4caf50;
		}

		&.medium {
			background-color: #fff3e0;
			color: #ff9500;
		}

		&.hard {
			background-color: #ffebee;
			color: #f44336;
		}
	}

	.task-desc {
		font-size: 24rpx;
		color: #999;
		display: block;
		margin-bottom: 15rpx;
	}

	.task-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 15rpx;
		margin-bottom: 15rpx;
	}

	.meta-item {
		font-size: 22rpx;
		color: #666;

		&.reward {
			color: #ff9500;
			font-weight: bold;
		}

		&.audit-pending {
			color: #999;
			font-style: italic;
		}
	}

	.task-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.task-status {
		font-size: 22rpx;
		padding: 6rpx 16rpx;
		border-radius: 20rpx;

		&.active {
			background-color: #e3f2fd;
			color: #2196f3;
		}

		&.completed {
			background-color: #e8f5e9;
			color: #4caf50;
		}

		&.paused {
			background-color: #f5f5f5;
			color: #999;
		}
	}

	.task-actions {
		display: flex;
		gap: 15rpx;
	}

	.action-btn {
		width: 50rpx;
		height: 50rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background-color: #fff;
		font-size: 24rpx;
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

	.template-switch, .audit-switch {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10rpx 0;
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
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
					<uni-data-select
						v-model="filterChildId"
						:localdata="filterChildOptions"
						placeholder="全部"
					/>
				</view>
				<view class="filter-item">
					<text class="filter-label">类型</text>
					<uni-data-select
						v-model="filterTypeId"
						:localdata="filterTypeOptions"
						placeholder="全部"
					/>
				</view>
			</view>
			<view class="filter-row">
				<view class="filter-item">
					<text class="filter-label">开始时间</text>
					<uni-datetime-picker
						v-model="filterStartTime"
						type="date"
						return-type="timestamp"
						placeholder="选择开始时间"
					/>
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
				<button class="add-btn" @click="creatTask">+ 新建任务</button>
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
				<view v-if="filteredTasks.length === 0" class="empty-state">
					<text class="empty-icon">📭</text>
					<text class="empty-text">暂无任务数据</text>
					<text class="empty-hint">点击右上角按钮创建新任务</text>
				</view>
			</view>
		</view>

		<!-- 任务表单弹窗 -->
		<TaskFormModal
			:visible="showAddModal"
			:editing-task="editingTask"
			:task-types="taskTypes"
			:difficulties="difficulties"
			:children="children"
			:textbooks="textbooks"
			@close="showAddModal = false"
			@save="handleTaskSave"
		/>

		<!-- AI生成任务弹窗 -->
		<AITaskModal
			:visible="showAIModal"
			:difficulties="difficulties"
			@close="showAIModal = false"
			@generate="handleGenerateTasks"
		/>
		
		<custom-tab-bar ref="tabBar"></custom-tab-bar>
	</view>
</template>

<script>
	import customTabBar from '@/custom-tab-bar/index.vue'
	import TaskFormModal from '@/components/TaskFormModal.vue'
	import AITaskModal from '@/components/AITaskModal.vue'
	import UserManager from '@/common/user-manager.js'
	import { feishuRequest } from '@/common/feishu-request.js'
	import CategoryManager from '@/common/category-manager.js'
	export default {
		components: { customTabBar, TaskFormModal, AITaskModal },
		data() {
			return {
				tasks: [],
				currentFilter: 'all',  // 'all' | '进行中' | '已完成'
				showAddModal: false,
				editingTask: null,
				taskTypes: [],  // 任务类型选项（从localStorage获取）
				difficulties: [],         // 难度选项（从localStorage获取）
				children: [],            // 儿童列表
				childNames: [],
				parentPhone: '',
				// AI生成任务相关
				showAIModal: false,
				// 筛选相关
				filterChildId: '',      // 儿童筛选ID
				filterTypeId: '',       // 类型筛选值
				filterStartTime: '',    // 开始时间筛选（时间戳）
				// 教材相关
				textbooks: [],           // 教材列表
				textbookNames: []        // 教材名称列表
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
				// 儿童选项（用于uni-data-select）
				childOptions() {
					return this.children.map((child, index) => ({
						value: index.toString(),
						text: child.name
					}))
				},
				// 筛选儿童选项（包含全部选项）
				filterChildOptions() {
					return [{
						value: '',
						text: '全部'
					}, ...this.children.map(child => ({
						value: child.child_id,
						text: child.name
					}))]
				},
				// 筛选类型选项（包含全部选项）
				filterTypeOptions() {
					return [{
						value: '',
						text: '全部'
					}, ...this.taskTypes.map(type => ({
						value: type,
						text: type
					}))]
				},
				// 教材选项（用于uni-data-select）
				textbookOptions() {
					return this.textbooks.map(textbook => ({
						value: textbook.id,
						text: textbook.name
					}))
				},
				// 模板选项（用于uni-data-select）
				templateOptions() {
					return this.templates.map((template, index) => ({
						value: index.toString(),
						text: template.title || '未命名模板'
					}))
				},
			filteredTasks() {
				let result = this.tasks
				
				// 状态筛选
				if (this.currentFilter !== 'all') {
					result = result.filter(task => task.status === this.currentFilter)
				}
				
				// 儿童筛选
				if (this.filterChildId) {
					result = result.filter(task => task.child_id === this.filterChildId)
				}
				
				// 类型筛选
				if (this.filterTypeId) {
					result = result.filter(task => task.type === this.filterTypeId || task.type_text === this.filterTypeId)
				}
				
				// 开始时间筛选
				if (this.filterStartTime) {
					result = result.filter(task => {
						const taskTime = task.created_at || task.start_time || Date.now()
						return Number(taskTime) >= Number(this.filterStartTime)
					})
				}
				
				return result
			}
		},
		watch: {
			filterChildId() {
				this.loadTasks()
			},
			filterTypeId() {
				this.loadTasks()
			},
			filterStartTime() {
				this.loadTasks()
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
			creatTask(){
				this.editingTask = null
				this.showAddModal = true
			},
			editTask(task) {
				this.editingTask = task
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
			showAIGenerate() {
				this.showAIModal = true
			},
			// 处理任务保存
			async handleTaskSave({ data, isEdit, editId }) {
				uni.showLoading({ title: '保存中...' })

				try {
					if (isEdit) {
						const success = await this.updateTaskToTable(editId, data)
						if (success) {
							const index = this.tasks.findIndex(t => t.id === editId)
							if (index >= 0) {
								this.tasks[index] = { ...this.tasks[index], ...data }
							}
							uni.showToast({ title: '修改成功', icon: 'success' })
						} else {
							uni.showToast({ title: '修改失败', icon: 'none' })
						}
					} else {
						const recordId = await this.addTaskToTable(data)
						if (recordId) {
							this.tasks.unshift({
								id: recordId,
								...data,
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
				this.editingTask = null
			},
			// 处理AI生成任务
			handleGenerateTasks({ prompt, count, difficulty }) {
				uni.showLoading({ title: 'AI生成中...' })
				setTimeout(() => {
					uni.hideLoading()
					uni.showToast({ title: '生成成功！', icon: 'success' })
					this.showAIModal = false
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
					this.taskTypes = CategoryManager.getTaskTypes()
					console.log('this.taskTypes------', this.taskTypes);
				} catch (error) {
					console.error('[Tasks] 从CategoryManager加载任务类型失败:', error)
					this.taskTypes = []
				}
			},
			loadDifficultiesFromStorage() {
				try {
					this.difficulties = CategoryManager.getDifficulties()
					console.log('this.difficulties------', this.difficulties);
				} catch (error) {
					console.error('[Tasks] 从CategoryManager加载难度失败:', error)
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
					// 构建筛选条件
					const filter = {}
					
					// 儿童筛选
					if (this.filterChildId) {
						filter.child_id = this.filterChildId
					}
					
					// 类型筛选
					if (this.filterTypeId) {
						filter.type = this.filterTypeId
					}
					
					// 开始时间筛选（使用数组格式）
					if (this.filterStartTime) {
						filter.start_time = ["ExactDate", this.filterStartTime.toString()]
					}
					
					const result = await feishuRequest.queryRecords('任务表', filter)
					
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
		min-height: 400rpx;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 100rpx 40rpx;
	}

	.empty-icon {
		font-size: 120rpx;
		margin-bottom: 30rpx;
	}

	.empty-text {
		font-size: 32rpx;
		color: #999;
		margin-bottom: 15rpx;
	}

	.empty-hint {
		font-size: 26rpx;
		color: #ccc;
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

	</style>
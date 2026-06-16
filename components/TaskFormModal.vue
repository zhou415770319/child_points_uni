<template>
	<view class="modal-overlay" v-if="visible" @click="handleClose">
		<view class="modal-content" @click.stop>
			<view class="modal-header">
				<text class="modal-title">{{ modalTitle }}</text>
				<text class="modal-close" @click="handleClose">✕</text>
			</view>
			<view class="modal-body">
				<!-- 模板弹框：先显示模板名称和描述 -->
				<view v-if="pageType === 'template'" class="template-section">
					<view class="section-title">📋 模板信息</view>
					<view class="form-item">
						<text class="form-label">模板名称</text>
						<input class="form-input" v-model="formData.template_title" placeholder="请输入模板名称" />
					</view>
					<view class="form-item">
						<text class="form-label">模板描述</text>
						<textarea class="form-textarea" v-model="formData.template_description" placeholder="请输入模板描述（可选）"></textarea>
					</view>
					<view class="section-divider"></view>
				</view>

				<!-- 任务弹框：是否保存为模板 -->
				<view v-if="pageType === 'task' && !editingTask" class="form-item">
					<view class="template-switch">
						<text class="form-label">保存为模板</text>
						<switch :checked="saveAsTemplate" @change="onSaveAsTemplateChange" />
					</view>
				</view>
				<view v-if="pageType === 'task' && saveAsTemplate && !editingTask" class="form-item">
					<text class="form-label">模板名称</text>
					<input class="form-input" v-model="formData.template_title" placeholder="请输入模板名称" />
				</view>

				<!-- 任务弹框：使用模板 -->
				<view class="form-item" v-if="pageType === 'task' && !editingTask">
					<view class="template-switch">
						<text class="form-label">使用模板</text>
						<switch :checked="useTemplate" @change="onUseTemplateChange" />
					</view>
				</view>
				<view class="form-item" v-if="pageType === 'task' && useTemplate && !editingTask">
					<text class="form-label">选择模板</text>
					<input 
						class="form-input" 
						v-model="templateSearchKeyword" 
						placeholder="搜索模板"
						@input="onTemplateSearch"
					/>
					<uni-data-select 
						ref="templateSelect"
						v-model="selectedTemplate" 
						:localdata="templateOptions" 
						placeholder="请选择模板"
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
					<uni-data-select 
						v-model="formData.type" 
						:localdata="taskTypeOptions" 
						placeholder="请选择类型"
						@change="onTypeChange"
					/>
				</view>
				<view class="form-item">
					<text class="form-label">难度等级</text>
					<uni-data-select 
						v-model="formData.difficulty" 
						:localdata="difficultyOptions" 
						placeholder="请选择难度"
						@change="onDifficultyChange"
					/>
				</view>
				<view class="form-item">
					<text class="form-label">基础积分</text>
					<input class="form-input" type="number" v-model="formData.base_points" placeholder="请输入基础积分" />
				</view>
				<view class="form-item">
					<view class="audit-switch">
						<text class="form-label">需要审核</text>
						<switch :checked="formData.need_audit" @change="onAuditChange" />
					</view>
				</view>
				<view class="form-item" v-if="formData.need_audit">
					<text class="form-label">奖励积分</text>
					<input class="form-input" type="number" v-model="formData.reward_points" placeholder="请输入奖励积分（完成任务额外奖励）" />
				</view>
				<!-- 任务开始时间 -->
				<view class="form-item">
					<text class="form-label">任务开始时间</text>
					<uni-datetime-picker
						v-model="formData.start_time"
						type="date"
						return-type="timestamp"
						placeholder="请选择任务开始时间"
					/>
				</view>
				<!-- 是否批量创建 -->
				<view class="form-item">
					<view class="audit-switch">
						<text class="form-label">批量创建</text>
						<switch :checked="formData.batch_create" @change="onBatchCreateChange" />
					</view>
				</view>
				<!-- 任务周期（批量创建时显示） -->
				<view class="form-item" v-if="formData.batch_create">
					<text class="form-label">任务周期</text>
					<uni-data-select 
						v-model="formData.period" 
						:localdata="periodOptions" 
						placeholder="请选择周期"
						@change="onPeriodChange"
					/>
				</view>
				<!-- 截止时间（批量创建时显示） -->
				<view class="form-item" v-if="formData.batch_create">
					<text class="form-label">截止时间</text>
					<uni-datetime-picker
						v-model="formData.deadline_time"
						type="date"
						return-type="timestamp"
						placeholder="请选择截止时间"
					/>
				</view>
				<view class="form-item">
					<text class="form-label">关联儿童</text>
					<uni-data-select 
						v-model="selectedChild" 
						:localdata="childOptions" 
						placeholder="请选择儿童"
						@change="onChildChange"
					/>
				</view>
				<view class="form-item">
					<text class="form-label">绑定教材</text>
					<uni-data-select 
						v-model="selectedTextbook" 
						:localdata="textbookOptions" 
						placeholder="请选择教材（可选）"
						@change="onTextbookChange"
					/>
				</view>
			</view>
			<view class="modal-footer">
				<button class="btn btn-secondary" @click="handleClose">取消</button>
				<button class="btn btn-primary" @click="handleSave">保存</button>
			</view>
		</view>
	</view>
</template>

<script>
	import { feishuRequest } from '@/common/feishu-request.js'

	export default {
		name: 'TaskFormModal',
		props: {
			visible: {
				type: Boolean,
				default: false
			},
			pageType: {
				type: String,
				default: 'task', // 'task' 或 'template'
				validator: (value) => ['task', 'template'].includes(value)
			},
			editingTask: {
				type: Object,
				default: null
			},
			taskTypes: {
				type: Array,
				default: () => []
			},
			difficulties: {
				type: Array,
				default: () => []
			},
			children: {
				type: Array,
				default: () => []
			},
			textbooks: {
				type: Array,
				default: () => []
			}
		},
		emits: ['close', 'save'],
		data() {
			return {
				formData: {
					title: '每日阅读',
					description: '每天阅读一篇课文',
					type: '英语',
					difficulty: '适中',
					base_points: '10',
					reward_points: '1',
					start_time: new Date().setHours(0, 0, 0, 0),
					deadline_time: '',
					batch_create: false,
					period: '',
					need_audit: false,
					child_name: '',
					child_id: '',
					textbook_id: '',
					textbook_name: '',
					template_name: '英语阅读模版',
					template_description: '英语早读'
				},
				useTemplate: false,
				saveAsTemplate: false,
				templates: [],
				selectedTemplate: '',
				selectedChild: '',
				selectedTextbook: '',
				templateSearchKeyword: ''
			}
		},
		computed: {
			modalTitle() {
				if (this.pageType === 'template') {
					return this.editingTask ? '编辑任务模板' : '新建任务模板'
				}
				console.log('this.editingTask---任务',this.editingTask,this.pageType);
				
				return this.editingTask ? '编辑任务' : '新建任务'
			},
			taskTypeOptions() {
				return this.taskTypes.map(type => ({
					value: type,
					text: type
				}))
			},
			difficultyOptions() {
				return this.difficulties.map(diff => ({
					value: diff,
					text: diff
				}))
			},
			childOptions() {
				return this.children.map((child) => ({
					value: child.child_id || child.id || '',
					text: child.name
				}))
			},
			textbookOptions() {
				return this.textbooks.map(textbook => ({
					value: textbook.id,
					text: textbook.name
				}))
			},
			templateOptions() {
				return this.templates.map((template, index) => ({
					value: index.toString(),
					text: template.template_title || template.title || '未命名模板'
				}))
			},
			periodOptions() {
				return [
					{ value: 'daily', text: '每天' },
					{ value: 'weekly', text: '每周' },
					{ value: 'monthly', text: '每月' }
				]
			}
		},
		watch: {
			visible(val) {
				if (val) {
					this.initForm()
				}
			},
			editingTask(val) {
				if (val && this.visible) {
					this.initForm()
				}
			}
		},
		methods: {
			initForm() {
				// 先清空表单数据
				this.resetForm()
				
				if (this.editingTask) {
					// 编辑模式：清空后再赋值，使用 parseFeishuField 解析飞书多维表格的嵌套格式
					this.formData = {
						title: this.editingTask.title || '',
						description: this.editingTask.description || '',
						type: this.parseFeishuField(this.editingTask.type) || '',
						difficulty: this.parseFeishuField(this.editingTask.difficulty) || '',
						base_points: this.editingTask.base_points ? this.editingTask.base_points.toString() : '',
						reward_points: this.editingTask.reward_points ? this.editingTask.reward_points.toString() : '',
						start_time: this.editingTask.start_time ? Number(this.editingTask.start_time) : new Date().setHours(0, 0, 0, 0),
						deadline_time: this.editingTask.deadline_time ? Number(this.editingTask.deadline_time) : '',
						batch_create: this.editingTask.batch_create || false,
						period: this.editingTask.period || '',
						need_audit: this.editingTask.need_audit || false,
						child_name: this.parseFeishuField(this.editingTask.child_name),
						child_id: this.parseFeishuField(this.editingTask.child_id),
						textbook_id: this.parseFeishuField(this.editingTask.textbook_id),
						textbook_name: this.parseFeishuField(this.editingTask.textbook_name),
						template_name: this.editingTask.template_name || '',
						template_description: this.editingTask.template_description || ''
					}
					
					// 设置选中状态
					this.selectedChild = this.formData.child_id || ''
					this.selectedTextbook = this.formData.textbook_id || ''
					
					console.log('[TaskFormModal] 编辑任务回显数据:', {
						type: this.formData.type,
						difficulty: this.formData.difficulty,
						start_time: this.formData.start_time,
						selectedChild: this.selectedChild
					})
				}
			},
			resetForm() {
				const today = new Date()
				today.setHours(0, 0, 0, 0)
				this.formData = {
					title: '',
					description: '',
					type: '',
					difficulty: '',
					base_points: '',
					reward_points: '',
					start_time: today.getTime(),
					deadline_time: '',
					batch_create: false,
					period: '',
					need_audit: false,
					child_name: '',
					child_id: '',
					textbook_id: '',
					textbook_name: '',
					template_name: '',
					template_description: ''
				}
				this.selectedChild = ''
				this.selectedTextbook = ''
				this.selectedTemplate = ''
				this.useTemplate = false
				this.saveAsTemplate = false
			},
			onTypeChange(e) {
				const value = e?.detail?.value || e
				this.formData.type = value
			},
			onDifficultyChange(e) {
				const value = e?.detail?.value || e
				this.formData.difficulty = value
			},
			onChildChange(e) {
				const value = e?.detail?.value || e
				const index = parseInt(value)
				this.formData.child_name = this.children[index]?.name || ''
				this.formData.child_id = this.children[index]?.child_id || this.children[index]?.id || ''
			},
			onTextbookChange(e) {
				this.formData.textbook_id = e
			},
			onAuditChange(e) {
				const value = e?.detail?.value !== undefined ? e.detail.value : e
				this.formData.need_audit = value
			},
			onBatchCreateChange(e) {
				const value = e?.detail?.value !== undefined ? e.detail.value : e
				this.formData.batch_create = value
				if (!this.formData.batch_create) {
					this.formData.period = ''
				}
			},
			onPeriodChange(e) {
				const value = e?.detail?.value || e
				this.formData.period = value
			},
			// 辅助函数：解析飞书多维表格的字段值（可能是 {value: [{text: 'xxx'}] } 或直接是字符串）
			parseFeishuField(value) {
				if (!value) return ''
				// 如果是字符串，直接返回
				if (typeof value === 'string') return value
				// 如果是数组且第一个元素有 text 属性
				if (Array.isArray(value) && value[0] && value[0].text) return value[0].text
				// 如果是对象且有 value 属性（{value: [{text: 'xxx'}]}）
				if (typeof value === 'object' && value.value) {
					if (Array.isArray(value.value) && value.value[0] && value.value[0].text) {
						return value.value[0].text
					}
				}
				return ''
			},
			onSaveAsTemplateChange(e) {
				const value = e?.detail?.value !== undefined ? e.detail.value : e
				this.saveAsTemplate = value
				if (!this.saveAsTemplate) {
					this.formData.template_name = ''
				}
			},
			handleClose() {
				this.resetForm()
				this.$emit('close')
			},
			onUseTemplateChange(e) {
				const value = e?.detail?.value !== undefined ? e.detail.value : e
				this.useTemplate = value
				if (this.useTemplate) {
					this.loadTemplates()
				} else {
					this.selectedTemplate = ''
				}
			},
			onTemplateSearch() {
				this.loadTemplates(this.templateSearchKeyword)
			},
			onTemplateChange(e) {
				const value = e?.detail?.value || e
				const index = parseInt(value)
				const template = this.templates[index]
				console.log('template----',template);
				
				if (template) {
					// 清空之前的表单数据，然后赋值新模板数据
					this.formData.title = template.title || ''
					this.formData.description = template.description || ''
					this.formData.type = template.type || ''
					this.formData.difficulty = template.difficulty || ''
					this.formData.base_points = template.base_points ? template.base_points.toString() : ''
					this.formData.reward_points = template.reward_points ? template.reward_points.toString() : ''
					this.formData.start_time = template.start_time || ''
					this.formData.deadline_time = template.deadline_time || ''
					this.formData.batch_create = template.batch_create || false
					this.formData.period = template.period || ''
					this.formData.need_audit = template.need_audit || false
					
					// 关联儿童 - 使用统一的解析函数
					this.formData.child_id = this.parseFeishuField(template.child_id)
					this.formData.child_name = this.parseFeishuField(template.child_name)
					
					// 绑定教材 - 使用统一的解析函数
					this.formData.textbook_id = this.parseFeishuField(template.textbook_id)
					this.formData.textbook_name = this.parseFeishuField(template.textbook_name)
					
					// 设置选中状态
					this.selectedChild = this.formData.child_id
					this.selectedTextbook = this.formData.textbook_id
					console.log('template---this.formData-',template,this.formData);

					uni.showToast({ title: '模板信息已填充', icon: 'success' })
				}
			},
			async loadTemplates(keyword = '') {
				try {
					const params = keyword ? { keyword } : {}
					const result = await feishuRequest.queryRecords('任务模板表', params)
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
							
							return {
								...item.fields,
								title: title,
								template_title: templateTitle,
								description: description
								
							}
						})
					} else {
						this.templates = []
					}
					
					// 搜索后清空选中状态，让用户可以直接看到搜索结果
					this.selectedTemplate = ''
					
					// 尝试自动展开下拉框
					this.$nextTick(() => {
						if (this.$refs.templateSelect && typeof this.$refs.templateSelect.showSelector === 'function') {
							this.$refs.templateSelect.showSelector()
						} else if (this.$refs.templateSelect && typeof this.$refs.templateSelect.open === 'function') {
							this.$refs.templateSelect.open()
						}
					})
				} catch (error) {
					console.error('[TaskFormModal] 加载模板列表失败:', error)
					this.templates = []
				}
			},
			handleSave() {
				// 任务模板模式验证
				if (this.pageType === 'template') {
					if (!this.formData.template_title || !this.formData.title || !this.formData.type || !this.formData.difficulty || !this.formData.base_points) {
						uni.showToast({ title: '请填写模板名称和任务信息', icon: 'none' })
						return
					}

					const templateData = {
						template_title: this.formData.template_title,
						template_description: this.formData.template_description,
						title: this.formData.title,
						description: this.formData.description,
						type: this.formData.type,
						difficulty: this.formData.difficulty,
						base_points: parseInt(this.formData.base_points),
						reward_points: this.formData.reward_points ? parseInt(this.formData.reward_points) : 0,
						deadline_time: this.formData.deadline_time || '',
						need_audit: this.formData.need_audit || false,
						child_id: this.formData.child_id || '',
						child_name: this.formData.child_name || '',
						textbook_id: this.formData.textbook_id || '',
						textbook_name: this.formData.textbook_name || ''
					}
console.log('任务模板----',{
						data: templateData,
						isEdit: !!this.editingTask,
						editId: this.editingTask?.id,
						isTemplate: true
					});

					this.$emit('save', {
						data: templateData,
						isEdit: !!this.editingTask,
						editId: this.editingTask?.id,
						isTemplate: true
					})
					return
				}

				// 任务模式验证
				if (!this.formData.title || !this.formData.type || !this.formData.difficulty || !this.formData.base_points || !this.formData.child_id) {
					uni.showToast({ title: '请填写完整信息', icon: 'none' })
					return
				}

				// 批量创建时验证
				if (this.formData.batch_create) {
					if (!this.formData.deadline_time) {
						uni.showToast({ title: '批量创建需要设置截止时间', icon: 'none' })
						return
					}
					if (!this.formData.period) {
						uni.showToast({ title: '批量创建需要选择任务周期', icon: 'none' })
						return
					}
				}

				// 检查是否需要保存为模板
				if (this.saveAsTemplate && !this.formData.template_title) {
					uni.showToast({ title: '请输入模板名称', icon: 'none' })
					return
				}

				// 基础任务数据
				const baseTaskData = {
					title: this.formData.title,
					description: this.formData.description,
					type: this.formData.type,
					difficulty: this.formData.difficulty,
					base_points: parseInt(this.formData.base_points),
					reward_points: this.formData.reward_points ? parseInt(this.formData.reward_points) : 0,
					need_audit: this.formData.need_audit || false,
					child_id: this.formData.child_id,
					textbook_id: this.formData.textbook_id || '',
					status: this.editingTask?.status || '未开始',
					saveAsTemplate: this.saveAsTemplate,
					template_title: this.saveAsTemplate ? this.formData.template_title : '',
					template_description: this.saveAsTemplate ? this.formData.description : ''
				}
				// 日期时间字段只有在有值时才添加（飞书API要求必须是Unix时间戳）
				if (this.formData.start_time) {
					baseTaskData.start_time = Number(this.formData.start_time)
				}
				if (this.formData.deadline_time) {
					baseTaskData.deadline_time = Number(this.formData.deadline_time)
				}

				// 如果是批量创建，生成多个任务
				if (this.formData.batch_create && this.formData.period) {
					const tasks = this.generateBatchTasks(baseTaskData)
					this.$emit('save', {
						data: tasks,
						isEdit: !!this.editingTask,
						editId: this.editingTask?.id,
						isTemplate: false,
						isBatch: true
					})
				} else {
					this.$emit('save', {
						data: baseTaskData,
						isEdit: !!this.editingTask,
						editId: this.editingTask?.id,
						isTemplate: false,
						isBatch: false
					})
				}
			},
			// 生成批量任务
			generateBatchTasks(baseTaskData) {
				const tasks = []
				const startDate = new Date(parseInt(this.formData.start_time))
				const endDate = new Date(parseInt(this.formData.deadline_time))
				const period = this.formData.period

				// 设置为当天零点
				startDate.setHours(0, 0, 0, 0)
				endDate.setHours(0, 0, 0, 0)

				switch (period) {
					case 'daily': // 每天
						{
							const diffTime = endDate.getTime() - startDate.getTime()
							const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
							for (let i = 0; i < diffDays; i++) {
								const taskDate = new Date(startDate)
								taskDate.setDate(taskDate.getDate() + i)
								tasks.push({
									...baseTaskData,
									start_time: taskDate.getTime(),
									deadline_time: taskDate.getTime() // 当天截止
								})
							}
						}
						break

					case 'weekly': // 每周（每周一）
						{
							const currentDate = new Date(startDate)
							// 将开始日期调整到本周一
							const dayOfWeek = currentDate.getDay()
							if (dayOfWeek !== 1) {
								currentDate.setDate(currentDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
							}

							while (currentDate <= endDate) {
								tasks.push({
									...baseTaskData,
									start_time: currentDate.getTime()
								})
								currentDate.setDate(currentDate.getDate() + 7)
							}
						}
						break

					case 'monthly': // 每月（每月1号）
						{
							const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
							while (currentDate <= endDate) {
								tasks.push({
									...baseTaskData,
									start_time: currentDate.getTime()
								})
								currentDate.setMonth(currentDate.getMonth() + 1)
							}
						}
						break
				}

				console.log('[TaskFormModal] 生成批量任务:', tasks.length, '个')
				return tasks
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
		z-index: 2000;
		padding: 40rpx;
	}

	.modal-content {
		width: 100%;
		max-width: 640rpx;
		background-color: #fff;
		border-radius: 20rpx;
		max-height: 80vh;
		overflow-y: auto;
		z-index: 2001;
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

	.template-switch,
	.audit-switch {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10rpx 0;
	}

	.template-section {
		background-color: #f8f9fa;
		padding: 20rpx;
		border-radius: 12rpx;
		margin-bottom: 20rpx;
	}

	.section-title {
		font-size: 26rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 15rpx;
		display: block;
	}

	.section-divider {
		height: 1rpx;
		background-color: #e8e8e8;
		margin: 20rpx -20rpx;
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
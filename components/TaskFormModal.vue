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
						<input class="form-input" v-model="formData.template_name" placeholder="请输入模板名称" />
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
					<input class="form-input" v-model="formData.template_name" placeholder="请输入模板名称" />
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
					<uni-data-select 
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
				<view class="form-item" v-if="formData.need_audit">
					<text class="form-label">奖励积分</text>
					<input class="form-input" type="number" v-model="formData.reward_points" placeholder="请输入奖励积分（完成任务额外奖励）" />
				</view>
				<view class="form-item">
					<text class="form-label">截止时间</text>
					<uni-datetime-picker
						v-model="formData.deadline_time"
						type="date"
						return-type="timestamp"
						placeholder="请选择截止时间"
					/>
				</view>
				<view class="form-item">
					<view class="audit-switch">
						<text class="form-label">需要审核</text>
						<switch :checked="formData.need_audit" @change="onAuditChange" />
					</view>
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
					deadline_time: '',
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
				selectedTextbook: ''
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
				return this.children.map((child, index) => ({
					value: index.toString(),
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
					text: template.title || '未命名模板'
				}))
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
					// 编辑模式：清空后再赋值
					this.formData = {
						title: this.editingTask.title || '',
						description: this.editingTask.description || '',
						type: this.editingTask.type || '',
						difficulty: this.editingTask.difficulty || '',
						base_points: this.editingTask.base_points ? this.editingTask.base_points.toString() : '',
						reward_points: this.editingTask.reward_points ? this.editingTask.reward_points.toString() : '',
						deadline_time: this.editingTask.deadline_time || '',
						need_audit: this.editingTask.need_audit || false,
						child_name: this.editingTask.child_name || '',
						child_id: this.editingTask.child_id || '',
						textbook_id: this.editingTask.textbook_id || '',
						textbook_name: this.editingTask.textbook_name || '',
						template_name: this.editingTask.template_name || '',
						template_description: this.editingTask.template_description || ''
					}
					
					// 设置选中状态
					const childIndex = this.children.findIndex(c => c.child_id === this.formData.child_id || c.id === this.formData.child_id)
					this.selectedChild = childIndex >= 0 ? childIndex.toString() : ''
					this.selectedTextbook = this.formData.textbook_id || ''
				}
			},
			resetForm() {
				this.formData = {
					title: '',
					description: '',
					type: '',
					difficulty: '',
					base_points: '',
					reward_points: '',
					deadline_time: '',
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
			onTemplateChange(e) {
				const value = e?.detail?.value || e
				const index = parseInt(value)
				const template = this.templates[index]
				if (template) {
					// 清空之前的表单数据，然后赋值新模板数据
					this.formData.title = template.title || ''
					this.formData.description = template.description || ''
					this.formData.type = template.type || ''
					this.formData.difficulty = template.difficulty || ''
					this.formData.base_points = template.base_points ? template.base_points.toString() : ''
					this.formData.reward_points = template.reward_points ? template.reward_points.toString() : ''
					this.formData.deadline_time = template.deadline_time || ''
					this.formData.need_audit = template.need_audit || false
					this.formData.child_name = ''
					this.formData.child_id = ''
					this.formData.textbook_id = ''
					this.formData.textbook_name = ''
					
					// 重置选中状态
					this.selectedChild = ''
					this.selectedTextbook = ''
					
					uni.showToast({ title: '模板信息已填充', icon: 'success' })
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
								difficulty: item.fields.difficulty || '',
								base_points: item.fields.base_points || 0,
								reward_points: item.fields.reward_points || 0,
								deadline_time: item.fields.deadline_time || '',
								need_audit: item.fields.need_audit || false
							}
						})
					} else {
						this.templates = []
					}
				} catch (error) {
					console.error('[TaskFormModal] 加载模板列表失败:', error)
					this.templates = []
				}
			},
			handleSave() {
				// 任务模板模式验证
				if (this.pageType === 'template') {
					if (!this.formData.template_name || !this.formData.title || !this.formData.type || !this.formData.difficulty || !this.formData.base_points) {
						uni.showToast({ title: '请填写模板名称和任务信息', icon: 'none' })
						return
					}

					const templateData = {
						template_name: this.formData.template_name,
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

				// 检查是否需要保存为模板
				if (this.saveAsTemplate && !this.formData.template_name) {
					uni.showToast({ title: '请输入模板名称', icon: 'none' })
					return
				}

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
					status: this.editingTask?.status || '未开始',
					saveAsTemplate: this.saveAsTemplate,
					template_name: this.saveAsTemplate ? this.formData.template_name : '',
					template_description: this.saveAsTemplate ? this.formData.description : ''
				}
console.log('任务----',{
					data: taskData,
					isEdit: !!this.editingTask,
					editId: this.editingTask?.id,
					isTemplate: false
				}
)
				this.$emit('save', {
					data: taskData,
					isEdit: !!this.editingTask,
					editId: this.editingTask?.id,
					isTemplate: false
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
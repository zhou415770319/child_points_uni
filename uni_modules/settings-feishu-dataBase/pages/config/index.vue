<template>
	<view class="container">
		<view class="section">
			<view class="section-header">
				<text class="section-title">🔐 飞书应用配置</text>
				<button class="clear-btn" @click="showClearConfirm">🗑️ 清空配置</button>
			</view>
			<view class="form-item">
				<text class="form-label">多维表格Token</text>
				<input class="form-input" v-model="config.baseToken" placeholder="请输入多维表格Token（可选）" />
			</view>
			<view class="button-row">
				<button class="btn btn-primary" @click="saveConfig">保存配置</button>
				<button class="btn btn-secondary" @click="testConnection">测试连接</button>
			</view>
		</view>

		<view class="section">
			<view class="section-header">
				<text class="section-title">📊 数据表列表</text>
				<button class="refresh-btn" @click="loadTables">🔄 刷新</button>
			</view>
			<view class="table-list">
				<view class="table-item" v-for="table in tables" :key="table.table_id">
					<view class="table-info" @click="viewTableDetail(table)">
						<text class="table-name">{{ table.name }}</text>
						<text class="table-id">{{ table.table_id }}</text>
						<text class="table-fields">{{ table.fields.length }} 个字段</text>
					</view>
					<view class="table-actions" v-if="false">
						<button class="action-btn" @click="configureApi(table)">⚙️ 配置接口</button>
					</view>
				</view>
			</view>
		</view>

		<view class="modal-overlay" v-if="showDetailModal" @click="closeDetailModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">{{ currentTable?.name }}</text>
					<text class="modal-close" @click="closeDetailModal">✕</text>
				</view>
				<view class="modal-body">
					<view class="detail-section">
						<text class="detail-label">数据表ID</text>
						<text class="detail-value mono">{{ currentTable?.table_id }}</text>
					</view>
					<view class="detail-section">
						<text class="detail-label">字段数量</text>
						<text class="detail-value">{{ currentTable?.fields?.length || 0 }} 个</text>
					</view>
					<view class="detail-section">
						<text class="detail-label">字段列表</text>
						<view class="field-list">
							<view class="field-item" v-for="field in currentTable?.fields" :key="field.field_id">
								<view class="field-info">
									<text class="field-name">{{ field.field_name }}</text>
									<text class="field-type">{{ field.type }}</text>
								</view>
								<text class="field-id">{{ field.field_id }}</text>
							</view>
						</view>
					</view>
				</view>
				<view class="modal-footer">
					<button class="btn btn-primary" @click="configureApi(currentTable)">⚙️ 配置接口</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { feishuApi } from '../../src/utils/feishu-api.js'

export default {
	data() {
		return {
			config: {
				baseToken: ''
			},
			tables: [],
			showDetailModal: false,
			currentTable: null
		}
	},
	onLoad() {
		this.loadConfig()
		this.loadSavedTables()
	},
	onShow() {
		if (this.config.baseToken) {
			this.loadTables()
		}
	},
	methods: {
		loadConfig() {
			const saved = feishuApi.getConfig()
			if (saved && saved.baseToken) {
				this.config.baseToken = saved.baseToken
			}
		},
		loadSavedTables() {
			const savedTables = feishuApi.getTableListSaved()
			if (savedTables.length > 0) {
				this.tables = savedTables
			}
		},
		showClearConfirm() {
			uni.showModal({
				title: '确认清空',
				content: '确定要清空所有飞书配置吗？这将清除多维表格Token和数据表数据。',
				confirmColor: '#ff4d4f',
				success: (res) => {
					if (res.confirm) {
						this.clearConfig()
					}
				}
			})
		},
		clearConfig() {
			feishuApi.clearConfig()
			this.config.baseToken = ''
			this.tables = []
			uni.showToast({ title: '配置已清空', icon: 'success' })
		},
		saveConfig() {
			feishuApi.saveConfig(this.config)
			uni.showToast({ title: '配置保存成功', icon: 'success' })
			if (this.config.baseToken) {
				this.loadTables()
			}
		},
		async testConnection() {
			if (!this.config.baseToken) {
				uni.showToast({ title: '请先输入多维表格Token', icon: 'none' })
				return
			}
			uni.showLoading({ title: '测试中...' })
			try {
				const result = await feishuApi.testConnection()
				uni.hideLoading()
				if (result.success) {
					uni.showToast({ title: result.message, icon: 'success' })
					await this.loadTables()
				} else {
					uni.showToast({ title: result.message, icon: 'none' })
				}
			} catch (error) {
				uni.hideLoading()
				uni.showToast({ title: '连接失败: ' + error.message, icon: 'none' })
			}
		},
		async loadTables() {
			if (!this.config.baseToken) {
				uni.showToast({ title: '请先输入多维表格Token', icon: 'none' })
				return
			}
			uni.showLoading({ title: '加载中...' })
			try {
				this.tables = await feishuApi.getTableList(this.config.baseToken)
				feishuApi.saveTableList(this.tables)
			} catch (error) {
				uni.showToast({ title: '加载失败: ' + error.message, icon: 'none' })
			} finally {
				uni.hideLoading()
			}
		},
		async viewTableDetail(table) {
			uni.showLoading({ title: '加载中...' })
			try {
				table.fields = await feishuApi.getTableFields(
					this.config.baseToken,
					table.table_id
				)
				this.currentTable = table
				this.showDetailModal = true
			} catch (error) {
				uni.showToast({ title: '获取详情失败: ' + error.message, icon: 'none' })
			} finally {
				uni.hideLoading()
			}
		},
		closeDetailModal() {
			this.showDetailModal = false
			this.currentTable = null
		},
		configureApi(table) {
			uni.navigateTo({
				url: `/uni_modules/settings-feishu-database/pages/api-config/index?tableId=${table.table_id}&tableName=${encodeURIComponent(table.name)}`
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.container {
	min-height: 100vh;
	background-color: #f5f5f5;
	padding: 20rpx;
}

.section {
	background-color: #fff;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	display: block;
	margin-bottom: 20rpx;
}

.form-item {
	margin-bottom: 20rpx;
}

.form-label {
	font-size: 28rpx;
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

.button-row {
	display: flex;
	gap: 20rpx;
	margin-top: 30rpx;
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

.refresh-btn {
	height: 60rpx;
	padding: 0 20rpx;
	border-radius: 30rpx;
	font-size: 24rpx;
	background-color: #f0f0f0;
	border: none;
}

.clear-btn {
	height: 60rpx;
	padding: 0 20rpx;
	border-radius: 30rpx;
	font-size: 24rpx;
	background-color: #fff0f0;
	color: #ff4d4f;
	border: 2rpx solid #ffccc7;
}

.base-list {
	display: flex;
	flex-direction: column;
}

.base-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
	
	&:last-child {
		border-bottom: none;
	}
}

.base-info {
	display: flex;
	flex-direction: column;
}

.base-name {
	font-size: 30rpx;
	font-weight: bold;
	color: #333;
}

.base-id {
	font-size: 24rpx;
	color: #999;
	margin-top: 5rpx;
}

.base-arrow {
	font-size: 40rpx;
	color: #ccc;
}

.table-list {
	display: flex;
	flex-direction: column;
}

.table-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx;
	background-color: #fafafa;
	border-radius: 10rpx;
	margin-bottom: 10rpx;
}

.table-info {
	display: flex;
	flex-direction: column;
}

.table-name {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
}

.table-fields {
	font-size: 24rpx;
	color: #999;
	margin-top: 5rpx;
}

.action-btn {
	height: 60rpx;
	padding: 0 20rpx;
	border-radius: 30rpx;
	font-size: 24rpx;
	background-color: #1890ff;
	color: #fff;
	border: none;
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
	font-size: 34rpx;
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
	max-height: 60vh;
	overflow-y: auto;
}

.modal-footer {
	padding: 20rpx 30rpx 30rpx;
}

.detail-section {
	margin-bottom: 25rpx;
}

.detail-section:last-child {
	margin-bottom: 0;
}

.detail-label {
	font-size: 26rpx;
	color: #999;
	display: block;
	margin-bottom: 10rpx;
}

.detail-value {
	font-size: 28rpx;
	color: #333;
	
	&.mono {
		font-family: 'Courier New', monospace;
		font-size: 24rpx;
	}
}

.field-list {
	background-color: #fafafa;
	border-radius: 10rpx;
	padding: 10rpx;
}

.field-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 15rpx 10rpx;
	border-bottom: 1rpx solid #f0f0f0;
	
	&:last-child {
		border-bottom: none;
	}
}

.field-info {
	display: flex;
	flex-direction: column;
	flex: 1;
}

.field-name {
	font-size: 26rpx;
	color: #333;
}

.field-type {
	font-size: 22rpx;
	color: #999;
	margin-top: 4rpx;
}

.field-id {
	font-size: 22rpx;
	color: #666;
	font-family: 'Courier New', monospace;
	max-width: 150rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
</style>
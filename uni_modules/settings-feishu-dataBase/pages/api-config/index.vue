<template>
	<view class="container">
		<view class="section">
			<text class="section-title">⚙️ 接口配置</text>
			<view class="form-item">
				<text class="form-label">数据表名称</text>
				<text class="form-value">{{ tableName }}</text>
			</view>
			<view class="form-item">
				<text class="form-label">数据表ID</text>
				<text class="form-value">{{ tableId }}</text>
			</view>
			<view class="form-item">
				<text class="form-label">接口名称</text>
				<input class="form-input" v-model="apiConfig.apiName" placeholder="请输入接口名称（如：user）" />
			</view>
		</view>

		<view class="section">
			<text class="section-title">📦 操作配置</text>
			<view class="operation-list">
				<view class="operation-item" v-for="(op, index) in apiConfig.operations" :key="index">
					<view class="operation-info">
						<text class="operation-name">{{ getOperationName(op.type) }}</text>
						<text class="operation-desc">{{ getOperationDesc(op.type) }}</text>
					</view>
					<switch :checked="op.enabled" @change="(e) => toggleOperation(index, e)" color="#1890ff" />
				</view>
			</view>
		</view>

		<view class="section" v-if="generatedApis.length > 0">
			<view class="section-header">
				<text class="section-title">📝 生成的接口代码</text>
				<button class="copy-btn" @click="copyAllCode">📋 复制全部</button>
			</view>
			<view class="code-list">
				<view class="code-item" v-for="(api, index) in generatedApis" :key="index">
					<view class="code-header">
						<text class="code-method" :class="api.method.toLowerCase()">{{ api.method }}</text>
						<text class="code-path">{{ api.path }}</text>
					</view>
					<scroll-view class="code-content" scroll-x scroll-y>
						<text class="code-text">{{ api.code }}</text>
					</scroll-view>
					<button class="copy-code-btn" @click="copyCode(api.code)">📋 复制</button>
				</view>
			</view>
		</view>

		<view class="button-area">
			<button class="btn btn-primary" @click="generateCode">生成代码</button>
			<button class="btn btn-secondary" @click="saveApiConfig">保存配置</button>
		</view>
	</view>
</template>

<script>
import { feishuApi } from '../../src/utils/feishu-api.js'

export default {
	data() {
		return {
			tableId: '',
			tableName: '',
			apiConfig: {
				tableId: '',
				tableName: '',
				apiName: '',
				enabled: true,
				operations: [
					{ name: '列表查询', type: 'list', enabled: true },
					{ name: '详情查询', type: 'detail', enabled: true },
					{ name: '创建记录', type: 'create', enabled: true },
					{ name: '更新记录', type: 'update', enabled: true },
					{ name: '删除记录', type: 'delete', enabled: false }
				]
			},
			generatedApis: []
		}
	},
	onLoad(options) {
		this.tableId = options?.tableId || ''
		this.tableName = decodeURIComponent(options?.tableName || '')
		this.apiConfig.tableId = this.tableId
		this.apiConfig.tableName = this.tableName
		this.apiConfig.apiName = this.tableName.toLowerCase().replace(/\s+/g, '-')
		
		const savedConfigs = feishuApi.getApiConfigs()
		const existingConfig = savedConfigs.find((c) => c.tableId === this.tableId)
		if (existingConfig) {
			this.apiConfig = existingConfig
		}
	},
	methods: {
		getOperationName(type) {
			const names = {
				list: '列表查询',
				detail: '详情查询',
				create: '创建记录',
				update: '更新记录',
				delete: '删除记录'
			}
			return names[type] || type
		},
		getOperationDesc(type) {
			const desc = {
				list: '获取多条记录列表',
				detail: '获取单条记录详情',
				create: '新增一条记录',
				update: '更新指定记录',
				delete: '删除指定记录'
			}
			return desc[type] || ''
		},
		toggleOperation(index, e) {
			this.apiConfig.operations[index].enabled = e.detail.value
		},
		generateCode() {
			if (!this.apiConfig.apiName) {
				uni.showToast({ title: '请输入接口名称', icon: 'none' })
				return
			}
			this.generatedApis = feishuApi.generateApiCode(this.apiConfig)
			uni.showToast({ title: '代码生成成功', icon: 'success' })
		},
		copyCode(code) {
			uni.setClipboardData({
				data: code,
				success: () => {
					uni.showToast({ title: '已复制', icon: 'success' })
				}
			})
		},
		copyAllCode() {
			const allCode = this.generatedApis.map(api => api.code).join('\n\n')
			uni.setClipboardData({
				data: allCode,
				success: () => {
					uni.showToast({ title: '已复制全部代码', icon: 'success' })
				}
			})
		},
		saveApiConfig() {
			if (!this.apiConfig.apiName) {
				uni.showToast({ title: '请输入接口名称', icon: 'none' })
				return
			}
			let configs = feishuApi.getApiConfigs()
			const existingIndex = configs.findIndex(function(c) { return c.tableId === this.tableId }.bind(this))
			if (existingIndex >= 0) {
				configs[existingIndex] = this.apiConfig
			} else {
				configs.push(this.apiConfig)
			}
			feishuApi.saveApiConfigs(configs)
			uni.showToast({ title: '配置保存成功', icon: 'success' })
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

.form-value {
	font-size: 28rpx;
	color: #333;
	background-color: #f5f5f5;
	padding: 20rpx;
	border-radius: 10rpx;
	display: block;
}

.operation-list {
	display: flex;
	flex-direction: column;
}

.operation-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx;
	background-color: #fafafa;
	border-radius: 10rpx;
	margin-bottom: 10rpx;
}

.operation-info {
	display: flex;
	flex-direction: column;
}

.operation-name {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
}

.operation-desc {
	font-size: 24rpx;
	color: #999;
	margin-top: 5rpx;
}

.code-list {
	display: flex;
	flex-direction: column;
}

.code-item {
	background-color: #2d2d2d;
	border-radius: 10rpx;
	padding: 20rpx;
	margin-bottom: 15rpx;
}

.code-header {
	display: flex;
	align-items: center;
	gap: 10rpx;
	margin-bottom: 15rpx;
}

.code-method {
	font-size: 22rpx;
	font-weight: bold;
	padding: 5rpx 15rpx;
	border-radius: 5rpx;
	
	&.get {
		background-color: #67c23a;
		color: #fff;
	}
	
	&.post {
		background-color: #409eff;
		color: #fff;
	}
	
	&.put {
		background-color: #e6a23c;
		color: #fff;
	}
	
	&.delete {
		background-color: #f56c6c;
		color: #fff;
	}
}

.code-path {
	font-size: 24rpx;
	color: #b3b3b3;
}

.code-content {
	max-height: 300rpx;
	margin-bottom: 15rpx;
}

.code-text {
	font-size: 24rpx;
	color: #ccc;
	font-family: 'Courier New', monospace;
	white-space: pre;
}

.copy-code-btn {
	width: 100%;
	height: 60rpx;
	background-color: #4a4a4a;
	color: #fff;
	border-radius: 30rpx;
	font-size: 24rpx;
	border: none;
}

.copy-btn {
	height: 60rpx;
	padding: 0 20rpx;
	border-radius: 30rpx;
	font-size: 24rpx;
	background-color: #1890ff;
	color: #fff;
	border: none;
}

.button-area {
	display: flex;
	gap: 20rpx;
	padding: 40rpx 0;
}

.btn {
	flex: 1;
	height: 88rpx;
	border-radius: 44rpx;
	font-size: 32rpx;
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
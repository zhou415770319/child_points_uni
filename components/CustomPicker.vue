<template>
	<view class="custom-picker" @click="showPicker">
		<view class="picker-content">
			<text class="picker-value">{{ currentValue || placeholder }}</text>
			<text class="picker-arrow">›</text>
		</view>
		<!-- 选择器弹窗 -->
		<view class="picker-overlay" v-if="show" @click="closePicker">
			<view class="picker-modal" @click.stop>
				<view class="picker-header">
					<text class="picker-title">{{ title || '请选择' }}</text>
					<text class="picker-close" @click="closePicker">✕</text>
				</view>
				<view class="picker-body">
					<view 
						v-for="(option, index) in options" 
						:key="index" 
						class="picker-item"
						:class="{ 'picker-item-active': currentIndex === index }"
						@click="selectOption(index)"
					>
						{{ typeof option === 'object' ? option[this.labelField] : option }}
						<text v-if="currentIndex === index" class="picker-check">✓</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'CustomPicker',
	props: {
		// 选项列表，可以是字符串数组或对象数组
		options: {
			type: Array,
			default: () => []
		},
		// 当前选中的索引
		modelValue: {
			type: Number,
			default: -1
		},
		// 占位符文本
		placeholder: {
			type: String,
			default: '请选择'
		},
		// 标题
		title: {
			type: String,
			default: ''
		},
		// 是否自动选择第一项
		autoSelectFirst: {
			type: Boolean,
			default: true
		},
		// 显示文本的字段名（支持 label, name, text 等）
		labelField: {
			type: String,
			default: 'label'
		},
		// 值字段名（支持 value, id 等）
		valueField: {
			type: String,
			default: 'value'
		}
	},
	data() {
		return {
			show: false,
			currentIndex: -1
		}
	},
	computed: {
		currentValue() {
			if (this.currentIndex >= 0 && this.currentIndex < this.options.length) {
				const option = this.options[this.currentIndex]
				return typeof option === 'object' ? option[this.labelField] : option
			}
			return ''
		}
	},
	watch: {
		modelValue: {
			handler(newVal) {
				this.currentIndex = newVal
			},
			immediate: true
		},
		options: {
			handler(newOptions) {
				// 如果启用了自动选择第一项，且当前没有选中项，则自动选中第一项
				if (this.autoSelectFirst && newOptions.length > 0 && this.currentIndex === -1) {
					this.currentIndex = 0
					this.$emit('update:modelValue', 0)
				}
			},
			immediate: true
		}
	},
	methods: {
		showPicker() {
			this.show = true
		},
		closePicker() {
			this.show = false
		},
		selectOption(index) {
			this.currentIndex = index
			this.$emit('update:modelValue', index)
			this.$emit('change', index, this.options[index])
			this.closePicker()
		}
	}
}
</script>

<style lang="scss" scoped>
.custom-picker {
	.picker-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 80rpx;
		padding: 0 20rpx;
		border: 2rpx solid #e8e8e8;
		border-radius: 10rpx;
		background-color: #fff;
	}

	.picker-value {
		flex: 1;
		font-size: 28rpx;
		color: #333;
	}

	.picker-arrow {
		font-size: 32rpx;
		color: #999;
	}

	.picker-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		z-index: 1001;
	}

	.picker-modal {
		width: 100%;
		background-color: #fff;
		border-radius: 20rpx 20rpx 0 0;
		max-height: 60vh;
		overflow: hidden;
	}

	.picker-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.picker-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.picker-close {
		font-size: 36rpx;
		color: #999;
		padding: 10rpx;
	}

	.picker-body {
		max-height: 400rpx;
		overflow-y: auto;
	}

	.picker-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		font-size: 30rpx;
		color: #333;
		border-bottom: 1rpx solid #f5f5f5;

		&:active {
			background-color: #f5f5f5;
		}
	}

	.picker-item-active {
		background-color: #f0f5ff;
		color: #667eea;
	}

	.picker-check {
		font-size: 32rpx;
		color: #667eea;
	}
}
</style>
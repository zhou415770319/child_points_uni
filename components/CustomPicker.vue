<template>
	<view class="custom-picker-container">
		<view class="custom-picker" @tap="togglePicker">
			<text class="picker-value">{{ displayValue || placeholder }}</text>
			<text class="picker-arrow" :class="{ active: showPicker }">▼</text>
		</view>
		
		<view class="picker-overlay" v-if="showPicker" @tap="closePicker"></view>
		
		<view class="picker-popup" v-if="showPicker">
			<view class="picker-header">
				<text class="picker-title">{{ title }}</text>
				<text class="picker-close" @tap="closePicker">✕</text>
			</view>
			<scroll-view class="picker-content" scroll-y>
				<view 
					class="picker-item" 
					v-for="(item, index) in options" 
					:key="index"
					:class="{ active: index === selectedIndex }"
					@tap="selectItem(index)"
				>
					<text class="item-text">{{ typeof item === 'object' ? (item.label || item.text || item.value) : item }}</text>
					<text class="item-check" v-if="index === selectedIndex">✓</text>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'CustomPicker',
		props: {
			options: {
				type: Array,
				default: () => []
			},
			value: {
				type: [String, Number],
				default: ''
			},
			placeholder: {
				type: String,
				default: '请选择'
			},
			title: {
				type: String,
				default: '选择'
			}
		},
		data() {
			return {
				showPicker: false,
				selectedIndex: -1
			}
		},
		computed: {
			displayValue() {
				if (this.selectedIndex >= 0 && this.selectedIndex < this.options.length) {
					const item = this.options[this.selectedIndex]
					return typeof item === 'object' ? (item.label || item.text || item.value) : item
				}
				return ''
			}
		},
		watch: {
			value: {
				immediate: true,
				handler(newVal) {
					if (newVal !== undefined && newVal !== null && newVal !== '') {
						this.selectedIndex = this.options.findIndex(item => {
							if (typeof item === 'object') {
								return item.value === newVal || item.label === newVal || item.text === newVal
							}
							return item === newVal
						})
					}
				}
			},
			options: {
				immediate: true,
				handler() {
					if (this.value) {
						this.selectedIndex = this.options.findIndex(item => {
							if (typeof item === 'object') {
								return item.value === this.value || item.label === this.value || item.text === this.value
							}
							return item === this.value
						})
					}
				}
			}
		},
		methods: {
			togglePicker() {
				this.showPicker = !this.showPicker
			},
			closePicker() {
				this.showPicker = false
			},
			selectItem(index) {
				this.selectedIndex = index
				const item = this.options[index]
				const value = typeof item === 'object' ? (item.value || item.label || item.text) : item
				this.$emit('input', value)
				this.$emit('change', { index, value, item })
				this.closePicker()
			}
		}
	}
</script>

<style lang="scss" scoped>
	.custom-picker-container {
		position: relative;
		width: 100%;
	}

	.custom-picker {
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
		background-color: #fff;

		&:active {
			background-color: #f5f5f5;
		}
	}

	.picker-value {
		flex: 1;
		text-align: left;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.picker-arrow {
		font-size: 20rpx;
		color: #999;
		transition: transform 0.2s ease;

		&.active {
			transform: rotate(180deg);
		}
	}

	.picker-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 999;
	}

	.picker-popup {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: #fff;
		border-radius: 20rpx 20rpx 0 0;
		z-index: 1000;
		max-height: 60vh;
		display: flex;
		flex-direction: column;
	}

	.picker-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 25rpx 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
		background-color: #fff;
		position: sticky;
		top: 0;
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

	.picker-content {
		flex: 1;
		max-height: 50vh;
	}

	.picker-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 25rpx 30rpx;
		border-bottom: 1rpx solid #f5f5f5;

		&:active {
			background-color: #f8f9fa;
		}

		&.active {
			background-color: #e8f4ff;

			.item-text {
				color: #667eea;
				font-weight: bold;
			}
		}
	}

	.item-text {
		font-size: 30rpx;
		color: #333;
	}

	.item-check {
		font-size: 28rpx;
		color: #667eea;
		font-weight: bold;
	}
</style>
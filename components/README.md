# 组件使用手册

## 概述

本目录包含项目中可复用的通用组件，旨在提高代码复用率和开发效率。

---

## 组件列表

### 1. Avatar（头像组件）

用于展示用户头像，支持图片和文字首字母两种模式。

**属性配置：**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| src | String | '' | 头像图片URL |
| name | String | '' | 用户姓名（用于生成首字母） |
| size | String | 'medium' | 尺寸：small/medium/large |
| clickable | Boolean | false | 是否可点击 |

**事件：**

| 事件名 | 说明 |
|--------|------|
| click | 点击头像时触发 |

**使用示例：**

```vue
<template>
	<Avatar 
		:src="user.avatar" 
		:name="user.name" 
		size="large"
		:clickable="true"
		@click="handleAvatarClick"
	/>
</template>

<script>
import Avatar from '@/components/Avatar/Avatar.vue'

export default {
	components: { Avatar }
}
</script>
```

---

### 2. CustomPicker（自定义选择器）

用于弹出式下拉选择，支持自定义选项数据结构。

**属性配置：**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| options | Array | [] | 选项列表 |
| modelValue | Number | -1 | 当前选中索引 |
| placeholder | String | '请选择' | 占位符文本 |
| title | String | '' | 弹窗标题 |
| autoSelectFirst | Boolean | true | 是否自动选中第一项 |
| labelField | String | 'label' | 显示文本字段名 |
| valueField | String | 'value' | 值字段名 |

**事件：**

| 事件名 | 说明 | 参数 |
|--------|------|------|
| update:modelValue | 选中项改变时触发 | index |
| change | 选中项改变时触发 | index, option |

**使用示例：**

```vue
<template>
	<CustomPicker 
		:options="categories" 
		v-model="selectedIndex" 
		:title="'选择分类'"
		label-field="name"
		value-field="id"
		@change="handleChange"
	/>
</template>

<script>
import CustomPicker from '@/components/CustomPicker.vue'

export default {
	components: { CustomPicker },
	data() {
		return {
			categories: [
				{ id: '1', name: '玩具' },
				{ id: '2', name: '图书' }
			],
			selectedIndex: -1
		}
	},
	methods: {
		handleChange(index, option) {
			console.log('选中:', option)
		}
	}
}
</script>
```

---

### 3. SectionHeader（区块头部）

用于页面区块标题，支持右侧显示数量或链接。

**属性配置：**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| title | String | '' | 标题文本 |
| count | String/Number | '' | 数量（与linkText互斥） |
| linkText | String | '' | 链接文本（与count互斥） |

**事件：**

| 事件名 | 说明 |
|--------|------|
| linkClick | 点击链接时触发 |

**使用示例：**

```vue
<template>
	<!-- 带数量 -->
	<SectionHeader title="📋 今日任务" :count="`${completed}/${total}`" />
	
	<!-- 带链接 -->
	<SectionHeader 
		title="👧 我的孩子" 
		link-text="查看全部 ›"
		@link-click="goToChildren"
	/>
</template>

<script>
import SectionHeader from '@/components/SectionHeader/SectionHeader.vue'

export default {
	components: { SectionHeader }
}
</script>
```

---

### 4. StatCard（统计卡片）

用于展示数值统计数据，带有渐变背景。

**属性配置：**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| value | String/Number | '0' | 统计数值 |
| label | String | '' | 标签文本 |

**事件：**

| 事件名 | 说明 |
|--------|------|
| click | 点击卡片时触发 |

**使用示例：**

```vue
<template>
	<view class="stats-row">
		<StatCard :value="todayTasks" label="今日任务" @click="goToTasks" />
		<StatCard :value="pendingReviews" label="待审核" @click="goToReviews" />
		<StatCard :value="totalPoints" label="总积分" @click="goToPoints" />
	</view>
</template>

<script>
import StatCard from '@/components/StatCard/StatCard.vue'

export default {
	components: { StatCard }
}
</script>

<style>
.stats-row {
	display: flex;
	gap: 20rpx;
}
</style>
```

---

## 组件开发规范

### 命名规范

- 组件目录名：大驼峰（PascalCase），如 `SectionHeader`
- 组件文件名：与目录名一致，如 `SectionHeader.vue`
- 组件名：与文件名一致

### 代码规范

1. **Props 定义**：
   - 必须定义类型和默认值
   - 使用 `validator` 验证枚举类型

2. **事件命名**：
   - 使用 kebab-case
   - 避免使用原生事件名

3. **样式规范**：
   - 使用 scoped 样式
   - 使用 BEM 命名规范
   - 使用 rpx 单位适配多端

### 目录结构

```
components/
├── Avatar/
│   └── Avatar.vue
├── CustomPicker.vue
├── SectionHeader/
│   └── SectionHeader.vue
├── StatCard/
│   └── StatCard.vue
├── README.md
└── ...
```

---

## 新增组件流程

1. 创建组件目录（复杂组件）或直接创建 `.vue` 文件（简单组件）
2. 编写组件代码（template、script、style）
3. 在 `README.md` 中添加组件文档
4. 在需要使用的页面中导入并注册组件

---

## 注意事项

1. 组件应保持独立，不依赖特定业务逻辑
2. 使用 `@/components/` 路径导入组件
3. 复杂组件建议创建独立目录，简单组件可直接放在根目录
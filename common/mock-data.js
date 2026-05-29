/**
 * Mock数据 - 用于开发测试和网络不可用的情况
 */

export const mockChildren = [
  { id: 'rec123', child_id: 'child_20260522001', name: '小明', avatar: '', total_points: 150 },
  { id: 'rec456', child_id: 'child_20260522002', name: '小红', avatar: '', total_points: 200 }
]

export const mockTasks = [
  {
    record_id: 'task001',
    fields: {
      id: 'task_20260529001',
      title: [{ text: '数学作业', type: 'text' }],
      description: [{ text: '完成第35-38页练习', type: 'text' }],
      type: 'study',
      type_text: '学习',
      difficulty: '中等',
      base_points: 20,
      child_id: [{ text: 'child_20260522001', type: 'text' }],
      status: '未开始',
      created_at: new Date().toISOString()
    }
  },
  {
    record_id: 'task002',
    fields: {
      id: 'task_20260529002',
      title: [{ text: '阅读课外书', type: 'text' }],
      description: [{ text: '阅读《小王子》第三章', type: 'text' }],
      type: 'reading',
      type_text: '阅读',
      difficulty: '简单',
      base_points: 15,
      child_id: [{ text: 'child_20260522001', type: 'text' }],
      status: '未开始',
      created_at: new Date().toISOString()
    }
  },
  {
    record_id: 'task003',
    fields: {
      id: 'task_20260529003',
      title: [{ text: '英语口语练习', type: 'text' }],
      description: [{ text: '跟读课文第5课', type: 'text' }],
      type: 'speaking',
      type_text: '口语',
      difficulty: '中等',
      base_points: 25,
      child_id: [{ text: 'child_20260522001', type: 'text' }],
      status: '进行中',
      elapsed_time: 1200,
      created_at: new Date().toISOString()
    }
  }
]

export const mockRewards = [
  {
    record_id: 'reward001',
    fields: {
      id: 'reward_20260528001',
      child_id: [{ text: 'child_20260522001', type: 'text' }],
      gift_name: { type: 1, value: [{ text: '航空积木', type: 'text' }] },
      price: 100,
      status: '已兑换',
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  },
  {
    record_id: 'reward002',
    fields: {
      id: 'reward_20260527001',
      child_id: [{ text: 'child_20260522001', type: 'text' }],
      gift_name: { type: 1, value: [{ text: '故事书', type: 'text' }] },
      price: 80,
      status: '已兑换',
      created_at: new Date(Date.now() - 172800000).toISOString()
    }
  }
]

export const mockTextbooks = [
  {
    record_id: 'book001',
    fields: {
      id: 'book_20260526001',
      name: [{ text: '一年级数学教材', type: 'text' }],
      child_id: [{ text: 'child_20260522001', type: 'text' }],
      subject: '数学',
      total_pages: 78,
      current_page: 35,
      pages_per_task: 0.5,
      status: '开启',
      resource_url: 'https://example.com/video.mp4'
    }
  },
  {
    record_id: 'book002',
    fields: {
      id: 'book_20260526002',
      name: [{ text: '英语绘本', type: 'text' }],
      child_id: [{ text: 'child_20260522001', type: 'text' }],
      subject: '英语',
      total_pages: 45,
      current_page: 20,
      pages_per_task: 1,
      status: '开启',
      resource_url: ''
    }
  }
]

export const mockPointsHistory = [
  {
    record_id: 'point001',
    fields: {
      id: 'point_20260529001',
      child_id: [{ text: 'child_20260522001', type: 'text' }],
      amount: 20,
      type: 'earn',
      description: [{ text: '完成数学作业', type: 'text' }],
      created_at: new Date().toISOString()
    }
  },
  {
    record_id: 'point002',
    fields: {
      id: 'point_20260528001',
      child_id: [{ text: 'child_20260522001', type: 'text' }],
      amount: 100,
      type: 'spend',
      description: [{ text: '兑换航空积木', type: 'text' }],
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  },
  {
    record_id: 'point003',
    fields: {
      id: 'point_20260528002',
      child_id: [{ text: 'child_20260522001', type: 'text' }],
      amount: 15,
      type: 'earn',
      description: [{ text: '完成阅读任务', type: 'text' }],
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  }
]

export const mockGoods = [
  {
    record_id: 'goods001',
    fields: {
      id: 'goods_20260528001',
      name: [{ text: '航空积木', type: 'text' }],
      description: [{ text: '益智拼装积木玩具', type: 'text' }],
      category: '玩具',
      price: 59,
      points: 100,
      stock: 50,
      status: '开启'
    }
  },
  {
    record_id: 'goods002',
    fields: {
      id: 'goods_20260528002',
      name: [{ text: '故事书套装', type: 'text' }],
      description: [{ text: '精选儿童故事书5本', type: 'text' }],
      category: '图书',
      price: 89,
      points: 150,
      stock: 30,
      status: '开启'
    }
  },
  {
    record_id: 'goods003',
    fields: {
      id: 'goods_20260528003',
      name: [{ text: '水彩笔套装', type: 'text' }],
      description: [{ text: '24色水彩笔', type: 'text' }],
      category: '文具',
      price: 35,
      points: 60,
      stock: 100,
      status: '开启'
    }
  }
]

export const mockCategories = [
  { label: '积木', value: '积木', checked: false },
  { label: '玩具', value: '玩具', checked: false },
  { label: '图书', value: '图书', checked: false },
  { label: '文具', value: '文具', checked: false },
  { label: '零食', value: '零食', checked: false },
  { label: '其他', value: '其他', checked: false }
]

export const mockBookStatus = [
  { label: '开启', value: '开启', checked: false },
  { label: '关闭', value: '关闭', checked: false }
]

export const mockTaskTypes = ['语文', '数学', '英语', '科学', '美术', '音乐']

export const mockTaskTemplates = [
  {
    record_id: 'template001',
    fields: {
      id: 'template_001',
      name: [{ text: '每日阅读', type: 'text' }],
      description: [{ text: '每天阅读30分钟', type: 'text' }],
      type: 'reading',
      type_text: '阅读',
      difficulty: '简单',
      base_points: 15,
      status: '开启'
    }
  },
  {
    record_id: 'template002',
    fields: {
      id: 'template_002',
      name: [{ text: '数学练习', type: 'text' }],
      description: [{ text: '完成10道数学题', type: 'text' }],
      type: 'study',
      type_text: '学习',
      difficulty: '中等',
      base_points: 20,
      status: '开启'
    }
  }
]
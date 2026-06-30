// ==================== Coze代码节点：飞书API查询用户任务数据 ====================
// 作者：AI助手
// 创建时间：2026-06-26
// 功能：通过云函数查询用户任务数据、任务模板、学习习惯配置
// ====================================================================

async function main({ params }: Args): Promise<Output> {
    console.log('🚀 ========== 飞书API查询用户任务开始执行 ==========');
    console.log('📅 执行时间:', new Date().toISOString());
    
    try {
        // ==================== 1. 解析输入参数 ====================
        console.log('🔍 步骤1: 解析输入参数');
        
        console.log('📥 原始输入参数:', JSON.stringify(params, null, 2));
        
        const feishuConfig = params.feishuConfig;
        const userInfo = params.userInfo;
        const content = params.content || '生成今日打卡任务';
        
        console.log('📋 解析后的参数:');
        console.log(`   - baseToken: ${feishuConfig?.baseToken ? '已提供' : '未提供'}`);
        console.log(`   - child_id: ${userInfo?.child_id || '未提供'}`);
        console.log(`   - name: ${userInfo?.name || '未提供'}`);
        console.log(`   - content: "${content}"`);
        
        // ==================== 2. 参数验证 ====================
        console.log('🔍 步骤2: 验证参数有效性');
        
        if (!feishuConfig) {
            console.error('❌ 缺少feishuConfig参数');
            return buildErrorResponse('缺少feishuConfig参数', null, content);
        }
        
        if (!feishuConfig.baseToken) {
            console.error('❌ 缺少feishuConfig.baseToken');
            return buildErrorResponse('缺少feishuConfig.baseToken', null, content);
        }
        
        if (!feishuConfig.tableList || !Array.isArray(feishuConfig.tableList) || feishuConfig.tableList.length === 0) {
            console.error('❌ 缺少feishuConfig.tableList或tableList为空');
            return buildErrorResponse('缺少feishuConfig.tableList或tableList为空', null, content);
        }
        
        if (!userInfo) {
            console.error('❌ 缺少userInfo参数');
            return buildErrorResponse('缺少userInfo参数', null, content);
        }
        
        if (!userInfo.child_id) {
            console.error('❌ 缺少userInfo.child_id');
            return buildErrorResponse('缺少userInfo.child_id', null, content);
        }
        
        console.log('✅ 参数验证通过');
        
        // ==================== 3. 获取表格ID ====================
        console.log('🔍 步骤3: 获取表格ID');
        
        const tableIds = getTableIds(feishuConfig.tableList);
        console.log('📊 表格ID映射:', JSON.stringify(tableIds, null, 2));
        
        const missingTables = [];
        if (!tableIds.taskTable) missingTables.push('任务表');
        if (!tableIds.templateTable) missingTables.push('任务模板表');
        if (!tableIds.childTable) missingTables.push('儿童表');
        
        if (missingTables.length > 0) {
            const errorMsg = `缺少必要的表格配置，请在飞书多维表格中配置：${missingTables.join('、')}`;
            console.error(`❌ ${errorMsg}`);
            return buildErrorResponse(errorMsg, userInfo, content);
        }
        
        console.log('✅ 表格ID验证通过');
        
        // ==================== 4. 并行查询数据（通过云函数） ====================
        console.log('🔍 步骤4: 通过云函数并行查询数据');
        
        const [userTasksResult, taskTemplatesResult, learningHabitsResult] = await Promise.all([
            queryUserTasks(feishuConfig.baseToken, tableIds.taskTable, userInfo.child_id),
            queryTaskTemplates(feishuConfig.baseToken, tableIds.templateTable),
            queryLearningHabits(feishuConfig.baseToken, tableIds.childTable, userInfo.child_id)
        ]);
        
        console.log('✅ 数据查询完成');
        console.log(`   - 用户任务: ${userTasksResult.total || 0}条`);
        console.log(`   - 任务模板: ${taskTemplatesResult.total || 0}条`);
        console.log(`   - 学习习惯: ${learningHabitsResult.total || 0}条`);
        
        // ==================== 5. 构建输出对象 ====================
        console.log('🔍 步骤5: 构建输出对象');
        
        const ret = {
            executionInfo: {
                success: true,
                timestamp: new Date().toISOString(),
                message: '数据查询成功'
            },
            content: content,
            userInfo: userInfo,
            userTasks: {
                total: userTasksResult.total || 0,
                list: userTasksResult.list || [],
                activeTasks: userTasksResult.list.filter(t => t.status === '进行中' || t.status === '未开始').length,
                completedTasks: userTasksResult.list.filter(t => t.status === '已完成').length,
                message: userTasksResult.error ? userTasksResult.error : userTasksResult.total === 0 ? '未查询到用户任务数据' : ''
            },
            taskTemplates: {
                total: taskTemplatesResult.total || 0,
                list: taskTemplatesResult.list || [],
                message:taskTemplatesResult.error ? taskTemplatesResult.error : taskTemplatesResult.total === 0 ? '未查询到任务模板数据' : ''
            },
            learningHabits: {
                total: learningHabitsResult.total || 0,
                list: learningHabitsResult.list || [],
                studyTimeSlots: learningHabitsResult.studyTimeSlots || [],
                message:learningHabitsResult.error ? learningHabitsResult.error : learningHabitsResult.total === 0 ? '未查询到学习习惯配置数据' : ''
            }
        };
        
        console.log('✅ 输出对象构建完成');
        console.log('🎉 ========== 飞书API查询用户任务执行完成 ==========');
        
        return ret;
        
    } catch (error) {
        console.error('❌ 执行过程中发生错误:', error);
        
        return buildErrorResponse(error.message, params.userInfo || null, params.content || '');
    }
}

function buildErrorResponse(errorMessage, userInfo, content) {
    return {
        executionInfo: {
            success: false,
            timestamp: new Date().toISOString(),
            error: errorMessage,
            message: errorMessage
        },
        content: content || '',
        userInfo: userInfo || {},
        userTasks: { total: 0, list: [], activeTasks: 0, completedTasks: 0, message: errorMessage },
        taskTemplates: { total: 0, list: [], message: errorMessage },
        learningHabits: { total: 0, list: [], studyTimeSlots: [], message: errorMessage }
    };
}

// ==================== 表格ID获取函数 ====================

function getTableIds(tableList) {
    const ids = {
        taskTable: '',
        templateTable: '',
        childTable: '',
        userTable: ''
    };
    
    if (!tableList || !Array.isArray(tableList)) {
        return ids;
    }
    
    tableList.forEach(table => {
        const name = table.name || '';
        if (name.includes('任务表') && !name.includes('模板')) {
            ids.taskTable = table.table_id || '';
        } else if (name.includes('任务模板')) {
            ids.templateTable = table.table_id || '';
        } else if (name.includes('儿童表')) {
            ids.childTable = table.table_id || '';
        } else if (name.includes('用户表')) {
            ids.userTable = table.table_id || '';
        }
    });
    
    return ids;
}

// ==================== 云函数调用函数 ====================

const CLOUD_FUNCTION_URL = 'https://abc-1g9fbz6077254054.service.tcloudbase.com/http/queryFeishuData';

async function callCloudFunction(action, params) {
    console.log(`📡 调用云函数 - action: ${action}`);
    
    try {
        const response = await fetch(CLOUD_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action,
                params
            })
        });
        
        const result = await response.json();
        console.log(`   - 云函数响应:`, JSON.stringify(result));
        
        return result;
    } catch (error) {
        console.error('❌ 调用云函数失败:', error.message);
        throw error;
    }
}

async function queryUserTasks(baseToken, tableId, childId) {
    console.log(`📡 查询用户任务 - 表格ID: ${tableId}, 儿童ID: ${childId}`);
    
    try {
        const result = await callCloudFunction('queryUserTasks', {
            baseToken,
            tableId,
            childId
        });
        
        if (result.success) {
            console.log(`✅ 查询成功，返回${result.total}条记录`);
            return {
                total: result.total || 0,
                list: result.list || [],
                source: '云函数'
            };
        } else {
            console.error('❌ 云函数返回错误:', result.error);
            return {
                total: 0,
                list: [],
                source: '云函数',
                error: result.error
            };
        }
    } catch (error) {
        console.error('❌ 查询用户任务失败:', error.message);
        return {
            total: 0,
            list: [],
            source: '云函数',
            error: error.message
        };
    }
}

async function queryTaskTemplates(baseToken, tableId) {
    console.log(`📡 查询任务模板 - 表格ID: ${tableId}`);
    
    try {
        const result = await callCloudFunction('queryTaskTemplates', {
            baseToken,
            tableId
        });
        
        if (result.success) {
            console.log(`✅ 查询成功，返回${result.total}条记录`);
            return {
                total: result.total || 0,
                list: result.list || [],
                source: '云函数'
            };
        } else {
            console.error('❌ 云函数返回错误:', result.error);
            return {
                total: 0,
                list: [],
                source: '云函数',
                error: result.error
            };
        }
    } catch (error) {
        console.error('❌ 查询任务模板失败:', error.message);
        return {
            total: 0,
            list: [],
            source: '云函数',
            error: error.message
        };
    }
}

async function queryLearningHabits(baseToken, tableId, childId) {
    console.log(`📡 查询学习习惯 - 表格ID: ${tableId}, 儿童ID: ${childId}`);
    
    try {
        const result = await callCloudFunction('queryLearningHabits', {
            baseToken,
            tableId,
            childId
        });
        
        if (result.success) {
            console.log(`✅ 查询成功，返回${result.total}条记录`);
            return {
                total: result.total || 0,
                list: result.list || [],
                studyTimeSlots: result.studyTimeSlots || [],
                source: '云函数'
            };
        } else {
            console.error('❌ 云函数返回错误:', result.error);
            return {
                total: 0,
                list: [],
                studyTimeSlots: [],
                source: '云函数',
                error: result.error
            };
        }
    } catch (error) {
        console.error('❌ 查询学习习惯失败:', error.message);
        return {
            total: 0,
            list: [],
            studyTimeSlots: [],
            source: '云函数',
            error: error.message
        };
    }
}
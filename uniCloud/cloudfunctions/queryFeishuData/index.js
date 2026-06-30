'use strict';

const { queryRecords, getTableList } = require('../../uni_modules/settings-feishu-dataBase/uniCloud/cloudfunctions/feishutools/modules/bitable')

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

function buildResponse(data, statusCode = 200) {
    return {
        statusCode: statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify(data)
    }
}

exports.main = async (event, context) => {
    console.log('[queryFeishuData] 收到请求:', JSON.stringify(event))
    
    const isHttpTrigger = !!event.httpMethod || !!event.requestContext?.http
    
    if (isHttpTrigger && (event.httpMethod === 'OPTIONS' || event.requestContext?.http?.method === 'OPTIONS')) {
        console.log('[queryFeishuData] 处理OPTIONS预检请求')
        return buildResponse({}, 204)
    }
    
    try {
        let requestData = event
        
        if (isHttpTrigger) {
            let body = event.body
            if (typeof body === 'string') {
                try {
                    body = JSON.parse(body)
                } catch (e) {
                    console.error('[queryFeishuData] 解析body失败:', e)
                    return buildResponse({
                        success: false,
                        error: '请求体格式错误'
                    }, 400)
                }
            }
            requestData = body || event
        }
        
        const { action, params } = requestData
        
        if (!action) {
            const error = { success: false, error: '缺少action参数' }
            return isHttpTrigger ? buildResponse(error, 400) : error
        }
        
        let result
        switch (action) {
            case 'queryUserTasks':
                result = await handleQueryUserTasks(params)
                break
            case 'queryTaskTemplates':
                result = await handleQueryTaskTemplates(params)
                break
            case 'queryLearningHabits':
                result = await handleQueryLearningHabits(params)
                break
            case 'queryAll':
                result = await handleQueryAll(params)
                break
            default:
                const defaultError = { success: false, error: '不支持的action: ' + action }
                return isHttpTrigger ? buildResponse(defaultError, 400) : defaultError
        }
        
        return isHttpTrigger ? buildResponse(result) : result
        
    } catch (error) {
        console.error('[queryFeishuData] 执行异常:', error)
        const errorResponse = { success: false, error: error.message }
        return isHttpTrigger ? buildResponse(errorResponse, 500) : errorResponse
    }
}

async function handleQueryUserTasks(params) {
    const { baseToken, tableId, childId } = params
    
    if (!baseToken || !tableId || !childId) {
        return {
            success: false,
            error: '缺少必要参数: baseToken、tableId、childId'
        }
    }
    
    console.log('[queryFeishuData] 查询用户任务 - tableId:', tableId, ', childId:', childId)
    
    try {
        const result = await queryRecords({
            baseToken,
            tableId,
            filter: {
                child_id: childId
            },
            pageSize: 100
        })
        
        const tasks = (result.data || []).map(item => {
            const fields = item.fields || {}
            return {
                recordId: item.record_id || '',
                title: fields.title?.[0]?.text || fields.title || '',
                description: fields.description?.[0]?.text || fields.description || '',
                type: fields.type?.[0]?.text || fields.type || '',
                difficulty: fields.difficulty?.[0]?.text || fields.difficulty || '',
                basePoints: fields.base_points || 0,
                rewardPoints: fields.reward_points || 0,
                status: fields.status?.[0]?.text || fields.status || '',
                childId: fields.child_id?.[0]?.text || fields.child_id || '',
                deadlineTime: fields.deadline_time || '',
                createdAt: fields.created_at || fields.created_time || '',
                needAudit: fields.need_audit || false
            }
        })
        
        return {
            success: true,
            total: tasks.length,
            list: tasks,
            source: '飞书API'
        }
    } catch (error) {
        console.error('[queryFeishuData] 查询用户任务失败:', error)
        return {
            success: false,
            total: 0,
            list: [],
            source: '飞书API',
            error: error.message
        }
    }
}

async function handleQueryTaskTemplates(params) {
    const { baseToken, tableId } = params
    
    if (!baseToken || !tableId) {
        return {
            success: false,
            error: '缺少必要参数: baseToken、tableId'
        }
    }
    
    console.log('[queryFeishuData] 查询任务模板 - tableId:', tableId)
    
    try {
        const result = await queryRecords({
            baseToken,
            tableId,
            pageSize: 100
        })
        
        const templates = (result.data || []).map(item => {
            const fields = item.fields || {}
            return {
                recordId: item.record_id || '',
                title: fields.title?.[0]?.text || fields.title || '',
                description: fields.description?.[0]?.text || fields.description || '',
                type: fields.type?.[0]?.text || fields.type || '',
                category: fields.category?.[0]?.text || fields.category || '',
                subject: fields.subject?.[0]?.text || fields.subject || '',
                difficulty: fields.difficulty?.[0]?.text || fields.difficulty || '',
                basePoints: fields.base_points || 0,
                rewardPoints: fields.reward_points || 0,
                frequency: fields.frequency?.[0]?.text || fields.frequency || '',
                tags: Array.isArray(fields.tags) ? fields.tags.map(t => t.text || t) : [],
                grade: fields.grade?.[0]?.text || fields.grade || ''
            }
        })
        
        return {
            success: true,
            total: templates.length,
            list: templates,
            source: '飞书API'
        }
    } catch (error) {
        console.error('[queryFeishuData] 查询任务模板失败:', error)
        return {
            success: false,
            total: 0,
            list: [],
            source: '飞书API',
            error: error.message
        }
    }
}

async function handleQueryLearningHabits(params) {
    const { baseToken, tableId, childId } = params
    
    if (!baseToken || !tableId || !childId) {
        return {
            success: false,
            error: '缺少必要参数: baseToken、tableId、childId'
        }
    }
    
    console.log('[queryFeishuData] 查询学习习惯 - tableId:', tableId, ', childId:', childId)
    
    try {
        const result = await queryRecords({
            baseToken,
            tableId,
            filter: {
                child_id: childId
            },
            pageSize: 100
        })
        
        const children = (result.data || []).map(item => {
            const fields = item.fields || {}
            return {
                recordId: item.record_id || '',
                childId: fields.child_id?.[0]?.text || fields.child_id || '',
                name: fields.name?.[0]?.text || fields.name || '',
                age: fields.age || '',
                grade: fields.grade?.[0]?.text || fields.grade || '',
                hobby: Array.isArray(fields.hobby) ? fields.hobby.map(h => h.text || h) : [],
                studyStartTime: fields.study_start_time || '',
                studyEndTime: fields.study_end_time || '',
                studyTimeSlots: parseStudyTimeSlots(fields.study_time_slots)
            }
        })
        
        const studyTimeSlots = children.length > 0 ? children[0].studyTimeSlots : []
        
        return {
            success: true,
            total: children.length,
            list: children,
            studyTimeSlots: studyTimeSlots,
            source: '飞书API'
        }
    } catch (error) {
        console.error('[queryFeishuData] 查询学习习惯失败:', error)
        return {
            success: false,
            total: 0,
            list: [],
            studyTimeSlots: [],
            source: '飞书API',
            error: error.message
        }
    }
}

async function handleQueryAll(params) {
    const { feishuConfig, userInfo } = params
    
    if (!feishuConfig || !userInfo) {
        return {
            success: false,
            error: '缺少必要参数: feishuConfig、userInfo'
        }
    }
    
    const { baseToken, tableList } = feishuConfig
    const { child_id } = userInfo
    
    if (!baseToken || !tableList || !tableList.length || !child_id) {
        return {
            success: false,
            error: '参数不完整'
        }
    }
    
    const tableIds = getTableIds(tableList)
    
    const missingTables = []
    if (!tableIds.taskTable) missingTables.push('任务表')
    if (!tableIds.templateTable) missingTables.push('任务模板表')
    if (!tableIds.childTable) missingTables.push('儿童表')
    
    if (missingTables.length > 0) {
        return {
            success: false,
            error: '缺少必要的表格配置：' + missingTables.join('、')
        }
    }
    
    console.log('[queryFeishuData] 并行查询所有数据')
    
    const [userTasksResult, taskTemplatesResult, learningHabitsResult] = await Promise.all([
        handleQueryUserTasks({ baseToken, tableId: tableIds.taskTable, childId: child_id }),
        handleQueryTaskTemplates({ baseToken, tableId: tableIds.templateTable }),
        handleQueryLearningHabits({ baseToken, tableId: tableIds.childTable, childId: child_id })
    ])
    
    return {
        success: true,
        userTasks: userTasksResult,
        taskTemplates: taskTemplatesResult,
        learningHabits: learningHabitsResult
    }
}

function getTableIds(tableList) {
    const ids = {
        taskTable: '',
        templateTable: '',
        childTable: '',
        userTable: ''
    }
    
    if (!tableList || !Array.isArray(tableList)) {
        return ids
    }
    
    tableList.forEach(table => {
        const name = table.name || ''
        if (name.includes('任务表') && !name.includes('模板')) {
            ids.taskTable = table.table_id || ''
        } else if (name.includes('任务模板')) {
            ids.templateTable = table.table_id || ''
        } else if (name.includes('儿童表')) {
            ids.childTable = table.table_id || ''
        } else if (name.includes('用户表')) {
            ids.userTable = table.table_id || ''
        }
    })
    
    return ids
}

function parseStudyTimeSlots(studyTimeSlots) {
    if (!studyTimeSlots) return []
    
    try {
        if (typeof studyTimeSlots === 'string') {
            return JSON.parse(studyTimeSlots)
        }
        if (Array.isArray(studyTimeSlots)) {
            return studyTimeSlots
        }
    } catch (e) {
        console.warn('[queryFeishuData] 解析学习时间段失败:', e)
    }
    
    return []
}
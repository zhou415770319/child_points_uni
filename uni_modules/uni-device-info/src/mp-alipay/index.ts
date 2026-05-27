import type { DeviceInfo, NetworkInfo, BatteryInfo } from '../types/device'

/**
 * 获取设备信息 - 支付宝小程序实现
 */
export function getDeviceInfo(): DeviceInfo {
	const systemInfo = my.getSystemInfoSync?.() || {}
	
	return {
		model: (systemInfo as any).model || 'unknown',
		brand: (systemInfo as any).brand || 'unknown',
		osVersion: (systemInfo as any).system || 'unknown',
		osType: (systemInfo as any).platform === 'android' ? 'android' : 
				(systemInfo as any).platform === 'ios' ? 'ios' : 'unknown',
		uuid: '', // 小程序无法获取UUID
		appVersion: (systemInfo as any).appVersion || 'unknown',
		appVersionCode: (systemInfo as any).appVersion || 'unknown',
		deviceName: (systemInfo as any).model || 'unknown',
		screenWidth: (systemInfo as any).screenWidth || 0,
		screenHeight: (systemInfo as any).screenHeight || 0,
		pixelRatio: (systemInfo as any).pixelRatio || 2
	}
}

/**
 * 获取网络信息 - 支付宝小程序实现
 */
export function getNetworkInfo(): NetworkInfo {
	const networkType = my.getNetworkType?.() || 'unknown'
	
	let type: 'wifi' | '4g' | '3g' | '2g' | 'none' | 'unknown' = 'unknown'
	let isConnected = true
	
	switch (networkType) {
		case 'wifi':
			type = 'wifi'
			break
		case '4g':
			type = '4g'
			break
		case '3g':
			type = '3g'
			break
		case '2g':
			type = '2g'
			break
		case 'none':
			type = 'none'
			isConnected = false
			break
		default:
			type = 'unknown'
	}
	
	return {
		type,
		isConnected
	}
}

/**
 * 获取电池信息 - 支付宝小程序实现
 */
export function getBatteryInfo(): BatteryInfo {
	return {
		level: -1, // 支付宝小程序不支持获取电池信息
		isCharging: false
	}
}
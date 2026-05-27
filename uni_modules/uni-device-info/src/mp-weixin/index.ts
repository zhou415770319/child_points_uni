import type { DeviceInfo, NetworkInfo, BatteryInfo } from '../types/device'

/**
 * 获取设备信息 - 微信小程序实现
 */
export function getDeviceInfo(): DeviceInfo {
	const systemInfo = uni.getSystemInfoSync()
	
	return {
		model: systemInfo.model,
		brand: systemInfo.brand,
		osVersion: systemInfo.system,
		osType: systemInfo.platform === 'android' ? 'android' : 
				systemInfo.platform === 'ios' ? 'ios' : 'unknown',
		uuid: '', // 小程序无法获取UUID
		appVersion: systemInfo.version,
		appVersionCode: systemInfo.version,
		deviceName: systemInfo.model,
		screenWidth: systemInfo.screenWidth,
		screenHeight: systemInfo.screenHeight,
		pixelRatio: systemInfo.pixelRatio
	}
}

/**
 * 获取网络信息 - 微信小程序实现
 */
export function getNetworkInfo(): NetworkInfo {
	const networkType = uni.getNetworkTypeSync()
	
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
 * 获取电池信息 - 微信小程序实现
 */
export function getBatteryInfo(): BatteryInfo {
	const batteryInfo = uni.getBatteryInfoSync?.() || {}
	
	return {
		level: (batteryInfo as any).level || -1,
		isCharging: (batteryInfo as any).isCharging || false
	}
}
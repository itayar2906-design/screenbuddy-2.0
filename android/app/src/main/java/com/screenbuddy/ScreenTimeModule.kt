package com.screenbuddy

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.*

class ScreenTimeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val blockedApps = mutableSetOf<String>()
    private val activeTimers = mutableMapOf<String, Timer>()
    private val handler = Handler(Looper.getMainLooper())

    override fun getName(): String {
        return "ScreenTimeModule"
    }

    // MARK: - Request Permissions

    @ReactMethod
    fun requestPermissions(promise: Promise) {
        try {
            val context = reactApplicationContext
            
            // Check if we have usage stats permission
            val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                context.packageName
            )
            
            if (mode != AppOpsManager.MODE_ALLOWED) {
                // Request permission
                val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                context.startActivity(intent)
                promise.resolve(false)
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("PERMISSION_ERROR", e.message, e)
        }
    }

    // MARK: - Block App

    @ReactMethod
    fun blockApp(packageName: String, promise: Promise) {
        try {
            blockedApps.add(packageName)
            
            // In a real implementation, you would use AccessibilityService
            // or Device Policy Manager to enforce blocking
            // For now, we just track the blocked state
            
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("BLOCK_ERROR", e.message, e)
        }
    }

    // MARK: - Unblock App for Minutes

    @ReactMethod
    fun unblockAppForMinutes(packageName: String, minutes: Int, promise: Promise) {
        try {
            // Remove from blocked list
            blockedApps.remove(packageName)
            
            // Cancel existing timer if any
            activeTimers[packageName]?.cancel()
            activeTimers.remove(packageName)
            
            // Send 2-minute warning
            if (minutes > 2) {
                val warningDelay = (minutes - 2) * 60 * 1000L
                handler.postDelayed({
                    sendEvent("onTwoMinuteWarning", Arguments.createMap().apply {
                        putString("packageName", packageName)
                        putInt("remainingMinutes", 2)
                    })
                }, warningDelay)
            }
            
            // Set timer to re-block
            val timer = Timer()
            timer.schedule(object : TimerTask() {
                override fun run() {
                    blockedApps.add(packageName)
                    activeTimers.remove(packageName)
                    
                    sendEvent("onTimerExpired", Arguments.createMap().apply {
                        putString("packageName", packageName)
                    })
                }
            }, (minutes * 60 * 1000).toLong())
            
            activeTimers[packageName] = timer
            
            val result = Arguments.createMap().apply {
                putString("packageName", packageName)
                putInt("minutes", minutes)
                putDouble("expiresAt", (System.currentTimeMillis() + minutes * 60 * 1000) / 1000.0)
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("UNBLOCK_ERROR", e.message, e)
        }
    }

    // MARK: - Get Blocked Apps

    @ReactMethod
    fun getBlockedApps(promise: Promise) {
        try {
            val array = Arguments.createArray()
            blockedApps.forEach { array.pushString(it) }
            promise.resolve(array)
        } catch (e: Exception) {
            promise.reject("GET_BLOCKED_ERROR", e.message, e)
        }
    }

    // MARK: - Get Remaining Minutes

    @ReactMethod
    fun getRemainingMinutes(packageName: String, promise: Promise) {
        try {
            val timer = activeTimers[packageName]
            if (timer == null) {
                promise.resolve(0)
                return
            }
            
            // This is a simplified implementation
            // In production, you'd track the exact expiration time
            promise.resolve(0)
        } catch (e: Exception) {
            promise.reject("GET_REMAINING_ERROR", e.message, e)
        }
    }

    // MARK: - Event Emitter

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    // MARK: - Cleanup

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        activeTimers.values.forEach { it.cancel() }
        activeTimers.clear()
    }
}

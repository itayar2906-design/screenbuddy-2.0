import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const LINKING_ERROR =
    `The package 'screen-buddy' doesn't seem to be linked. Make sure: \n\n` +
    Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
    '- You rebuilt the app after installing the package\n' +
    '- You are not using Expo Go\n';

const ScreenTimeModule = NativeModules.ScreenTimeModuleBridge || NativeModules.ScreenTimeModule;

if (!ScreenTimeModule) {
    throw new Error(LINKING_ERROR);
}

const eventEmitter = new NativeEventEmitter(ScreenTimeModule);

class ScreenTime {
    constructor() {
        this.listeners = {
            onTimerExpired: [],
            onTwoMinuteWarning: [],
        };

        // Set up event listeners
        eventEmitter.addListener('onTimerExpired', (data) => {
            this.listeners.onTimerExpired.forEach((callback) => callback(data));
        });

        eventEmitter.addListener('onTwoMinuteWarning', (data) => {
            this.listeners.onTwoMinuteWarning.forEach((callback) => callback(data));
        });
    }

    /**
     * Request Screen Time permissions from the user
     * @returns {Promise<boolean>} True if permission granted
     */
    async requestPermissions() {
        try {
            return await ScreenTimeModule.requestPermissions();
        } catch (error) {
            console.error('Error requesting permissions:', error);
            throw error;
        }
    }

    /**
     * Block an app by its identifier
     * @param {string} appIdentifier - Bundle ID (iOS) or package name (Android)
     * @param {string} childId - Child ID (for tracking purposes)
     * @returns {Promise<boolean>}
     */
    async blockApp(appIdentifier, childId) {
        try {
            return await ScreenTimeModule.blockApp(appIdentifier);
        } catch (error) {
            console.error('Error blocking app:', error);
            throw error;
        }
    }

    /**
     * Unblock an app for a specified number of minutes
     * @param {string} appIdentifier - Bundle ID (iOS) or package name (Android)
     * @param {number} minutes - Number of minutes to unlock
     * @param {string} childId - Child ID (for tracking purposes)
     * @returns {Promise<{packageName: string, minutes: number, expiresAt: number}>}
     */
    async unblockAppForMinutes(appIdentifier, minutes, childId) {
        try {
            return await ScreenTimeModule.unblockAppForMinutes(appIdentifier, minutes);
        } catch (error) {
            console.error('Error unblocking app:', error);
            throw error;
        }
    }

    /**
     * Get list of currently blocked apps
     * @param {string} childId - Child ID (for tracking purposes)
     * @returns {Promise<string[]>} Array of app identifiers
     */
    async getBlockedApps(childId) {
        try {
            return await ScreenTimeModule.getBlockedApps();
        } catch (error) {
            console.error('Error getting blocked apps:', error);
            throw error;
        }
    }

    /**
     * Get remaining minutes for an unlocked app
     * @param {string} appIdentifier - Bundle ID (iOS) or package name (Android)
     * @returns {Promise<number>} Remaining minutes
     */
    async getRemainingMinutes(appIdentifier) {
        try {
            return await ScreenTimeModule.getRemainingMinutes(appIdentifier);
        } catch (error) {
            console.error('Error getting remaining minutes:', error);
            throw error;
        }
    }

    /**
     * Register callback for when timer expires
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    onTimerExpired(callback) {
        this.listeners.onTimerExpired.push(callback);
        return () => {
            this.listeners.onTimerExpired = this.listeners.onTimerExpired.filter(
                (cb) => cb !== callback
            );
        };
    }

    /**
     * Register callback for 2-minute warning
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    onTwoMinuteWarning(callback) {
        this.listeners.onTwoMinuteWarning.push(callback);
        return () => {
            this.listeners.onTwoMinuteWarning = this.listeners.onTwoMinuteWarning.filter(
                (cb) => cb !== callback
            );
        };
    }
}

export default new ScreenTime();

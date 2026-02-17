import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
    CHILD_ID: 'screenbuddy_child_id',
    CHILD_SESSION: 'screenbuddy_child_session',
    PARENT_SESSION: 'screenbuddy_parent_session',
};

export const storage = {
    // Child session management
    async saveChildSession(childId) {
        await SecureStore.setItemAsync(STORAGE_KEYS.CHILD_ID, childId);
        await SecureStore.setItemAsync(STORAGE_KEYS.CHILD_SESSION, JSON.stringify({
            childId,
            timestamp: new Date().toISOString(),
        }));
    },

    async getChildSession() {
        const sessionData = await SecureStore.getItemAsync(STORAGE_KEYS.CHILD_SESSION);
        if (!sessionData) return null;
        return JSON.parse(sessionData);
    },

    async clearChildSession() {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.CHILD_ID);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.CHILD_SESSION);
    },

    // Generic storage
    async setItem(key, value) {
        await SecureStore.setItemAsync(key, typeof value === 'string' ? value : JSON.stringify(value));
    },

    async getItem(key) {
        const value = await SecureStore.getItemAsync(key);
        if (!value) return null;

        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    },

    async removeItem(key) {
        await SecureStore.deleteItemAsync(key);
    },

    async clear() {
        // Clear all Screen Buddy related keys
        await this.clearChildSession();
    },
};

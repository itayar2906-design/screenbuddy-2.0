import 'react-native-gesture-handler/jestSetup';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        auth: {
            getSession: jest.fn(() => Promise.resolve({ data: { session: { user: { id: 'test-user' } } } })),
            getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } } })),
        },
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
        channel: jest.fn(() => ({
            on: jest.fn().mockReturnThis(),
            subscribe: jest.fn().mockReturnThis(),
            unsubscribe: jest.fn(),
        })),
        functions: {
            invoke: jest.fn(),
        },
    })),
}));

// Mock Native Modules (EventEmitter)
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Mock React Native Modules
jest.mock('react-native', () => {
    const RN = jest.requireActual('react-native');
    RN.NativeModules.ScreenTimeModuleBridge = {
        requestPermissions: jest.fn(),
        blockApp: jest.fn(),
        unblockAppForMinutes: jest.fn(),
        getBlockedApps: jest.fn(),
        getRemainingMinutes: jest.fn(),
    };
    RN.NativeModules.ScreenTimeModule = RN.NativeModules.ScreenTimeModuleBridge;
    return RN;
});

// Mock Expo Modules
jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

// Mock Stripe
jest.mock('@stripe/stripe-react-native', () => ({
    StripeProvider: ({ children }) => children,
}));

import { currency } from '../src/services/currency';
import { tasks } from '../src/services/tasks';
import { screentime } from '../src/services/screentime';

// Mock the supabase client wrapper directly
jest.mock('../src/lib/supabase', () => ({
    supabase: {
        from: jest.fn(),
        functions: {
            invoke: jest.fn(),
        },
        auth: {
            getSession: jest.fn(),
        },
        channel: jest.fn(() => ({
            on: jest.fn().mockReturnThis(),
            subscribe: jest.fn().mockReturnThis(),
            unsubscribe: jest.fn(),
        })),
    },
}));

// Mock the native wrapper directly with ES Module structure
jest.mock('../src/native/ScreenTime', () => {
    const mockInstance = {
        unblockAppForMinutes: jest.fn().mockResolvedValue(true),
        blockApp: jest.fn().mockResolvedValue(true),
        getBlockedApps: jest.fn().mockResolvedValue([]),
        requestPermissions: jest.fn().mockResolvedValue(true),
        onTimerExpired: jest.fn(),
        onTwoMinuteWarning: jest.fn(),
    };
    return {
        __esModule: true,
        default: mockInstance,
    };
});

import { supabase } from '../src/lib/supabase';
import ScreenTime from '../src/native/ScreenTime';

describe('Business Logic Verification', () => {
    const mockChildId = 'child-123';
    const mockParentId = 'parent-123';

    beforeEach(() => {
        jest.clearAllMocks();

        // Default auth mock
        supabase.auth.getSession.mockResolvedValue({
            data: { session: { access_token: 'valid-token' } },
            error: null
        });
    });

    describe('Currency Service', () => {
        it('should fetch child balance', async () => {
            // Mock chain: from('children').select(...).eq(...).single()
            const mockSingle = jest.fn().mockResolvedValue({
                data: { time_bucks: 100 },
                error: null
            });
            const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
            const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
            supabase.from.mockReturnValue({ select: mockSelect });

            const balance = await currency.getBalance(mockChildId);

            expect(balance).toBe(100);
            expect(supabase.from).toHaveBeenCalledWith('children');
            expect(mockSelect).toHaveBeenCalledWith('time_bucks');
            expect(mockEq).toHaveBeenCalledWith('id', mockChildId);
        });

        it('should freeze spending via Edge Function', async () => {
            supabase.functions.invoke.mockResolvedValue({
                data: { success: true },
                error: null
            });

            await currency.toggleFreeze(mockChildId, true);

            expect(supabase.functions.invoke).toHaveBeenCalledWith('freeze-spending', expect.objectContaining({
                body: { child_id: mockChildId, freeze: true }
            }));
        });
    });

    describe('Task System Flow', () => {
        it('should create a new task', async () => {
            const newTask = {
                title: 'Clean Room',
                time_bucks_reward: 50
            };

            // Mock chain: from('tasks').insert(...).select().single()
            const mockSingle = jest.fn().mockResolvedValue({
                data: { id: 'task-1', ...newTask },
                error: null
            });
            const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
            const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
            supabase.from.mockReturnValue({ insert: mockInsert });

            const result = await tasks.createTask(mockParentId, mockChildId, newTask);

            expect(result).toMatchObject(newTask);
            expect(supabase.from).toHaveBeenCalledWith('tasks');
        });

        it('should submit task completion', async () => {
            // Mock chain: from('task_completions').insert(...).select().single()
            const mockSingle = jest.fn().mockResolvedValue({
                data: { id: 'completion-1', status: 'pending' },
                error: null
            });
            const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
            const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
            supabase.from.mockReturnValue({ insert: mockInsert });

            const result = await tasks.submitTaskCompletion('task-1', mockChildId);
            expect(result.status).toBe('pending');
        });

        it('should approve task via Edge Function', async () => {
            supabase.functions.invoke.mockResolvedValue({
                data: { success: true, new_balance: 150 },
                error: null
            });

            await tasks.approveTask('completion-1');

            expect(supabase.functions.invoke).toHaveBeenCalledWith('approve-task', expect.objectContaining({
                body: { task_completion_id: 'completion-1' }
            }));
        });
    });

    describe('Screen Time Purchase Flow', () => {
        it('should unlock app via Edge Function', async () => {
            supabase.functions.invoke.mockResolvedValue({
                data: { success: true },
                error: null
            });

            await screentime.unlockApp(mockChildId, 'YouTube', 'com.youtube', 30);

            expect(supabase.functions.invoke).toHaveBeenCalledWith('unlock-screen-time', expect.objectContaining({
                body: {
                    child_id: mockChildId,
                    app_name: 'YouTube',
                    minutes: 30
                }
            }));

            // Correct expectation: packageName, minutes, childId
            expect(ScreenTime.unblockAppForMinutes).toHaveBeenCalledWith('com.youtube', 30, mockChildId);
        });
    });
});

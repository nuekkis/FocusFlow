import { create } from 'zustand';

export type FocusState = 'FOCUSED' | 'DISTRACTED' | 'DROWSY' | 'CALIBRATING';

interface FocusStore {
    focusScore: number; // 0.0 to 1.0 (or 0-100)
    focusState: FocusState;
    isWebcamActive: boolean;

    // Calibration
    calibrationData: {
        baselineEAR: number; // Eye Aspect Ratio
        centerHeadPose: { yaw: number; pitch: number; roll: number } | null;
    };

    setFocusScore: (score: number) => void;
    setFocusState: (state: FocusState) => void;
    setWebcamActive: (active: boolean) => void;
    setCalibrationData: (data: Partial<FocusStore['calibrationData']>) => void;
}

export const useFocusStore = create<FocusStore>((set) => ({
    focusScore: 1.0,
    focusState: 'FOCUSED',
    isWebcamActive: false,
    calibrationData: {
        baselineEAR: 0.3, // Default average
        centerHeadPose: null,
    },

    setFocusScore: (score) => set({ focusScore: score }),
    setFocusState: (state) => set({ focusState: state }),
    setWebcamActive: (active) => set({ isWebcamActive: active }),
    setCalibrationData: (data) =>
        set((state) => ({
            calibrationData: { ...state.calibrationData, ...data },
        })),
}));

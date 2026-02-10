export interface Keypoint {
    x: number;
    y: number;
    z?: number;
    name?: string;
}
import { LEFT_EYE, RIGHT_EYE, NOSE_TIP, LEFT_EAR, RIGHT_EAR, CHIN } from './indices';

// Helper to get distance between two points (2D or 3D)
export function euclideanDistance(p1: Keypoint, p2: Keypoint): number {
    return Math.sqrt(
        Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow((p1.z || 0) - (p2.z || 0), 2)
    );
}

// Calculate Eye Aspect Ratio (EAR)
// EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
export function calculateEAR(eyeKeypoints: Keypoint[]): number {
    // Keypoints are passed in order: [left, top1, top2, top3, right, bottom3, bottom2, bottom1]
    // BUT our indices are: [33, 133, 160, 159, 158, 144, 145, 153]
    // 33=left (p1), 133=right (p4)
    // 160, 159, 158 are top. 144, 145, 153 are bottom.
    // We use vertical pairs: (160, 144) and (158, 153) roughly.

    // Simplified EAR using specific indices from our list
    // indices array: [0:33, 1:133, 2:160, 3:159, 4:158, 5:144, 6:145, 7:153]
    // Vertical 1: index 3 (159 - top mid) and index 6 (145 - bottom mid)
    // Vertical 2: index 2 (160) and index 5 (144)
    // Horizontal: index 0 (33) and index 1 (133)

    const v1 = euclideanDistance(eyeKeypoints[3], eyeKeypoints[6]);
    const v2 = euclideanDistance(eyeKeypoints[2], eyeKeypoints[5]); // Using neighbors for robustness
    const h = euclideanDistance(eyeKeypoints[0], eyeKeypoints[1]);

    return (v1 + v2) / (2.0 * h);
}

// Estimate Yaw (Left/Right turn)
// Based on ratio of nose to ears
export function calculateYaw(keypoints: Keypoint[]): number {
    const nose = keypoints[NOSE_TIP];
    const leftEar = keypoints[LEFT_EAR];
    const rightEar = keypoints[RIGHT_EAR];

    const dLeft = euclideanDistance(nose, leftEar);
    const dRight = euclideanDistance(nose, rightEar);

    // If looking straight, dLeft ~= dRight.
    // If looking left, dLeft < dRight.
    // Normalized ratio: (dRight - dLeft) / (dRight + dLeft)
    // Range roughly -1 to 1. 0 is center.
    return (dRight - dLeft) / (dRight + dLeft);
}

// Estimate Pitch (Up/Down)
// Based on nose position relative to eyes and chin
// This is a rough heuristic for 2D landmarks without full PnP solver
export function calculatePitch(keypoints: Keypoint[]): number {
    const nose = keypoints[NOSE_TIP];
    const chin = keypoints[CHIN];
    // Midpoint between eyes would be better but let's use nose-chin distance vs face height
    // Actually simpler: vertical placement of nose between eyes mid and mouth

    // Let's use simpler metric: 
    // Normalized vertical position of nose in the face box?
    // Or just relative y differences.

    // Better heuristic:
    // Ratio of (Nose to Chin) / (Eyes Midpoint to Nose)
    // We construct Eyes Midpoint from indices 33 and 263 (outer corners)
    const leftEyeOuter = keypoints[33];
    const rightEyeOuter = keypoints[263];
    const eyesMidY = (leftEyeOuter.y + rightEyeOuter.y) / 2;

    const noseY = nose.y;
    const chinY = chin.y;

    const dNoseChin = chinY - noseY;
    const dEyesNose = noseY - eyesMidY;

    if (dEyesNose === 0) return 0;

    // Ratio
    return dNoseChin / dEyesNose;
}

// Estimate Emotion
// Simple heuristics for Happy, Surprised, Sad, Neutral
export function calculateEmotion(keypoints: Keypoint[]): 'HAPPY' | 'SAD' | 'SURPRISED' | 'NEUTRAL' {
    // Indices (mapped from indices.ts for reference)
    // 13 = Upper Lip Top
    // 14 = Lower Lip Bottom
    // 61 = Mouth Corner Left
    // 291 = Mouth Corner Right
    // 33 = Left Eye Inner
    // 263 = Right Eye Inner
    // 66 = Left Eyebrow Mid
    // 296 = Right Eyebrow Mid

    // We can just use the passed keypoints array directly if it's 468 length
    // But calculateEmotion receives the *full* keypoints array? 
    // Yes, useFocusLogic passes the mapped keypoints.

    const upperLip = keypoints[13];
    const lowerLip = keypoints[14];
    const mouthLeft = keypoints[61];
    const mouthRight = keypoints[291];
    const nose = keypoints[1];

    // 1. Calculate Mouth Aspect Ratio (MAR) for Surprise
    // Vertical distance / Horizontal distance
    const mouthHeight = euclideanDistance(upperLip, lowerLip);
    const mouthWidth = euclideanDistance(mouthLeft, mouthRight);

    // 2. Smile Detection
    // Mouth corners are usually higher than lower lip or even upper lip when smiling
    // But simpler: mouth width increases significantly?
    // Let's use relative height of corners vs center of mouth.
    const mouthCenterY = (upperLip.y + lowerLip.y) / 2;
    const cornersY = (mouthLeft.y + mouthRight.y) / 2;
    // Normalized by nose-chin distance to be scale invariant?
    // Let's just check if corners are significantly above the center.
    // Note: y increases downwards. So "above" means cornersY < mouthCenterY.

    // 3. Eyebrow Raise for Surprise

    // Heuristics
    const MAR = mouthHeight / mouthWidth;

    if (MAR > 0.5) {
        return 'SURPRISED';
    }

    // Smile: Corners are higher (smaller y) than mouth center
    // Threshold needs tuning.
    if (mouthCenterY - cornersY > 0.02) {
        return 'HAPPY';
    }

    // Sad: Corners are lower (larger y) than mouth center
    if (cornersY - mouthCenterY > 0.02) {
        return 'SAD';
    }

    return 'NEUTRAL';
}

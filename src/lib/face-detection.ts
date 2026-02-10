import type { FaceMesh } from '@mediapipe/face_mesh';

// We need to declare the global types for MediaPipe if they aren't picked up
// or just use 'any' for the library import if types are missing.
// Fortunately @mediapipe/face_mesh includes types.

export async function createFaceMesh(): Promise<FaceMesh> {
    // Dynamic import to avoid SSR issues
    // We import the module for side effects or to get the Class
    const faceMeshModule = await import('@mediapipe/face_mesh');

    // The FaceMesh class should be exposed either as a named export 
    // or attached to window if the file is a pure script.
    // Based on package analysis, it might be weird.
    // Let's try to get it from the module first.

    let FaceMeshClass = faceMeshModule.FaceMesh;

    // Fallback for UMD/Global script behavior
    if (!FaceMeshClass && typeof window !== 'undefined' && (window as any).FaceMesh) {
        FaceMeshClass = (window as any).FaceMesh;
    }

    if (!FaceMeshClass) {
        throw new Error("Could not load FaceMesh class from @mediapipe/face_mesh");
    }

    const faceMesh = new FaceMeshClass({
        locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
    });

    faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    return faceMesh;
}


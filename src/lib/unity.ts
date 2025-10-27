import { UnityInstance } from '../types';

declare global {
  interface Window {
    createUnityInstance: (
      canvas: HTMLCanvasElement,
      config: UnityConfig,
      onProgress?: (progress: number) => void
    ) => Promise<UnityInstance>;
  }
}

interface UnityConfig {
  dataUrl: string;
  frameworkUrl: string;
  codeUrl: string;
  streamingAssetsUrl: string;
  companyName: string;
  productName: string;
  productVersion: string;
  webglContextAttributes: {
    alpha: boolean;
    premultipliedAlpha: boolean;
    preserveDrawingBuffer?: boolean;
  };
}

/**
 * Load Unity WebGL build script
 */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script already loaded
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
}

/**
 * Load and initialize Unity WebGL build
 */
export async function loadUnityBuild(
  canvas: HTMLCanvasElement,
  onProgress?: (progress: number) => void
): Promise<UnityInstance> {
  // Load Unity loader script
  await loadScript('/unity/Build/mirabel-unity-webgl-builds.loader.js');

  // Wait for createUnityInstance to be available
  let retries = 0;
  while (!window.createUnityInstance && retries < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    retries++;
  }

  if (!window.createUnityInstance) {
    throw new Error('Unity loader failed to initialize');
  }

  const config: UnityConfig = {
    dataUrl: '/unity/Build/mirabel-unity-webgl-builds.data',
    frameworkUrl: '/unity/Build/mirabel-unity-webgl-builds.framework.js',
    codeUrl: '/unity/Build/mirabel-unity-webgl-builds.wasm',
    streamingAssetsUrl: 'StreamingAssets',
    companyName: 'DefaultCompany',
    productName: 'mirabel-unity-webgl',
    productVersion: '1.0',
    webglContextAttributes: {
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false
    }
  };

  const instance = await window.createUnityInstance(canvas, config, onProgress);
  return instance;
}

/**
 * Send message to Unity
 */
export function sendToUnity(
  instance: UnityInstance,
  objectName: string,
  methodName: string,
  value?: string | number
): void {
  if (!instance) {
    console.warn('Unity instance not ready');
    return;
  }
  instance.SendMessage(objectName, methodName, value);
}

import { useEffect, useState } from 'react';

export type WebGLCapability = 'checking' | 'supported' | 'unsupported';

export function useWebGLCapability() {
  const [capability, setCapability] = useState<WebGLCapability>('checking');

  useEffect(() => {
    const supported = typeof window.WebGLRenderingContext !== 'undefined'
      || typeof window.WebGL2RenderingContext !== 'undefined';
    setCapability(supported ? 'supported' : 'unsupported');
  }, []);

  return capability;
}

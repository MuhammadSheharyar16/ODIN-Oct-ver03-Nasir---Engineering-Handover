import { useEffect, type RefObject } from 'react';
import { cameraOffset, visibleHeightAt } from './layout';

/**
 * Moves a DOM element exactly as a 3D object at `depth` would move under
 * the current camera drift, so HTML text stays locked to its WebGL body.
 */
export function useDepthParallax(ref: RefObject<HTMLElement | null>, depth: number) {
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const el = ref.current;
      if (el) {
        const pxPerUnit = window.innerHeight / visibleHeightAt(depth);
        const dx = -cameraOffset.x * pxPerUnit;
        const dy = cameraOffset.y * pxPerUnit;
        el.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [ref, depth]);
}

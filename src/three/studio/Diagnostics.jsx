import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

// Small on-screen status line for environments we cannot inspect (sandboxed
// previews): WebGL renderer, canvas size, frames drawn, draw calls, errors.

const errors = [];
if (typeof window !== 'undefined') {
  const push = msg => errors.push(String(msg).slice(0, 300));
  window.addEventListener('error', e => push(e.message || e.error));
  window.addEventListener('unhandledrejection', e => push(e.reason?.message || e.reason));
  const original = console.error;
  console.error = (...args) => {
    push(args.map(a => a?.message || a).join(' '));
    original(...args);
  };
}
export const diagnosticErrors = errors;

// Replaces three's console dump with the compiler's own error lines.
export function installShaderDiagnostics(gl) {
  gl.debug.onShaderError = (ctx, program, vs, fs) => {
    const lines = [ctx.getShaderInfoLog(vs), ctx.getShaderInfoLog(fs), ctx.getProgramInfoLog(program)]
      .join('\n')
      .split('\n')
      .map(l => l.trim())
      .filter(l => /error/i.test(l));
    errors.push(`SHADER ${lines.slice(0, 3).join(' / ') || 'link failed'}`.slice(0, 400));
  };
}

export function Diagnostics({ target }) {
  const { gl, size, scene } = useThree();
  const frames = useRef(0);
  const renderer = useRef('');

  useEffect(() => {
    try {
      const ctx = gl.getContext();
      const ext = ctx.getExtension('WEBGL_debug_renderer_info');
      renderer.current = ext ? ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL) : ctx.getParameter(ctx.RENDERER);
    } catch (err) {
      renderer.current = `? (${err.message})`;
    }
  }, [gl]);

  useFrame(() => {
    frames.current++;
    if (frames.current % 20 !== 1 || !target.current) return;
    let meshes = 0;
    scene.traverse(o => o.isMesh && meshes++);
    const lost = gl.getContext().isContextLost?.() ? ' · CONTEXT LOST' : '';
    target.current.textContent =
      `WebGL ${gl.capabilities.isWebGL2 ? 2 : 1} · ${renderer.current} · ${size.width}×${size.height} @${gl.getPixelRatio().toFixed(1)} · ` +
      `frames ${frames.current} · calls ${gl.info.render.calls} · tris ${gl.info.render.triangles} · meshes ${meshes}${lost}` +
      (errors.length ? ` · errors: ${errors.slice(-3).join(' | ')}` : '');
  });
  return null;
}

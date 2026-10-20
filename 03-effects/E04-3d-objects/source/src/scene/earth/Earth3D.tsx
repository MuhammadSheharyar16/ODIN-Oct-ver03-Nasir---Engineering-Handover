import { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { feature } from 'topojson-client';
import { geoEquirectangular, geoPath } from 'd3-geo';
import landTopo from 'world-atlas/land-110m.json';
import type { Topology, GeometryCollection } from 'topojson-specification';
import { proxies } from '../../odin/fx';
import { PRESENCE_DEPTH, screenLengthToWorld, screenToWorld } from '../../lib/layout';

/**
 * Data Earth: dotted glowing continents on a deep glass ocean, atmosphere
 * fresnel, orbit rings, and light spikes rising from each ranked country.
 * Follows a DOM proxy (kind 'earth') whose data lists {lat, lon, value, accent}.
 */

type Pin = { lat: number; lon: number; value: number; accent?: string };

let cachedTex: THREE.CanvasTexture | null = null;
function landTexture() {
  if (cachedTex) return cachedTex;
  const W = 2048;
  const H = 1024;
  const mask = document.createElement('canvas');
  mask.width = W;
  mask.height = H;
  const mctx = mask.getContext('2d')!;
  const topo = landTopo as unknown as Topology<{ land: GeometryCollection }>;
  const land = feature(topo, topo.objects.land);
  const proj = geoEquirectangular().fitSize([W, H], { type: 'Sphere' } as never);
  const path = geoPath(proj, mctx);
  mctx.fillStyle = '#fff';
  mctx.beginPath();
  path(land as never);
  mctx.fill();
  const data = mctx.getImageData(0, 0, W, H).data;

  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const ctx = out.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  // Soft land fill (red channel), crisp dots (green channel).
  ctx.globalAlpha = 0.55;
  ctx.drawImage(mask, 0, 0);
  ctx.globalAlpha = 1;
  ctx.filter = 'blur(6px)';
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.35;
  ctx.drawImage(mask, 0, 0);
  ctx.filter = 'none';
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  const step = 7;
  for (let y = step / 2; y < H; y += step) {
    // Compensate dot spacing toward the poles.
    const lat = (0.5 - y / H) * Math.PI;
    const sx = step / Math.max(0.25, Math.cos(lat));
    for (let x = (y / step) % 2 ? sx / 2 : 0; x < W; x += sx) {
      const i = ((y | 0) * W + (x | 0)) * 4;
      if (data[i] > 128) {
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(x, y, 1.9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  cachedTex = new THREE.CanvasTexture(out);
  cachedTex.anisotropy = 8;
  return cachedTex;
}

const earthVert = /* glsl */ `
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;

const earthFrag = /* glsl */ `
  uniform sampler2D uLand; uniform float uTime; uniform float uOpacity;
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main(){
    vec4 L = texture2D(uLand, vUv);
    float facing = max(dot(normalize(vN), normalize(vV)), 0.0);
    float fres = pow(max(1.0 - facing, 0.0), 2.4);
    vec3 ocean = mix(vec3(0.02, 0.06, 0.20), vec3(0.06, 0.18, 0.46), pow(max(facing, 0.0), 1.5));
    vec3 landCol = vec3(0.30, 0.56, 0.95) * L.r * 0.9;
    float tw = 0.75 + 0.25 * sin(uTime * 2.0 + vUv.x * 400.0 + vUv.y * 300.0);
    vec3 dots = mix(vec3(0.85, 0.92, 1.0), vec3(1.0, 0.82, 0.55), step(0.7, fract(vUv.x * 37.0 + vUv.y * 53.0))) * L.g * tw * 1.1;
    vec3 col = ocean + landCol + dots;
    // Daylight terminator-free sheen and atmosphere rim.
    col += vec3(0.45, 0.7, 1.0) * fres * 1.3;
    float alpha = mix(0.94, 1.0, fres) * uOpacity;
    gl_FragColor = vec4(col, alpha);
  }`;

const atmoFrag = /* glsl */ `
  uniform float uOpacity; varying vec2 vUv;
  void main(){ float d = length(vUv - 0.5) * 2.0; float g = smoothstep(1.0, 0.62, d) * smoothstep(0.42, 0.62, d); gl_FragColor = vec4(vec3(0.42, 0.68, 1.0) * g * 0.9 * uOpacity, 1.0); }`;

const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false } as const;

function latLonToVec(lat: number, lon: number, r = 1) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

/** Light arcs: every ranked country streams into the UAE (great-circle, lifted). */
const UAE = { lat: 24.4, lon: 54.4 };
const arcVert = `
  varying float vT;
  void main() { vT = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const arcFrag = `
  uniform vec3 uColor; uniform float uTime; uniform float uOpacity; uniform float uSeed;
  varying float vT;
  void main() {
    float x = fract(vT - uTime * 0.32 + uSeed) - 0.5;
    float pulse = exp(-(x * x) / 0.0036);
    float base = 0.38 * smoothstep(0.0, 0.08, vT) * smoothstep(1.0, 0.9, vT);
    float draw = step(vT, clamp(uOpacity * 1.4 - 0.2, 0.0, 1.0));
    // Solid (normal-blended) gold line with a white-hot travelling pulse: reads on
    // both the dark ocean and the bright dotted land.
    float a = clamp(base * 2.2 + pulse, 0.0, 1.0) * uOpacity * draw;
    gl_FragColor = vec4(mix(uColor, vec3(1.0, 0.97, 0.88), pulse * 0.8), a);
  }`;

function arcCurve(lat: number, lon: number) {
  const a = latLonToVec(lat, lon, 1.0);
  const b = latLonToVec(UAE.lat, UAE.lon, 1.0);
  const pts: THREE.Vector3[] = [];
  const ang = a.angleTo(b);
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    const p = new THREE.Vector3().copy(a).lerp(b, t).normalize();
    p.multiplyScalar(1.0 + Math.sin(Math.PI * t) * (0.1 + ang * 0.32));
    pts.push(p);
  }
  return new THREE.CatmullRomCurve3(pts);
}

function EarthObject({ id }: { id: string }) {
  const size = useThree((s) => s.size);
  const proxy = proxies.get(id)!;
  const { pins, focusLon = 55, focusLat = 18 } = proxy.data as { pins: Pin[]; focusLon?: number; focusLat?: number };
  const root = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const mats = useRef<THREE.ShaderMaterial[]>([]);
  const tex = useMemo(landTexture, []);
  const uni = useMemo(() => ({ uLand: { value: tex }, uTime: { value: 0 }, uOpacity: { value: 0 } }), [tex]);
  const atmo = useMemo(() => ({ uOpacity: { value: 0 } }), []);
  const t = useRef(0);
  const spikeRef = useRef<THREE.LineSegments>(null);

  const spikes = useMemo(() => {
    const max = Math.max(...pins.map((p) => p.value), 1);
    const pos: number[] = [];
    const col: number[] = [];
    const c = new THREE.Color();
    for (const p of pins) {
      const h = 0.12 + 0.42 * (p.value / max);
      // A small cluster of rays per country, like the concept.
      for (let k = 0; k < 7; k++) {
        const jl = p.lat + (Math.sin(k * 2.1) * 2.5);
        const jo = p.lon + (Math.cos(k * 1.7) * 2.5);
        const a = latLonToVec(jl, jo, 1.005);
        const b = latLonToVec(jl, jo, 1.005 + h * (0.55 + 0.45 * Math.abs(Math.sin(k * 1.3))));
        pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
        c.set(p.accent ?? '#9fd0ff');
        col.push(c.r, c.g, c.b, 1, 1, 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    return g;
  }, [pins]);
  const arcs = useMemo(
    () =>
      pins
        .filter((p) => Math.abs(p.lat - UAE.lat) + Math.abs(p.lon - UAE.lon) > 4)
        .map((p, i) => ({
          geo: new THREE.TubeGeometry(arcCurve(p.lat, p.lon), 64, i < 5 ? 0.012 : 0.008, 8, false),
          // Warm gold reads against the blue ocean and continents.
          u: { uColor: { value: new THREE.Color(i < 5 ? '#ff9d2e' : '#ffc070') }, uTime: { value: 0 }, uOpacity: { value: 0 }, uSeed: { value: i * 0.137 } },
        })),
    [pins],
  );
  const arcMats = useRef<(THREE.ShaderMaterial | null)[]>([]);
  const spikeMat = useMemo(() => new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), []);
  const ringMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#a8d4ff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), []);
  const [, force] = useState(0);
  void force;

  useFrame((_, dt) => {
    const g = root.current;
    if (!g) return;
    t.current += dt;
    const r = proxy.el.getBoundingClientRect();
    const morph = proxy.el.closest<HTMLElement>('[data-morph]');
    const op = morph ? parseFloat(morph.style.opacity || getComputedStyle(morph).opacity || '1') : 1;
    const [x, y, z] = screenToWorld(r.left + r.width / 2, r.top + r.height / 2, PRESENCE_DEPTH, size);
    g.position.set(x, y, z);
    const R = screenLengthToWorld(Math.min(r.width, r.height) / 2, PRESENCE_DEPTH, size);
    // Grow in from a point as it forms.
    const e = Math.min(1, op);
    g.scale.setScalar(Math.max(0.0001, R * (0.55 + 0.45 * e)));
    g.visible = op > 0.01 && r.width > 1;
    uni.uTime.value = t.current;
    uni.uOpacity.value = op;
    atmo.uOpacity.value = op;
    spikeMat.opacity = op * (0.8 + 0.2 * Math.sin(t.current * 3));
    ringMat.opacity = op * 0.55;
    if (spin.current) {
      // Face the focus region; gentle sway keeps spikes visible.
      spin.current.rotation.y = THREE.MathUtils.degToRad(-focusLon - 90) + Math.sin(t.current * 0.12) * 0.18 + (1 - e) * 1.2;
      spin.current.rotation.x = THREE.MathUtils.degToRad(focusLat * 0.6);
    }
    // Write through the live materials (R3F clones the uniforms prop).
    for (const m of arcMats.current) {
      if (!m) continue;
      m.uniforms.uTime.value = t.current;
      m.uniforms.uOpacity.value = op;
    }
    for (const m of mats.current) {
      if (!m?.uniforms) continue;
      m.uniforms.uOpacity.value = op;
      if (m.uniforms.uTime) m.uniforms.uTime.value = t.current;
    }
  });

  return (
    <group ref={root}>
      <mesh scale={2.5} position={[0, 0, -0.8]} renderOrder={2}>
        <planeGeometry />
        <shaderMaterial vertexShader={`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`} fragmentShader={atmoFrag} uniforms={atmo} {...additive} ref={(m) => { if (m) mats.current[0] = m; }} />
      </mesh>
      <group ref={spin}>
        <mesh renderOrder={4}>
          <sphereGeometry args={[1, 128, 96]} />
          <shaderMaterial vertexShader={earthVert} fragmentShader={earthFrag} uniforms={uni} transparent depthWrite toneMapped={false} ref={(m) => { if (m) mats.current[1] = m; }} />
        </mesh>
        <lineSegments ref={spikeRef} geometry={spikes} material={spikeMat} renderOrder={6} />
        {arcs.map((a, i) => (
          <mesh key={i} geometry={a.geo} renderOrder={7}>
            <shaderMaterial
              ref={(m) => {
                arcMats.current[i] = m;
              }}
              vertexShader={arcVert}
              fragmentShader={arcFrag}
              uniforms={a.u}
              transparent
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ))}
        {/* UAE: destination beacon */}
        <mesh position={latLonToVec(UAE.lat, UAE.lon, 1.012)} renderOrder={8}>
          <sphereGeometry args={[0.022, 16, 16]} />
          <meshBasicMaterial color="#fff6dd" toneMapped={false} />
        </mesh>
      </group>
      {/* Orbit rings */}
      <mesh rotation={[1.25, 0.2, 0.15]} material={ringMat} renderOrder={5}>
        <torusGeometry args={[1.28, 0.006, 8, 256]} />
      </mesh>
      <mesh rotation={[1.4, -0.35, -0.25]} material={ringMat} renderOrder={5}>
        <torusGeometry args={[1.42, 0.004, 8, 256]} />
      </mesh>
    </group>
  );
}

export function EarthObjects() {
  const sig = useRef('');
  const [, setTick] = useState(0);
  useFrame(() => {
    const v = [...proxies.entries()].filter(([, p]) => p.kind === 'earth').map(([k]) => k).join('|');
    if (v !== sig.current) {
      sig.current = v;
      setTick((x) => x + 1);
    }
  });
  return (
    <>
      {[...proxies.entries()]
        .filter(([, p]) => p.kind === 'earth')
        .map(([id]) => (
          <EarthObject key={id} id={id} />
        ))}
    </>
  );
}

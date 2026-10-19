import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import Exterior from '../three/store/exterior/Exterior.jsx';
import Interior from '../three/store/interior/Interior.jsx';
import { approach } from '../three/motion.js';
import { Products, Tray } from './Products.jsx';
import { doorOpenAt, fridgeOpenAt, sampleRail, stationAt } from './rail.js';

// Lighting for the whole diorama (~100 units across): a soft warm evening
// outside, cosy inside. No shadow maps; the products carry soft contact
// blobs and the store materials bring their own fake occlusion.
function LandingStage() {
  return (
    <>
      <Environment resolution={256} frames={1} environmentIntensity={0.6}>
        <Lightformer form="rect" intensity={2.4} color="#ffe6cc" position={[-30, 40, 40]} scale={[70, 40, 1]} target={[0, 5, 0]} />
        <Lightformer form="rect" intensity={1.3} color="#ffc99a" position={[50, 12, 30]} scale={[40, 25, 1]} target={[0, 5, 0]} />
        <Lightformer form="rect" intensity={1.8} color="#c9d6ff" position={[0, 30, -50]} scale={[90, 30, 1]} target={[0, 5, 0]} />
        <Lightformer form="rect" intensity={1.4} color="#fff2e0" position={[0, 60, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[80, 80, 1]} target={[0, 0, 0]} />
      </Environment>
      <hemisphereLight intensity={0.25} color="#fff0e0" groundColor="#d9b58f" />
      <directionalLight position={[-25, 40, 45]} intensity={0.5} color="#ffe2bd" />
    </>
  );
}

const D2R = Math.PI / 180;
const clamp01 = x => Math.min(1, Math.max(0, x));
const smooth = x => x * x * (3 - 2 * x);

// Moves the camera along the rail. `state.progress` is the scroll position
// (0..1), `state.mouse` the pointer in -1..1. Everything is damped through
// approach() so that motion.js remains the single switch.
function CameraRig({ state, onStation }) {
  const camera = useThree(s => s.camera);
  const tmp = useRef({
    pos: new THREE.Vector3(),
    tgt: new THREE.Vector3(),
    p: 0,
    mx: 0,
    my: 0,
    fov: 0,
    door: -1,
    fridge: -1,
  }).current;

  useFrame((_, dt) => {
    tmp.p = approach(tmp.p, state.progress, 12, dt);
    tmp.mx = approach(tmp.mx, state.mouse.x, 6, dt);
    tmp.my = approach(tmp.my, state.mouse.y, 6, dt);
    const s = stationAt(tmp.p);
    state.station = s;
    const fov = sampleRail(s, tmp.pos, tmp.tgt);

    // Exterior: the mouse swings the whole shot ±20° around the shop.
    const outside = 1 - smooth(clamp01(s / 0.7));
    if (outside > 0) {
      const a = tmp.mx * 20 * D2R * outside;
      const rx = tmp.pos.x - tmp.tgt.x;
      const rz = tmp.pos.z - tmp.tgt.z;
      tmp.pos.x = tmp.tgt.x + rx * Math.cos(a) + rz * Math.sin(a);
      tmp.pos.z = tmp.tgt.z - rx * Math.sin(a) + rz * Math.cos(a);
      tmp.pos.y += tmp.my * -2 * outside;
    }
    // Inside: a few degrees of parallax.
    const inside = smooth(clamp01((s - 1.6) / 0.8));
    if (inside > 0) {
      tmp.pos.x += tmp.mx * 0.7 * inside;
      tmp.pos.y += tmp.my * 0.35 * inside;
      tmp.tgt.x += tmp.mx * 0.5 * inside;
      tmp.tgt.y += tmp.my * 0.25 * inside;
    }
    camera.position.copy(tmp.pos);
    camera.lookAt(tmp.tgt);
    if (Math.abs(camera.fov - fov) > 1e-3) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    // Door and fridge follow the scroll position, in 1/24 steps so that the
    // store only re-renders when they really move.
    const door = Math.round(doorOpenAt(s) * 24) / 24;
    const fridge = Math.round(fridgeOpenAt(s) * 24) / 24;
    if (door !== tmp.door || fridge !== tmp.fridge) {
      tmp.door = door;
      tmp.fridge = fridge;
      onStation(door, fridge);
    }
  });
  return null;
}

export default function Scene({ state, lines, ui }) {
  const [open, setOpen] = useState({ door: 0, fridge: 0 });
  const set = useRef((door, fridge) => setOpen({ door, fridge })).current;
  const camera = useThree(s => s.camera);
  useEffect(() => {
    camera.far = 1200;
    camera.near = 0.3;
    camera.updateProjectionMatrix();
  }, [camera]);

  return (
    <>
      <LandingStage />
      <CameraRig state={state} onStation={set} />
      <Exterior doorOpen={open.door} glow={false} />
      <Interior fridgeOpen={open.fridge} />
      <Products ui={ui} />
      <Tray lines={lines} />
    </>
  );
}

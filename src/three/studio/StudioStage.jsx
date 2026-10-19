import { ContactShadows, Environment, Lightformer } from '@react-three/drei';

// The shared studio light every model is judged in (style bible §6): a big
// soft key from the top-left, warm fill, cool rim from behind – the soft,
// glowing look of Fluent's 3D emoji.
export default function StudioStage({ children }) {
  return (
    <>
      <Environment resolution={512} frames={1}>
        <Lightformer form="rect" intensity={2.4} color="#fff6ea" position={[-3, 5, 3]} scale={[7, 5, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.1} color="#ffd9b0" position={[5, 2, 2]} scale={[4, 4, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={2.2} color="#e6f0ff" position={[0, 3, -6]} scale={[10, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="circle" intensity={0.8} color="#ffffff" position={[0, -4, 2]} scale={4} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.35} color="#fff3e2" position={[0, 0, 8]} scale={[16, 8, 1]} target={[0, 0, 0]} />
      </Environment>

      <directionalLight
        position={[-3, 6, 3.5]}
        intensity={1.6}
        color="#fff1dd"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={6}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />

      {children}

      <ContactShadows position={[0, 0.001, 0]} scale={8} resolution={1024} blur={2.6} opacity={0.42} far={2} color="#4a2a12" />
    </>
  );
}

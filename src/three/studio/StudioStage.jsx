import { ContactShadows, Environment, Lightformer } from '@react-three/drei';

// The shared studio light every model is judged in (style bible §6): bright
// and soft like Fluent's 3D emoji – a big diffuse key from the top-left, warm
// fill, cool back light for the rim, no hard shadows on the subject.
export default function StudioStage({ children }) {
  return (
    <>
      <Environment resolution={512} frames={1}>
        <Lightformer form="rect" intensity={3.2} color="#fffaf2" position={[-3, 6, 3]} scale={[9, 7, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.6} color="#ffe2c2" position={[6, 2, 3]} scale={[6, 5, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={2.6} color="#eef4ff" position={[0, 4, -6]} scale={[12, 4, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.2} color="#fff6ec" position={[0, 1, 8]} scale={[16, 8, 1]} target={[0, 0, 0]} />
      </Environment>

      <hemisphereLight intensity={0.55} color="#fffaf2" groundColor="#f2d6b8" />
      <directionalLight
        position={[-3, 7, 4]}
        intensity={0.9}
        color="#fff4e4"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={8}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />

      {children}

      <ContactShadows position={[0, 0.001, 0]} scale={9} resolution={1024} blur={3} opacity={0.32} far={2.5} color="#7a4a24" />
    </>
  );
}

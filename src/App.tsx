import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense, useRef } from "react";
import Welcome from "./features/welcome/Welcome";
import { Environment, KeyboardControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import {  OrbitControls } from '@react-three/drei'




const Controls = {
  forward: "forward",
  back: "back",
  left: "left",
  right: "right",
} as const;

type Controls = (typeof Controls)[keyof typeof Controls];

const keyMap = [
  { name: Controls.forward, keys: ["KeyW", "ArrowUp"] },
  { name: Controls.back,    keys: ["KeyS", "ArrowDown"] },
  { name: Controls.left,    keys: ["KeyA", "ArrowLeft"] },
  { name: Controls.right,   keys: ["KeyD", "ArrowRight"] },
];

const App = () => {
  const camRef = useRef<THREE.PerspectiveCamera>(null);

  return (
    <KeyboardControls map={keyMap}>
      <Canvas>
        <Suspense>
          <Physics numSolverIterations={20}>
            <PerspectiveCamera
              ref={camRef}
              makeDefault
              position={[0, 0, 200]}
              fov={60}
            />
            <Environment preset="city" />
            <Welcome camRef={camRef} />
          </Physics>
          <OrbitControls />
        </Suspense>
      </Canvas>
    </KeyboardControls>
  );
};

export default App
export { Controls };
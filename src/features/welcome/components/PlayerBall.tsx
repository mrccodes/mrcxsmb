import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { MeshTransmissionMaterial, useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { useControls } from 'leva';
import { Controls } from "../../../App";

interface PlayerBallProps {
    camRef: RefObject<THREE.PerspectiveCamera | null>;
}

const IMPULSE_FORCE = 0.01;
const MAX_SPEED = 25;
const YAW_SPEED = 0.04;
const CAM_BACK = 14;
const CAM_HEIGHT = 7;

const PlayerBall = ({ camRef }: PlayerBallProps) => {
    const rigidRef = useRef<RapierRigidBody>(null);
    const yaw = useRef(Math.PI);
    const hasLanded = useRef(false);
    const { ballScale } = useControls({ ballScale: 0.3 });
    const [, getKeys] = useKeyboardControls<Controls>();

    useFrame(() => {
        if (!rigidRef.current || !camRef.current) return;

        const { forward, back, left, right } = getKeys();

        // Rotate yaw with left/right
        if (left)  yaw.current += YAW_SPEED;
        if (right) yaw.current -= YAW_SPEED;

        // Forward/back impulse along current yaw direction
        if (forward || back) {
            const dir = forward ? 1 : -1;
            rigidRef.current.applyImpulse(
                {
                    x: Math.sin(yaw.current) * IMPULSE_FORCE * dir,
                    y: 0,
                    z: Math.cos(yaw.current) * IMPULSE_FORCE * dir,
                },
                true
            );
        }

        // Clamp horizontal speed
        const vel = rigidRef.current.linvel();
        const hSpeed = Math.sqrt(vel.x ** 2 + vel.z ** 2);
        if (hSpeed > MAX_SPEED) {
            rigidRef.current.setLinvel(
                { x: (vel.x / hSpeed) * MAX_SPEED, y: vel.y, z: (vel.z / hSpeed) * MAX_SPEED },
                true
            );
        }

        // Only start trailing camera once ball has landed
        if (!hasLanded.current) return;

        const pos = rigidRef.current.translation();
        const targetCamPos = new THREE.Vector3(
            pos.x - Math.sin(yaw.current) * CAM_BACK,
            pos.y + CAM_HEIGHT,
            pos.z - Math.cos(yaw.current) * CAM_BACK
        );
        camRef.current.position.lerp(targetCamPos, 0.1);
        camRef.current.lookAt(pos.x, pos.y, pos.z);
    });

    return (
        <RigidBody
            ref={rigidRef}
            position={[0, 5, 11.5]}
            colliders="ball"
            friction={1.8}
            restitution={0.1}
            linearDamping={0.4}
            angularDamping={0.6}
            onCollisionEnter={() => { hasLanded.current = true; }}
        >
            <mesh scale={ballScale}>
                <sphereGeometry args={[1, 64, 64]} />
                <MeshTransmissionMaterial
                    backside
                    samples={16}
                    thickness={0.8}
                    roughness={0}
                    transmission={1}
                    ior={1.5}
                    chromaticAberration={0.05}
                    anisotropy={0.3}
                    distortion={0.1}
                    distortionScale={0.2}
                    temporalDistortion={0.2}
                    color="#ffffff"
                />
            </mesh>
        </RigidBody>
    );
};

export default PlayerBall;

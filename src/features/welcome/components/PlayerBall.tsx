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

const IMPULSE_FORCE = 0.001;
const MAX_SPEED = 25;
const YAW_SPEED = 0.04;
const CAM_BACK = 1.25;
const CAM_HEIGHT = 0.5;

const PlayerBall = ({ camRef }: PlayerBallProps) => {
    const rigidRef = useRef<RapierRigidBody>(null);
    const meshRef = useRef<THREE.Mesh>(null);
    const yaw = useRef(Math.PI);
    const hasLanded = useRef(false);
    const controlsActive = useRef(false);
    const _worldPos = useRef(new THREE.Vector3());
    const { ballScale } = useControls({ ballScale: 0.1 });
    const [, getKeys] = useKeyboardControls<Controls>();

    useFrame(() => {
        if (!rigidRef.current || !camRef.current || !controlsActive.current) return;

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

        if (!controlsActive.current || !meshRef.current) return;

        // Use the mesh's interpolated world position — r3r smooths this between
        // physics steps, unlike rigidRef.translation() which is raw/stepped
        meshRef.current.getWorldPosition(_worldPos.current);

        const targetCamPos = new THREE.Vector3(
            _worldPos.current.x - Math.sin(yaw.current) * CAM_BACK,
            _worldPos.current.y + CAM_HEIGHT,
            _worldPos.current.z - Math.cos(yaw.current) * CAM_BACK
        );
        camRef.current.position.copy(targetCamPos);
        camRef.current.lookAt(_worldPos.current.x, _worldPos.current.y * 1.75, _worldPos.current.z);

    });

    return (
        <RigidBody
            ref={rigidRef}
            position={[0, 5, 11.5]}
            colliders="ball"
            ccd={true}
            friction={1}
            restitution={0}
            linearDamping={0.4}
            angularDamping={1.5}
            onCollisionEnter={() => {
                hasLanded.current = true;
                setTimeout(() => { controlsActive.current = true; }, 750);
            }}
        >
            <mesh ref={meshRef} scale={ballScale}>
                <sphereGeometry args={[1, 128, 128]} />
                <MeshTransmissionMaterial
                    backside
                    samples={32}
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

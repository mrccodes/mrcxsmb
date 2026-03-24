import { useRef, useState, type RefObject } from "react";
import Lighting from "./components/Lighting";
import MRCPlatform from "./models/MRCPlatform";
import * as THREE from 'three'
import { useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import PlayerBall from "./components/PlayerBall";
interface WelcomeProps {
    camRef: RefObject<THREE.PerspectiveCamera | null>,
}

const _quat = new THREE.Quaternion();
const _euler = new THREE.Euler();

const Welcome = ({ camRef }: WelcomeProps) => {
    const platformRef = useRef<THREE.Group>(null);
    const rigidRef = useRef<RapierRigidBody>(null);
    const hasEntered = useRef<boolean>(false);
    const [showBall, setShowBall] = useState<boolean>(false);
    // Plain object GSAP animates — physics body syncs to this every frame
    const animTarget = useRef({ x: 0, y: -50, rotX: 0 });

    useFrame(() => {
        if (!camRef.current || !rigidRef.current) return;

        // Keep physics body in sync with animated values every frame
        rigidRef.current.setNextKinematicTranslation({ x: animTarget.current.x, y: animTarget.current.y, z: 0 });
        _euler.set(animTarget.current.rotX, 0, 0);
        _quat.setFromEuler(_euler);
        rigidRef.current.setNextKinematicRotation(_quat);

        if (hasEntered.current) return;
        hasEntered.current = true;

        // Camera intro
        gsap.to(camRef.current.position, {
            z: 15, y: 2, duration: 5, ease: "power1.inOut",
            onComplete: () => {
                rigidRef.current?.setBodyType(2, true);
                setShowBall(true);
            }
        });

        // Animate data — physics follows via setNextKinematic* above
        gsap.to(animTarget.current, { x: 21.5, duration: 3 });
        gsap.to(animTarget.current, { y: 0,    duration: 3 });
        gsap.to(animTarget.current, { rotX: -Math.PI * 0.5, duration: 3 });
    })

    return (
        <>
        {showBall ? <PlayerBall camRef={camRef} /> : null}
            <Lighting />
            <RigidBody ref={rigidRef}  type="kinematicPosition" colliders="trimesh" position={[0, 0, 0]} friction={1.8}>
                <MRCPlatform ref={platformRef} />
            </RigidBody>

        </>
    )
}

export default Welcome;
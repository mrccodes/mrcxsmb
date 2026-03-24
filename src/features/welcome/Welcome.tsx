import { useRef, useState, type RefObject } from "react";
import Lighting from "./components/Lighting";
import MRCPlatform from "./models/MRCPlatform";
import * as THREE from 'three'
import { useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { RapierRigidBody, RigidBody, useRapier } from "@react-three/rapier";
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
    const { rapier, world } = useRapier();

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
            z: 13, y: 1, duration: 5, ease: "power1.inOut",
            onComplete: () => {
                rigidRef.current?.setBodyType(2, true);

                // Build trimesh collider manually with FIX_INTERNAL_EDGES to prevent
                // ghost collisions at triangle edges (the cause of exponential bouncing)
                if (platformRef.current && rigidRef.current) {
                    platformRef.current.updateWorldMatrix(true, true);
                    const platformWorldInv = new THREE.Matrix4()
                        .copy(platformRef.current.matrixWorld).invert();

                    const allVertices: number[] = [];
                    const allIndices: number[] = [];
                    let vOffset = 0;

                    platformRef.current.traverse((child) => {
                        if (!(child instanceof THREE.Mesh)) return;

                        const toBodyLocal = new THREE.Matrix4()
                            .copy(platformRef.current!.matrix)
                            .multiply(platformWorldInv)
                            .multiply(child.matrixWorld);

                        const pos = child.geometry.attributes.position;
                        for (let i = 0; i < pos.count; i++) {
                            const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i))
                                .applyMatrix4(toBodyLocal);
                            allVertices.push(v.x, v.y, v.z);
                        }

                        const idx = child.geometry.index;
                        if (idx) {
                            for (let i = 0; i < idx.count; i++) allIndices.push(idx.getX(i) + vOffset);
                        } else {
                            for (let i = 0; i < pos.count; i++) allIndices.push(i + vOffset);
                        }
                        vOffset += pos.count;
                    });

                    const body = world.getRigidBody(rigidRef.current.handle);
                    const colliderDesc = rapier.ColliderDesc.trimesh(
                        new Float32Array(allVertices),
                        new Uint32Array(allIndices),
                        rapier.TriMeshFlags.FIX_INTERNAL_EDGES
                    );
                    colliderDesc.setFriction(1.8);
                    colliderDesc.setRestitution(0);
                    world.createCollider(colliderDesc, body);
                }

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
            <RigidBody ref={rigidRef} type="kinematicPosition" colliders={false} position={[0, 0, 0]}>
                <MRCPlatform ref={platformRef} />
            </RigidBody>

        </>
    )
}

export default Welcome;
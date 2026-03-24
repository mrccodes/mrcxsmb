import { useGLTF } from "@react-three/drei";
import { useEffect, type RefObject } from "react";
import * as THREE from "three";
interface MRCPlatformProps {
    ref: RefObject<THREE.Group | null>,
}
const MRCPlatform = ({ ref }: MRCPlatformProps) => {
    const platform = useGLTF('./src/assets/models/MRC.glb', true);

    useEffect(() => {
        if (!ref.current) return;
        const box = new THREE.Box3().setFromObject(ref.current);
        const size = box.getSize(new THREE.Vector3());
        ref.current.position.x = -size.x * 0.5;
        ref.current.position.y = -size.y * 0.5;
    }, [platform.scene]);

    return <primitive ref={ref} object={platform.scene} scale={[20, 20, 10]} dispose={null} />;
};

export default MRCPlatform;
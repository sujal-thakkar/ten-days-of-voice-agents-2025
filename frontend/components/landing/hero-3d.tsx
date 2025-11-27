'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Float } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';

function ParticleField(props: any) {
    const ref = useRef<any>();
    const [sphere] = useState(() => random.inSphere(new Float32Array(6000), { radius: 1.5 }));

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x -= delta / 10;
            ref.current.rotation.y -= delta / 15;
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial
                    transparent
                    color="#ffa500" // Gold/Amber
                    size={0.005}
                    sizeAttenuation={true}
                    depthWrite={false}
                />
            </Points>
        </group>
    );
}

function FloatingShapes() {
    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <mesh position={[1, 1, 0]}>
                <icosahedronGeometry args={[0.5, 0]} />
                <meshStandardMaterial color="#007bff" wireframe /> {/* Blue */}
            </mesh>
            <mesh position={[-1, -1, 0]}>
                <octahedronGeometry args={[0.5, 0]} />
                <meshStandardMaterial color="#00ced1" wireframe /> {/* Teal */}
            </mesh>
        </Float>
    )
}

export function Hero3D() {
    return (
        <div className="absolute inset-0 z-0 h-full w-full">
            <Canvas camera={{ position: [0, 0, 1] }}>
                <ambientLight intensity={0.5} />
                <ParticleField />
                {/* <FloatingShapes />  Optional: Add geometric shapes if needed */}
            </Canvas>
        </div>
    );
}

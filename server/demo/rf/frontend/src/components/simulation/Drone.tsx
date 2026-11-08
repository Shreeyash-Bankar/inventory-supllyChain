import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Box, Cylinder } from "@react-three/drei";
import * as THREE from "three";

interface DroneProps {
  position: [number, number, number];
  orientation: [number, number, number];
}

interface PropellerProps {
  position: [number, number, number];
}

function Propeller({ position }: PropellerProps) {
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 18;
    }
  });

  return (
    <group ref={ref} position={position}>
      <Cylinder args={[0.025, 0.025, 0.035, 12]} position={[0, 0.025, 0]}>
        <meshStandardMaterial color="#8996a5" />
      </Cylinder>

      <Box args={[0.42, 0.012, 0.055]} position={[0, 0.045, 0]}>
        <meshStandardMaterial color="#303d4c" />
      </Box>
    </group>
  );
}

export default function Drone({ position, orientation }: DroneProps) {
  return (
    <group position={position} rotation={orientation}>
      {/* Main drone body */}
      <Box args={[0.55, 0.16, 0.65]}>
        <meshStandardMaterial
          color="#26394f"
          metalness={0.65}
          roughness={0.35}
        />
      </Box>

      {/* Front indicator */}
      <Box args={[0.18, 0.07, 0.12]} position={[0, 0.02, 0.35]}>
        <meshStandardMaterial
          color="#42b8ff"
          emissive="#147dbb"
          emissiveIntensity={0.8}
        />
      </Box>

      {/* Arms */}
      <Box args={[1.35, 0.055, 0.09]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#536579" metalness={0.5} />
      </Box>

      <Box args={[0.09, 0.055, 1.35]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#536579" metalness={0.5} />
      </Box>

      {/* Motors and propellers */}
      <Propeller position={[0.65, 0.08, 0.65]} />
      <Propeller position={[-0.65, 0.08, 0.65]} />
      <Propeller position={[0.65, 0.08, -0.65]} />
      <Propeller position={[-0.65, 0.08, -0.65]} />

      {/* Vertical drone antenna.
          Its centre is at local Y = 0.36 m. */}
      <Cylinder args={[0.012, 0.012, 0.55, 12]} position={[0, 0.36, 0]}>
        <meshStandardMaterial
          color="#e7a83e"
          emissive="#9a5b13"
          emissiveIntensity={0.2}
        />
      </Cylinder>

      {/* Visual marker at the antenna tip */}
      <mesh position={[0, 0.635, 0]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial
          color="#ffb84d"
          emissive="#ff8c00"
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}

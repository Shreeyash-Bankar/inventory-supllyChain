import { Box, Cylinder } from "@react-three/drei";
import type { Position3 } from "../../physics/antennaGeometry";

interface GroundStationProps {
  position: Position3;
  antennaHeightMeters: number;
}

export default function GroundStation({
  position,
  antennaHeightMeters,
}: GroundStationProps) {
  const mastHeight = Math.max(0.1, antennaHeightMeters - 0.6);

  return (
    <group position={position}>
      {/* Ground base */}
      <Cylinder args={[0.55, 0.65, 0.2, 24]} position={[0, 0.1, 0]}>
        <meshStandardMaterial color="#34465b" metalness={0.5} />
      </Cylinder>

      {/* Mast */}
      <Cylinder
        args={[0.045, 0.06, mastHeight, 12]}
        position={[0, 0.2 + mastHeight / 2, 0]}
      >
        <meshStandardMaterial color="#8996a5" metalness={0.7} />
      </Cylinder>

      {/* Directional antenna body */}
      <Box
        args={[0.16, 0.12, 0.55]}
        position={[0, antennaHeightMeters - 0.35, 0]}
      >
        <meshStandardMaterial
          color="#2d9bba"
          metalness={0.35}
          roughness={0.4}
        />
      </Box>

      {/* Antenna position marker */}
      <mesh position={[0, antennaHeightMeters, 0]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial
          color="#45d6b5"
          emissive="#159b7b"
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Equipment enclosure */}
      <Box args={[0.55, 0.35, 0.4]} position={[0, 0.4, 0.45]}>
        <meshStandardMaterial color="#536579" metalness={0.35} />
      </Box>
    </group>
  );
}

import * as THREE from "three";

interface RFLinkProps {
  from: [number, number, number];
  to: [number, number, number];
}

export default function RFLink({ from, to }: RFLinkProps) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);

  const curve = new THREE.LineCurve3(start, end);

  return (
    <mesh>
      <tubeGeometry args={[curve, 1, 0.018, 8, false]} />
      <meshStandardMaterial
        color="#42c9ff"
        emissive="#168bc1"
        emissiveIntensity={0.8}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

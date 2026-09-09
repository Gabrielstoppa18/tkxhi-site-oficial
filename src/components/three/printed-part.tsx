"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

/**
 * Uma engrenagem flangeada gerada por código — sem arquivo de modelo — que se
 * constrói de baixo para cima conforme `progress` vai de 0 a 1.
 *
 * O efeito não é decorativo: é o mesmo argumento do título do hero, agora em
 * três dimensões. Um plano de corte sobe pela peça e o anel quente marca a
 * altura onde o bico está depositando material.
 */
const TEETH = 18;
const R_OUTER = 1;
const R_ROOT = 0.84;
const R_BORE = 0.26;
const THICKNESS = 0.32;

function polar(radius: number, angle: number) {
  return new THREE.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius);
}

function createGearGeometry() {
  const step = (Math.PI * 2) / TEETH;
  const points: THREE.Vector2[] = [];

  for (let i = 0; i < TEETH; i++) {
    const a = i * step;
    points.push(polar(R_ROOT, a));
    points.push(polar(R_OUTER, a + step * 0.2));
    points.push(polar(R_OUTER, a + step * 0.36));
    points.push(polar(R_ROOT, a + step * 0.56));
  }

  const shape = new THREE.Shape(points);

  const bore = new THREE.Path();
  bore.absarc(0, 0, R_BORE, 0, Math.PI * 2, true);
  shape.holes.push(bore);

  // Furos de fixação: o que separa uma peça de um enfeite.
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.PI / 5;
    const hole = new THREE.Path();
    hole.absarc(
      Math.cos(a) * 0.5,
      Math.sin(a) * 0.5,
      0.085,
      0,
      Math.PI * 2,
      true,
    );
    shape.holes.push(hole);
  }

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: THICKNESS,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
    curveSegments: 24,
  });
  // Extrudado em +Z; deitar sobre a mesa é girar para o eixo Y.
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

function Gear({ progress }: { progress: number }) {
  const geometry = useMemo(() => createGearGeometry(), []);

  const height = progress * (THICKNESS + 0.02);

  // O plano é recriado a cada altura em vez de mutado: `progress` já é estado,
  // então o React re-renderiza de qualquer forma e o objeto é barato demais
  // para justificar memoização.
  const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), height);

  return (
    <group position={[0, -THICKNESS / 2, 0]}>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial
          color="#fe7c20"
          roughness={0.42}
          metalness={0.18}
          clippingPlanes={[plane]}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* O bico: o anel quente na altura em que o material está sendo depositado. */}
      <mesh
        rotation-x={-Math.PI / 2}
        position-y={height}
        visible={progress > 0.02 && progress < 0.995}
      >
        <ringGeometry args={[R_ROOT * 0.99, R_OUTER * 1.06, 64]} />
        <meshBasicMaterial
          color="#ffd08a"
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Mesa de impressão. */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[1.9, 64]} />
        <meshStandardMaterial color="#1d0838" roughness={0.9} metalness={0.1} />
      </mesh>
    </group>
  );
}

export default function PrintedPart({
  progress,
  autoRotate,
}: {
  progress: number;
  autoRotate: boolean;
}) {
  return (
    <Canvas
      camera={{ position: [2.5, 1.85, 2.5], fov: 40 }}
      dpr={[1, 2]}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
      }}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 5, 2]} intensity={1.6} />
      {/* Calor da mesa, na cor da frente de manufatura. */}
      <pointLight position={[0, 0.3, 1.6]} intensity={6} color="#fe7c20" />
      <pointLight position={[-2, 1.5, -2]} intensity={3} color="#d457c7" />

      <Gear progress={progress} />

      <OrbitControls
        makeDefault
        autoRotate={autoRotate}
        autoRotateSpeed={0.9}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI * 0.18}
        maxPolarAngle={Math.PI * 0.48}
      />
    </Canvas>
  );
}

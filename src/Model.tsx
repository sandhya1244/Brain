import React, { useRef, useState } from 'react';
import { useGLTF } from '@react-three/drei/native';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Model(props: any) {
  const { nodes, materials } = useGLTF(require('../src/Model.glb'));
  const [selectedMesh, setSelectedMesh] = useState<string | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001; // Adjust the rotation speed as needed
    }
  });

  const handlePointerDown = (event: any) => {
    const meshName = event.object.name;
    setSelectedMesh(meshName);
    props.onPointerDown(event);
  };

  return (
    <group {...props} dispose={null} scale={1}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        geometry={nodes.Cube.geometry}
        material={selectedMesh === "Cube" ? new THREE.MeshStandardMaterial({ color: 'skyblue' }) : materials.Material}
        name="Cube"
        onPointerDown={handlePointerDown}
      />
    </group>
  );
}

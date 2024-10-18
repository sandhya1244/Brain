import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei/native';
import { useFrame } from '@react-three/fiber';

export default function Model(props) {
  const { nodes, materials } = useGLTF(require('../src/head_model_of_a_child.glb'));
  const modelRef = useRef(); // Create a reference to the model

  // Auto-rotate the model using useFrame hook
  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.01; // Adjust rotation speed as needed
    }
  });

  return (
    <group ref={modelRef} {...props} dispose={null} scale={1.4}>
      <mesh
        name="Object_2"
        castShadow
        receiveShadow
        geometry={nodes.Object_2.geometry}
        material={materials.kt_facebuilder_material}
        rotation={[-Math.PI / 2, 0, 0]}
      />
    </group>
  );
}

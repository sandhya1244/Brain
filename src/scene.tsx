import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei/native';

export default function Model(props) {
  const { nodes, materials } = useGLTF(require('../src/mushroom.glb'));

  return (
    <group {...props} dispose={null} scale={1}>
      <mesh
        name="Right"
        castShadow
        receiveShadow
        geometry={nodes.Cylinder002.geometry}
        material={materials['Material.002']}
        position={[-0.104, 1.976, 0.044]}
      />
  

      <mesh
        name="Left"
        castShadow
        receiveShadow
        geometry={nodes.Plane.geometry}
        material={materials['Material.002']}
        position={[-0.38, 1.153, 0.361]}
        rotation={[Math.PI / 2, 0, 1.423]}
        scale={0.37}>
        <mesh
          name="Plane001"
          castShadow
          receiveShadow
          geometry={nodes.Plane001.geometry}
          material={materials['Material.002']}
        />
        <mesh
          name="Plane002"
          castShadow
          receiveShadow
          geometry={nodes.Plane002.geometry}
          material={materials['Material.002']}
          rotation={[0, 0, -3.142]}
        />
      </mesh>
      

      <mesh
        name="Cylinder001"
        castShadow
        receiveShadow
        geometry={nodes.Cylinder001.geometry}
        material={materials['Material.002']}
        position={[1.17, 1.159, 2.834]}
        rotation={[0, -0.01, 0]}
      />
      

      <mesh
        name="Cylinder003"
        castShadow
        receiveShadow
        geometry={nodes.Cylinder003.geometry}
        material={materials['Material.002']}
        position={[-1.389, 1.155, 2.834]}
        rotation={[0, 0.006, 0]}
      />
      

      <mesh
        name="Cylinder050"
        castShadow
        receiveShadow
        geometry={nodes.Cylinder050.geometry}
        material={materials['Material.002']}
        position={[-0.104, 1.976, -0.494]}
      />
     

      <mesh
        name="Cylinder051"
        castShadow
        receiveShadow
        geometry={nodes.Cylinder051.geometry}
        material={materials['Material.002']}
        position={[1.17, 1.159, 2.834]}
        rotation={[0.099, -0.01, 0.001]}
      />
     

      <mesh
        name="Cylinder053"
        castShadow
        receiveShadow
        geometry={nodes.Cylinder053.geometry}
        material={materials['Material.002']}
        position={[1.17, 1.159, 2.834]}
        rotation={[0, -0.01, 0]}>
        <mesh
          name="Cylinder054"
          castShadow
          receiveShadow
          geometry={nodes.Cylinder054.geometry}
          material={materials['Material.002']}
          rotation={[Math.PI, -0.019, Math.PI]}
        />
      </mesh>
    
    </group>
  );
}

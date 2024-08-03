import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei/native';
import * as THREE from 'three';

export default function Model(props) {
  const { nodes } = useGLTF(require('../src/head_model_of_a_child.glb'));
  const groupRef = useRef();
  const meshRef = useRef();

  const [hoveredVertex, setHoveredVertex] = useState(null);

  useEffect(() => {
    if (meshRef.current) {
      const geometry = meshRef.current.geometry;
      const colors = new Float32Array(geometry.attributes.position.count * 3);
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }
  }, []);

  useEffect(() => {
    if (!props.selectedVertex && meshRef.current) {
      const geometry = meshRef.current.geometry;
      const colors = geometry.attributes.color.array;

      for (let i = 0; i < colors.length; i += 3) {
        colors[i] = 1;   // Reset to white color
        colors[i + 1] = 1;
        colors[i + 2] = 1;
      }

      geometry.attributes.color.needsUpdate = true;
    }
  }, [props.selectedVertex]);

  // Use useFrame to update the rotation on every frame
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += props.rotationSpeed;
    }
  });

  const handlePointerDown = (event) => {
    const intersect = event.intersections[0];
    if (intersect) {
      const geometry = intersect.object.geometry;
      const colors = geometry.attributes.color;
      const position = geometry.attributes.position.array;
      const face = intersect.face;
      const radius = 0.3; // Define your radius here
  
      const vertexIndices = new Set();
      
      // Add vertices of the intersected face
      [face.a, face.b, face.c].forEach((vertexIndex) => vertexIndices.add(vertexIndex));
  
      // Function to calculate distance between two vertices
      const distance = (index1, index2) => {
        const x1 = position[index1 * 3];
        const y1 = position[index1 * 3 + 1];
        const z1 = position[index1 * 3 + 2];
        const x2 = position[index2 * 3];
        const y2 = position[index2 * 3 + 1];
        const z2 = position[index2 * 3 + 2];
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2);
      };
  
      // Find vertices within the radius from the clicked vertex
      const verticesInRadius = Array.from(vertexIndices);
      verticesInRadius.forEach((vertexIndex) => {
        for (let i = 0; i < position.length / 3; i++) {
          if (vertexIndex !== i && distance(vertexIndex, i) <= radius) {
            vertexIndices.add(i);
          }
        }
      });
  
      // Update colors for all collected vertex indices
      vertexIndices.forEach((vertexIndex) => {
        colors.setXYZ(vertexIndex, 0, 1, 1); // Sky blue color
      });
  
      colors.needsUpdate = true;
      setHoveredVertex({ face, object: intersect.object });
      props.onPointerDown(event); // Notify parent component
    }
  };
  

  return (
    <group ref={groupRef} {...props} dispose={null} scale={1}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        geometry={nodes.Object_2.geometry}
        material={new THREE.MeshStandardMaterial({
          vertexColors: true,
          side: THREE.DoubleSide,
        })}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={handlePointerDown}
      />
    </group>
  );
}

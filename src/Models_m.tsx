import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei/native';
import * as THREE from 'three';

interface ModelProps {
  rotationSpeed: number;
  onPointerDown: (event: any) => void;
  selectedVertex: any;
  totalGCS: number;
  interpolateColor: (totalGCS: number, min: number, max: number) => string;
}

const Model: React.FC<ModelProps> = ({ rotationSpeed, onPointerDown, selectedVertex, totalGCS, interpolateColor }) => {
  const { nodes } = useGLTF(require('../src/head_model_of_a_child.glb'));
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [highlightedVertices, setHighlightedVertices] = useState<Set<number>>(new Set());

  // Helper function to apply color to highlighted vertices based on severity
  const applyColor = () => {

    if (meshRef.current) {
      const geometry = meshRef.current.geometry as THREE.BufferGeometry;
      const colors = geometry.attributes.color.array as Float32Array;

      // Apply color only to highlighted vertices
      const color = new THREE.Color(interpolateColor(totalGCS, 1, 15));
      highlightedVertices.forEach(vertexIndex => {
        colors[vertexIndex * 3] = color.r;
        colors[vertexIndex * 3 + 1] = color.g;
        colors[vertexIndex * 3 + 2] = color.b;
      });

      geometry.attributes.color.needsUpdate = true;
    }
  };

  useEffect(() => {
    if (meshRef.current) {
      const geometry = meshRef.current.geometry as THREE.BufferGeometry;
      const colors = new Float32Array(geometry.attributes.position.count * 3);
      for (let i = 0; i < colors.length; i += 3) {
        colors[i] = 1; // Initial color: white
        colors[i + 1] = 1;
        colors[i + 2] = 1;
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }
  }, []);

  useEffect(() => {
    applyColor(); // Update color whenever severity changes
  }, [totalGCS, highlightedVertices]);

  useEffect(() => {
    if (!selectedVertex && meshRef.current) {
      const geometry = meshRef.current.geometry as THREE.BufferGeometry;
      const colors = geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < colors.length; i += 3) {
        colors[i] = 1; // Reset to white color
        colors[i + 1] = 1;
        colors[i + 2] = 1;
      }
      geometry.attributes.color.needsUpdate = true;
    }
  }, [selectedVertex]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed;
    }
  });

  const handlePointerDown = (event: any) => {
    const intersect = event.intersections[0];
    if (intersect) {
      const geometry = intersect.object.geometry as THREE.BufferGeometry;
      const colors = geometry.attributes.color;
      const position = geometry.attributes.position.array;
      const face = intersect.face;
      const radius = 0.3;

      const vertexIndices = new Set<number>();
      [face.a, face.b, face.c].forEach((vertexIndex) => vertexIndices.add(vertexIndex));

      const distance = (index1: number, index2: number) => {
        const x1 = position[index1 * 3];
        const y1 = position[index1 * 3 + 1];
        const z1 = position[index1 * 3 + 2];
        const x2 = position[index2 * 3];
        const y2 = position[index2 * 3 + 1];
        const z2 = position[index2 * 3 + 2];
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2);
      };

      const verticesInRadius = Array.from(vertexIndices);
      verticesInRadius.forEach((vertexIndex) => {
        for (let i = 0; i < position.length / 3; i++) {
          if (vertexIndex !== i && distance(vertexIndex, i) <= radius) {
            vertexIndices.add(i);
          }
        }
      });

      // Update highlighted vertices and apply color
      setHighlightedVertices(vertexIndices);
      applyColor();
      onPointerDown(event); // Notify parent component
    }
  };

  return (
    <group ref={groupRef} dispose={null} scale={1.5}>
      <mesh
        ref={meshRef}
        name="Child_head"
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

export default Model;
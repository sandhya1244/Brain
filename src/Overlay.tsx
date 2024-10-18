import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Overlay = ({ selectedVertex }) => {
  if (!selectedVertex) return null;

  return (
    <View style={styles.overlay}>
      <Text style={styles.overlayText}>
        X: {selectedVertex.x.toFixed(2)}
      </Text>
      <Text style={styles.overlayText}>
        Y: {selectedVertex.y.toFixed(2)}
      </Text>
      <Text style={styles.overlayText}>
        Z: {selectedVertex.z.toFixed(2)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  overlayText: {
    color: 'white',
    fontSize: 16,
  },
});

export default Overlay;

import React, { useState, Suspense, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Button, Platform } from 'react-native';
import { Canvas } from '@react-three/fiber';
import useControls from 'r3f-native-orbitcontrols';
import { ThreeEvent } from '@react-three/fiber';
import Model from './src/Models';
import 'react-native-url-polyfill/auto';  // Import polyfill
import Slider from '@react-native-community/slider';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { DateTimePicker } from 'react-native-ui-lib';
import { createTable, insertData } from './db';

// Helper function to interpolate between two colors
const interpolateColor = (value, min, max) => {
  const ratio = (value - min) / (max - min);
  const r = Math.floor(255 * ratio);
  const g = Math.floor(255 * (1 - ratio));
  const b = 255;
  return `rgb(${r}, ${g}, ${b})`;
};

const App = () => {
  const [OrbitControls, events] = useControls();
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0, z: 0 });
  const [meshName, setMeshName] = useState('');
  const [severity, setSeverity] = useState(1);
  const [injuryDate, setInjuryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedVertex, setSelectedVertex] = useState(null);

  useEffect(() => {
    createTable();
  }, []);

  const handlePointerDown = (event: ThreeEvent<MouseEvent>) => {
    const intersect = event.intersections[0];
    if (intersect) {
      const point = intersect.point;
      const name = intersect.object.name;
      setCoords({ x: point.x, y: point.y, z: point.z });
      setMeshName(name);
      setSelectedVertex({ x: point.x, y: point.y, z: point.z });  // Set the selected vertex
      setVisible(true);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, date?: Date | undefined) => {
    const currentDate = date || injuryDate;
    setShowDatePicker(Platform.OS === 'android');
    setInjuryDate(currentDate);
  };

  const handleTimeChange = (event: DateTimePickerEvent, date?: Date | undefined) => {
    const currentTime = date || injuryDate;
    setShowTimePicker(Platform.OS === 'android');
    setInjuryDate(currentTime);
  };

  const handleSubmit = () => {
    const formattedDate = injuryDate.toISOString();
    insertData({ meshName, x: coords.x, y: coords.y, z: coords.z, severity, injuryDate: formattedDate });

    console.log('Submitted:', { coords, meshName, severity, injuryDate });
    setVisible(false);
  };

  const handleCancel = () => {
    setSelectedVertex(null);  // Reset the selected vertex
    setVisible(false);
  };

  return (
    <View style={styles.container} {...events}>
      <Text style={styles.instructionText}>Please tap to locate brain injury</Text>
      <Canvas style={styles.canvas} camera={{ position: [0, 0, 5] }}>
        <OrbitControls enablePan={true} />
        <directionalLight position={[1, 0, 10]} args={['#9e9e9e', 2]} />
        <directionalLight position={[-1, 0, 10]} args={['#9e9e9e', 2]} />
        <directionalLight position={[1, 0, 10]} args={['#9e9e9e', 2]} />
        <directionalLight position={[1, 0, 10]} args={['#9e9e9e', 2]} />
        <directionalLight position={[-1, 0, 10]} args={['#9e9e9e', 2]} />
        <directionalLight position={[1, 0, 10]} args={['#9e9e9e', 2]} />
        <Suspense fallback={null}>
          <Model onPointerDown={handlePointerDown} rotationSpeed={0.01} selectedVertex={selectedVertex} />
        </Suspense>
      </Canvas>
      <Modal
        transparent={true}
        visible={visible}
        onRequestClose={handleCancel}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Model Touched</Text>
            <Text style={styles.modalText}>Mesh: {meshName}</Text>
            
            {/* Single row for X, Y, Z coordinates */}
            <View style={styles.coordinatesRow}>
              <Text style={styles.coordinateText}>X: {coords.x.toFixed(2)}</Text>
              <Text style={styles.coordinateText}>Y: {coords.y.toFixed(2)}</Text>
              <Text style={styles.coordinateText}>Z: {coords.z.toFixed(2)}</Text>
            </View>
             
            <Text style={styles.modalText}> Brain Injury Date and Time:</Text>
            {/* Single row for Date and Time labels and buttons */}
            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeButtonContainer}>
                <Text style={styles.dateTimeLabel}>Date:</Text>
                <Button onPress={() => setShowDatePicker(true)} title="Select Date" />
              </View>
              <View style={styles.dateTimeButtonContainer}>
                <Text style={styles.dateTimeLabel}>Time:</Text>
                <Button onPress={() => setShowTimePicker(true)} title="Select Time" />
              </View>
            </View>

            {/* Single row for Date and Time Pickers */}
            <View style={styles.pickersRow}>
              {showDatePicker && (
                <DateTimePicker
                  value={injuryDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
              {showTimePicker && (
                <DateTimePicker
                  value={injuryDate}
                  mode="time"
                  display="default"
                  onChange={handleTimeChange}
                />
              )}
            </View>

            <Text style={styles.modalText}>Severity of Brain Injury:</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={severity}
              onValueChange={setSeverity}
              minimumTrackTintColor={interpolateColor(severity, 1, 5)}
              maximumTrackTintColor="#C0C0C0"
              thumbTintColor="#FFC107"
            />
            <Text style={styles.modalText}>Severity: {severity}</Text>
            <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    position: 'absolute',
    top: 200,  // Adjust this value to move the text further down if needed
    textAlign: 'center',
    fontSize: 16,
    color: 'black',
    zIndex: 1, // Ensure it stays above the Canvas
  },
  canvas: {
    flex: 1,
    width: '100%',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',  // Align modal content to the bottom
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBox: {
    width: '100%',
    padding: 20,
    backgroundColor: 'white',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    alignItems: 'center',
    position: 'relative',
  },
  cancelButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    padding: 10,
    backgroundColor: 'red',
    borderRadius: 5,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
  coordinatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  coordinateText: {
    fontSize: 16,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  dateTimeButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeLabel: {
    fontSize: 16,
    marginRight: 5,
  },
  pickersRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default App;

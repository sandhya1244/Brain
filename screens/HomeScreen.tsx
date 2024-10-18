import React, {useState, useEffect, Suspense} from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Button,
  ImageBackground,
  ScrollView,
  FlatList,
} from 'react-native';
import {Canvas} from '@react-three/fiber';
import useControls from 'r3f-native-orbitcontrols';
import {ThreeEvent} from '@react-three/fiber';
import Model from '../src/Models_m';
import 'react-native-url-polyfill/auto';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Picker} from '@react-native-picker/picker';
import {createTable, insertData} from '../db';
import LinearGradient from 'react-native-linear-gradient';




// Helper function to interpolate between two colors
const interpolateColor = (totalGCS, min, max) => {
  if (totalGCS >= 3 && totalGCS <= 8) {
    return '#FF6B6B'; // Severe: Soft Red
  } else if (totalGCS >= 9 && totalGCS <= 12) {
    return '#FFD93D'; // Moderate: Soft Orange
  } else if (totalGCS >= 13 && totalGCS <= 15) {
    return '#A8E6CF'; // Mild: Soft Green
  }
  return '#FFFFFF'; // Default: white (in case severity is out of bounds)
};

const HomeScreen = ({navigation}) => {
  const [OrbitControls, events] = useControls();
  const [visible, setVisible] = useState(false);
  const [glasgowModalVisible, setGlasgowModalVisible] = useState(false);
  const [coords, setCoords] = useState({x: 0, y: 0, z: 0});
  const [meshName, setMeshName] = useState('');
  const [injuryDate, setInjuryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date()); // Default to current date
  const [selectedTime, setSelectedTime] = useState(new Date()); // Default to current time
  const [selectedVertex, setSelectedVertex] = useState(null);
  const [injuryRecords, setInjuryRecords] = useState([]);
  const [severityMeasure, setSeverityMeasure] = useState('Glasgow Coma'); // Default to ISS
  const [eyeResponse, setEyeResponse] = useState('');
  const [verbalResponse, setVerbalResponse] = useState('');
  const [motorResponse, setMotorResponse] = useState('');
  const [totalGCS, setTotalGCS] = useState(0);
  const [showTotalGCS, setShowTotalGCS] = useState(false); // New state variable
  const [gcsSeverity, setGcsSeverity] = useState(''); // Severity classification
  const [region, setRegion] = useState('');


  useEffect(() => {
    createTable();
  }, []);


  const getMeshSide = (x) => {
    if (x < 0) {
      return 'left';
    } else if (x > 0) {
      return 'right';
    } else {
      return 'center'; // Optional: Handle the case for X = 0
    }
  };

  const handlePointerDown = (event: ThreeEvent<MouseEvent>) => {
    const intersect = event.intersections[0];
    if (intersect) {
      const point = intersect.point;
      const name = intersect.object.name;
      setCoords({ x: point.x, y: point.y, z: point.z });
  
      // Get mesh side based on the X coordinate
      const side = getMeshSide(point.x);
      setMeshName(`${name} (${side})`); // Update meshName to include side information
      setSelectedVertex({ x: point.x, y: point.y, z: point.z });
      setVisible(true);
  
      // Determine brain region based on coordinates
      const brainRegion = getBrainRegion(point.x, point.y, point.z);
      setRegion(brainRegion); // Set the region state
      console.log(`Selected Region: ${brainRegion}`);
    }
  };
  
  
  const getBrainRegion = (x, y, z) => {
    let hemisphere = x < 0 ? 'Left' : 'Right'; 
    
   
    if (Math.abs(x) < 1) { 
      if (y < 0) {
        return `${hemisphere} Temporal`;
      } else {
        return `${hemisphere} Occipital`;
      }
    } else {
      if (y < 0) {
        return `${hemisphere} Frontal`;
      } else {
        return `${hemisphere} Parietal`;
      }
    }
  };
  


  const handleDateChange = (event, selectedDate) => {
    if (event.type === 'set' && selectedDate) {
      setSelectedDate(selectedDate);
      const updatedDate = new Date(injuryDate);
      updatedDate.setFullYear(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
      );
      setInjuryDate(updatedDate);
    }
    setShowDatePicker(false);
  };

  const handleTimeChange = (event, selectedTime) => {
    if (event.type === 'set' && selectedTime) {
      setSelectedTime(selectedTime);
      const updatedDate = new Date(injuryDate);
      updatedDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setInjuryDate(updatedDate);
    }
    setShowTimePicker(false);
  };

  const handleSubmit = () => {
    const formattedInjuryDate = injuryDate.toISOString();
    const submissionDate = new Date().toISOString();
    // Create a new injury record
    const newInjury = {
      severity: gcsSeverity,
      eyeResponse,
      verbalResponse,
      motorResponse,
      meshName,
      x: coords.x,
      y: coords.y,
      z: coords.z,
      injuryDate: formattedInjuryDate,
      submissionDate,
      region,
    };

    insertData(newInjury); // Insert data into the database
    setInjuryRecords([...injuryRecords, newInjury]); // Update injury records state
    setVisible(false);
    //navigation.navigate('History');
    console.log(newInjury);
  };

  const classifySeverity = (gcsScore: number) => {
    if (gcsScore >= 3 && gcsScore <= 8) {
      setGcsSeverity('Severe');
    } else if (gcsScore >= 9 && gcsScore <= 12) {
      setGcsSeverity('Moderate');
    } else if (gcsScore >= 13 && gcsScore <= 15) {
      setGcsSeverity('Mild');
    } else {
      setGcsSeverity('');
    }
  };

  const navigateToHistory = () => {
    navigation.navigate('History');
  };

  const calculateTotalGCS = () => {
    const eye = parseInt(eyeResponse) || 0;
    const verbal = parseInt(verbalResponse) || 0;
    const motor = parseInt(motorResponse) || 0;
    const total = eye + verbal + motor;
    setTotalGCS(total); // Update the total GCS value
    console.log(total);
    setShowTotalGCS(true);
    classifySeverity(total);
  };

  const handleCancel = () => {
    setSelectedVertex(null);
    setVisible(false);
  };

  const openGlasgowComaModal = () => {
    setSeverityMeasure('Glasgow Coma');
    setVisible(true);
  };

  const showGlasgowCriteria = () => {
    setGlasgowModalVisible(true);
  };

  const closeGlasgowCriteria = () => {
    setGlasgowModalVisible(false);
  };

  return (
   <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.instructionText}>
          Please tap to locate brain injury
        </Text>
        <View style={styles.canvasContainer} {...events}>
          <Canvas style={styles.canvas} camera={{ position: [0, 0, 5] }}>
            <OrbitControls enablePan={true} />
            <directionalLight position={[1, 0, 10]} args={['#9e9e9e', 2]} />
            <ambientLight intensity={0.4} />
            <Suspense fallback={null}>
              <Model
                onPointerDown={handlePointerDown}
                rotationSpeed={0.01}
                selectedVertex={selectedVertex}
                totalGCS={totalGCS}
                interpolateColor={interpolateColor}
              />
            </Suspense>
          </Canvas>
        </View>

        {/* Added Info Section */}
        <Text style={styles.infoText}>
          Interact with the model using touch or mouse. 
          Pinch to zoom in and out, and explore the brain anatomy in 3D.
        </Text>
        <Text style={styles.tipeText}>
          Tip: Double-tap on a specific area to get more details.
        </Text>

    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={handleCancel}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalBox}>
          <TouchableOpacity
            onPress={handleCancel}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>✖ Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Injury Details</Text>

          {/* Location Row */}
          <View style={styles.row}>
            <Text style={styles.modalText}>📍 Location:</Text>
            <Text style={styles.modalText}>{region}</Text>
          </View>

          {/* Coordinates */}
          <View style={styles.coordinatesRow}>
                <Text style={styles.coordinateText}>
                  X: {coords.x.toFixed(2)}
                </Text>
                <Text style={styles.coordinateText}>
                  Y: {coords.y.toFixed(2)}
                </Text>
                <Text style={styles.coordinateText}>
                  Z: {coords.z.toFixed(2)}
                </Text>
              </View>

          {/* Injury Date */}
          <View style={styles.row}>
            <Text style={styles.modalText}>📅 Injury Date:</Text>
            <View style={styles.dateTimeButtonContainer}>
              <Button
                onPress={() => setShowDatePicker(true)}
                title="Select Date"
              />
              <Text style={styles.selectedDateText}>
                {` ${new Date(selectedDate).toLocaleDateString()}`}
              </Text>
            </View>
          </View>

          {/* Injury Time */}
          <View style={styles.row}>
            <Text style={styles.modalText}>🕒 Injury Time:</Text>
            <View style={styles.dateTimeButtonContainer}>
              <Button
                onPress={() => setShowTimePicker(true)}
                title="Select Time"
              />
              <Text style={styles.selectedTimeText}>
                {` ${new Date(selectedTime).toLocaleTimeString()}`}
              </Text>
            </View>
          </View>

          {/* Choose Standard Severity Measure Scale */}
          <Text style={styles.modalText}>
            📊 Choose Severity Measure Scale:
          </Text>
          <View style={styles.radioContainer}>
            <TouchableOpacity
              onPress={() => setSeverityMeasure('ISS')}
              style={styles.radioButton}
            >
              <Text style={severityMeasure === 'ISS' ? styles.selectedRadioText : styles.radioText}>
                ISS
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                // Replace with your function to open modal
                openGlasgowComaModal();
                showGlasgowCriteria();
              }}
              style={styles.radioButton}
            >
              <Text style={severityMeasure === 'Glasgow Coma' ? styles.selectedRadioText : styles.radioText}>
                Glasgow Coma
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSeverityMeasure('VAS')}
              style={styles.radioButton}
            >
              <Text style={severityMeasure === 'VAS' ? styles.selectedRadioText : styles.radioText}>
                VAS
              </Text>
            </TouchableOpacity>
          </View>

          {/* DateTime Pickers */}
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}

          {/* Card for Severity of Brain Injury */}
          {severityMeasure === 'Glasgow Coma' && showTotalGCS && (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.cardIcon}>⭐</Text>
                <Text style={styles.cardText}>Total GCS: {totalGCS}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardIcon}>⚠️</Text>
                <Text style={styles.cardText}>Severity: {gcsSeverity}</Text>
              </View>
            </View>
          )}
          <TouchableOpacity
            onPress={handleSubmit}
            style={styles.submitButton}
          >
            <Text style={styles.submitButtonText}>✅ Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

        <Modal
          transparent={true}
          visible={glasgowModalVisible}
          onRequestClose={closeGlasgowCriteria}>
          <View style={styles.modalBackground}>
            <View style={styles.modalBox}>
              <TouchableOpacity
                onPress={closeGlasgowCriteria}
                style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Glasgow Coma Scale Criteria</Text>

              {/* Eye Response */}
              <Text style={styles.gcsSubtitle}>Eye Response (1-4):</Text>
              <Picker
                selectedValue={eyeResponse}
                onValueChange={itemValue => {
                  setEyeResponse(itemValue);
                  setShowTotalGCS(false);
                }}
                style={styles.picker}>
                <Picker.Item label="Select Eye Response" value="" />
                <Picker.Item label="4: Eyes opening spontaneously" value="4" />
                <Picker.Item label="3: Eyes opening to speech" value="3" />
                <Picker.Item label="2: Eyes opening to pain" value="2" />
                <Picker.Item label="1: No eye opening" value="1" />
              </Picker>

              {/* Verbal Response */}
              <Text style={styles.gcsSubtitle}>Verbal Response (1-5):</Text>
              <Picker
                selectedValue={verbalResponse}
                onValueChange={itemValue => {
                  setVerbalResponse(itemValue);
                  setShowTotalGCS(false);
                  // Calculate total GCS when changed
                }}
                style={styles.picker}>
                <Picker.Item label="Select Verbal Response" value="" />
                <Picker.Item label="5: Oriented" value="5" />
                <Picker.Item label="4: Confused conversation" value="4" />
                <Picker.Item label="3: Inappropriate words" value="3" />
                <Picker.Item label="2: Incomprehensible sounds" value="2" />
                <Picker.Item label="1: No verbal response" value="1" />
              </Picker>

              {/* Motor Response */}
              <Text style={styles.gcsSubtitle}>Motor Response (1-6):</Text>
              <Picker
                selectedValue={motorResponse}
                onValueChange={itemValue => {
                  setMotorResponse(itemValue);
                  setShowTotalGCS(false); // Calculate total GCS when changed
                }}
                style={styles.picker}>
                <Picker.Item label="Select Motor Response" value="" />
                <Picker.Item label="6: Obeys commands" value="6" />
                <Picker.Item label="5: Localizes pain" value="5" />
                <Picker.Item label="4: Withdraws from pain" value="4" />
                <Picker.Item label="3: Flexion to pain" value="3" />
                <Picker.Item label="2: Extension to pain" value="2" />
                <Picker.Item label="1: No motor response" value="1" />
              </Picker>

              <TouchableOpacity
                onPress={calculateTotalGCS}
                style={styles.calculateButton}>
                <Text style={styles.calculateButtonText}>Total GCS</Text>
              </TouchableOpacity>
              <Text style={styles.modalText}>Total GCS: {totalGCS}</Text>
            </View>
          </View>
        </Modal>

            {/* Latest Injury Section */}
      <Text style={styles. sectionHeading}>Latest Injury</Text>
      <View style={styles.injuryContainer}>
        {injuryRecords.length === 0 ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('Details', { injury: null })}>
            <Text style={styles.noDataText}>No data available today</Text>
          </TouchableOpacity>
        ) : (
          <FlatList
            data={injuryRecords}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => {
              // Determine circle color based on severity
              const circleColor =
                item.severity === 'Severe' ? '#FF6B6B' : // Soft Red
                item.severity === 'Moderate' ? '#FFD93D' : // Soft Orange
                '#A8E6CF'; // Soft Green for Mild

              const emoji =
                item.severity === 'Mild' ? '🙂' : 
                item.severity === 'Moderate' ? '😐' : 
                '😟'; // Emoji based on severity

              return (
                <TouchableOpacity
                  style={styles.recordContainer}
                  onPress={() => navigation.navigate('Details', { injury: item })}
                  activeOpacity={0.3}>
                  <View style={styles.recordContent}>
                    {/* Circle Container for the Emoji */}
                    <View style={[styles.recordIconContainer, { backgroundColor: circleColor }]}>
                      <Text style={styles.recordIcon}>
                        {emoji}
                      </Text>
                    </View>

                    {/* Injury Record Text */}
                    <View style={styles.recordTextContainer}>
                      <Text style={styles.recordTitle}>
                        Location: {item.region}
                      </Text>
                      <Text style={styles.recordDetails}>
                        Severity: {item.severity}
                      </Text>
                      <Text style={styles.recordDate}>
                        Injury Date: {new Date(item.injuryDate).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>


         {/* New Section for Clinical App Trends */}
      <Text style={styles.sectionHeading}>Trends and Recovery Insights</Text>
      <View style={styles.trendsContainer}>
        <View style={styles.trendCard}>
          <Text style={styles.trendIcon}>📈</Text>
          <Text style={styles.trendText}>
            - Average recovery time from injuries is 3 weeks.
          </Text>
        </View>
        <View style={styles.trendCard}>
          <Text style={styles.trendIcon}>⚠️</Text>
          <Text style={styles.trendText}>
            - Severe injuries may require special medical attention.
          </Text>
        </View>
        <View style={styles.trendCard}>
          <Text style={styles.trendIcon}>🩺</Text>
          <Text style={styles.trendText}>
            - Regular checkups and monitoring help in faster recovery.
          </Text>
        </View>
      </View>

      {/* New Instruction Section */}
      <Text style={styles.sectionHeading}>Important Tips</Text>
      <View style={styles.tipsContainer}>
        <View style={styles.tipCard}>
          <Text style={styles.tipIcon}>🧑‍⚕️</Text>
          <Text style={styles.tipText}>
            - Follow up regularly with your medical professional.
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Text style={styles.tipIcon}>🍎</Text>
          <Text style={styles.tipText}>
            - Maintain a healthy diet to support brain recovery.
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Text style={styles.tipIcon}>🛌</Text>
          <Text style={styles.tipText}>
            - Take necessary rest and avoid strenuous activities.
          </Text>
        </View>
      </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.footerIcon}>🏠</Text>
          <Text style={styles.footerText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={navigateToHistory}>
          <Text style={styles.footerIcon}>📜</Text>
          <Text style={styles.footerText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
        <Text style={styles.footerIcon}>⚙️</Text>
        <Text style={styles.footerText}>Settings</Text>
      </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  
  container: {
    flex: 1, // Ensures the container takes the full height
    backgroundColor: '#F0F0F0',
  },
  scrollContainer: {
    flexGrow: 1, // Allows scrolling content
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80, // Prevents content from overlapping footer
  },

  sectionHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fd7013', // Accent color
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
    width: '90%',
    borderBottomWidth: 2, // Stylish separator under heading
    borderBottomColor: '#fd7013',
  },
  
  trendsContainer: {
    width: '90%',
    padding: 10,
    backgroundColor: '#eaf6f6', // Light background for trends section
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 20,
  },
  trendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  trendIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  trendText: {
    fontSize: 16,
    color: '#555',
  },
  
  tipsContainer: {
    width: '90%',
    padding: 10,
    backgroundColor: '#fff8e1', // Light yellow background for tips section
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 50,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 10,
  },


  tipText: {
    fontSize: 16,
    color: '#555',
  },
 
  calculateButton: {
    backgroundColor: '#fd7013', // Adjust this color as needed
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  calculateButtonText: {
    color: '#ffffff', // Adjust text color as needed
    fontSize: 16,
  },

  cardBackground: {
    width: '90%',
    maxWidth: 500,
    height: 'auto',
    padding: 20,
    borderRadius: 15,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    alignItems: 'center',
    position: 'relative', // For positioning decorative elements
  },

//style for 1st pop-up box
  card: {
    backgroundColor: '#f0f4c3', // Light yellow background for severity card
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 10, // Space between icon and text
  },
  cardText: {
    fontSize: 18,
    color: '#393e46', // Color for severity text
    fontWeight: 'bold',
  },

  recordContainer: {
    backgroundColor: '#fff',
    marginVertical: 10,
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    transform: [{ scale: 1 }],
    transition: 'transform 0.1s',
  },
  recordContainerActive: {
    transform: [{ scale: 1.05 }],
  },
  recordContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordIconContainer: {
    backgroundColor: '#fd7013',
    padding: 10,
    borderRadius: 50,
    marginRight: 15,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  recordIcon: {
    fontSize: 24,
    color: '#fff',
  },
  recordTextContainer: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#393e46',
  },
  recordDetails: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  recordDate: {
    fontSize: 12,
    color: '#777',
    marginTop: 5,
  },

  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',

    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark overlay
  },
  modalBox: {
    width: '100%',
    padding: 20,
    backgroundColor: '#ffffff', // White background for the modal
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  cancelButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  cancelButtonText: {
    color: '#fd7013', // Color for cancel button
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center', // Center title
  },
 
  modalText: {
    fontSize: 16,
    color: '#393e46', // Dark color for text
  },
  coordinatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  coordinateText: {
    fontSize: 16,
    color: '#fd7013', // Color for coordinates
    fontWeight: 'bold',
  },
  dateTimeButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedDateText: {
    marginLeft: 10,
    color: '#393e46', // Dark color for visibility
  },
  selectedTimeText: {
    marginLeft: 10,
    color: '#393e46', // Dark color for visibility
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  radioButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#eceff1', // Light gray background for radio buttons
  },
  selectedRadioText: {
    fontWeight: 'bold',
    color: '#fd7013', // Highlighted text color
  },
  radioText: {
    color: '#393e46', // Dark text color
  },
  recordText: {
    fontSize: 16,
  },
  instructionText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 30,
    color: '#fd7013', // Accent color for tipe
    fontStyle: 'italic', // Italic style for tips
  },

  //styles for GCS pop-up
  gcsSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    color: 'black',
  },

  openButton: {
    backgroundColor: '#fd7013',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  openButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  picker: {
    height: 50,
    width: '100%',
    color: 'black',
    borderStyle: 'solid',
    borderColor: 'black',
  },

  guidanceText: {
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 30,
    backgroundColor: 'transparent', // Black background for visibility
    padding: 10,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },

  additionalText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#555',
    marginBottom: 0.1,
  },

  injuryHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fd7013',
    marginVertical: 20,
    textAlign: 'left',
    borderBottomWidth: 2,
    borderBottomColor: '#fd7013',
  },
  injuryContainer: {
    marginBottom: 20,
    width: '90%',
    alignSelf: 'center',
  },

  //styles for latest history 
  noDataContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
  },
 
  canvasContainer: {
    width: '100%',
    height: 370,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    overflow: 'hidden', // To ensure rounded corners
  },
  canvas: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  historyButton: {
    marginTop: 15,
    backgroundColor: '#007BFF', // Blue color for the button
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    width: '100%',
  },
  historyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerText: {
    color: '#000',
    fontSize: 12,
    textAlign: 'center',
  },
  footerIcon: {
    fontSize: 30, // Icon size
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: '#28A745', // Green color for the submit button
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

   tipeText: {
    fontSize: 14, // Smaller for tips
    color: '#fd7013', // Accent color for tips
    textAlign: 'center', // Center align for better readability
    fontStyle: 'italic', // Italic style for tips
    marginBottom: 20, // Space below tip text
  }, 

  infoText: {
    fontSize: 14, // Slightly smaller than instruction text
    color: '#4a4a4a', // Darker gray for secondary text
    marginBottom: 10, // Space below info text
    textAlign: 'center', // Center align for better readability
  },
  
});

export default HomeScreen;

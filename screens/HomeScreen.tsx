import React, {useState, useEffect,useRef, Suspense} from 'react';
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
  Linking,
  Image,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import useControls from 'r3f-native-orbitcontrols';
import {ThreeEvent} from '@react-three/fiber';
import Model from '../src/Models_m';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Picker} from '@react-native-picker/picker';
import {createTable, insertData} from '../db';
import { WebView } from 'react-native-webview';
import tipsData from '../assets/tips.json'; // Adjust the path according to your file structure
import axios from 'axios';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import PushNotification from 'react-native-push-notification';
import Sound from 'react-native-sound';
import { extend } from '@react-three/fiber';
import { Canvas, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { captureRef } from 'react-native-view-shot';
import { retrieveData } from '../db'; // Assuming you're using the existing db.js for fetching data




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


const Stack = createStackNavigator();

const requestNotificationPermission = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      PushNotification.createChannel(
        {
          channelId: 'default-channel-id',
          channelName: 'Default Channel',
          channelDescription: 'A default channel',
          importance: 4,
          vibrate: true,
        },
        (created) => console.log(`Channel created: ${created}`)
      );
    } else {
      console.log('Notifications are disabled by the user.');
    }
   
  }
};




const HomeScreen = ({navigation, route}) => {
  const cameraRef = useRef();
  const viewRef = useRef(null);
  const [OrbitControls, events] = useControls();
  const [visible, setVisible] = useState(false);
  const [glasgowModalVisible, setGlasgowModalVisible] = useState(false);
  const [gcsInstructionModalVisible, setGcsInstructionModalVisible] = useState(false);
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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [totalGCS, setTotalGCS] = useState(0);
  const [showTotalGCS, setShowTotalGCS] = useState(false); // New state variable
  const [gcsSeverity, setGcsSeverity] = useState(''); // Severity classification
  const [region, setRegion] = useState('');
  
  const [injuriesPerDay, setInjuriesPerDay] = useState([]);
  const [exerciseCount, setExerciseCount] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null); // State to track selected day
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileAge, setProfileAge] = useState('');
  const [isProfileModalVisible, setProfileModalVisible] = useState(false); // State for modal visibility
  const [zoom, setZoom] = useState(5); // Initial zoom level
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const zoomIn = () => setZoom((prevZoom) => Math.min(prevZoom + 0.5, 10)); // Max zoom 10
  const zoomOut = () => setZoom((prevZoom) => Math.max(prevZoom - 0.5, 2));  // Min zoom 2
  const bellSound = new Sound('bell.mp3', Sound.MAIN_BUNDLE); // Bell sound initialization
  const [paused, setPaused] = useState(false);

  const togglePause = () => setPaused(!paused);

  useEffect(() => {
    // Fetch injuries and process data on component mount
    const fetchInjuries = async () => {
      try {
        const injuries = await retrieveData();
        const injuriesByDay = getInjuriesByDay(injuries);
        setInjuriesPerDay(injuriesByDay);
        setExerciseCount(getExerciseCount(injuriesByDay));
      } catch (error) {
        console.log('Error fetching injuries:', error);
      }
    };

    fetchInjuries();
  }, []);



  
  const getInjuriesByDay = (injuries) => {

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const injuriesByDay = days.map((day, index) => ({
      day,
      count: 0,
      totalSeverity: 0,
      avgSeverity: 0,
    }));

    injuries.forEach((injury) => {
      const injuryDate = new Date(injury.injuryDate);
      const dayOfWeek = injuryDate.getDay(); // Get the day of the week (0 - Sunday, 6 - Saturday)
      const severityValue = getSeverityValue(injury.severity);

      injuriesByDay[dayOfWeek].count += 1;
      injuriesByDay[dayOfWeek].totalSeverity += severityValue;
    });

    // Calculate average severity for each day
    injuriesByDay.forEach((day) => {
      if (day.count > 0) {
        day.avgSeverity = day.totalSeverity / day.count;
      }
    });

    return injuriesByDay;
  };

  // Convert severity string to a numerical value (e.g., 'mild' = 1, 'moderate' = 2, 'severe' = 3)
  const getSeverityValue = (severity) => {
    switch (severity.toLowerCase()) {
      case 'severe':
        return 0; // Severe = 0-8
      case 'moderate':
        return 9;  // Moderate = 9-12
      case 'mild':
        return 13; // Mild = 13-15
      default:
        return 0;
    }
  };

  // Function to interpolate color based on the average severity
  const interpolateColorforActivity = (avgSeverity) => {
    if (avgSeverity === 0) {
      return '#d1e3e5'; // No injuries, so keep it light gray
    } else if (avgSeverity < 8) {
      return '#FF6B6B'; // Severe: Soft Red
    } else if (avgSeverity >= 9 && avgSeverity <= 12) {
      return '#FFD93D'; // Moderate: Soft Orange
    } else if (avgSeverity >= 13 && avgSeverity <= 15) {
      return '#A8E6CF'; // Mild: Soft Green
    }
    return '#d1e3e5'; // Default for other cases: Light Gray
  };

  // Function to get severity label
  const getSeverityLabel = (avgSeverity) => {
    if (avgSeverity === 0) return 'No Injuries';
    if (avgSeverity < 8) return 'Severe';
    if (avgSeverity >= 9 && avgSeverity <= 12) return 'Moderate';
    if (avgSeverity >= 13) return 'Mild';
    return 'Unknown';
  };

  // Count total number of exercises completed
  const getExerciseCount = (injuriesByDay) => {
    return injuriesByDay.reduce((count, day) => count + day.count, 0);
  };

  // Handle day circle click
  const handleDayClick = (day) => {
    setSelectedDay(day);
    setModalVisible(true); // Show the modal
  };

  // Function to handle screenshot capture  // Take screenshot function
  const takeScreenshot = () => {
    if (viewRef.current) {
      captureRef(viewRef, { format: 'png', quality: 0.8 })
        .then((uri) => {
          console.log('Screenshot saved to', uri);
          setScreenshot(uri); // Save the screenshot URI
        })
        .catch((error) => {
          console.error('Error taking screenshot', error);
        });
    } else {
      console.error('Ref is null, could not capture screenshot.');
    }
  };


  const cancelScreenshot = () => {
    setScreenshot(null); // Reset the screenshot state to remove the preview
  };
  
  
  
  
  useEffect(() => {
    if (route.params) {
      const { name, age } = route.params;
      setProfileName(name);
      setProfileAge(age);
    }
  }, [route.params]);


  useEffect(() => {
    createTable();
    requestNotificationPermission();

    PushNotification.createChannel(
      {
        channelId: 'default-channel-id',
        channelName: 'Default Channel',
        channelDescription: 'A default channel',
        importance: 4,
        vibrate: true,
      },
      (created: boolean) => console.log(`Channel created: ${created}`)
    );

    // Example: Show a notification after a delay (for testing purposes)
    setTimeout(() => {
      PushNotification.localNotification({
        channelId: 'default-channel-id',
        title: 'Welcome!',
        message: 'This is a local notification to test setup.',
      });
    }, 3000);
  }, []);




  const getMeshSide = (x) => {
    if (x < 0) {
      return 'left';
    } else if (x > 0) {
      return 'right';
    } else {
      return 'center'; // Optional: Handle the case for X = 0n
    }
  };

  // Request notification permission for Android 13+


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
  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };
  const openInjuryDetails = () => {
    setVisible(true); // Show the Injury Details modal
    closeGlasgowCriteria(); // Hide the Glasgow Coma Scale modal
  };

    // Function to simulate receiving notifications
    const simulateNotification = () => {
      setNotificationCount(prevCount => prevCount + 1);
    };

    
    // Function to handle bell icon press
    const handleBellPress = () => {
      // Play the bell sound
      bellSound.play((success) => {
        if (!success) {
          console.log('Sound did not play correctly');
        }
      });
  
      if (notificationCount > 0) {
        setModalVisible(true); // Show notifications
        setNotificationCount(0); // Clear notifications
      } else {
        // Possibly trigger a toast or message saying "No new notifications"
      }
    };

 
  useEffect(() => {
    fetch('https://public-api.wordpress.com/wp/v2/sites/hitsense.wordpress.com/posts?_embed')
      .then(response => response.json())
      .then(data => {
        const postsWithDetails = data.map(post => {
          const excerptText = post.excerpt?.rendered || '';
          const wordCount = excerptText.replace(/<[^>]+>/g, '').split(/\s+/).length;
          const readingTime = `${Math.ceil(wordCount / 200)} min read`;
          const modifiedTime = new Date(post.modified);
          const formattedModifiedTime = modifiedTime.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
          });
  
          return {
            ...post,
            thumbnail: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || 
            (post.categories.includes(25761) 
              ? "https://hitsense.wordpress.com/wp-content/uploads/2024/10/recovery-insights.jpeg"
              : "https://hitsense.wordpress.com/wp-content/uploads/2024/10/ai-powered.jpeg" ),
          
            readingTime: readingTime,
            excerptText: excerptText.replace(/<[^>]+>/g, '').substring(0, 100) + '...',
            formattedModifiedTime: formattedModifiedTime,
          };
        });
        setPosts(postsWithDetails);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching posts:', error);
        setLoading(false);
      });
  }, []);


  const toggleProfileModal = () => {
    setProfileModalVisible(!isProfileModalVisible); // Toggle modal visibility
  };

// Separate posts by category
const category25761Posts = posts.filter(post => post.categories.includes(25761));
const category518Posts = posts.filter(post => post.categories.includes(518));

   return (
      <View style={styles.container}>
        <View style={styles.header}>
        <TouchableOpacity onPress={handleBellPress}>
          <Text style={styles.settingsIcon}>🔔 {notificationCount > 0 && <Text style={styles.notificationBadge}>{notificationCount}</Text>}
          </Text>
          </TouchableOpacity>
          
      <Text style={styles.headerText}>HITSENSE</Text>
            <TouchableOpacity onPress={toggleProfileModal} style={styles.iconContainer}>
        <Text style={styles.lockIcon}>👤</Text>
      </TouchableOpacity>
      </View>
    
   
      <Modal visible={isProfileModalVisible} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Cancel Button at Top Right */}
          <TouchableOpacity onPress={toggleProfileModal} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>✖</Text>
          </TouchableOpacity>

          <Text style={styles.modalTitle}>Profile Information</Text>
          
          {/* Name and Age Fields Styled as Input Boxes */}
          <View style={styles.inputBox}>
            <Text style={styles.inputLabel}>Name:</Text>
            <Text style={styles.inputValue}>{profileName}</Text>
          </View>
          
          <View style={styles.inputBox}>
            <Text style={styles.inputLabel}>Age:</Text>
            <Text style={styles.inputValue}>{profileAge}</Text>
          </View>
        </View>
      </View>
    </Modal>


      {/* Notification Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Notifications</Text>
            <Text style={styles.modalText}>You have new notifications.</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.canvasContainer}ref={viewRef} {...events}>

            {/* Left Gradient Overlay */}
            <LinearGradient
              colors={['rgba(135,206,250,0.5)', 'transparent']} 
              style={styles.leftGradientOverlay}
            />

            {/* Right Gradient Overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.5)']}
              style={styles.rightGradientOverlay}
            />
            <Canvas style={styles.canvas} camera={{ position: [0, 0, zoom] }}>
              <OrbitControls enablePan={false}  maxZoom={10} minZoom={2}/>
              <directionalLight position={[1, 0, 10]} args={['#9e9e9e', 2]} />
              <ambientLight intensity={0.4} />
              <Suspense fallback={null}>
                <Model
                  onPointerDown={handlePointerDown}
                  rotationSpeed={paused ? 0 : 0.01}
                  selectedVertex={selectedVertex}
                  totalGCS={totalGCS}
                  interpolateColor={interpolateColor}
                  zoom={zoom}
                  onTakeScreenshot={takeScreenshot}
                />
              </Suspense>
            </Canvas> 


      {/* Right Side Vertical Bar for Controls */}
      <View style={styles.verticalBar}>
        <TouchableOpacity onPress={togglePause} style={styles.controlButton}>
          <Text style={styles.buttonIcon}>{paused ? '▶️' : '⏸️'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={zoomIn} style={styles.controlButton}>
        <Text style={styles.buttonIcon}>➕</Text>               
      </TouchableOpacity>
      <TouchableOpacity onPress={zoomOut} style={styles.controlButton}>
        <Text style={styles.buttonIcon}>➖</Text> 
      </TouchableOpacity>
       <TouchableOpacity onPress={takeScreenshot} style={styles.controlButton}>
          <Text style={styles.buttonIcon}>📸</Text> 
        </TouchableOpacity>
      </View>

        {/* Optional: Display Screenshot Preview */}
        {screenshot && (
            <View style={styles.screenshotContainer}>
              <Text>Screenshot Preview:</Text>
              <Image source={{ uri: screenshot }} style={styles.screenshotImage} />
              <TouchableOpacity onPress={cancelScreenshot} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>✖</Text>
              </TouchableOpacity>
            </View>
          )}

      <View style={styles.semiTransparentCard}> 
      <Text style={styles.tipsText}>
            * Tip: Use the controls to pan and rotate for a better view. Adjust lighting if needed for clarity.
      </Text>
           
            <TouchableOpacity onPress={toggleModal} style={styles.instructionButton}>
              <Text style={styles.buttonIcon}>❓</Text>
              <Text style={styles.buttonText}>Show Instructions</Text>
            </TouchableOpacity>
            </View>
          </View>

       {/* Instruction Modal */}
       <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={toggleModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                      {/* Cancel Button at Top Right */}
            <TouchableOpacity onPress={toggleModal} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>✖</Text>
            </TouchableOpacity>

              <Text style={styles.modalTitle}>Instructions</Text>
              <Text style={styles.modalText}>
                Here are some tips for interacting with the model:
                {'\n'}- Tap on specific areas to locate injury points.
                {'\n'}- Double-tap for more details.
                {'\n'}- Use pinch gestures to zoom in and out.
              </Text>
              <TouchableOpacity onPress={toggleModal} style={styles.closeButton}>
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
            <Text style={styles.cancelButtonText}>✖</Text>
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
                <Text style={styles.cancelButtonText}>✖</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Glasgow Coma Scale Criteria</Text>

               {/* Instruction Button */}
              <TouchableOpacity
                onPress={() => setGcsInstructionModalVisible(true)}
                style={styles.infoButton}>
                <Text style={styles.infoButtonText}>ℹ️ Instructions</Text>
              </TouchableOpacity>

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
              onPress={() => {
                calculateTotalGCS(); // Calculate GCS
                openInjuryDetails(); // Open Injury Details modal
              }}
              style={styles.calculateButton}>
              <Text style={styles.calculateButtonText}>Total GCS</Text>
            </TouchableOpacity>
            
              
       {/* Instructions Modal */}
        <Modal
          transparent={true}
          visible={gcsInstructionModalVisible}
          onRequestClose={() => setGcsInstructionModalVisible(false)}>
          <View style={styles.modalBackground}>
            <View style={styles.modalBox}>
              <TouchableOpacity
                onPress={() => setGcsInstructionModalVisible(false)}
                style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>✖</Text>
              </TouchableOpacity>

              <Text style={styles.modalTitle}>Glasgow Coma Scale Instructions</Text>

              {/* Introduction */}
              <Text style={styles.instructionText}>
                The Glasgow Coma Scale (GCS) is a simple tool used by healthcare professionals to assess the level of consciousness in people who have had a head injury. It helps determine how severe the injury is. The GCS has three parts:
              </Text>

             

              {/* YouTube Video Thumbnail */}
              <Text style={styles.instructionText}>
                For a video explanation, click on the thumbnail below:
              </Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://www.youtube.com/watch?v=_BGMQDmwRmA')}>
                <Image 
                  source={{uri: 'https://img.youtube.com/vi/_BGMQDmwRmA/0.jpg'}} 
                  style={styles.videoThumbnail} 
                />
              </TouchableOpacity>

                  {/* Additional Resources */}
            <Text style={styles.instructionText}>
              For further reading, consider checking the following resources:
            </Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://www.ncbi.nlm.nih.gov/books/NBK459253/')}>
              <Text style={styles.linkText}>- GCS Overview on NCBI</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('https://www.cdc.gov/traumaticbraininjury/guidelines.html')}>
              <Text style={styles.linkText}>- CDC TBI Guidelines</Text>
            </TouchableOpacity>
            </View>
          </View>
        </Modal>
        </View>
        </View>
        </Modal>

      <Text style={styles. sectionHeading}>Latest Injury</Text>
      <View style={styles.injuryContainer}>
        {injuryRecords.length === 0 ? (
            <TouchableOpacity
            style={styles.noDataContainer} // Adding a container style for "No data"
            onPress={() => navigation.navigate('Details', { injury: null })}
          >
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


      <View style={styles.activityCardContainer}>
      <Text style={styles.activityTitle}>Week-Summary</Text>

      <View style={styles.exerciseContainer}>
        <Text style={styles.exerciseLabel}>Injury Days</Text>
        <Text style={styles.exerciseCount}>{exerciseCount} of 7</Text> 
        <Text style={styles.weekLabel}>This Week's Injury Data</Text>
            
        
        {/* Scrollable Container for Days */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayIndicatorContainer}
        >
          {injuriesPerDay.map((day, index) => (
            <View key={index} style={styles.dayContainer}>
              <TouchableOpacity onPress={() => handleDayClick(day)}>
                <View
                  style={[
                    styles.dayCircle,
                    { backgroundColor: interpolateColorforActivity(day.avgSeverity) }, // Apply color based on avgSeverity
                  ]}
                />
              </TouchableOpacity>
              <Text style={styles.dayText}>
                {day.day} ({day.count})
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
       {/* Modal to show injury details for selected day */}
       {selectedDay && (
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Injury Details</Text>
              <Text style={styles.modalText}>
                Day: {selectedDay.day}
              </Text>
              <Text style={styles.modalText}>
                Total Injuries: {selectedDay.count}
              </Text>
              <Text style={styles.modalText}>
                Average Severity: {getSeverityLabel(selectedDay.avgSeverity)}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      
     </View>
    

    <Text style={styles.sectionHeading}>Trends and News</Text>
    <View style={styles.trendsContainer}>
    <ScrollView>
    {category518Posts.map(post => (
        <View key={post.id} style={styles.trendCard}>
          <Text style={styles.modifiedTimeText}>Updated: {post.formattedModifiedTime}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('PostDetails', { post })}>
            <Image source={{ uri: post.thumbnail }} style={styles.thumbnail} />
            <Text style={styles.trendText}>{post.title.rendered}</Text>
            <Text style={styles.excerptText}>{post.excerptText}</Text>
            <Text style={styles.readingTimeText}>{post.readingTime}</Text>
          </TouchableOpacity>
          <Text style={styles.authorText}>Author: HITSENSE</Text>
        </View>
      ))}
    </ScrollView>
    </View>

      {/* New Instruction Section */}
      <Text style={styles.sectionHeading}>Recovery insights and Tips</Text>
      <View style={styles.tipsContainer}>
    
        {category25761Posts.map(post => (
        <View key={post.id} style={styles.trendCard}>
          <Text style={styles.modifiedTimeText}>Updated: {post.formattedModifiedTime}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('PostDetails', { post })}>
            <Image source={{ uri: post.thumbnail }} style={styles.thumbnail} />
            <Text style={styles.trendText}>{post.title.rendered}</Text>
            <Text style={styles.excerptText}>{post.excerptText}</Text>
            <Text style={styles.readingTimeText}>{post.readingTime}</Text>
          </TouchableOpacity>
          <Text style={styles.authorText}>Author: HITSENSE</Text>
        </View>
      ))}
      </View>
      </ScrollView>


      <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigation.navigate('HomeScreen')}>
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
    fontSize: 17,
    color: '#343434',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
    width: '90%',
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
    backgroundColor: '#FFFFFF',
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
    position: 'absolute',
    top: 10,
    right: 10,
   
  },
  cancelButtonText: {
    color: '#000', // Black color for cancel button
    fontWeight: 'bold',
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
    backgroundColor: '#FFFFFF',
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
    height: 400,
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

  infoButton: {
    backgroundColor: '#393e46',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  infoButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  gcsinstructionText: {
    fontSize: 14,
    marginVertical: 10,
    textAlign: 'justify',
  },
  instructionSubtitle: {
    fontWeight: 'bold',
    marginVertical: 5,
    fontSize: 16,
  },

  videoThumbnail: {
    width: '100%',
    height: 200,
    marginTop: 15,
    borderRadius: 10,
  },
  instructionDetail: {
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'justify',
  },
  linkText: {
    color: '#fd7013', // Color of the link
    textDecorationLine: 'underline', // Underline to indicate it's a link
    marginVertical: 4, // Space above and below the link
    fontSize: 16, // Adjust the font size as needed
    // You can add additional styles like fontWeight or fontFamily if desired
  },


  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', padding: 20, backgroundColor: '#fff', borderRadius: 8, alignItems: 'center' },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center', // Center title
  },

  closeButton: { padding: 10, backgroundColor: '#FF5C5C', borderRadius: 5, marginTop: 10 },
 
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  lockIcon: {
    fontSize: 19,
    color: '#9e9e9e',
    right: 0.0001,
    left: 5,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 1,
  },
  settingsIcon: {
    fontSize: 18,
    color: '#9e9e9e',
    left: 12,
  },

  introText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fd7013', // Highlighted color
    textAlign: 'center',
    marginVertical: 10,
    textShadowColor: '#393e46',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 1.2,
  },

  tipsText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#555', // Subtle contrast color
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
 
  instructionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRadius: 8,
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  buttonIcon: {
    fontSize: 15,
    color: '#ffffff',
    marginRight: 5,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  trendCard: { marginBottom: 16, padding: 16, backgroundColor: '#fff', borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  thumbnail: { width: '100%', height: 150, borderRadius: 8, marginBottom: 8 },
  trendText: { fontSize: 18, fontWeight: 'bold' },
  excerptText: { color: '#666', fontSize: 14, marginTop: 4 }, // Added styling for excerpt text
  readingTimeText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 3,
    marginTop: 20,
  },
  modifiedTimeText: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'left',
    marginBottom: 10,
  },
  authorText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    textAlign: 'right',
    fontStyle: 'italic',
    fontWeight: '600',
  },

  leftGradientOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '150%', // Adjust width as needed
  },
 

  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 10 },
 


  canvasContainer: { position: 'relative', width: '100%', height: 400 },
  menuIcon: { position: 'absolute', top: 16, right: 20, zIndex: 1 },
  menuText: { fontSize: 40, color: '#333' },

  modalContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalButton: { padding: 15, backgroundColor: '#fff', marginBottom: 10, borderRadius: 8 },
  modalButtonText: { fontSize: 16 },
  notificationBadge: {
    color: 'red',
    fontWeight: 'bold',
  },
  closeButton: { marginTop: 10 },
  closeButtonText: { color: 'blue' },

  iconContainer: {
    backgroundColor: '#e0e0e0', // Light grey background color for visibility
    borderRadius: 25, // Half of width/height to make it circular
    width: 30,       // Width and height make the container large enough to be visible
    height: 30,  
    right: 10,   
  
  },

 
  inputBox: {
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  inputLabel: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  inputValue: {
    fontSize: 18,
    paddingVertical: 10,
    backgroundColor: '#f2f2f2', // Light grey background to simulate input fields
    borderRadius: 5,
    textAlign: 'center',
    color: '#333',
  },
  semiTransparentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
    marginHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
 
  zoomControls: {
    position: 'relative',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    gap: 10,
  },
  zoomButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  zoomText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  pauseButton: {
    position: 'relative',
    bottom: 20,
    left: 20,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  pauseText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
 

 

  verticalBar: {
    position: 'absolute',
    right: 10,
    top: '8%',
    backgroundColor: 'transparent', // Transparent background for the bar
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    marginBottom: 20,
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent background for the button
  },
  buttonIcon: {
    fontSize: 16, // Icon size
    color: 'white', // Icon color
  },
 
  screenshotContainer: {
    position: 'absolute',
    bottom: 150,
    right: 1,
    backgroundColor: '#fff',
    padding: 1,
    borderRadius: 10,
  },
  screenshotImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover', // Adjust the image to fit the container
  },
  activityCardContainer: {
    backgroundColor: '#f6f8f9',
    borderRadius: 12,
    padding: 5,
    margin: 1,
    marginBottom: 20,
    width: '90%',
    alignSelf: 'center',
  },

  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },

  exerciseContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
  },

  exerciseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  exerciseCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },

  weekLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },

  dayIndicatorContainer: {
    flexDirection: 'row', // Ensures horizontal scrolling
    marginTop: 16,
  },

  dayContainer: {
    alignItems: 'center',
    marginRight: 16, // Space between each day container
  },

  dayCircle: {
    width: 18,
    height: 39,
    borderRadius: 9,
    marginBottom: 4,
  },

  dayText: {
    fontSize: 12,
    color: '#888',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },

  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },

  modalText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },

  closeButton: {
    backgroundColor: '#FF6B6B',
    padding: 10,
    borderRadius: 5,
    marginTop: 12,
  },

  closeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});



export default HomeScreen;

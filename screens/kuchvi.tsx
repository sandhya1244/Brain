import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { retrieveData } from '../db'; // Assuming you're using the existing db.js for fetching data

const ActivityCard = () => {
  const [injuriesPerDay, setInjuriesPerDay] = useState([]);
  const [exerciseCount, setExerciseCount] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null); // State to track selected day
  const [modalVisible, setModalVisible] = useState(false); // State to control modal visibility

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

  // Calculate injuries per day and average severity
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

  return (
    <View style={styles.activityCardContainer}>
      <Text style={styles.activityTitle}>Activity</Text>

      <View style={styles.exerciseContainer}>
        <Text style={styles.exerciseLabel}>Exercise days</Text>
        <Text style={styles.exerciseCount}>
          {exerciseCount} of 6
        </Text>
        <Text style={styles.weekLabel}>This week</Text>

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
  );
};

const styles = StyleSheet.create({
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

export default ActivityCard;

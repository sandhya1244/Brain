import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';

const ProfileSelectionScreen = ({ navigation }) => {
  const [profiles, setProfiles] = useState([
    { id: '1', name: 'David', age: 25 },
    { id: '2', name: 'Hjjjj', age: 30 },
    { id: '3', name: 'Kychvi', age: 27 },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileAge, setNewProfileAge] = useState('');
  const [editingProfileId, setEditingProfileId] = useState(null);

  const addProfile = () => {
    if (!newProfileName || !newProfileAge) {
      Alert.alert("Please fill out all fields.");
      return;
    }
  
    const newProfile = {
      id: (profiles.length + 1).toString(),
      name: newProfileName,
      age: parseInt(newProfileAge),
    };
  
    setProfiles((prevProfiles) => [...prevProfiles, newProfile]);
    setModalVisible(false);
    resetModalFields();
  
    // Redirect to HomeScreen with the new profile's name
    navigation.navigate('HomeScreen', { name: newProfile.name });
  };

  const handleAddProfileClick = () => {
    setEditingProfileId(null); // Ensure no profile is being edited
    setNewProfileName(''); // Clear the name input
    setNewProfileAge(''); // Clear the age input
    setModalVisible(true); // Open modal for creating a new profile
  };
  
  // Function to edit an existing profile
  const editProfile = (profile) => {
    setEditingProfileId(profile.id); // Set the profile ID to identify the one being edited
    setNewProfileName(profile.name); // Set the existing name in the modal
    setNewProfileAge(profile.age.toString()); // Set the existing age in the modal
    setModalVisible(true); // Open modal for editing an existing profile
  };

  const saveProfileChanges = () => {
    if (!newProfileName || !newProfileAge) {
      Alert.alert("Please fill out all fields.");
      return;
    }

    const updatedProfiles = profiles.map((profile) => {
      if (profile.id === editingProfileId) {
        return { ...profile, name: newProfileName, age: parseInt(newProfileAge) };
      }
      return profile;
    });

    setProfiles(updatedProfiles);
    setModalVisible(false);
    resetModalFields();
  };

  const removeProfile = () => {
    const updatedProfiles = profiles.filter((profile) => profile.id !== editingProfileId);
    setProfiles(updatedProfiles);
    setModalVisible(false);
    resetModalFields();
  };

  const resetModalFields = () => {
    setNewProfileName('');
    setNewProfileAge('');
    setEditingProfileId(null);
  };

  const handleProfileSelect = (profile) => {
    navigation.navigate('HomeScreen', { name: profile.name });
  };

  const renderProfile = ({ item }) => {
    return (
      <View style={styles.profileContainer}>
        <View style={styles.profileCircle}>
          <Text style={styles.profileInitial}>{item.name.charAt(0)}</Text>
          <TouchableOpacity
            style={styles.editIcon}
            onPress={() => editProfile(item)}
          >
            <Text style={styles.editIconText}>✎</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => handleProfileSelect(item)}>
          <Text style={styles.profileName}>{item.name}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Choose Profile</Text>

      <FlatList
        data={profiles}
        numColumns={3}
        keyExtractor={(item) => item.id}
        renderItem={renderProfile}
        contentContainerStyle={styles.profilesList}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddProfileClick} // Ensure it's for adding a new profile
      >
        <Text style={styles.addButtonText}>➕</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Cancel Button */}
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>✖</Text> 
            </TouchableOpacity>

            <Text style={styles.modalTitle}>
              {editingProfileId ? 'Edit Profile' : 'Create Profile'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={newProfileName}
              onChangeText={setNewProfileName}
            />
            <TextInput
              style={styles.input}
              placeholder="Age"
              keyboardType="numeric"
              value={newProfileAge}
              onChangeText={setNewProfileAge}
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={editingProfileId ? saveProfileChanges : addProfile}
            >
              <Text style={styles.saveButtonText}>
                {editingProfileId ? 'Save Changes' : 'Save'}
              </Text>
            </TouchableOpacity>

            {editingProfileId && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={removeProfile}
              >
                <Text style={styles.removeButtonText}>Remove Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Clean white background
    alignItems: 'center',
    paddingVertical: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: '600',
    color: '#333', // Dark gray for subtle contrast
    marginVertical: 15,
    textAlign: 'center',
  },
  profilesList: {
    alignItems: 'center',
    paddingBottom: 100,
  },
  profileContainer: {
    alignItems: 'center',
    margin: 15,
  },
  profileCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#d1e3e5', // Soft pastel color for elegance
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  profileInitial: {
    fontSize: 28,
    color: '#4a4a4a', // Elegant dark gray
    fontWeight: '600',
  },
  editIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#fff', // White background for the edit button
    borderRadius: 12,
    padding: 4,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#ddd',
    borderWidth: 1,
  },
  editIconText: {
    color: '#4a4a4a',
    fontSize: 14,
  },
  profileName: {
    fontSize: 16,
    color: '#333', // Dark gray text
    marginTop: 8,
    fontWeight: '500',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#9fa8da',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 32,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Slight dark overlay for focus
  },
  modalContent: {
    width: 320,
    padding: 25,
    backgroundColor: '#fff', // White modal background for a clean look
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  cancelButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  cancelButtonText: {
    fontSize: 28,
    color: '#000', // Black cancel icon color
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#a5d6a7',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  removeButton: {
    marginTop: 15,
    backgroundColor: '#f8d7da',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 5,
  },
  removeButtonText: {
    color: '#721c24',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileSelectionScreen;

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView, Switch } from 'react-native';

// Define your settings options array
const settingsOptions = [
  {
    id: '1',
    title: 'Account',
    items: [
      { id: '1-1', title: 'Profile', icon: '👤', onPress: () => console.log('Profile Pressed') },
      { id: '1-2', title: 'Change Password', icon: '🔒', onPress: () => console.log('Change Password Pressed') },
    ],
  },
  {
    id: '2',
    title: 'Notifications',
    items: [
      { id: '2-1', title: 'App Notifications', icon: '🔔', onPress: () => console.log('App Notifications Pressed'), toggle: true },
      { id: '2-2', title: 'Email Notifications', icon: '📧', onPress: () => console.log('Email Notifications Pressed'), toggle: true },
    ],
  },
  {
    id: '3',
    title: 'Privacy',
    items: [
      { id: '3-1', title: 'Privacy Settings', icon: '🔐', onPress: () => console.log('Privacy Settings Pressed') },
      { id: '3-2', title: 'Data Sharing', icon: '📊', onPress: () => console.log('Data Sharing Pressed') },
    ],
  },
  {
    id: '4',
    title: 'About',
    items: [
      { id: '4-1', title: 'Version Info', icon: 'ℹ️', onPress: () => console.log('Version Info Pressed') },
      { id: '4-2', title: 'Terms of Service', icon: '📜', onPress: () => console.log('Terms of Service Pressed') },
    ],
  },
];

const SettingsScreen = () => {
  const [toggles, setToggles] = useState({
    '2-1': false,
    '2-2': false,
  });

  // Function to handle toggle switch changes
  const toggleSwitch = (id) => {
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Safely render each item
  const renderItem = ({ item }) => {
    if (!item || !item.onPress) {
      console.warn(`Item is missing: ${item?.title || 'Unknown Item'}`);
      return null; // Prevent rendering if item or onPress is undefined
    }
    return (
      <TouchableOpacity style={styles.optionItem} onPress={item.onPress}>
        <Text style={styles.icon}>{item.icon}</Text>
        <Text style={styles.optionText}>{item.title}</Text>
        {item.toggle !== undefined && (
          <Switch
            value={toggles[item.id] || false}
            onValueChange={() => toggleSwitch(item.id)}
          />
        )}
      </TouchableOpacity>
    );
  };

  // Render section for each category of settings
  const renderSection = ({ item }) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{item.title}</Text>
      {item.items && item.items.map((subItem) => renderItem({ item: subItem }))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Settings</Text>
      </View>
      <FlatList
        data={settingsOptions}
        renderItem={renderSection}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fd7013',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  listContainer: {
    paddingVertical: 10,
  },
  sectionContainer: {
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 15,
    backgroundColor: '#e0e0e0',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#393e46',
  },
  icon: {
    marginRight: 15,
    fontSize: 24, // Adjust size as necessary
  },
});

export default SettingsScreen;

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { 
    storage,
    getCurrentUser, 
    updateUserProfile, 
    signOut, 
    uploadFile, 
    getFilePreview, 
    deleteFile,
    config // Add this
} from '../../lib/appwrite';

import { router } from 'expo-router';

import * as ImagePicker from 'expo-image-picker';

const ProfileScreen = () => {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    address: '',
    phone: ''
  });
  const [editingField, setEditingField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tempValue, setTempValue] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [coverPhoto, setCoverPhoto] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);
  
  const fetchUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUserData({
          $id: currentUser.$id,
          name: currentUser.name,
          email: currentUser.email,
          address: currentUser.address || '',
          phone: currentUser.phone || '',
          username: currentUser.username || 'User' // Add username
        });
      } else {
        router.replace('/(auth)/sign-in');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch user data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (field, value) => {
    setEditingField(field);
    setTempValue(value);
  };

  const cancelEditing = () => {
    setEditingField(null);
    setTempValue('');
  };

  const uploadImageToAppwrite = async (imageUri) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
  
      // Check file size (optional)
      if (blob.size > 10 * 1024 * 1024) {
        throw new Error('File size too large. Please select an image under 10MB.');
      }
  
      const fileName = `${Date.now()}.jpg`;
      const fileObject = new File([blob], fileName, {
        type: 'image/jpeg',
      });
  
      const file = await uploadFile(fileObject);
  
      const fileUrl = getFilePreview(file.$id);
  
      return {
        fileUrl,
        fileId: file.$id
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

const handleProfilePictureUpload = async () => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'Camera roll permissions are required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uploadedImage = await uploadImageToAppwrite(result.assets[0].uri);
      
      if (uploadedImage && uploadedImage.fileUrl) {
        setProfilePicture(uploadedImage.fileUrl);
        await updateUserProfile(userData.$id, { profilePicture: uploadedImage.fileUrl });
        setUserData(prev => ({ ...prev, profilePicture: uploadedImage.fileUrl }));
        Alert.alert('Success', 'Profile picture updated successfully');
      }
    }
  } catch (error) {
    console.error('Profile picture upload error details:', error);
    Alert.alert('Error', `Failed to upload profile picture: ${error.message}`);
  }
};

const handleCoverPhotoUpload = async () => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'Camera roll permissions are required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) { // Changed from !result.cancelled
      const uploadedImage = await uploadImageToAppwrite(result.assets[0].uri, 'cover-photo');
      if (uploadedImage) {
        setCoverPhoto(uploadedImage.fileUrl);
        await updateUserProfile(userData.$id, { coverPhoto: uploadedImage.fileUrl });
        setUserData((prevData) => ({ ...prevData, coverPhoto: uploadedImage.fileUrl }));
      }
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to upload cover photo');
    console.error(error);
  }
};

const saveField = async (field) => {
  // Check for empty values
  if (!tempValue.trim()) {
    Alert.alert('Error', `${field.charAt(0).toUpperCase() + field.slice(1)} cannot be empty`);
    return;
  }

  // Phone number specific validation
  if (field === 'phone') {
    if (tempValue.length > 11) {
      Alert.alert('Error', 'Phone number cannot exceed 11 digits');
      return;
    }
    if (tempValue.length < 11) {
      Alert.alert('Error', 'Phone number must be 11 digits');
      return;
    }
    if (!/^\d+$/.test(tempValue)) {
      Alert.alert('Error', 'Phone number must contain only digits');
      return;
    }
  }

  // Address specific validation
  if (field === 'address' && tempValue.trim().length < 3) {
    Alert.alert('Error', 'Please enter a valid address');
    return;
  }

  try {
    setLoading(true);
    await updateUserProfile(userData.$id, {
      [field]: tempValue
    });

    setUserData((prevData) => ({
      ...prevData,
      [field]: tempValue
    }));
    setEditingField(null);
    setTempValue('');
    Alert.alert('Success', 'Profile updated successfully');
  } catch (error) {
    Alert.alert('Error', 'Failed to update profile');
    console.error(error);
  } finally {
    setLoading(false);
  }
};

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOut();
      router.replace('/(auth)/sign-in');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  const InputField = ({ icon, label, field, value, editable = true }) => (
    <TouchableOpacity
      style={styles.inputContainer}
      onPress={() => editable && startEditing(field, value)}
      disabled={!editable}
    >
      <Icon name={icon} size={24} color="#555" style={styles.inputIcon} />
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>{label}</Text>
        {editingField === field ? (
  <View style={styles.editingContainer}>
    <TextInput
      style={styles.input}
      value={tempValue}
      onChangeText={(text) => {
        if (field === 'phone') {
          const numbersOnly = text.replace(/[^0-9]/g, '');
          setTempValue(numbersOnly.slice(0, 11));
        } else {
          setTempValue(text);
        }
      }}
      keyboardType={field === 'phone' ? 'numeric' : 'default'}
      maxLength={field === 'phone' ? 11 : undefined}
      autoFocus
      onBlur={cancelEditing}
    />
    <View style={styles.editingButtons}>
      <TouchableOpacity onPress={() => saveField(field)}>
        <Icon name="check" size={20} color="#4A90E2" />
      </TouchableOpacity>
      <TouchableOpacity onPress={cancelEditing}>
        <Icon name="close" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  </View>
        ) : (
          <Text style={styles.inputValue}>
          {field === 'profilePicture' ? (
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                {value ? (
                  <Image source={{ uri: value }} style={styles.avatarImage} />
                ) : (
                  <Icon name="account" size={40} color="#FFF" />
                )}
              </View>
            </View>
          ) : field === 'coverPhoto' ? (
            <Image source={{ uri: value }} style={styles.coverPhoto} />
          ) : (
            value || `No ${label.toLowerCase()} added`
          )}
          {editable && <Icon name="pencil" size={16} color="#4A90E2" style={styles.editIcon} />}
        </Text>
      )}
    </View>
  </TouchableOpacity>
);


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.profileContent}>
      <View style={styles.avatarContainer}>
      <TouchableOpacity onPress={handleProfilePictureUpload}>
        <View style={styles.avatar}>
          {profilePicture ? (
            <Image source={{ uri: profilePicture }} style={styles.avatarImage} />
          ) : (
            <Icon name="account" size={40} color="#FFF" />
          )}
        </View>
        <Text style={styles.userName}>{userData.username}</Text>
      </TouchableOpacity>
    </View>
    {coverPhoto && (
      <Image source={{ uri: coverPhoto }} style={styles.coverPhoto} />
    )}
    <TouchableOpacity style={styles.uploadButton} onPress={handleCoverPhotoUpload}>
      <Icon name="upload" size={20} color="#FFF" />
      <Text style={styles.uploadText}>Upload Cover Photo</Text>
    </TouchableOpacity>

        <View style={styles.infoContainer}>
          <InputField 
            icon="map-marker" 
            label="Address"
            field="address"
            value={userData.address}
          />
          <InputField 
            icon="phone" 
            label="Contact Number"
            field="phone"
            value={userData.phone}
          />
          <InputField 
            icon="email" 
            label="Email Address"
            field="email"
            value={userData.email}
            editable={false}
          />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    height: 120,
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 15,
  },
  coverPhoto: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 15,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  editIcon: {
    marginLeft: 8,
  },
  uploadText: {
    color: '#FFF',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileContent: {
    flex: 1,
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  infoContainer: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 15,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  inputValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  editButton: {
    position: 'absolute',
    right: 20,
    padding: 8,
  },
  input: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    padding: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#4A90E2',
  },
  editingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editingButtons: {
    flexDirection: 'row',
    marginLeft: 10,
  },
});

export default ProfileScreen;

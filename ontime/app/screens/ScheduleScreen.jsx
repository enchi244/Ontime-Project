import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, FlatList, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { createCalendarEvent, getCalendarEvents, updateCalendarEvent, deleteCalendarEvent } from '../../lib/appwrite';

const ScheduleScreen = () => {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [events, setEvents] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [editingEvent, setEditingEvent] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSaveEvent = async () => {
    if (selectedDate && title) {
      try {
        if (editingEvent) {
          await updateCalendarEvent(editingEvent.id, {
            title,
            description,
            date: selectedDate
          });
        } else {
          await createCalendarEvent({
            title,
            description,
            date: selectedDate
          });
        }
        fetchEvents();
        resetFormAndModal();
      } catch (error) {
        console.error('Error saving event:', error);
      }
    }
  };

  const handleDeleteEvent = async () => {
    if (editingEvent) {
      Alert.alert(
        "Delete Event",
        "Are you sure you want to delete this event?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteCalendarEvent(editingEvent.id);
                fetchEvents();
                resetFormAndModal();
              } catch (error) {
                console.error('Error deleting event:', error);
              }
            }
          }
        ]
      );
    }
  };

  const resetFormAndModal = () => {
    setTitle('');
    setDescription('');
    setSelectedDate('');
    setModalVisible(false);
    setEditingEvent(null);
    setIsViewMode(false);
    setShowDatePicker(false);
  };

  const handleEventPress = (event) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description || '');
    setSelectedDate(event.date);
    setIsViewMode(true);
    setModalVisible(true);
  };

  const handleAddEvent = () => {
    resetFormAndModal();
    setModalVisible(true);
  };

  const handleDayPress = (day) => {
    router.push({
      pathname: '/screens/DayScheduleScreen',
      params: { date: day.dateString },
    });
  };
  
  const fetchEvents = async () => {
    try {
        const response = await getCalendarEvents();
        if (response && response.documents) {
            const formattedEvents = response.documents.map(doc => ({
                id: doc.$id,
                date: doc.date,
                title: doc.title,
                description: doc.description
            }));
            setEvents(formattedEvents);
            
            // Update marked dates
            const marked = {};
            formattedEvents.forEach(event => {
                if (event.date) {
                    marked[event.date] = { marked: true, dotColor: 'blue' };
                }
            });
            setMarkedDates(marked);
        }
    } catch (error) {
        console.error('Error fetching events:', error);
    }
};

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().substr(-2)}`;
  };

  const handleDateSelect = (day) => {
    setSelectedDate(day.dateString);
    setShowDatePicker(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={handleAddEvent}>
        <Text style={styles.addButtonText}>Add Event</Text>
      </TouchableOpacity>

      <Calendar
        onDayPress={(day) => handleDayPress(day)}
        markedDates={markedDates}
        theme={{
          arrowColor: 'black',
          todayTextColor: 'blue',
          selectedDayBackgroundColor: 'black',
          selectedDayTextColor: 'white',
        }}
      />

      <Text style={styles.eventsHeader}>Events:</Text>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.eventItem}
            onPress={() => handleEventPress(item)}
          >
            <Text style={styles.eventDate}>{formatDate(item.date)} - {item.title}</Text>
            {item.description && (
              <Text style={styles.eventDescription}>{item.description}</Text>
            )}
          </TouchableOpacity>
        )}
        style={styles.eventsList}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={resetFormAndModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingEvent ? (isViewMode ? 'View Event' : 'Edit Event') : 'Add New Event'}
            </Text>
            
            <Text style={styles.label}>Date:</Text>
            {showDatePicker ? (
              <View style={styles.calendarContainer}>
                <Calendar
                  onDayPress={handleDateSelect}
                  current={selectedDate}
                  markedDates={{
                    [selectedDate]: {selected: true, selectedColor: '#007AFF'}
                  }}
                  style={styles.calendar}
                />
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => !isViewMode && setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {selectedDate ? formatDate(selectedDate) : 'Select Date'}
                </Text>
              </TouchableOpacity>
            )}

            <Text style={styles.label}>Title:</Text>
            <TextInput
              style={styles.input}
              placeholder="Event Title"
              value={title}
              onChangeText={setTitle}
              editable={!isViewMode}
            />

            <Text style={styles.label}>Description:</Text>
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Event Description"
              value={description}
              onChangeText={setDescription}
              multiline
              editable={!isViewMode}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={resetFormAndModal}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              {editingEvent && (
                <>
                  {isViewMode ? (
                    <TouchableOpacity 
                      style={[styles.button, styles.editButton]} 
                      onPress={() => setIsViewMode(false)}
                    >
                      <Text style={styles.buttonText}>Edit</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.button, styles.deleteButton]} 
                      onPress={handleDeleteEvent}
                    >
                      <Text style={styles.buttonText}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
              
              {!isViewMode && (
                <TouchableOpacity 
                  style={[styles.button, styles.saveButton]} 
                  onPress={handleSaveEvent}
                >
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  eventsList: {
    flex: 1,
  },
  eventItem: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#ff3b30',
  },
  saveButton: {
    backgroundColor: '#34c759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  calendarContainer: {
    marginBottom: 16,
  },
  calendar: {
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#000',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '90%',
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});

export default ScheduleScreen;
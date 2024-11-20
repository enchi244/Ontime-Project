import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Button, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { createScheduleTask, getScheduleTasks, deleteScheduleTask } from '../../lib/appwrite';

const timeslots = Array.from({ length: 15 }, (_, i) => `${6 + i}:00`);

const DayScheduleScreen = () => {
    const { date } = useLocalSearchParams();
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [taskInput, setTaskInput] = useState('');
    const [tasks, setTasks] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
    }, [date]);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await getScheduleTasks(date);
            const tasksByTime = {};
            response.documents.forEach(doc => {
                tasksByTime[doc.timeSlot] = {
                    text: doc.task,
                    id: doc.$id
                };
            });
            setTasks(tasksByTime);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch tasks');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const openAddTaskModal = (slot) => {
        setSelectedSlot(slot);
        setTaskInput(tasks[slot]?.text || '');
        setModalVisible(true);
    };

    const addTask = async () => {
        if (taskInput.trim()) {
            try {
                const taskData = {
                    date: date,
                    timeSlot: selectedSlot,
                    task: taskInput.trim()
                };

                const response = await createScheduleTask(taskData);

                setTasks(prevTasks => ({
                    ...prevTasks,
                    [selectedSlot]: {
                        text: taskInput,
                        id: response.$id
                    }
                }));

                setTaskInput('');
                setModalVisible(false);
            } catch (error) {
                Alert.alert('Error', 'Failed to save task');
                console.error(error);
            }
        }
    };

    const handleDeleteTask = async (timeSlot) => {
        try {
            const taskId = tasks[timeSlot]?.id;
            if (taskId) {
                await deleteScheduleTask(taskId);
                setTasks(prevTasks => {
                    const newTasks = { ...prevTasks };
                    delete newTasks[timeSlot];
                    return newTasks;
                });
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to delete task');
            console.error(error);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.dateText}>Schedule for {date}</Text>
            <FlatList
                data={timeslots}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={styles.timeslot} 
                        onPress={() => openAddTaskModal(item)}
                        onLongPress={() => {
                            if (tasks[item]) {
                                Alert.alert(
                                    'Delete Task',
                                    'Do you want to delete this task?',
                                    [
                                        { text: 'Cancel' },
                                        { 
                                            text: 'Delete', 
                                            onPress: () => handleDeleteTask(item),
                                            style: 'destructive'
                                        }
                                    ]
                                );
                            }
                        }}
                    >
                        <Text style={styles.timeText}>{item}</Text>
                        <Text style={styles.taskText}>
                            {tasks[item]?.text || ''}
                        </Text>
                    </TouchableOpacity>
                )}
            />
            
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add Task for {selectedSlot}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter task"
                            value={taskInput}
                            onChangeText={setTaskInput}
                            placeholderTextColor="#666"
                        />
                        <View style={styles.buttonContainer}>
                            <Button title="Add Task" onPress={addTask} />
                            <Button title="Cancel" onPress={() => setModalVisible(false)} color="red" />
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
        padding: 16, 
        backgroundColor: '#f9f9f9' 
    },
    dateText: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        marginBottom: 16 
    },
    timeslot: { 
        padding: 16, 
        marginBottom: 8, 
        backgroundColor: '#e3e3e3', 
        borderRadius: 8 
    },
    timeText: { 
        fontSize: 18, 
        fontWeight: '500' 
    },
    taskText: { 
        fontSize: 16, 
        color: 'gray',
        marginTop: 4 
    },
    modalContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        backgroundColor: 'rgba(0,0,0,0.5)' 
    },
    modalContent: {
        backgroundColor: 'white',
        margin: 20,
        borderRadius: 8,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalTitle: { 
        fontSize: 20, 
        marginBottom: 16, 
        textAlign: 'center', 
        color: '#000',
        fontWeight: 'bold'
    },
    input: { 
        backgroundColor: '#f0f0f0', 
        padding: 12,
        marginBottom: 16, 
        borderRadius: 8,
        fontSize: 16
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10
    }
});

export default DayScheduleScreen;
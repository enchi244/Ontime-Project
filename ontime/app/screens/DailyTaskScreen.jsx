import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { createTask, getTasks, updateTask, deleteTask } from '../../lib/appwrite';

const DailyTaskScreen = () => {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            setLoading(true);
            const response = await getTasks();
            setTasks(response.documents);
        } catch (error) {
            console.error('Error loading tasks:', error);
            // You might want to add error handling UI here
        } finally {
            setLoading(false);
        }
    };

    const addTask = async () => {
        if (newTask.trim() === '') return;

        try {
            const response = await createTask({ text: newTask });
            setTasks(prevTasks => [...prevTasks, response]);
            setNewTask('');
        } catch (error) {
            console.error('Error adding task:', error);
            // Add error handling UI here
        }
    };

    const handleEditTask = (taskId, taskText) => {
        setIsEditing(true);
        setNewTask(taskText);
        setEditingTaskId(taskId);
    };

    const saveEditTask = async () => {
        try {
            await updateTask(editingTaskId, { text: newTask });
            await loadTasks(); // Reload tasks to get the updated list
            setNewTask('');
            setIsEditing(false);
            setEditingTaskId(null);
        } catch (error) {
            console.error('Error updating task:', error);
            // Add error handling UI here
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            await deleteTask(taskId);
            setTasks(prevTasks => prevTasks.filter(task => task.$id !== taskId));
        } catch (error) {
            console.error('Error deleting task:', error);
            // Add error handling UI here
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#fff" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Daily Task</Text>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Add Task"
                    value={newTask}
                    onChangeText={setNewTask}
                />
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={isEditing ? saveEditTask : addTask}
                >
                    <Icon name={isEditing ? "check" : "plus-circle-outline"} size={24} color="#000" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={tasks}
                keyExtractor={item => item.$id}
                renderItem={({ item }) => (
                    <View style={styles.taskItem}>
                        <Text style={styles.taskText}>{item.text}</Text>
                        <View style={styles.taskActions}>
                            <TouchableOpacity onPress={() => handleEditTask(item.$id, item.text)}>
                                <Icon name="pencil-outline" size={20} color="#000" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteTask(item.$id)}>
                                <Icon name="delete-outline" size={20} color="#000" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1e1e1e',
        padding: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    input: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 10,
        fontSize: 16,
    },
    addButton: {
        marginLeft: 10,
    },
    taskItem: {
        backgroundColor: '#e0e0e0',
        padding: 15,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    taskText: {
        fontSize: 16,
        color: '#000',
    },
    taskActions: {
        flexDirection: 'row',
        gap: 10,
    },
});

export default DailyTaskScreen;

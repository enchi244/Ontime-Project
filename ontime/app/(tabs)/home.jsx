import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCurrentUser, getDailyTasks, getCalendarEvents, getGoals, getTasks } from '../../lib/appwrite';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

export default function Home() {
    const [username, setUsername] = useState('User');
    const [reminders, setReminders] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchAllReminders();
        setRefreshing(false);
    }, []);


    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await getCurrentUser();
                setUsername(user.username);
            } catch (error) {
                console.error('Error fetching user:', error);
            }
        };

        fetchUser();
    }, []);

    const fetchAllReminders = async () => {
        try {
            const [tasks, events, goals] = await Promise.all([
                getTasks(),
                getCalendarEvents(),
                getGoals()
            ]);

            const combinedReminders = [
                ...(tasks?.documents?.map(task => ({
                    id: task.$id,
                    title: task.text,
                    type: 'task',
                    dueDate: task.createdAt,
                })) || []),
                ...(events?.documents?.map(event => ({
                    id: event.$id,
                    title: event.title,
                    type: 'event',
                    dueDate: event.date,
                })) || []),
                ...(goals?.documents?.map(goal => ({
                    id: goal.$id,
                    title: goal.title,
                    type: 'goal',
                    dueDate: goal.deadline,
                })) || [])
            ];

            const sortedReminders = combinedReminders.sort((a, b) =>
                new Date(a.dueDate) - new Date(b.dueDate)
            );

            setReminders(sortedReminders.slice(0, 4));
        } catch (error) {
            console.error('Error fetching reminders:', error);
        }
    };

    const getIconForType = (type) => {
        switch(type) {
            case 'task':
                return 'clipboard-text-outline';
            case 'event':
                return 'calendar-clock';
            case 'goal':
                return 'target';
            default:
                return 'bell-outline';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <ScrollView 
            contentContainerStyle={styles.container}
            refreshControl={ <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/> }>
            {/* Greeting */}
            <View style={styles.header}>
                <Text style={styles.greeting}>Hello, {username}!</Text>
                <View style={styles.icons}>
                    <MaterialCommunityIcons name="bell-outline" size={28} color="#2c3e50" />
                    <MaterialCommunityIcons name="menu" size={28} color="#2c3e50" style={{ marginLeft: 20 }} />
                </View>
            </View>

            {/* Menu Buttons */}
            <View style={styles.menuContainer}>
                <TouchableOpacity 
                    style={styles.menuButton} 
                    onPress={() => router.push('/screens/DailyTaskScreen')}
                >
                    <View style={styles.menuButtonContent}>
                        <MaterialCommunityIcons name="clipboard-text-outline" size={40} color="#fff" />
                        <Text style={styles.menuText}>Daily Task</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.menuButton} 
                    onPress={() => router.push('/screens/ScheduleScreen')}
                >
                    <View style={styles.menuButtonContent}>
                        <MaterialCommunityIcons name="calendar-clock" size={40} color="#fff" />
                        <Text style={styles.menuText}>Schedule</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.menuButton} 
                    onPress={() => router.push('/screens/GoalScreen')}
                >
                    <View style={styles.menuButtonContent}>
                        <MaterialCommunityIcons name="target" size={40} color="#fff" />
                        <Text style={styles.menuText}>Goals</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Reminders Section */}
            <Text style={styles.reminderTitle}>Reminders</Text>
            <View style={styles.reminderContainer}>
                {reminders.length > 0 ? (
                    reminders.map((reminder) => (
                        <TouchableOpacity 
                            key={reminder.id} 
                            style={styles.reminderItem}
                            onPress={() => {
                                switch(reminder.type) {
                                    case 'task':
                                        router.push('/screens/DailyTaskScreen');
                                        break;
                                    case 'event':
                                        router.push('/screens/ScheduleScreen');
                                        break;
                                    case 'goal':
                                        router.push('/screens/GoalScreen');
                                        break;
                                }
                            }}
                        >
                            <View style={styles.reminderContent}>
                                <MaterialCommunityIcons 
                                    name={getIconForType(reminder.type)} 
                                    size={24} 
                                    color="#3498db" 
                                    style={styles.reminderIcon}
                                />
                                <View style={styles.reminderTextContainer}>
                                    <Text style={styles.reminderText}>{reminder.title}</Text>
                                    <Text style={styles.reminderDate}>
                                        {formatDate(reminder.dueDate)}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text style={styles.noReminders}>No upcoming reminders</Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#f5f7fa',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 20,
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    icons: {
        flexDirection: 'row',
    },
    menuContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 20,
    },
    menuButton: {
        width: '30%',
        aspectRatio: 1,
        backgroundColor: '#3498db',
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    menuButtonContent: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuText: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
    },
    reminderTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 10,
    },
    reminderContainer: {
        backgroundColor: '#ecf0f1',
        borderRadius: 15,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    reminderItem: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    reminderText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#2c3e50',
    },
    reminderContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reminderIcon: {
        marginRight: 12,
    },
    reminderTextContainer: {
        flex: 1,
    },
    reminderText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#2c3e50',
    },
    reminderDate: {
        fontSize: 14,
        color: '#7f8c8d',
        marginTop: 4,
    },
    noReminders: {
        textAlign: 'center',
        color: '#7f8c8d',
        fontSize: 16,
        padding: 20,
    },
});

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const GoalsScreen = () => {
    const [goals, setGoals] = useState([]);       // List of goals
    const [newGoal, setNewGoal] = useState('');   // Text for new goal
    const [isEditing, setIsEditing] = useState(false);
    const [editingGoalId, setEditingGoalId] = useState(null);

    // Add a new goal
    const addGoal = () => {
        if (newGoal.trim() === '') return;

        const newGoalData = {
            id: Date.now().toString(),
            text: newGoal,
        };

        setGoals([...goals, newGoalData]);
        setNewGoal('');
    };

    // Edit an existing goal
    const editGoal = (goalId, goalText) => {
        setIsEditing(true);
        setNewGoal(goalText);
        setEditingGoalId(goalId);
    };

    const saveEditGoal = () => {
        setGoals(goals.map(goal =>
            goal.id === editingGoalId ? { ...goal, text: newGoal } : goal
        ));
        setNewGoal('');
        setIsEditing(false);
        setEditingGoalId(null);
    };

    // Delete a goal
    const deleteGoal = (goalId) => {
        setGoals(goals.filter(goal => goal.id !== goalId));
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>My Goals</Text>

            {/* Goal Input Field */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Add Goal"
                    value={newGoal}
                    onChangeText={setNewGoal}
                />
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={isEditing ? saveEditGoal : addGoal}
                >
                    <Icon name={isEditing ? "check" : "plus-circle-outline"} size={24} color="#000" />
                </TouchableOpacity>
            </View>

            {/* Goal List */}
            <FlatList
                data={goals}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.goalItem}>
                        <Text style={styles.goalText}>{item.text}</Text>
                        <View style={styles.goalActions}>
                            <TouchableOpacity onPress={() => editGoal(item.id, item.text)}>
                                <Icon name="pencil-outline" size={20} color="#000" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => deleteGoal(item.id)}>
                                <Icon name="delete-outline" size={20} color="#000" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />
        </View>
    );
};

export default GoalsScreen;

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
    goalItem: {
        backgroundColor: '#e0e0e0',
        padding: 15,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    goalText: {
        fontSize: 16,
        color: '#000',
    },
    goalActions: {
        flexDirection: 'row',
        gap: 10,
    },
});
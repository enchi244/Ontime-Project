import {
    Account,
    Avatars,
    Client,
    Databases,
    ID,
    Query,
    Storage,
  } from "react-native-appwrite";

export const config = {
    endpoint: 'https://cloud.appwrite.io/v1',
    platform: 'com.xepharus.ontime',
    projectId: '670d3e0d000cd53de4f5',
    databaseId: '670d4695001cfaf92e1f',
    userCollectionId: '670d46c2001162beaa10',
    storageId: 'profile_images',
    calendarEventsCollectionId: 'calendar_events',
    tasksCollectionId: 'daily_tasks', 
    goalsCollectionId: 'goals',    
    scheduleCollectionId: 'schedule'
}

const client = new Client();

client
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setPlatform(config.platform)

    const account = new Account(client);
    const avatars = new Avatars(client);
    const databases = new Databases(client);
    const storage = new Storage(client);

export { storage };

export const createUser = async (email, password, username) => {
    try {
        const newAccount = await account.create(
            ID.unique(),
            email,
            password,
            username
        )

        if(!newAccount) throw Error;

        const avatarUrl = avatars.getInitials(username)

        await signIn(email, password);

        const newUser = await databases.createDocument(
            config.databaseId,
            config.userCollectionId,
            ID.unique(),
            {
                accountID: newAccount.$id,
                email,
                username,
                avatar: avatarUrl
            }
        )

        return newUser;
    } catch (error) {
        console.log(error);
        throw new Error(error);
    }
}

export const signIn = async (email, password) => {
    try {
        const session = await account.createEmailPasswordSession(email, password)
        return session;
    } catch (error) {
        throw new Error(error);
    }
}

export const getCurrentUser = async () => {
    try {
        const currentAccount = await account.get();

        if(!currentAccount) throw Error;

        const currentUser = await databases.listDocuments(
            config.databaseId,
            config.userCollectionId,
            [Query.equal('accountID', currentAccount.$id)]
        )

        if(!currentUser) throw Error;

        return currentUser.documents[0];
    } catch (error) {
        console.log(error);
    }
}

export const updateUserProfile = async (userId, data) => {
    try {
        if (!userId) {
            throw new Error('User ID is required');
        }
        if (!data || Object.keys(data).length === 0) {
            throw new Error('No data provided for updating the user profile');
        }
     
        const response = await databases.updateDocument(
            config.databaseId,
            config.userCollectionId,
            userId,
            data
        );
        return response;
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
};

export const signOut = async () => {
    try {
        await account.deleteSessions(); // This deletes all sessions
        return true;
    } catch (error) {
        console.error('Error signing out:', error);
        throw error;
    }
};

// for files //
export const uploadFile = async (file, permissions = []) => {
    try {
        // Create a File object from the blob
        const fileName = `${Date.now()}.jpg`; // Generate unique filename
        const fileObject = new File([file], fileName, {
            type: 'image/jpeg',
        });

        const uploadedFile = await storage.createFile(
            config.storageId, 
            ID.unique(),
            fileObject,
            [Permission.read("role:all")] 
        );
        return uploadedFile;
    } catch (error) {
        console.error('File upload error:', error);
        throw error;
    }
};
export const getFilePreview = (fileId) => {
    try {
        return storage.getFileView(config.storageId, fileId);
    } catch (error) {
        console.error('Get file preview error:', error);
        throw error;
    }
};
export const deleteFile = async (fileId) => {
    try {
        await storage.deleteFile(config.storageId, fileId);
        return true;
    } catch (error) {
        console.error('Delete file error:', error);
        throw error;
    }
};

// For the Tasks //
export const createTask = async (taskData) => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || !currentUser.accountID) {
            throw new Error('User not found or not authenticated');
        }

        return await databases.createDocument(
            config.databaseId,
            config.tasksCollectionId,
            ID.unique(),
            {
                userId: currentUser.accountID,
                text: taskData.text,
                completed: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        );
    } catch (error) {
        console.error('Create task error:', error);
        throw error;
    }
};
export const getTasks = async () => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || !currentUser.accountID) {
            throw new Error('User not found or not authenticated');
        }

        return await databases.listDocuments(
            config.databaseId,
            config.tasksCollectionId,
            [Query.equal('userId', currentUser.accountID)]
        );
    } catch (error) {
        console.error('Get tasks error:', error);
        throw error;
    }
};
export const updateTask = async (taskId, taskData) => {
    try {
        return await databases.updateDocument(
            config.databaseId,
            config.tasksCollectionId,
            taskId,
            {
                ...taskData,
                updatedAt: new Date().toISOString()
            }
        );
    } catch (error) {
        console.error('Update task error:', error);
        throw error;
    }
};
export const deleteTask = async (taskId) => {
    try {
        await databases.deleteDocument(
            config.databaseId,
            config.tasksCollectionId,
            taskId
        );
        return true;
    } catch (error) {
        console.error('Delete task error:', error);
        throw error;
    }
};

// for dayschedule task //
export const createScheduleTask = async (taskData) => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || !currentUser.accountID) {
            throw new Error('User not found or not authenticated');
        }

        return await databases.createDocument(
            config.databaseId,
            config.scheduleCollectionId,
            ID.unique(),
            {
                userId: currentUser.accountID,
                date: taskData.date,
                timeSlot: taskData.timeSlot,
                task: taskData.task,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        );
    } catch (error) {
        console.error('Create schedule task error:', error);
        throw error;
    }
};
export const getScheduleTasks = async (date) => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || !currentUser.accountID) {
            throw new Error('User not found or not authenticated');
        }

        return await databases.listDocuments(
            config.databaseId,
            config.scheduleCollectionId,
            [
                Query.equal('userId', currentUser.accountID),
                Query.equal('date', date)
            ]
        );
    } catch (error) {
        console.error('Get schedule tasks error:', error);
        throw error;
    }
};
export const updateScheduleTask = async (taskId, taskData) => {
    try {
        return await databases.updateDocument(
            config.databaseId,
            config.scheduleCollectionId,
            taskId,
            {
                ...taskData,
                updatedAt: new Date().toISOString()
            }
        );
    } catch (error) {
        console.error('Update schedule task error:', error);
        throw error;
    }
};
export const deleteScheduleTask = async (taskId) => {
    try {
        await databases.deleteDocument(
            config.databaseId,
            config.scheduleCollectionId,
            taskId
        );
        return true;
    } catch (error) {
        console.error('Delete schedule task error:', error);
        throw error;
    }
};

// for schedul task//
export const createCalendarEvent = async (eventData) => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || !currentUser.accountID) throw new Error('User not authenticated');

        const response = await databases.createDocument(
            config.databaseId,
            config.calendarEventsCollectionId,
            ID.unique(),
            {
                userId: currentUser.accountID,  // Changed from currentUser.$id to currentUser.accountID
                title: eventData.title,
                description: eventData.description,
                date: eventData.date,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        );
        return response;
    } catch (error) {
        console.error('Create calendar event error:', error);
        throw error;
    }
};
export const getCalendarEvents = async () => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || !currentUser.accountID) throw new Error('User not authenticated');

        return await databases.listDocuments(
            config.databaseId,
            config.calendarEventsCollectionId,
            [
                Query.equal('userId', currentUser.accountID)  // Changed from [currentUser.$id] to currentUser.accountID
            ]
        );
    } catch (error) {
        console.error('Get calendar events error:', error);
        throw error;
    }
};
export const updateCalendarEvent = async (eventId, eventData) => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || !currentUser.accountID) throw new Error('User not authenticated');

        return await databases.updateDocument(
            config.databaseId,
            config.calendarEventsCollectionId,
            eventId,
            {
                title: eventData.title,
                description: eventData.description,
                date: eventData.date,
                updatedAt: new Date().toISOString()
            }
        );
    } catch (error) {
        console.error('Update calendar event error:', error);
        throw error;
    }
};
export const deleteCalendarEvent = async (eventId) => {
    try {
        await databases.deleteDocument(
            config.databaseId,
            config.calendarEventsCollectionId,
            eventId
        );
        return true;
    } catch (error) {
        console.error('Delete calendar event error:', error);
        throw error;
    }
};

// Display in Reminder //
// For Daily Tasks
export const getDailyTasks = async () => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || !currentUser.accountID) {
            throw new Error('User not found or not authenticated');
        }

        return await databases.listDocuments(
            config.databaseId,
            config.tasksCollectionId,
            [
                Query.equal('userId', currentUser.accountID),
                Query.orderAsc('createdAt')
            ]
        );
    } catch (error) {
        console.error('Get daily tasks error:', error);
        throw error;
    }
};

// For Goals
export const createGoal = async (goalData) => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || !currentUser.accountID) {
            throw new Error('User not found or not authenticated');
        }

        return await databases.createDocument(
            config.databaseId,
            config.goalsCollectionId,
            ID.unique(),
            {
                userId: currentUser.accountID,
                title: goalData.title,
                description: goalData.description,
                deadline: goalData.deadline,
                status: goalData.status || 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        );
    } catch (error) {
        console.error('Create goal error:', error);
        throw error;
    }
};
export const getGoals = async () => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || !currentUser.accountID) {
            throw new Error('User not found or not authenticated');
        }

        return await databases.listDocuments(
            config.databaseId,
            config.goalsCollectionId,
            [
                Query.equal('userId', currentUser.accountID),
                Query.orderAsc('deadline')
            ]
        );
    } catch (error) {
        console.error('Get goals error:', error);
        throw error;
    }
};
export const updateGoal = async (goalId, goalData) => {
    try {
        return await databases.updateDocument(
            config.databaseId,
            config.goalsCollectionId,
            goalId,
            {
                ...goalData,
                updatedAt: new Date().toISOString()
            }
        );
    } catch (error) {
        console.error('Update goal error:', error);
        throw error;
    }
};
export const deleteGoal = async (goalId) => {
    try {
        await databases.deleteDocument(
            config.databaseId,
            config.goalsCollectionId,
            goalId
        );
        return true;
    } catch (error) {
        console.error('Delete goal error:', error);
        throw error;
    }
};
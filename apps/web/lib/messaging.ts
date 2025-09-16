import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase client
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Message types
export interface Message {
  id?: string;
  orgId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  content: string;
  timestamp: Timestamp | Date;
  type: 'text' | 'system' | 'notification';
  channelId?: string; // For future channel support
  replyTo?: string; // For threading
  edited?: boolean;
  editedAt?: Timestamp | Date;
}

export interface MessageChannel {
  id?: string;
  orgId: string;
  name: string;
  description?: string;
  type: 'general' | 'team' | 'project' | 'private';
  members: string[]; // User IDs
  createdBy: string;
  createdAt: Timestamp | Date;
  lastActivity: Timestamp | Date;
}

class MessagingService {
  private messaging: Messaging | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (typeof window === 'undefined' || this.isInitialized) return;

    try {
      this.messaging = getMessaging(app);
      this.isInitialized = true;
      console.log('Firebase Messaging initialized');
    } catch (error) {
      console.error('Failed to initialize Firebase Messaging:', error);
    }
  }

  async requestPermission(): Promise<string | null> {
    if (!this.messaging) await this.initialize();
    if (!this.messaging) return null;

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(this.messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });
        console.log('FCM Token:', token);
        return token;
      }
      return null;
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      return null;
    }
  }

  onMessage(callback: (payload: any) => void): void {
    if (!this.messaging) return;
    onMessage(this.messaging, callback);
  }

  // Send a message to the team chat
  async sendMessage(orgId: string, senderId: string, senderName: string, senderEmail: string, content: string, channelId = 'general'): Promise<string | null> {
    try {
      const messageData: Omit<Message, 'id'> = {
        orgId,
        senderId,
        senderName,
        senderEmail,
        content: content.trim(),
        timestamp: serverTimestamp() as Timestamp,
        type: 'text',
        channelId,
      };

      const docRef = await addDoc(collection(db, 'messages'), messageData);
      console.log('Message sent:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Failed to send message:', error);
      return null;
    }
  }

  // Listen to messages for an organization
  subscribeToMessages(orgId: string, channelId = 'general', callback: (messages: Message[]) => void): () => void {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('orgId', '==', orgId),
      where('channelId', '==', channelId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const messages: Message[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      
      // Reverse to show oldest first
      callback(messages.reverse());
    });
  }

  // Edit a message
  async editMessage(messageId: string, newContent: string): Promise<boolean> {
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'messages', messageId), {
        content: newContent.trim(),
        edited: true,
        editedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error('Failed to edit message:', error);
      return false;
    }
  }

  // Delete a message
  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'messages', messageId));
      return true;
    } catch (error) {
      console.error('Failed to delete message:', error);
      return false;
    }
  }

  // Create a new channel
  async createChannel(orgId: string, createdBy: string, name: string, description?: string, type: 'general' | 'team' | 'project' | 'private' = 'team'): Promise<string | null> {
    try {
      const channelData: Omit<MessageChannel, 'id'> = {
        orgId,
        name: name.trim(),
        description: description?.trim(),
        type,
        members: [createdBy],
        createdBy,
        createdAt: serverTimestamp() as Timestamp,
        lastActivity: serverTimestamp() as Timestamp,
      };

      const docRef = await addDoc(collection(db, 'channels'), channelData);
      console.log('Channel created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Failed to create channel:', error);
      return null;
    }
  }

  // Get channels for an organization
  subscribeToChannels(orgId: string, userId: string, callback: (channels: MessageChannel[]) => void): () => void {
    const channelsRef = collection(db, 'channels');
    const q = query(
      channelsRef,
      where('orgId', '==', orgId),
      where('members', 'array-contains', userId),
      orderBy('lastActivity', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const channels: MessageChannel[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as MessageChannel[];
      
      callback(channels);
    });
  }

  // Send system notification (member joined, etc.)
  async sendSystemMessage(orgId: string, content: string, channelId = 'general'): Promise<string | null> {
    try {
      const messageData: Omit<Message, 'id'> = {
        orgId,
        senderId: 'system',
        senderName: 'System',
        senderEmail: '',
        content: content.trim(),
        timestamp: serverTimestamp() as Timestamp,
        type: 'system',
        channelId,
      };

      const docRef = await addDoc(collection(db, 'messages'), messageData);
      return docRef.id;
    } catch (error) {
      console.error('Failed to send system message:', error);
      return null;
    }
  }
}

export const messagingService = new MessagingService();

// Initialize messaging when the module loads (browser only)
if (typeof window !== 'undefined') {
  messagingService.initialize();
}
import express from 'express';
import OpenAI from 'openai';
import { db } from '../db';
import { 
  toolSessions, 
  fileStorage, 
  desktopFolders, 
  desktopFiles, 
  notifications,
  insertDesktopFolderSchema, 
  insertDesktopFileSchema,
  insertNotificationSchema,
  type Notification
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { ObjectStorageService } from '../objectStorage';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const objectStorage = new ObjectStorageService();

// AI Chat endpoint with file generation capability
router.post('/chat', async (req, res) => {
  try {
    const { message, systemPrompt, agentType } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt + `

          IMPORTANT: When creating files, respond with JSON in this exact format:
          {
            "content": "Your helpful response text",
            "fileData": {
              "type": "document|calculator",
              "title": "File Title",
              "documentType": "sop|formulation|compliance",
              "calculatorType": "qc|extraction|margin",
              "content": "File content here",
              "inputs": {},
              "outputs": {}
            }
          }
          
          Only include fileData if you're creating a file. Otherwise just return: {"content": "response text"}
          `
        },
        {
          role: "user",
          content: message
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0].message.content;
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      responseData = {
        content: responseText || "I apologize, but I encountered an error processing your request."
      };
    }

    res.json(responseData);
    
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI response',
      content: 'I apologize, but I encountered an error processing your request. Please try again.'
    });
  }
});

// Tool sessions CRUD operations
router.get('/sessions', async (req, res) => {
  try {
    const userId = (req as any).user?.id || 'demo-user';
    
    const sessions = await db
      .select()
      .from(toolSessions)
      .where(eq(toolSessions.userId, userId))
      .orderBy(toolSessions.lastActive);
    
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

router.post('/sessions', async (req, res) => {
  try {
    const userId = (req as any).user?.id || 'demo-user';
    const sessionData = {
      ...req.body,
      userId,
    };
    
    const [session] = await db
      .insert(toolSessions)
      .values(sessionData)
      .returning();
    
    res.json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

router.put('/sessions/:id', async (req, res) => {
  try {
    const userId = (req as any).user?.id || 'demo-user';
    const sessionId = req.params.id;
    
    const [session] = await db
      .update(toolSessions)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(eq(toolSessions.id, sessionId))
      .returning();
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

router.delete('/sessions/:id', async (req, res) => {
  try {
    const sessionId = req.params.id;
    
    // Delete associated files first
    await db
      .delete(fileStorage)
      .where(eq(fileStorage.sessionId, sessionId));
    
    // Delete session
    await db
      .delete(toolSessions)
      .where(eq(toolSessions.id, sessionId));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// File storage operations
router.post('/files', async (req, res) => {
  try {
    const userId = (req as any).user?.id || 'demo-user';
    const fileData = {
      ...req.body,
      userId,
    };
    
    const [file] = await db
      .insert(fileStorage)
      .values(fileData)
      .returning();
    
    res.json(file);
  } catch (error) {
    console.error('Error creating file:', error);
    res.status(500).json({ error: 'Failed to create file' });
  }
});

router.get('/files/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    
    const files = await db
      .select()
      .from(fileStorage)
      .where(eq(fileStorage.sessionId, sessionId))
      .orderBy(fileStorage.createdAt);
    
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Multiple file upload endpoint for desktop drag and drop
router.post('/files', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const userId = (req as any).user?.id || 'demo-user';
    const uploadedFiles = [];

    for (const file of req.files) {
      // Generate upload URL
      const uploadUrl = await objectStorage.getFileUploadURL(file.originalname, file.mimetype);
      
      // Upload file to object storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file.buffer,
        headers: {
          'Content-Type': file.mimetype,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file ${file.originalname} to object storage`);
      }

      // Extract object path from upload URL
      const url = new URL(uploadUrl);
      const objectPath = url.pathname;

      // Create desktop file record
      const fileData = {
        userId,
        fileName: file.originalname,
        fileType: file.originalname.split('.').pop() || 'unknown',
        mimeType: file.mimetype,
        folderId: req.body.folderId ? parseInt(req.body.folderId) : null,
        position: { 
          x: 100 + Math.random() * 200, 
          y: 150 + Math.random() * 200 
        },
        objectStoragePath: objectPath,
        size: file.size,
      };

      const [fileRecord] = await db
        .insert(desktopFiles)
        .values(fileData)
        .returning();

      uploadedFiles.push(fileRecord);
    }

    res.json({
      success: true,
      files: uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`
    });
  } catch (error) {
    console.error('Multiple file upload error:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Single file upload endpoint (legacy)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = (req as any).user?.id || 'demo-user';
    const file = req.file;
    
    // Generate upload URL
    const uploadUrl = await objectStorage.getFileUploadURL(file.originalname, file.mimetype);
    
    // Upload file to object storage
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file.buffer,
      headers: {
        'Content-Type': file.mimetype,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file to object storage');
    }

    // Extract object path from upload URL
    const url = new URL(uploadUrl);
    const objectPath = url.pathname;

    // Create file record in database
    const fileData = {
      sessionId: req.body.sessionId || 'standalone',
      userId,
      fileName: file.originalname,
      fileType: file.originalname.split('.').pop() || 'unknown',
      mimeType: file.mimetype,
      objectStoragePath: objectPath,
      size: file.size,
      metadata: {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
      },
    };

    const [fileRecord] = await db
      .insert(fileStorage)
      .values(fileData)
      .returning();

    res.json({
      success: true,
      file: fileRecord,
      objectPath,
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// File download endpoint
router.get('/files/:fileId/download', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    
    const [file] = await db
      .select()
      .from(fileStorage)
      .where(eq(fileStorage.id, fileId));
    
    if (!file || !file.objectStoragePath) {
      return res.status(404).json({ error: 'File not found' });
    }

    const objectFile = await objectStorage.getFile(file.objectStoragePath);
    await objectStorage.downloadFile(objectFile, res);
    
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// File content endpoint (for viewers)
router.get('/files/:fileId/content', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    
    const [file] = await db
      .select()
      .from(fileStorage)
      .where(eq(fileStorage.id, fileId));
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.content) {
      // Return text content directly
      res.json({ content: file.content, type: 'text' });
    } else if (file.objectStoragePath) {
      // Get content from object storage
      const buffer = await objectStorage.getFileContent(file.objectStoragePath);
      
      // Handle different file types
      if (file.mimeType?.startsWith('text/') || file.fileType === 'json') {
        res.json({ content: buffer.toString('utf-8'), type: 'text' });
      } else if (file.mimeType?.startsWith('image/')) {
        res.json({ 
          content: buffer.toString('base64'), 
          type: 'image',
          mimeType: file.mimeType 
        });
      } else {
        res.json({ 
          content: buffer.toString('base64'), 
          type: 'binary',
          mimeType: file.mimeType 
        });
      }
    } else {
      res.status(404).json({ error: 'File content not available' });
    }
    
  } catch (error) {
    console.error('File content error:', error);
    res.status(500).json({ error: 'Failed to get file content' });
  }
});

// DESKTOP FOLDER MANAGEMENT ENDPOINTS

// Get all folders for a user
router.get('/folders', async (req, res) => {
  try {
    const userId = (req as any).user?.claims?.sub || 'demo-user';
    
    const folders = await db
      .select()
      .from(desktopFolders)
      .where(eq(desktopFolders.userId, userId))
      .orderBy(desktopFolders.createdAt);
    
    res.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Create a new folder
router.post('/folders', async (req, res) => {
  try {
    const userId = (req as any).user?.claims?.sub || 'demo-user';
    const folderData = insertDesktopFolderSchema.parse({
      ...req.body,
      userId,
    });
    
    const [folder] = await db
      .insert(desktopFolders)
      .values(folderData)
      .returning();
    
    res.json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Update folder
router.patch('/folders/:folderId', async (req, res) => {
  try {
    const userId = (req as any).user?.claims?.sub || 'demo-user';
    const folderId = parseInt(req.params.folderId);
    
    const [folder] = await db
      .update(desktopFolders)
      .set({ ...req.body, updatedAt: new Date() })
      .where(and(eq(desktopFolders.id, folderId), eq(desktopFolders.userId, userId)))
      .returning();
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    res.json(folder);
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

// Delete folder
router.delete('/folders/:folderId', async (req, res) => {
  try {
    const userId = (req as any).user?.claims?.sub || 'demo-user';
    const folderId = parseInt(req.params.folderId);
    
    // Move files from this folder to desktop root (folderId = null)
    await db
      .update(desktopFiles)
      .set({ folderId: null })
      .where(eq(desktopFiles.folderId, folderId));
    
    // Delete the folder
    const [deletedFolder] = await db
      .delete(desktopFolders)
      .where(and(eq(desktopFolders.id, folderId), eq(desktopFolders.userId, userId)))
      .returning();
    
    if (!deletedFolder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    res.json({ success: true, folder: deletedFolder });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// Get files in a folder or on desktop root
router.get('/desktop-files', async (req, res) => {
  try {
    const userId = (req as any).user?.claims?.sub || 'demo-user';
    const folderId = req.query.folderId ? parseInt(req.query.folderId as string) : null;
    
    const files = await db
      .select()
      .from(desktopFiles)
      .where(and(
        eq(desktopFiles.userId, userId),
        folderId ? eq(desktopFiles.folderId, folderId) : eq(desktopFiles.folderId, null)
      ))
      .orderBy(desktopFiles.createdAt);
    
    res.json(files);
  } catch (error) {
    console.error('Error fetching desktop files:', error);
    res.status(500).json({ error: 'Failed to fetch desktop files' });
  }
});

// Create a desktop file
router.post('/desktop-files', async (req, res) => {
  try {
    const userId = (req as any).user?.claims?.sub || 'demo-user';
    const fileData = insertDesktopFileSchema.parse({
      ...req.body,
      userId,
    });
    
    const [file] = await db
      .insert(desktopFiles)
      .values(fileData)
      .returning();
    
    res.json(file);
  } catch (error) {
    console.error('Error creating desktop file:', error);
    res.status(500).json({ error: 'Failed to create desktop file' });
  }
});

// Update desktop file position or move between folders
router.patch('/desktop-files/:fileId', async (req, res) => {
  try {
    const userId = (req as any).user?.claims?.sub || 'demo-user';
    const fileId = parseInt(req.params.fileId);
    
    const [file] = await db
      .update(desktopFiles)
      .set({ ...req.body, updatedAt: new Date() })
      .where(and(eq(desktopFiles.id, fileId), eq(desktopFiles.userId, userId)))
      .returning();
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json(file);
  } catch (error) {
    console.error('Error updating desktop file:', error);
    res.status(500).json({ error: 'Failed to update desktop file' });
  }
});

// Delete desktop file
router.delete('/desktop-files/:fileId', async (req, res) => {
  try {
    const userId = (req as any).user?.claims?.sub || 'demo-user';
    const fileId = parseInt(req.params.fileId);
    
    const [deletedFile] = await db
      .delete(desktopFiles)
      .where(and(eq(desktopFiles.id, fileId), eq(desktopFiles.userId, userId)))
      .returning();
    
    if (!deletedFile) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json({ success: true, file: deletedFile });
  } catch (error) {
    console.error('Error deleting desktop file:', error);
    res.status(500).json({ error: 'Failed to delete desktop file' });
  }
});

// Get folder context (all files and subfolders)
router.get('/folders/:folderId/context', async (req, res) => {
  try {
    const userId = (req as any).user?.claims?.sub || 'demo-user';
    const folderId = parseInt(req.params.folderId);
    
    // Get folder details
    const [folder] = await db
      .select()
      .from(desktopFolders)
      .where(and(eq(desktopFolders.id, folderId), eq(desktopFolders.userId, userId)));
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    // Get all files in the folder
    const files = await db
      .select()
      .from(desktopFiles)
      .where(eq(desktopFiles.folderId, folderId));
    
    // Get subfolders
    const subfolders = await db
      .select()
      .from(desktopFolders)
      .where(eq(desktopFolders.parentFolderId, folderId));
    
    res.json({
      folder,
      files,
      subfolders,
      context: {
        totalFiles: files.length,
        fileTypes: Array.from(new Set(files.map(f => f.fileType))),
        lastModified: files.length > 0 ? Math.max(...files.map(f => new Date(f.updatedAt || f.createdAt).getTime())) : null,
      }
    });
  } catch (error) {
    console.error('Error fetching folder context:', error);
    res.status(500).json({ error: 'Failed to fetch folder context' });
  }
});

// NOTIFICATION ENDPOINTS

// Get all notifications for a user
router.get('/notifications', async (req, res) => {
  try {
    const userId = (req as any).user?.claims?.sub || 'demo-user';
    
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(notifications.createdAt);
    
    res.json(userNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Create a new notification
router.post('/notifications', async (req, res) => {
  try {
    const userId = (req as any).user?.claims?.sub || 'demo-user';
    const notificationData = insertNotificationSchema.parse({
      ...req.body,
      userId,
    });
    
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    
    res.json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Mark notification as read
router.patch('/notifications/:notificationId/read', async (req, res) => {
  try {
    const userId = (req as any).user?.claims?.sub || 'demo-user';
    const notificationId = parseInt(req.params.notificationId);
    
    const [notification] = await db
      .update(notifications)
      .set({ 
        isRead: true,
        readAt: new Date()
      })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ))
      .returning();
      
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.patch('/notifications/mark-all-read', async (req, res) => {
  try {
    const userId = (req as any).user?.claims?.sub || 'demo-user';
    
    const updatedNotifications = await db
      .update(notifications)
      .set({ 
        isRead: true,
        readAt: new Date()
      })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ))
      .returning();
    
    res.json({ message: `Marked ${updatedNotifications.length} notifications as read` });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/notifications/:notificationId', async (req, res) => {
  try {
    const userId = (req as any).user?.claims?.sub || 'demo-user';
    const notificationId = parseInt(req.params.notificationId);
    
    const [notification] = await db
      .delete(notifications)
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ))
      .returning();
      
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;
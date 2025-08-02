import express from 'express';
import OpenAI from 'openai';
import { db } from '../db';
import { toolSessions, fileStorage } from '@shared/schema';
import { eq } from 'drizzle-orm';
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

// File upload endpoint
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

export default router;
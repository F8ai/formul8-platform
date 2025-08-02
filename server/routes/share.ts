import express from 'express';
import multer from 'multer';
import { db } from '../db';
import { fileStorage } from '@shared/schema';
import { ObjectStorageService } from '../objectStorage';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const objectStorage = new ObjectStorageService();

// Handle shared files and data from iOS/Android share sheets
router.post('/share', upload.array('files'), async (req, res) => {
  try {
    const { title, text, url } = req.body;
    const files = req.files as Express.Multer.File[];
    const userId = (req as any).user?.id || 'demo-user';
    
    const results = {
      sharedData: { title, text, url },
      uploadedFiles: []
    };

    // Handle shared files
    if (files && files.length > 0) {
      for (const file of files) {
        try {
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
          const uploadUrlObj = new URL(uploadUrl);
          const objectPath = uploadUrlObj.pathname;

          // Create file record in database
          const fileData = {
            sessionId: 'shared-files',
            userId,
            fileName: file.originalname,
            fileType: file.originalname.split('.').pop() || 'unknown',
            mimeType: file.mimetype,
            objectStoragePath: objectPath,
            size: file.size,
            metadata: {
              originalName: file.originalname,
              uploadedAt: new Date().toISOString(),
              sharedFrom: 'ios-share-sheet',
              sharedData: { title, text, url }
            },
          };

          const [fileRecord] = await db
            .insert(fileStorage)
            .values(fileData)
            .returning();

          results.uploadedFiles.push(fileRecord);
        } catch (error) {
          console.error('Error uploading shared file:', error);
        }
      }
    }

    // Handle shared text/URL data
    if (title || text || url) {
      // Create a text file with the shared content
      const content = [
        title && `Title: ${title}`,
        text && `Text: ${text}`,
        url && `URL: ${url}`
      ].filter(Boolean).join('\n\n');

      if (content) {
        const fileName = `shared-content-${Date.now()}.txt`;
        const buffer = Buffer.from(content, 'utf-8');
        
        try {
          const uploadUrl = await objectStorage.getFileUploadURL(fileName, 'text/plain');
          
          const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            body: buffer,
            headers: {
              'Content-Type': 'text/plain',
            },
          });

          if (uploadResponse.ok) {
            const uploadUrlObj = new URL(uploadUrl);
            const objectPath = uploadUrlObj.pathname;

            const fileData = {
              sessionId: 'shared-content',
              userId,
              fileName,
              fileType: 'txt',
              mimeType: 'text/plain',
              objectStoragePath: objectPath,
              size: buffer.length,
              content,
              metadata: {
                uploadedAt: new Date().toISOString(),
                sharedFrom: 'share-sheet',
                originalData: { title, text, url }
              },
            };

            const [fileRecord] = await db
              .insert(fileStorage)
              .values(fileData)
              .returning();

            results.uploadedFiles.push(fileRecord);
          }
        } catch (error) {
          console.error('Error creating shared content file:', error);
        }
      }
    }

    // Redirect to workspace with success message
    const successMessage = encodeURIComponent(
      `Successfully imported ${results.uploadedFiles.length} item(s) from share sheet`
    );
    
    res.redirect(`/workspace?share_success=${successMessage}`);
    
  } catch (error) {
    console.error('Share handling error:', error);
    res.redirect('/workspace?share_error=Failed to process shared content');
  }
});

// Handle file protocol handlers
router.get('/file', async (req, res) => {
  // Handle file protocol associations
  res.redirect('/workspace?file_handler=true');
});

// Handle custom protocol
router.get('/handle', async (req, res) => {
  const data = req.query.data;
  res.redirect(`/workspace?protocol_data=${encodeURIComponent(data as string)}`);
});

export default router;
import type { Express } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { storage } from "../storage";
import { db } from "../db";
import { spreadsheets, spreadsheetTemplates, userArtifacts, insertSpreadsheetSchema, insertSpreadsheetTemplateSchema } from "@shared/schema";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export function registerSpreadsheetRoutes(app: Express) {
  // Get all spreadsheets for user - Using storage interface
  app.get("/api/spreadsheets", async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || "anonymous";
      // Note: Need to add getUserSpreadsheets method to storage interface
      const userSpreadsheets = []; // Temporary - will implement storage method
      
      res.json(userSpreadsheets);
    } catch (error) {
      console.error("Error fetching spreadsheets:", error);
      res.status(500).json({ error: "Failed to fetch spreadsheets" });
    }
  });

  // Get specific spreadsheet
  app.get("/api/spreadsheets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.claims?.sub || "anonymous";
      
      const spreadsheet = await db
        .select()
        .from(spreadsheets)
        .where(eq(spreadsheets.id, id))
        .limit(1);
      
      if (!spreadsheet.length || spreadsheet[0].userId !== userId) {
        return res.status(404).json({ error: "Spreadsheet not found" });
      }
      
      res.json(spreadsheet[0]);
    } catch (error) {
      console.error("Error fetching spreadsheet:", error);
      res.status(500).json({ error: "Failed to fetch spreadsheet" });
    }
  });

  // Create new spreadsheet
  app.post("/api/spreadsheets", async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || "anonymous";
      const data = insertSpreadsheetSchema.parse({
        ...req.body,
        userId,
      });

      const [newSpreadsheet] = await db
        .insert(spreadsheets)
        .values(data)
        .returning();

      // Also create a corresponding artifact for desktop display
      await db.insert(userArtifacts).values({
        userId,
        title: data.title,
        description: data.description || `Spreadsheet: ${data.title}`,
        type: "spreadsheet",
        category: "data",
        content: {
          spreadsheetId: newSpreadsheet.id,
          type: "spreadsheet",
          sheetData: data.sheetData
        },
        metadata: {
          spreadsheetId: newSpreadsheet.id,
          rows: data.rows,
          cols: data.cols,
          ...data.metadata
        }
      });

      res.json(newSpreadsheet);
    } catch (error) {
      console.error("Error creating spreadsheet:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid spreadsheet data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create spreadsheet" });
    }
  });

  // Update spreadsheet
  app.put("/api/spreadsheets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.claims?.sub || "anonymous";
      
      // Check ownership
      const existing = await db
        .select()
        .from(spreadsheets)
        .where(eq(spreadsheets.id, id))
        .limit(1);
        
      if (!existing.length || existing[0].userId !== userId) {
        return res.status(404).json({ error: "Spreadsheet not found" });
      }

      const updateData = insertSpreadsheetSchema.partial().parse(req.body);
      
      const [updated] = await db
        .update(spreadsheets)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(spreadsheets.id, id))
        .returning();

      // Update corresponding artifact
      if (updated.artifactId) {
        await db
          .update(userArtifacts)
          .set({
            title: updated.title,
            content: {
              spreadsheetId: updated.id,
              type: "spreadsheet",
              sheetData: updated.sheetData
            },
            metadata: {
              spreadsheetId: updated.id,
              rows: updated.rows,
              cols: updated.cols,
              ...updated.metadata
            },
            updatedAt: new Date()
          })
          .where(eq(userArtifacts.id, updated.artifactId));
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating spreadsheet:", error);
      res.status(500).json({ error: "Failed to update spreadsheet" });
    }
  });

  // Delete spreadsheet
  app.delete("/api/spreadsheets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.claims?.sub || "anonymous";
      
      const existing = await db
        .select()
        .from(spreadsheets)
        .where(eq(spreadsheets.id, id))
        .limit(1);
        
      if (!existing.length || existing[0].userId !== userId) {
        return res.status(404).json({ error: "Spreadsheet not found" });
      }

      await db.delete(spreadsheets).where(eq(spreadsheets.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting spreadsheet:", error);
      res.status(500).json({ error: "Failed to delete spreadsheet" });
    }
  });

  // Get all spreadsheet templates
  app.get("/api/spreadsheet-templates", async (req, res) => {
    try {
      const templates = await db
        .select()
        .from(spreadsheetTemplates)
        .where(eq(spreadsheetTemplates.isPublic, true))
        .orderBy(spreadsheetTemplates.category, spreadsheetTemplates.name);
      
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  // Create spreadsheet from template
  app.post("/api/spreadsheets/from-template/:templateId", async (req, res) => {
    try {
      const templateId = parseInt(req.params.templateId);
      const userId = req.user?.claims?.sub || "anonymous";
      const { title } = req.body;

      const template = await db
        .select()
        .from(spreadsheetTemplates)
        .where(eq(spreadsheetTemplates.id, templateId))
        .limit(1);

      if (!template.length) {
        return res.status(404).json({ error: "Template not found" });
      }

      const templateData = template[0];
      
      // Create spreadsheet from template
      const spreadsheetData = {
        userId,
        title: title || `${templateData.name} - Copy`,
        description: templateData.description,
        sheetData: templateData.defaultData || [],
        template: templateData.name,
        metadata: {
          templateId: templateData.id,
          templateCategory: templateData.category,
          features: templateData.features
        }
      };

      const [newSpreadsheet] = await db
        .insert(spreadsheets)
        .values(spreadsheetData)
        .returning();

      // Update template usage count
      await db
        .update(spreadsheetTemplates)
        .set({ usageCount: templateData.usageCount + 1 })
        .where(eq(spreadsheetTemplates.id, templateId));

      res.json(newSpreadsheet);
    } catch (error) {
      console.error("Error creating spreadsheet from template:", error);
      res.status(500).json({ error: "Failed to create spreadsheet from template" });
    }
  });

  // AI-powered spreadsheet generation
  app.post("/api/spreadsheets/generate", async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || "anonymous";
      const { prompt, category = "general", includeFormulas = true } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // Generate spreadsheet using OpenAI
      const systemPrompt = `You are an expert spreadsheet creator specializing in cannabis industry data management. Create a comprehensive, professional spreadsheet based on the user's request.

Guidelines:
1. Return a JSON object with this exact structure:
{
  "title": "Spreadsheet Title",
  "description": "Brief description",
  "worksheets": [
    {
      "name": "Sheet1",
      "data": [
        [{"value": "Header1", "type": "text"}, {"value": "Header2", "type": "text"}],
        [{"value": "Data1", "type": "text"}, {"value": 100, "type": "number"}]
      ],
      "columns": 10,
      "rows": 50
    }
  ],
  "metadata": {
    "category": "formulation|compliance|inventory|finance|testing|general",
    "industry": "cannabis",
    "features": ["formulas", "validation", "charts"]
  }
}

2. Cell types: "text", "number", "date", "currency", "percentage"
3. Include realistic cannabis industry data (strains, potencies, lab results, compliance tracking, etc.)
4. Add formulas where appropriate (start with =, like "=SUM(B2:B10)")
5. Create professional headers and organize data logically
6. Include at least 20-30 rows of sample data
7. Use cannabis-specific terminology and units (mg/g, THC%, CBD%, batch numbers, etc.)
8. For compliance sheets: include testing dates, license numbers, regulatory fields
9. For formulation sheets: include ingredient percentages, potency calculations, cost analysis
10. For inventory sheets: include strain names, quantities, expiration dates, locations

Categories:
- formulation: Recipe development, ingredient mixing, potency calculations
- compliance: Regulatory tracking, testing results, license management  
- inventory: Stock management, strain tracking, expiration monitoring
- finance: Cost analysis, pricing, revenue tracking
- testing: Lab results, quality control, batch testing
- general: Any other cannabis business needs`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a ${category} spreadsheet: ${prompt}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const generatedData = JSON.parse(completion.choices[0].message.content);
      
      // Create the spreadsheet
      const spreadsheetData = {
        userId,
        title: generatedData.title,
        description: generatedData.description,
        sheetData: generatedData.worksheets || [],
        rows: generatedData.worksheets?.[0]?.rows || 50,
        cols: generatedData.worksheets?.[0]?.columns || 10,
        agentGenerated: true,
        metadata: {
          ...generatedData.metadata,
          generatedFrom: prompt,
          generatedAt: new Date().toISOString()
        }
      };

      const [newSpreadsheet] = await db
        .insert(spreadsheets)
        .values(spreadsheetData)
        .returning();

      // Create corresponding artifact
      await db.insert(userArtifacts).values({
        userId,
        title: spreadsheetData.title,
        description: spreadsheetData.description,
        type: "spreadsheet", 
        category: generatedData.metadata?.category || "general",
        content: {
          spreadsheetId: newSpreadsheet.id,
          type: "spreadsheet",
          sheetData: spreadsheetData.sheetData
        },
        agentGenerated: true,
        metadata: {
          spreadsheetId: newSpreadsheet.id,
          ...spreadsheetData.metadata
        }
      });

      res.json(newSpreadsheet);
    } catch (error) {
      console.error("Error generating spreadsheet:", error);
      res.status(500).json({ error: "Failed to generate spreadsheet" });
    }
  });

  // AI analysis of spreadsheet data
  app.post("/api/spreadsheets/:id/analyze", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.claims?.sub || "anonymous";
      const { question } = req.body;

      const spreadsheet = await db
        .select()
        .from(spreadsheets)
        .where(eq(spreadsheets.id, id))
        .limit(1);

      if (!spreadsheet.length || spreadsheet[0].userId !== userId) {
        return res.status(404).json({ error: "Spreadsheet not found" });
      }

      const sheet = spreadsheet[0];
      
      // Prepare data for analysis
      const dataForAnalysis = JSON.stringify(sheet.sheetData, null, 2);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system", 
            content: `You are a cannabis industry data analyst. Analyze the provided spreadsheet data and answer questions about it. Focus on cannabis-specific insights like potency trends, compliance status, formulation effectiveness, inventory levels, etc.

Provide clear, actionable insights with specific numbers and recommendations where applicable.`
          },
          {
            role: "user",
            content: `Analyze this spreadsheet data and answer: ${question}\n\nSpreadsheet: ${sheet.title}\nData: ${dataForAnalysis}`
          }
        ],
        temperature: 0.3,
      });

      res.json({
        analysis: completion.choices[0].message.content,
        spreadsheetTitle: sheet.title,
        question
      });
    } catch (error) {
      console.error("Error analyzing spreadsheet:", error);
      res.status(500).json({ error: "Failed to analyze spreadsheet" });
    }
  });

  // AI-powered data modification
  app.post("/api/spreadsheets/:id/modify", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.claims?.sub || "anonymous";
      const { instruction } = req.body;

      const spreadsheet = await db
        .select()
        .from(spreadsheets)
        .where(eq(spreadsheets.id, id))
        .limit(1);

      if (!spreadsheet.length || spreadsheet[0].userId !== userId) {
        return res.status(404).json({ error: "Spreadsheet not found" });
      }

      const sheet = spreadsheet[0];
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a spreadsheet modification expert. Modify the provided spreadsheet data according to the user's instructions. Return the modified data in the exact same JSON format.

Guidelines:
- Maintain the same structure but update values as requested
- Add new rows/columns if instructed
- Apply calculations, formulas, or data transformations
- Keep cannabis industry context and terminology
- Ensure data integrity and professional formatting`
          },
          {
            role: "user",
            content: `Modify this spreadsheet: ${instruction}\n\nCurrent data: ${JSON.stringify(sheet.sheetData, null, 2)}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const modifiedData = JSON.parse(completion.choices[0].message.content);
      
      // Update the spreadsheet
      const [updated] = await db
        .update(spreadsheets)
        .set({
          sheetData: modifiedData.sheetData || modifiedData.worksheets || modifiedData,
          updatedAt: new Date()
        })
        .where(eq(spreadsheets.id, id))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error modifying spreadsheet:", error);
      res.status(500).json({ error: "Failed to modify spreadsheet" });
    }
  });
}
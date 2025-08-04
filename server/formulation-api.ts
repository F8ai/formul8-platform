import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from './db.js';
import { ingredients } from '../shared/schema.js';
import { z } from 'zod';

const router = Router();

// Formulation calculation schema for LLM interaction
const FormulationRequestSchema = z.object({
  productName: z.string(),
  batchSize: z.number().positive(),
  servingSize: z.number().positive(),
  targetThc: z.number().nonnegative(),
  targetCbd: z.number().nonnegative(),
  ingredients: z.object({
    cannabinoid: z.object({
      name: z.string(),
      manufacturer: z.string().optional()
    }).optional(),
    carrierOil: z.object({
      name: z.string(),
      manufacturer: z.string().optional(),
      concentration: z.number().min(0).max(100).default(95)
    }).optional(),
    terpene: z.object({
      name: z.string(),
      manufacturer: z.string().optional(),
      concentration: z.number().min(0).max(10).default(2)
    }).optional(),
    flavoring: z.object({
      name: z.string(),
      manufacturer: z.string().optional(),
      concentration: z.number().min(0).max(5).default(1)
    }).optional()
  })
});

const OptimizationRequestSchema = z.object({
  formulation: FormulationRequestSchema,
  objectives: z.object({
    targetCost: z.number().positive().optional(),
    maxVariance: z.number().min(0).max(100).default(5), // % variance allowed
    preferredManufacturers: z.array(z.string()).optional(),
    prioritize: z.enum(['cost', 'quality', 'accuracy']).default('accuracy')
  })
});

interface CalculatedFormulation {
  productName: string;
  batchSize: number;
  servingSize: number;
  targetThc: number;
  targetCbd: number;
  servingsPerBatch: number;
  ingredients: {
    cannabinoid?: {
      ingredient: any;
      manufacturer?: string;
      requiredVolume: number;
      requiredMass: number;
      cost: number;
    };
    carrierOil?: {
      ingredient: any;
      manufacturer?: string;
      concentration: number;
      volume: number;
      mass: number;
      cost: number;
    };
    terpene?: {
      ingredient: any;
      manufacturer?: string;
      concentration: number;
      volume: number;
      mass: number;
      cost: number;
    };
    flavoring?: {
      ingredient: any;
      manufacturer?: string;
      concentration: number;
      volume: number;
      mass: number;
      cost: number;
    };
  };
  totals: {
    volume: number;
    mass: number;
    cost: number;
    costPerServing: number;
  };
  dosageVerification: {
    actualThc: number;
    actualCbd: number;
    thcVariance: number;
    cbdVariance: number;
    isWithinTolerance: boolean;
  };
  compliance: {
    withinStateLimits: boolean;
    labTestingRequired: boolean;
    childProofPackaging: boolean;
    warnings: string[];
  };
}

// Calculate formulation with full chemical accuracy
async function calculateFormulation(req: z.infer<typeof FormulationRequestSchema>): Promise<CalculatedFormulation> {
  const servingsPerBatch = req.batchSize / req.servingSize;
  const result: CalculatedFormulation = {
    ...req,
    servingsPerBatch,
    ingredients: {},
    totals: { volume: 0, mass: 0, cost: 0, costPerServing: 0 },
    dosageVerification: { 
      actualThc: 0, 
      actualCbd: 0, 
      thcVariance: 0, 
      cbdVariance: 0, 
      isWithinTolerance: false 
    },
    compliance: {
      withinStateLimits: true,
      labTestingRequired: true,
      childProofPackaging: true,
      warnings: []
    }
  };

  // Calculate cannabinoid requirements
  if (req.ingredients.cannabinoid) {
    const cannabinoidIngredient = await db.select()
      .from(ingredients)
      .where(eq(ingredients.name, req.ingredients.cannabinoid.name))
      .limit(1);

    if (cannabinoidIngredient.length > 0) {
      const ingredient = cannabinoidIngredient[0];
      const totalCannabinoids = (req.targetThc + req.targetCbd) * servingsPerBatch; // mg
      const potency = parseFloat(ingredient.potency?.toString() || '85') / 100;
      const density = parseFloat(ingredient.density?.toString() || '0.95');
      
      const requiredMass = (totalCannabinoids / 1000) / potency; // grams
      const requiredVolume = requiredMass / density; // ml
      const cost = requiredMass * parseFloat(ingredient.costPerUnit?.toString() || '12.5');

      result.ingredients.cannabinoid = {
        ingredient,
        manufacturer: req.ingredients.cannabinoid.manufacturer,
        requiredVolume,
        requiredMass,
        cost
      };

      // Calculate actual dosage
      result.dosageVerification.actualThc = (requiredMass * 1000 * potency) / servingsPerBatch;
      result.dosageVerification.thcVariance = ((result.dosageVerification.actualThc - req.targetThc) / req.targetThc) * 100;
    }
  }

  // Calculate carrier oil
  if (req.ingredients.carrierOil) {
    const carrierOilIngredient = await db.select()
      .from(ingredients)
      .where(eq(ingredients.name, req.ingredients.carrierOil.name))
      .limit(1);

    if (carrierOilIngredient.length > 0) {
      const ingredient = carrierOilIngredient[0];
      const concentration = req.ingredients.carrierOil.concentration;
      const volume = (req.batchSize * concentration) / 100;
      const density = parseFloat(ingredient.density?.toString() || '0.915');
      const mass = volume * density;
      const cost = volume * parseFloat(ingredient.costPerUnit?.toString() || '0.25');

      result.ingredients.carrierOil = {
        ingredient,
        manufacturer: req.ingredients.carrierOil.manufacturer,
        concentration,
        volume,
        mass,
        cost
      };
    }
  }

  // Calculate terpene
  if (req.ingredients.terpene) {
    const terpeneIngredient = await db.select()
      .from(ingredients)
      .where(eq(ingredients.name, req.ingredients.terpene.name))
      .limit(1);

    if (terpeneIngredient.length > 0) {
      const ingredient = terpeneIngredient[0];
      const concentration = req.ingredients.terpene.concentration;
      const volume = (req.batchSize * concentration) / 100;
      const density = parseFloat(ingredient.density?.toString() || '0.841');
      const mass = volume * density;
      const cost = volume * parseFloat(ingredient.costPerUnit?.toString() || '45.0');

      result.ingredients.terpene = {
        ingredient,
        manufacturer: req.ingredients.terpene.manufacturer,
        concentration,
        volume,
        mass,
        cost
      };
    }
  }

  // Calculate flavoring
  if (req.ingredients.flavoring) {
    const flavoringIngredient = await db.select()
      .from(ingredients)
      .where(eq(ingredients.name, req.ingredients.flavoring.name))
      .limit(1);

    if (flavoringIngredient.length > 0) {
      const ingredient = flavoringIngredient[0];
      const concentration = req.ingredients.flavoring.concentration;
      const volume = (req.batchSize * concentration) / 100;
      const density = parseFloat(ingredient.density?.toString() || '1.0');
      const mass = volume * density;
      const cost = volume * parseFloat(ingredient.costPerUnit?.toString() || '2.25');

      result.ingredients.flavoring = {
        ingredient,
        manufacturer: req.ingredients.flavoring.manufacturer,
        concentration,
        volume,
        mass,
        cost
      };
    }
  }

  // Calculate totals
  Object.values(result.ingredients).forEach(ing => {
    if (ing) {
      result.totals.volume += ing.volume || ing.requiredVolume || 0;
      result.totals.mass += ing.mass || ing.requiredMass || 0;
      result.totals.cost += ing.cost || 0;
    }
  });
  
  result.totals.costPerServing = result.totals.cost / servingsPerBatch;

  // Dosage verification
  result.dosageVerification.isWithinTolerance = Math.abs(result.dosageVerification.thcVariance) < 5;

  // Compliance checks
  if (req.targetThc > 10) { // Example state limit
    result.compliance.withinStateLimits = false;
    result.compliance.warnings.push('THC content exceeds state limits (10mg max per serving)');
  }

  return result;
}

// POST /api/formulation/calculate - Calculate formulation from ingredients
router.post('/calculate', async (req, res) => {
  try {
    const validatedData = FormulationRequestSchema.parse(req.body);
    const calculation = await calculateFormulation(validatedData);
    
    res.json({
      success: true,
      formulation: calculation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Formulation calculation error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid formulation data',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Calculation failed'
    });
  }
});

// POST /api/formulation/optimize - Optimize formulation for cost/quality
router.post('/optimize', async (req, res) => {
  try {
    const validatedData = OptimizationRequestSchema.parse(req.body);
    const baseFormulation = await calculateFormulation(validatedData.formulation);
    
    // Get all available ingredients for optimization
    const allIngredients = await db.select().from(ingredients);
    const alternatives: CalculatedFormulation[] = [];
    
    // Try different cannabinoid extracts
    for (const cannabinoid of allIngredients.filter(ing => ing.category === 'cannabinoid')) {
      const altFormulation = {
        ...validatedData.formulation,
        ingredients: {
          ...validatedData.formulation.ingredients,
          cannabinoid: { name: cannabinoid.name }
        }
      };
      
      try {
        const calculated = await calculateFormulation(altFormulation);
        if (calculated.dosageVerification.isWithinTolerance) {
          alternatives.push(calculated);
        }
      } catch (error) {
        console.warn('Failed to calculate alternative with', cannabinoid.name);
      }
    }

    // Sort by optimization objective
    alternatives.sort((a, b) => {
      switch (validatedData.objectives.prioritize) {
        case 'cost':
          return a.totals.costPerServing - b.totals.costPerServing;
        case 'accuracy':
          return Math.abs(a.dosageVerification.thcVariance) - Math.abs(b.dosageVerification.thcVariance);
        case 'quality':
          // Prefer full-spectrum and known manufacturers
          const aQuality = (a.ingredients.cannabinoid?.ingredient.subcategory === 'full-spectrum' ? 1 : 0);
          const bQuality = (b.ingredients.cannabinoid?.ingredient.subcategory === 'full-spectrum' ? 1 : 0);
          return bQuality - aQuality;
        default:
          return 0;
      }
    });

    res.json({
      success: true,
      baseFormulation,
      alternatives: alternatives.slice(0, 5), // Top 5 alternatives
      optimization: validatedData.objectives,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Formulation optimization error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid optimization data',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Optimization failed'
    });
  }
});

// GET /api/formulation/ingredients/:category - Get ingredients by category
router.get('/ingredients/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const categoryIngredients = await db.select()
      .from(ingredients)
      .where(eq(ingredients.category, category));

    res.json({
      success: true,
      category,
      ingredients: categoryIngredients,
      count: categoryIngredients.length
    });
  } catch (error) {
    console.error('Ingredients fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ingredients'
    });
  }
});

// POST /api/formulation/validate - Validate formulation for compliance
router.post('/validate', async (req, res) => {
  try {
    const validatedData = FormulationRequestSchema.parse(req.body);
    const calculation = await calculateFormulation(validatedData);
    
    const validationResults = {
      dosageAccuracy: Math.abs(calculation.dosageVerification.thcVariance) < 5,
      costEffective: calculation.totals.costPerServing < 2.0, // Example threshold
      compliant: calculation.compliance.withinStateLimits,
      manufacturable: calculation.totals.volume <= validatedData.batchSize,
      warnings: calculation.compliance.warnings,
      recommendations: [] as string[]
    };

    if (!validationResults.dosageAccuracy) {
      validationResults.recommendations.push('Consider adjusting cannabinoid extract potency or quantity');
    }
    
    if (!validationResults.costEffective) {
      validationResults.recommendations.push('Explore lower-cost carrier oils or reduce terpene concentration');
    }

    res.json({
      success: true,
      formulation: calculation,
      validation: validationResults,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Formulation validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Validation failed'
    });
  }
});

export default router;
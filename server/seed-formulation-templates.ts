import { db } from "./storage";
import { spreadsheetTemplates, ingredients } from "@shared/schema";

// Cannabis formulation ingredients with realistic properties
const formulationIngredients = [
  // Cannabis extracts and concentrates
  { name: "Cannabis Oil (CO2 Extract)", category: "cannabis", potency: 80, density: 0.92, cost_per_gram: 15.00, unit: "g", cannabinoids: "THC: 80%, CBD: 2%" },
  { name: "CBD Isolate", category: "cannabis", potency: 99, density: 0.95, cost_per_gram: 8.00, unit: "g", cannabinoids: "CBD: 99%" },
  { name: "THC Distillate", category: "cannabis", potency: 90, density: 0.94, cost_per_gram: 18.00, unit: "g", cannabinoids: "THC: 90%" },
  { name: "Live Resin", category: "cannabis", potency: 70, density: 0.88, cost_per_gram: 25.00, unit: "g", cannabinoids: "THC: 70%, Terps: 8%" },
  { name: "Rosin", category: "cannabis", potency: 75, density: 0.90, cost_per_gram: 30.00, unit: "g", cannabinoids: "THC: 75%, Terps: 5%" },
  
  // Carrier oils
  { name: "MCT Oil", category: "carrier", potency: 0, density: 0.95, cost_per_gram: 0.03, unit: "ml", solubility: "lipophilic" },
  { name: "Olive Oil", category: "carrier", potency: 0, density: 0.91, cost_per_gram: 0.02, unit: "ml", solubility: "lipophilic" },
  { name: "Coconut Oil", category: "carrier", potency: 0, density: 0.92, cost_per_gram: 0.04, unit: "ml", solubility: "lipophilic" },
  { name: "Hemp Seed Oil", category: "carrier", potency: 0, density: 0.93, cost_per_gram: 0.06, unit: "ml", solubility: "lipophilic" },
  
  // Terpenes
  { name: "Limonene", category: "terpene", potency: 100, density: 0.84, cost_per_gram: 2.50, unit: "ml", effects: "uplifting, anti-anxiety" },
  { name: "Myrcene", category: "terpene", potency: 100, density: 0.80, cost_per_gram: 2.25, unit: "ml", effects: "sedating, muscle relaxant" },
  { name: "Pinene", category: "terpene", potency: 100, density: 0.86, cost_per_gram: 2.75, unit: "ml", effects: "alertness, memory retention" },
  { name: "Linalool", category: "terpene", potency: 100, density: 0.87, cost_per_gram: 3.00, unit: "ml", effects: "calming, anti-inflammatory" },
  
  // Emulsifiers and stabilizers
  { name: "Lecithin", category: "emulsifier", potency: 0, density: 0.98, cost_per_gram: 0.15, unit: "g", function: "emulsification" },
  { name: "Polysorbate 80", category: "emulsifier", potency: 0, density: 1.07, cost_per_gram: 0.25, unit: "ml", function: "water-oil emulsion" },
  { name: "Glycerin", category: "stabilizer", potency: 0, density: 1.26, cost_per_gram: 0.08, unit: "ml", function: "moisture retention" },
  
  // Flavoring agents
  { name: "Natural Orange Extract", category: "flavoring", potency: 0, density: 0.88, cost_per_gram: 0.50, unit: "ml", flavor: "citrus" },
  { name: "Vanilla Extract", category: "flavoring", potency: 0, density: 0.89, cost_per_gram: 0.75, unit: "ml", flavor: "vanilla" },
  { name: "Mint Extract", category: "flavoring", potency: 0, density: 0.91, cost_per_gram: 0.60, unit: "ml", flavor: "mint" },
];

// Cannabis formulation templates
const formulationTemplates = [
  {
    name: "Tincture Formulation Calculator",
    category: "formulation",
    description: "Complete tincture formulation with potency calculations, ingredient costs, and batch tracking",
    cannabis_specific: true,
    industry: "cannabis",
    structure: {
      worksheets: [{
        name: "Formulation",
        columns: ["Ingredient", "Category", "Quantity", "Unit", "Density (g/ml)", "Mass (g)", "Potency (%)", "Active mg", "Cost/Unit", "Total Cost", "Notes"],
        formulas: {
          "F": "=C*E", // Mass = Quantity * Density  
          "H": "=F*G/100", // Active mg = Mass * Potency%
          "J": "=C*I" // Total Cost = Quantity * Cost/Unit
        }
      }]
    },
    defaultData: {
      worksheets: [{
        name: "Formulation",
        data: [
          // Headers
          [
            {value: "Ingredient", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "Category", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "Quantity", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "Unit", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "Density (g/ml)", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "Mass (g)", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "Potency (%)", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "Active mg", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "Cost/Unit ($)", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "Total Cost ($)", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "Notes", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}}
          ],
          // Sample formulation data
          [
            {value: "Cannabis Oil (CO2 Extract)", type: "text"},
            {value: "cannabis", type: "text"},
            {value: 1, type: "number"},
            {value: "g", type: "text"},
            {value: 0.92, type: "number"},
            {value: 0.92, type: "number", formula: "=C2*E2"},
            {value: 80, type: "number"},
            {value: 736, type: "number", formula: "=F2*G2"},
            {value: 15.00, type: "currency"},
            {value: 15.00, type: "currency", formula: "=C2*I2"},
            {value: "Primary active ingredient", type: "text"}
          ],
          [
            {value: "MCT Oil", type: "text"},
            {value: "carrier", type: "text"},
            {value: 29, type: "number"},
            {value: "ml", type: "text"},
            {value: 0.95, type: "number"},
            {value: 27.55, type: "number", formula: "=C3*E3"},
            {value: 0, type: "number"},
            {value: 0, type: "number", formula: "=F3*G3"},
            {value: 0.03, type: "currency"},
            {value: 0.87, type: "currency", formula: "=C3*I3"},
            {value: "Carrier oil base", type: "text"}
          ],
          [
            {value: "Limonene", type: "text"},
            {value: "terpene", type: "text"},
            {value: 0.1, type: "number"},
            {value: "ml", type: "text"},
            {value: 0.84, type: "number"},
            {value: 0.084, type: "number", formula: "=C4*E4"},
            {value: 100, type: "number"},
            {value: 84, type: "number", formula: "=F4*G4"},
            {value: 2.50, type: "currency"},
            {value: 0.25, type: "currency", formula: "=C4*I4"},
            {value: "Citrus terpene for flavor", type: "text"}
          ],
          // Totals row
          [
            {value: "TOTALS", type: "text", style: {fontWeight: "bold", backgroundColor: "#e6f3ff"}},
            {value: "", type: "text"},
            {value: "", type: "text"},
            {value: "", type: "text"},
            {value: "", type: "text"},
            {value: 28.554, type: "number", formula: "=SUM(F2:F4)", style: {fontWeight: "bold", backgroundColor: "#e6f3ff"}},
            {value: "", type: "text"},
            {value: 820, type: "number", formula: "=SUM(H2:H4)", style: {fontWeight: "bold", backgroundColor: "#e6f3ff"}},
            {value: "", type: "text"},
            {value: 16.12, type: "currency", formula: "=SUM(J2:J4)", style: {fontWeight: "bold", backgroundColor: "#e6f3ff"}},
            {value: "Total batch", type: "text"}
          ]
        ],
        columns: 11,
        rows: 50
      }]
    },
    features: ["formulas", "cost_analysis", "potency_calc", "batch_tracking"],
    isPublic: true,
    usageCount: 0
  },
  
  {
    name: "Edible Dosage Calculator",
    category: "formulation",
    description: "Calculate precise dosing for edible products with serving size analysis",
    cannabis_specific: true,
    industry: "cannabis",
    structure: {
      worksheets: [{
        name: "Dosage Calc",
        columns: ["Product", "Total THC (mg)", "Total Servings", "mg per Serving", "Serving Size", "Total Weight (g)", "Cost per Serving", "Notes"]
      }]
    },
    defaultData: {
      worksheets: [{
        name: "Dosage Calc", 
        data: [
          // Headers
          [
            {value: "Product", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "Total THC (mg)", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "Total Servings", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "mg per Serving", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "Serving Size", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "Total Weight (g)", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "Cost per Serving ($)", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "Notes", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}}
          ],
          // Sample products
          [
            {value: "Chocolate Brownies", type: "text"},
            {value: 240, type: "number"},
            {value: 24, type: "number"},
            {value: 10, type: "number", formula: "=B2/C2"},
            {value: "1 piece", type: "text"},
            {value: 480, type: "number"},
            {value: 2.50, type: "currency"},
            {value: "Standard 10mg dose", type: "text"}
          ],
          [
            {value: "Gummy Bears", type: "text"},
            {value: 125, type: "number"},
            {value: 25, type: "number"},
            {value: 5, type: "number", formula: "=B3/C3"},
            {value: "1 gummy", type: "text"},
            {value: 125, type: "number"},
            {value: 1.25, type: "currency"},
            {value: "Microdose option", type: "text"}
          ]
        ],
        columns: 8,
        rows: 30
      }]
    },
    features: ["dosage_calc", "serving_analysis", "cost_per_dose"],
    isPublic: true,
    usageCount: 0
  },

  {
    name: "Extraction Yield Tracker",
    category: "formulation",
    description: "Track extraction yields, efficiency, and batch consistency for different extraction methods",
    cannabis_specific: true,
    industry: "cannabis",
    structure: {
      worksheets: [{
        name: "Yield Tracking",
        columns: ["Batch ID", "Date", "Method", "Starting Material (g)", "Solvent", "Final Yield (g)", "Yield %", "THC %", "CBD %", "Terpenes %", "Cost", "Notes"]
      }]
    },
    defaultData: {
      worksheets: [{
        name: "Yield Tracking",
        data: [
          [
            {value: "Batch ID", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "Date", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "Method", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "Starting Material (g)", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "Solvent", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "Final Yield (g)", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "Yield %", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "THC %", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "CBD %", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "Terpenes %", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "Total Cost ($)", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}},
            {value: "Notes", type: "text", style: {fontWeight: "bold", backgroundColor: "#f0f0f0"}}
          ],
          [
            {value: "EXT-001", type: "text"},
            {value: "2024-01-15", type: "date"},
            {value: "CO2", type: "text"},
            {value: 1000, type: "number"},
            {value: "CO2", type: "text"},
            {value: 150, type: "number"},
            {value: 15, type: "percentage", formula: "=F2/D2*100"},
            {value: 82, type: "percentage"},
            {value: 1.2, type: "percentage"},
            {value: 4.5, type: "percentage"},
            {value: 450, type: "currency"},
            {value: "Good quality extract", type: "text"}
          ]
        ],
        columns: 12,
        rows: 50
      }]
    },
    features: ["yield_tracking", "efficiency_calc", "batch_comparison"],
    isPublic: true,
    usageCount: 0
  }
];

// Function to seed formulation templates
export async function seedFormulationTemplates() {
  try {
    console.log("🌱 Seeding cannabis formulation ingredients...");
    
    // First, seed ingredients if they don't exist
    for (const ingredient of formulationIngredients) {
      const existing = await db.select().from(ingredients).where(eq(ingredients.name, ingredient.name)).limit(1);
      
      if (existing.length === 0) {
        await db.insert(ingredients).values({
          name: ingredient.name,
          category: ingredient.category,
          potency: ingredient.potency,
          density: ingredient.density,
          cost_per_unit: ingredient.cost_per_gram,
          unit: ingredient.unit,
          metadata: {
            cannabinoids: ingredient.cannabinoids || null,
            solubility: ingredient.solubility || null,
            effects: ingredient.effects || null,
            function: ingredient.function || null,
            flavor: ingredient.flavor || null
          }
        });
      }
    }

    console.log("🧪 Seeding formulation templates...");
    
    // Then seed templates
    for (const template of formulationTemplates) {
      const existing = await db.select().from(spreadsheetTemplates).where(eq(spreadsheetTemplates.name, template.name)).limit(1);
      
      if (existing.length === 0) {
        await db.insert(spreadsheetTemplates).values({
          name: template.name,
          category: template.category,
          description: template.description,
          structure: template.structure,
          defaultData: template.defaultData,
          cannabis_specific: template.cannabis_specific,
          industry: template.industry,
          createdBy: "system",
          isPublic: template.isPublic,
          usageCount: template.usageCount,
          features: template.features
        });
      }
    }

    console.log("✅ Formulation templates seeded successfully!");
    
  } catch (error) {
    console.error("❌ Error seeding formulation templates:", error);
    throw error;
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedFormulationTemplates()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
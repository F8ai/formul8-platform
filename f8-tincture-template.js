// F8 CBD Tincture Formulation Template System
// This demonstrates how to create and populate professional cannabis formulation sheets

// Template structure for CBD Tincture Formulation
const tinctureTemplate = {
  name: "CBD Tincture Formulation Sheet",
  description: "Professional cannabis tincture formulation with terpene profiles and quality control",
  category: "formulation",
  f8_folder: "Product Development",
  
  // Template variables that can be populated
  variables: {
    batch_number: "CBDTx-{date}-{sequence}",
    product_name: "Premium CBD Wellness Tincture",
    target_potency: "1000mg CBD/30ml",
    batch_size: "1000 units",
    flavor_profile: "Citrus Mint Wellness",
    formulation_date: "{current_date}",
    formulated_by: "Master Formulator"
  },
  
  // Base ingredient specifications
  base_ingredients: [
    {
      component: "CBD Isolate (99.9%)",
      supplier: "Premium Extracts Co.",
      quantity_per_unit: "1000mg",
      unit_cost: "$15.00/g",
      potency: "999mg/g",
      notes: "COA verified, <0.3% THC"
    },
    {
      component: "MCT Oil (Fractionated)",
      supplier: "Coconut Wellness LLC",
      quantity_per_unit: "28ml",
      unit_cost: "$0.45/ml",
      potency: "N/A",
      notes: "Organic certified"
    },
    {
      component: "Organic Glycerin",
      supplier: "Natural Extracts Inc.",
      quantity_per_unit: "1ml",
      unit_cost: "$0.35/ml",
      potency: "N/A",
      notes: "USP grade"
    },
    {
      component: "Natural Flavoring",
      supplier: "Flavor Masters Pro",
      quantity_per_unit: "0.5ml",
      unit_cost: "$2.50/ml",
      potency: "N/A",
      notes: "Citrus mint blend"
    }
  ],
  
  // Terpene blend specifications
  terpene_blend: [
    {
      terpene: "Limonene",
      concentration: "0.5%",
      volume_per_unit: "0.15ml",
      cost_per_ml: "$125.00",
      effect_profile: "Uplifting, Anti-anxiety",
      aroma: "Citrus, Fresh",
      boiling_point: "176°C"
    },
    {
      terpene: "Linalool",
      concentration: "0.3%",
      volume_per_unit: "0.09ml",
      cost_per_ml: "$180.00",
      effect_profile: "Calming, Relaxing",
      aroma: "Floral, Lavender",
      boiling_point: "198°C"
    },
    {
      terpene: "Pinene",
      concentration: "0.2%",
      volume_per_unit: "0.06ml",
      cost_per_ml: "$150.00",
      effect_profile: "Alertness, Memory",
      aroma: "Pine, Fresh",
      boiling_point: "155°C"
    },
    {
      terpene: "Myrcene",
      concentration: "0.1%",
      volume_per_unit: "0.03ml",
      cost_per_ml: "$140.00",
      effect_profile: "Sedating, Muscle relaxant",
      aroma: "Earthy, Musky",
      boiling_point: "167°C"
    }
  ],
  
  // Formulation process steps
  formulation_steps: [
    {
      step: 1,
      process: "Weigh CBD isolate accurately",
      temperature: "Room temp",
      time: "5 min",
      equipment: "Analytical scale",
      notes: "Use anti-static measures",
      quality_check: "Weight verification"
    },
    {
      step: 2,
      process: "Heat MCT oil to optimal temp",
      temperature: "60°C",
      time: "10 min",
      equipment: "Heating mantle",
      notes: "Gentle heating, no boiling",
      quality_check: "Temperature check"
    },
    {
      step: 3,
      process: "Dissolve CBD in warm MCT oil",
      temperature: "60°C",
      time: "15 min",
      equipment: "Magnetic stirrer",
      notes: "Stir until completely dissolved",
      quality_check: "Visual inspection"
    },
    {
      step: 4,
      process: "Add terpene blend slowly",
      temperature: "50°C",
      time: "10 min",
      equipment: "Micropipette",
      notes: "Add drop by drop while stirring",
      quality_check: "Homogeneity check"
    },
    {
      step: 5,
      process: "Incorporate glycerin",
      temperature: "45°C",
      time: "5 min",
      equipment: "Stirring rod",
      notes: "Mix thoroughly",
      quality_check: "Visual inspection"
    },
    {
      step: 6,
      process: "Add natural flavoring",
      temperature: "40°C",
      time: "5 min",
      equipment: "Micropipette",
      notes: "Final flavor adjustment",
      quality_check: "Taste test"
    },
    {
      step: 7,
      process: "Cool to room temperature",
      temperature: "25°C",
      time: "30 min",
      equipment: "Cooling rack",
      notes: "Allow natural cooling",
      quality_check: "Temperature check"
    },
    {
      step: 8,
      process: "Final mixing and homogenization",
      temperature: "Room temp",
      time: "10 min",
      equipment: "High-speed mixer",
      notes: "Ensure complete blend",
      quality_check: "Homogeneity test"
    },
    {
      step: 9,
      process: "Fill bottles with precision",
      temperature: "Room temp",
      time: "45 min",
      equipment: "Filling machine",
      notes: "30ml ± 0.1ml per bottle",
      quality_check: "Volume check"
    },
    {
      step: 10,
      process: "Cap and label bottles",
      temperature: "Room temp",
      time: "30 min",
      equipment: "Capping machine",
      notes: "Ensure proper seal",
      quality_check: "Seal integrity"
    }
  ],
  
  // Quality control specifications
  quality_control: [
    {
      parameter: "CBD Potency",
      specification: "1000mg ± 50mg",
      method: "HPLC",
      frequency: "Every batch",
      acceptance_criteria: "950-1050mg per bottle",
      notes: "COA required"
    },
    {
      parameter: "THC Content",
      specification: "<0.3%",
      method: "HPLC",
      frequency: "Every batch",
      acceptance_criteria: "Below federal limit",
      notes: "Compliance critical"
    },
    {
      parameter: "Terpene Profile",
      specification: "As specified",
      method: "GC-MS",
      frequency: "Every batch",
      acceptance_criteria: "Match target profile ±10%",
      notes: "Flavor consistency"
    },
    {
      parameter: "Microbial Testing",
      specification: "USP standards",
      method: "Plate count",
      frequency: "Every batch",
      acceptance_criteria: "Within USP limits",
      notes: "Safety requirement"
    },
    {
      parameter: "Heavy Metals",
      specification: "USP <232>",
      method: "ICP-MS",
      frequency: "Every lot",
      acceptance_criteria: "Below USP limits",
      notes: "Supplier verification"
    }
  ]
};

// Function to populate template with real data
function populateTemplate(templateData, batchData) {
  console.log("🧪 Populating CBD Tincture Formulation Template...");
  
  // Generate batch number
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const batchNumber = `CBDTx-${date}-${batchData.sequence || '001'}`;
  
  // Populate variables
  const populatedVariables = {
    ...templateData.variables,
    batch_number: batchNumber,
    formulation_date: batchData.date || new Date().toISOString().slice(0, 10),
    formulated_by: batchData.formulator || "Master Formulator"
  };
  
  // Calculate costs
  const totalRawMaterialCost = templateData.base_ingredients.reduce((sum, ingredient) => {
    const cost = parseFloat(ingredient.unit_cost.replace('$', '').replace('/g', '').replace('/ml', ''));
    const quantity = parseFloat(ingredient.quantity_per_unit.replace('mg', '').replace('ml', ''));
    return sum + (cost * quantity * (batchData.batch_size || 1000));
  }, 0);
  
  const totalTerpeneCost = templateData.terpene_blend.reduce((sum, terpene) => {
    const cost = parseFloat(terpene.cost_per_ml.replace('$', ''));
    const volume = parseFloat(terpene.volume_per_unit.replace('ml', ''));
    return sum + (cost * volume * (batchData.batch_size || 1000));
  }, 0);
  
  // Create populated formulation sheet
  const populatedSheet = {
    batch_info: {
      batch_number: batchNumber,
      product_name: populatedVariables.product_name,
      target_potency: populatedVariables.target_potency,
      batch_size: `${batchData.batch_size || 1000} units`,
      flavor_profile: populatedVariables.flavor_profile,
      formulation_date: populatedVariables.formulation_date,
      formulated_by: populatedVariables.formulated_by
    },
    
    ingredients: templateData.base_ingredients.map(ingredient => ({
      ...ingredient,
      total_quantity: `${parseFloat(ingredient.quantity_per_unit.replace('mg', '').replace('ml', '')) * (batchData.batch_size || 1000)}${ingredient.quantity_per_unit.includes('mg') ? 'g' : 'L'}`,
      total_cost: `$${(parseFloat(ingredient.unit_cost.replace('$', '').replace('/g', '').replace('/ml', '')) * parseFloat(ingredient.quantity_per_unit.replace('mg', '').replace('ml', '')) * (batchData.batch_size || 1000)).toFixed(2)}`
    })),
    
    terpenes: templateData.terpene_blend.map(terpene => ({
      ...terpene,
      total_volume: `${parseFloat(terpene.volume_per_unit.replace('ml', '')) * (batchData.batch_size || 1000)}ml`,
      total_cost: `$${(parseFloat(terpene.cost_per_ml.replace('$', '')) * parseFloat(terpene.volume_per_unit.replace('ml', '')) * (batchData.batch_size || 1000)).toFixed(2)}`
    })),
    
    formulation_steps: templateData.formulation_steps,
    quality_control: templateData.quality_control,
    
    cost_analysis: {
      raw_materials: `$${totalRawMaterialCost.toFixed(2)}`,
      terpenes: `$${totalTerpeneCost.toFixed(2)}`,
      packaging: `$${(2.50 * (batchData.batch_size || 1000)).toFixed(2)}`,
      labor: `$${(1.20 * (batchData.batch_size || 1000)).toFixed(2)}`,
      overhead: `$${(0.80 * (batchData.batch_size || 1000)).toFixed(2)}`,
      total: `$${(totalRawMaterialCost + totalTerpeneCost + (2.50 * (batchData.batch_size || 1000)) + (1.20 * (batchData.batch_size || 1000)) + (0.80 * (batchData.batch_size || 1000))).toFixed(2)}`
    }
  };
  
  return populatedSheet;
}

// Demonstration: Creating multiple formulation sheets
console.log("🌿 F8 CBD Tincture Template System Demo");
console.log("=====================================");

// Demo batch data
const demoBatches = [
  {
    sequence: '001',
    date: '2025-07-14',
    batch_size: 1000,
    formulator: 'Master Formulator'
  },
  {
    sequence: '002',
    date: '2025-07-16',
    batch_size: 1500,
    formulator: 'Senior Formulator'
  },
  {
    sequence: '003',
    date: '2025-07-18',
    batch_size: 2000,
    formulator: 'Lead Formulator'
  }
];

// Generate formulation sheets for each batch
demoBatches.forEach((batchData, index) => {
  console.log(`\n📋 Batch ${index + 1}: ${batchData.sequence}`);
  console.log("=====================================");
  
  const populatedSheet = populateTemplate(tinctureTemplate, batchData);
  
  console.log(`Batch Number: ${populatedSheet.batch_info.batch_number}`);
  console.log(`Product: ${populatedSheet.batch_info.product_name}`);
  console.log(`Batch Size: ${populatedSheet.batch_info.batch_size}`);
  console.log(`Formulator: ${populatedSheet.batch_info.formulated_by}`);
  
  console.log("\n💰 Cost Analysis:");
  console.log(`Raw Materials: ${populatedSheet.cost_analysis.raw_materials}`);
  console.log(`Terpenes: ${populatedSheet.cost_analysis.terpenes}`);
  console.log(`Total Cost: ${populatedSheet.cost_analysis.total}`);
  console.log(`Cost per Unit: $${(parseFloat(populatedSheet.cost_analysis.total.replace('$', '')) / batchData.batch_size).toFixed(2)}`);
  
  console.log("\n🌱 Terpene Blend:");
  populatedSheet.terpenes.forEach(terpene => {
    console.log(`${terpene.terpene}: ${terpene.concentration} (${terpene.effect_profile})`);
  });
  
  console.log("\n🔬 Quality Control:");
  populatedSheet.quality_control.slice(0, 3).forEach(qc => {
    console.log(`${qc.parameter}: ${qc.specification} (${qc.method})`);
  });
});

console.log("\n✅ Template demonstration complete!");
console.log("📁 Ready for F8 Cannabis Workspace integration");
console.log("🔗 Templates can be populated with real batch data");
console.log("🎨 Professional styling applied automatically");

// Export for use in F8 system
export { tinctureTemplate, populateTemplate };
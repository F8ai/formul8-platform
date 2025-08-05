// Test script to demonstrate LLM-powered spreadsheet generation
import fetch from 'node-fetch';

async function testFormulationGeneration() {
  console.log('🧪 Testing Cannabis Formulation Generation with LLM...\n');

  const testCases = [
    {
      name: "Medical Tincture - High Precision",
      prompt: `Create a medical-grade tincture formulation spreadsheet with pharmaceutical precision:
      
      - Target: 10mg THC per 1ml serving
      - Batch Size: 100ml
      - Primary Extract: Cannabis CO2 extract (80% THC, $15/g)
      - Carrier: MCT oil (density 0.95 g/ml, $0.03/ml)
      - Terpenes: 0.5% limonene for anti-anxiety effects
      - Include: Precise mass calculations, potency verification, cost analysis
      - Add: Quality control parameters, stability testing notes
      - Formulas: Auto-calculate potency per drop, cost per mg THC, batch yield
      
      Make this production-ready with realistic cannabis industry data.`,
      category: "formulation"
    },
    {
      name: "Edible Gummy Formula",
      prompt: `Design a gummy edible production spreadsheet:
      
      - Product: Cannabis gummy bears
      - Target: 5mg THC per gummy (microdose)
      - Batch: 1000 gummies
      - Extract: THC distillate (90% THC)
      - Include: Gelatin ratios, flavor calculations, mold capacity
      - Cost analysis with packaging and labor
      - Shelf life and storage requirements
      
      Real cannabis manufacturing data with regulatory compliance notes.`,
      category: "formulation"
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.name}`);
    console.log('─'.repeat(50));
    
    try {
      const response = await fetch('http://localhost:5000/api/spreadsheets/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: testCase.prompt,
          category: testCase.category,
          includeFormulas: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log(`✅ Generated: "${result.title}"`);
      console.log(`📊 Worksheets: ${result.sheetData?.length || 0}`);
      console.log(`🧮 Rows: ${result.rows}, Columns: ${result.cols}`);
      console.log(`🤖 AI Generated: ${result.agentGenerated ? 'Yes' : 'No'}`);
      
      if (result.sheetData && result.sheetData[0]?.data) {
        const firstSheet = result.sheetData[0];
        console.log(`📋 Sheet Name: "${firstSheet.name}"`);
        console.log(`📈 Data Points: ${firstSheet.data.length} rows × ${firstSheet.columns} cols`);
        
        // Show first few cells to verify realistic data
        if (firstSheet.data.length > 1) {
          console.log('\n📊 Sample Data Preview:');
          const headers = firstSheet.data[0]?.map(cell => cell.value) || [];
          const firstRow = firstSheet.data[1]?.map(cell => cell.value) || [];
          
          console.log('Headers:', headers.slice(0, 5).join(' | '));
          console.log('Data:   ', firstRow.slice(0, 5).join(' | '));
        }
      }
      
      console.log(`💰 Metadata: ${JSON.stringify(result.metadata, null, 2).substring(0, 200)}...`);
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n🎉 Formulation generation test completed!');
}

// Run the test
testFormulationGeneration().catch(console.error);
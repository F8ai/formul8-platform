import fetch from 'node-fetch';

async function testImplementationComments() {
  try {
    console.log('Adding detailed implementation comments to GitHub issues...');
    
    const response = await fetch('http://localhost:5000/api/roadmap/add-implementation-comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Implementation comments result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Implementation Comments Summary:');
      console.log(`Total Agents: ${result.summary.totalAgents}`);
      console.log(`Comments Added: ${result.summary.totalComments}`);
      console.log(`Already Existed: ${result.summary.totalSkipped}`);
      console.log(`Errors: ${result.summary.totalErrors}`);
    }
  } catch (error) {
    console.error('Error adding implementation comments:', error.message);
  }
}

testImplementationComments();
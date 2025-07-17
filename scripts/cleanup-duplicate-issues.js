#!/usr/bin/env node

/**
 * Comprehensive Duplicate Issue Cleanup Script
 * Identifies and closes duplicate GitHub issues while preserving originals
 */

const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT,
});

const ORG = 'F8ai';
const AGENTS = [
  'compliance-agent',
  'patent-agent', 
  'operations-agent',
  'formulation-agent',
  'sourcing-agent',
  'marketing-agent',
  'science-agent',
  'spectra-agent',
  'customer-success-agent'
];

async function findDuplicateIssues(repo) {
  console.log(`\n📊 Analyzing ${repo} for duplicate issues...`);
  
  try {
    const { data: issues } = await octokit.rest.issues.listForRepo({
      owner: ORG,
      repo,
      state: 'open',
      per_page: 100
    });

    // Group issues by title
    const titleGroups = {};
    issues.forEach(issue => {
      if (!titleGroups[issue.title]) {
        titleGroups[issue.title] = [];
      }
      titleGroups[issue.title].push(issue);
    });

    // Find duplicates (groups with more than 1 issue)
    const duplicates = {};
    Object.entries(titleGroups).forEach(([title, issueGroup]) => {
      if (issueGroup.length > 1) {
        // Sort by creation date to keep the oldest
        issueGroup.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        duplicates[title] = {
          original: issueGroup[0],
          duplicates: issueGroup.slice(1)
        };
      }
    });

    return { duplicates, totalIssues: issues.length };
  } catch (error) {
    console.error(`❌ Error analyzing ${repo}:`, error.message);
    return { duplicates: {}, totalIssues: 0 };
  }
}

async function closeDuplicateIssue(repo, issue, originalIssue) {
  try {
    // Add explanatory comment
    await octokit.rest.issues.createComment({
      owner: ORG,
      repo,
      issue_number: issue.number,
      body: `🔄 **Duplicate Issue Cleanup**

This issue is a duplicate of #${originalIssue.number} which was created earlier.

**Original Issue:** ${originalIssue.html_url}
**Created:** ${new Date(originalIssue.created_at).toLocaleDateString()}

Closing this duplicate to maintain clean issue tracking. All discussions and progress should continue in the original issue.

*This cleanup was performed by automated duplicate prevention system.*`
    });

    // Close the duplicate issue
    await octokit.rest.issues.update({
      owner: ORG,
      repo,
      issue_number: issue.number,
      state: 'closed'
    });

    console.log(`   ✅ Closed duplicate #${issue.number} (keeping original #${originalIssue.number})`);
    return true;
  } catch (error) {
    console.error(`   ❌ Failed to close #${issue.number}:`, error.message);
    return false;
  }
}

async function cleanupRepo(repo) {
  console.log(`\n🧹 Starting cleanup for ${repo}...`);
  
  const { duplicates, totalIssues } = await findDuplicateIssues(repo);
  const duplicateCount = Object.keys(duplicates).length;
  
  if (duplicateCount === 0) {
    console.log(`   ✨ No duplicates found in ${repo} (${totalIssues} total issues)`);
    return { repo, duplicatesFound: 0, duplicatesClosed: 0, totalIssues };
  }

  console.log(`   🔍 Found ${duplicateCount} duplicate title(s) in ${repo}`);
  
  let closedCount = 0;
  let totalDuplicates = 0;

  for (const [title, { original, duplicates: dups }] of Object.entries(duplicates)) {
    console.log(`\n   📝 "${title}" (${dups.length + 1} copies)`);
    console.log(`      Keeping: #${original.number} (${new Date(original.created_at).toLocaleDateString()})`);
    
    totalDuplicates += dups.length;
    
    for (const dup of dups) {
      console.log(`      Closing: #${dup.number} (${new Date(dup.created_at).toLocaleDateString()})`);
      
      const success = await closeDuplicateIssue(repo, dup, original);
      if (success) {
        closedCount++;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return { 
    repo, 
    duplicatesFound: totalDuplicates, 
    duplicatesClosed: closedCount, 
    totalIssues,
    duplicateTitles: duplicateCount
  };
}

async function main() {
  console.log('🚀 Starting comprehensive duplicate issue cleanup...');
  console.log(`📋 Repositories to clean: ${AGENTS.join(', ')}`);
  
  const results = [];
  let totalFound = 0;
  let totalClosed = 0;
  
  for (const repo of AGENTS) {
    const result = await cleanupRepo(repo);
    results.push(result);
    totalFound += result.duplicatesFound;
    totalClosed += result.duplicatesClosed;
    
    // Rate limiting between repos
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 CLEANUP SUMMARY');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    const status = result.duplicatesFound === 0 ? '✨' : 
                  result.duplicatesClosed === result.duplicatesFound ? '✅' : '⚠️';
    console.log(`${status} ${result.repo.padEnd(20)} | ${result.duplicatesClosed}/${result.duplicatesFound} closed | ${result.totalIssues} total issues`);
  });
  
  console.log('='.repeat(60));
  console.log(`🎯 Total duplicates found: ${totalFound}`);
  console.log(`✅ Total duplicates closed: ${totalClosed}`);
  console.log(`📈 Success rate: ${totalFound > 0 ? Math.round((totalClosed / totalFound) * 100) : 100}%`);
  
  if (totalClosed > 0) {
    console.log('\n🛡️ Duplicate prevention system is now active to prevent future duplicates.');
    console.log('   Use /api/duplicate-prevention/status to monitor the system.');
  }
  
  console.log('\n✨ Cleanup complete!');
}

// Run the cleanup
if (require.main === module) {
  main().catch(console.error);
}
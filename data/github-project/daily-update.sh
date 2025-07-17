#!/bin/bash

# Formul8 Daily Project Update Automation
# Automatically updates GitHub project with latest progress and metrics

set -e

# Configuration
PROJECT_OWNER="F8ai"
PROJECT_NAME="Formul8 Agent Training Data Acquisition"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
REPORT_DATE=$(date +"%Y-%m-%d")

echo "🔄 Running daily project update for $PROJECT_NAME..."
echo "📅 Date: $REPORT_DATE"
echo "⏰ Timestamp: $TIMESTAMP"

# Get project number
PROJECT_URL=$(gh project list --owner $PROJECT_OWNER --format json | jq -r '.[] | select(.title=="'$PROJECT_NAME'") | .url')
PROJECT_NUMBER=$(echo $PROJECT_URL | grep -o '[0-9]*$')

if [ -z "$PROJECT_NUMBER" ]; then
  echo "❌ Error: Could not find project '$PROJECT_NAME'"
  exit 1
fi

echo "📊 Project Number: $PROJECT_NUMBER"

# Function to update repository metrics
update_repo_metrics() {
  local repo_name=$1
  echo "  📈 Updating metrics for $repo_name..."
  
  # Get repository statistics
  REPO_STATS=$(gh api repos/$PROJECT_OWNER/$repo_name)
  ISSUES_COUNT=$(echo $REPO_STATS | jq '.open_issues_count')
  LAST_COMMIT=$(echo $REPO_STATS | jq -r '.pushed_at')
  
  # Get training data progress (if corpus exists)
  if gh api repos/$PROJECT_OWNER/$repo_name/contents/rag/corpus.jsonl > /dev/null 2>&1; then
    CORPUS_SIZE=$(gh api repos/$PROJECT_OWNER/$repo_name/contents/rag/corpus.jsonl | jq -r '.size')
    echo "    ✅ Corpus found: $CORPUS_SIZE bytes"
  else
    CORPUS_SIZE=0
    echo "    ⚠️  No corpus found"
  fi
  
  # Get recent commits (activity indicator)
  RECENT_COMMITS=$(gh api repos/$PROJECT_OWNER/$repo_name/commits --jq 'length')
  
  # Calculate progress percentage based on issues closed
  CLOSED_ISSUES=$(gh issue list --repo $PROJECT_OWNER/$repo_name --state closed --json number | jq 'length')
  TOTAL_ISSUES=$(gh issue list --repo $PROJECT_OWNER/$repo_name --json number | jq 'length')
  
  if [ "$TOTAL_ISSUES" -gt 0 ]; then
    PROGRESS_PCT=$(echo "scale=0; $CLOSED_ISSUES * 100 / $TOTAL_ISSUES" | bc)
  else
    PROGRESS_PCT=0
  fi
  
  echo "    📊 Progress: $PROGRESS_PCT% ($CLOSED_ISSUES/$TOTAL_ISSUES issues closed)"
  echo "    📝 Recent commits: $RECENT_COMMITS"
  echo "    🕒 Last updated: $LAST_COMMIT"
}

# Update all agent repositories
echo "🔍 Scanning agent repositories..."

update_repo_metrics "compliance-agent"

update_repo_metrics "formulation-agent"

update_repo_metrics "science-agent"

update_repo_metrics "marketing-agent"

update_repo_metrics "operations-agent"

update_repo_metrics "patent-agent"

update_repo_metrics "sourcing-agent"

update_repo_metrics "spectra-agent"

update_repo_metrics "customer-success-agent"


# Generate daily report
echo "📋 Generating daily progress report..."

DAILY_REPORT="# Daily Progress Report - $REPORT_DATE

## 📊 Overall Project Status

Generated: $TIMESTAMP

### Repository Summary

#### compliance-agent
- **Priority:** CRITICAL
- **Features:** 7 total
- **Data Sources:** 3
- **Team Leads:** regulatory specialist, data engineer

#### formulation-agent
- **Priority:** CRITICAL
- **Features:** 7 total
- **Data Sources:** 3
- **Team Leads:** chemical engineer, data scientist

#### science-agent
- **Priority:** HIGH
- **Features:** 7 total
- **Data Sources:** 2
- **Team Leads:** research scientist, data curator

#### marketing-agent
- **Priority:** HIGH
- **Features:** 7 total
- **Data Sources:** 2
- **Team Leads:** marketing specialist, compliance officer

#### operations-agent
- **Priority:** HIGH
- **Features:** 7 total
- **Data Sources:** 2
- **Team Leads:** operations manager, facility engineer

#### patent-agent
- **Priority:** MEDIUM
- **Features:** 7 total
- **Data Sources:** 2
- **Team Leads:** IP attorney, patent researcher

#### sourcing-agent
- **Priority:** MEDIUM
- **Features:** 7 total
- **Data Sources:** 2
- **Team Leads:** procurement specialist, vendor manager

#### spectra-agent
- **Priority:** MEDIUM
- **Features:** 7 total
- **Data Sources:** 2
- **Team Leads:** analytical chemist, lab manager

#### customer-success-agent
- **Priority:** MEDIUM
- **Features:** 7 total
- **Data Sources:** 2
- **Team Leads:** customer success manager, support specialist


### Daily Metrics
- **Total Issues Tracked:** $(gh issue list --search 'org:$PROJECT_OWNER' --json number | jq 'length')
- **Issues Closed Today:** $(gh issue list --search 'org:$PROJECT_OWNER closed:$REPORT_DATE' --json number | jq 'length')
- **Active Pull Requests:** $(gh pr list --search 'org:$PROJECT_OWNER' --json number | jq 'length')
- **Repositories Updated:** $(git log --all --since='1 day ago' --oneline | wc -l)

### Feature Rollout Progress

#### MVP Core Features
- **Duration:** 4-6 weeks
- **Priority:** CRITICAL
- **Features:** 5

#### Advanced Agent Features
- **Duration:** 6-8 weeks
- **Priority:** HIGH
- **Features:** 5

#### Production Optimization
- **Duration:** 4-6 weeks
- **Priority:** HIGH
- **Features:** 5

#### User Experience Enhancement
- **Duration:** 3-4 weeks
- **Priority:** MEDIUM
- **Features:** 5


### Training Data Pipeline Status

- **compliance-agent**: Target 5,000 questions

- **formulation-agent**: Target 4,000 questions

- **science-agent**: Target 4,000 questions

- **marketing-agent**: Target 3,000 questions

- **operations-agent**: Target 3,500 questions

- **patent-agent**: Target 2,500 questions

- **sourcing-agent**: Target 2,500 questions

- **spectra-agent**: Target 2,000 questions

- **customer-success-agent**: Target 1,500 questions


### Next Actions Required
- [ ] Review blocked issues and dependencies
- [ ] Update project timeline and milestones
- [ ] Validate training data quality metrics
- [ ] Prepare weekly stakeholder report

---
*Report generated automatically by Formul8 project automation*
*Next update: $(date -d '+1 day' +%Y-%m-%d)*
"

# Save daily report
echo "$DAILY_REPORT" > "daily-reports/progress-$REPORT_DATE.md"

# Update project README with latest metrics
echo "📝 Updating project documentation..."

# Create or update project dashboard
cat > "PROJECT-DASHBOARD.md" << EOF
# Formul8 Project Dashboard

**Last Updated:** $TIMESTAMP
**Report Date:** $REPORT_DATE

## 🎯 Project Overview

Comprehensive tracking of training data acquisition across all 9 Formul8 AI agents

## 📈 Current Metrics

### Overall Progress
- **Total Repositories:** 9
- **Training Data Issues:** 9
- **Feature Issues:** 63
- **Estimated Training Questions:** 28,000

### Agent Status Matrix
| Agent | Priority | Features | Data Sources | Progress |
|-------|----------|----------|--------------|----------|
| compliance-agent | CRITICAL | 7 | 3 | 🔄 In Progress |
| formulation-agent | CRITICAL | 7 | 3 | 🔄 In Progress |
| science-agent | HIGH | 7 | 2 | 🔄 In Progress |
| marketing-agent | HIGH | 7 | 2 | 🔄 In Progress |
| operations-agent | HIGH | 7 | 2 | 🔄 In Progress |
| patent-agent | MEDIUM | 7 | 2 | 🔄 In Progress |
| sourcing-agent | MEDIUM | 7 | 2 | 🔄 In Progress |
| spectra-agent | MEDIUM | 7 | 2 | 🔄 In Progress |
| customer-success-agent | MEDIUM | 7 | 2 | 🔄 In Progress |

## 🚀 Feature Rollout Timeline


### Phase 1: MVP Core Features
- **Duration:** 4-6 weeks
- **Priority:** CRITICAL
- **Features:** 5

### Phase 2: Advanced Agent Features
- **Duration:** 6-8 weeks
- **Priority:** HIGH
- **Features:** 5

### Phase 3: Production Optimization
- **Duration:** 4-6 weeks
- **Priority:** HIGH
- **Features:** 5

### Phase 4: User Experience Enhancement
- **Duration:** 3-4 weeks
- **Priority:** MEDIUM
- **Features:** 5


## 📊 Daily Progress Tracking

### Today's Activity
- Issues closed: $(gh issue list --search 'org:$PROJECT_OWNER closed:$REPORT_DATE' --json number | jq 'length')
- Pull requests merged: $(gh pr list --search 'org:$PROJECT_OWNER merged:$REPORT_DATE' --json number | jq 'length')
- Repositories updated: $(git log --all --since='1 day ago' --oneline | wc -l)

### This Week's Goals
- Complete Phase 1 critical agent training data
- Deploy MVP core features
- Establish automated monitoring
- Begin user acceptance testing

## 🔗 Quick Links

- [Project Board]($PROJECT_URL)
- [Training Data Status](./daily-reports/)
- [Feature Development Status](./feature-status/)

---
*Dashboard updated automatically daily at 9:00 AM UTC*
EOF

echo "✅ Daily update complete!"
echo "📁 Files updated:"
echo "  - daily-reports/progress-$REPORT_DATE.md"
echo "  - PROJECT-DASHBOARD.md"
echo ""
echo "🔗 Project Dashboard: $PROJECT_URL"
echo "📊 View daily report: cat daily-reports/progress-$REPORT_DATE.md"

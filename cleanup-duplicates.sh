#!/bin/bash

# Close duplicate issues in F8ai/compliance-agent

# Keep most recent of each type, close older duplicates
echo "Closing duplicate Compliance Document issues..."
gh issue close 315 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #322"
gh issue close 304 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #322"

echo "Closing duplicate Real-time Regulatory issues..."
gh issue close 311 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #321"
gh issue close 298 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #321"
gh issue close 288 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #321"
gh issue close 284 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #321"
gh issue close 277 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #321"
gh issue close 274 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #321"
gh issue close 270 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #321"

echo "Closing duplicate Testing Requirements issues..."
gh issue close 313 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #320"
gh issue close 307 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #320"
gh issue close 294 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #320"
gh issue close 286 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #320"
gh issue close 285 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #320"
gh issue close 280 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #320"
gh issue close 271 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #320"

echo "Closing duplicate Licensing Compliance issues..."
gh issue close 314 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #319"
gh issue close 312 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #319"
gh issue close 309 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #319"
gh issue close 302 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #319"
gh issue close 292 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #319"
gh issue close 283 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #319"
gh issue close 281 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #319"
gh issue close 273 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #319"

echo "Closing duplicate SOP Verification issues..."
gh issue close 306 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #317"
gh issue close 303 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #317"
gh issue close 300 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #317"
gh issue close 295 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #317"
gh issue close 290 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #317"
gh issue close 272 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #317"
gh issue close 269 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #317"

echo "Closing duplicate Facility Compliance issues..."
gh issue close 310 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #318"
gh issue close 308 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #318"
gh issue close 305 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #318"
gh issue close 297 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #318"
gh issue close 291 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #318"
gh issue close 278 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #318"
gh issue close 275 --repo F8ai/compliance-agent --reason "not planned" --comment "Duplicate - consolidated into #318"

echo "Cleanup complete!"
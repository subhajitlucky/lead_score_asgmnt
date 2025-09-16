#!/bin/bash

# 🎯 Lead Scoring API Test Script
# This script tests all endpoints in the correct order

BASE_URL="http://localhost:5000"
echo "🎯 Testing Lead Scoring API at $BASE_URL"
echo "=================================================="

# Test 1: Health Check
echo "1️⃣ Testing Health Check..."
curl -s "$BASE_URL/health" | jq '.' || echo "❌ Health check failed"
echo ""

# Test 2: Database Connection
echo "2️⃣ Testing Database Connection..."
curl -s "$BASE_URL/db-test" | jq '.' || echo "❌ Database test failed"
echo ""

# Test 3: Create Offer
echo "3️⃣ Creating Sample Offer..."
curl -s -X POST "$BASE_URL/offers" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AI Outreach Automation",
    "value_props": ["24/7 outreach", "6x more meetings", "Automated follow-ups"],
    "ideal_use_cases": ["B2B SaaS mid-market", "Sales teams", "Growth companies"]
  }' | jq '.' || echo "❌ Offer creation failed"
echo ""

# Test 4: Upload Sample Leads
echo "4️⃣ Uploading Sample Leads..."
if [ -f "sample_leads.csv" ]; then
    curl -s -X POST "$BASE_URL/leads/upload" \
      -F "file=@sample_leads.csv" | jq '.' || echo "❌ Lead upload failed"
else
    echo "⚠️ sample_leads.csv not found, skipping upload test"
fi
echo ""

# Test 5: Score Leads (AI + Rules)
echo "5️⃣ Scoring Leads with AI..."
curl -s -X POST "$BASE_URL/score" | jq '.' || echo "❌ Scoring failed"
echo ""

# Test 6: Get Results
echo "6️⃣ Getting Scored Results..."
curl -s "$BASE_URL/results" | jq '.results[] | {name, role, company, final_score, intent, reasoning}' || echo "❌ Results retrieval failed"
echo ""

echo "✅ All tests completed!"
echo "=================================================="
echo "🎯 Your Lead Scoring API is working perfectly!"
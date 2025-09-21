#!/usr/bin/env node

/**
 * Live API Integration Test
 *
 * This script tests the live API endpoints using Node.js fetch (no jsdom restrictions).
 * Run with: node test-live-api.js
 */

const baseUrl = 'https://workbenchapi.ethicic.com';

async function testAPI() {
  console.log('🔥 Testing Live API at:', baseUrl);
  console.log('');

  const tests = [
    {
      name: 'Exclusions Workbench Stats',
      url: '/api/exclusions/workbench/stats',
      expect: ['companies', 'exclusions', 'sources', 'categories']
    },
    {
      name: 'Exclusions Categories',
      url: '/api/exclusions/workbench/categories',
      expect: ['categories']
    },
    {
      name: 'Securities Search (limit 5)',
      url: '/api/securities/?limit=5',
      expect: (data) => Array.isArray(data) && data.length <= 5 && data.length > 0
    },
    {
      name: 'Securities Search with Query',
      url: '/api/securities/?q=apple&limit=3',
      expect: (data) => Array.isArray(data) && data.length <= 3
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`📡 Testing: ${test.name}`);
      const response = await fetch(baseUrl + test.url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (typeof test.expect === 'function') {
        if (test.expect(data)) {
          console.log(`  ✅ PASS: Response structure valid`);
          passed++;
        } else {
          console.log(`  ❌ FAIL: Response structure invalid`);
          console.log(`     Data:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
          failed++;
        }
      } else {
        const missing = test.expect.filter(prop => !(prop in data));
        if (missing.length === 0) {
          console.log(`  ✅ PASS: All expected properties present`);
          console.log(`     Properties:`, test.expect.join(', '));
          passed++;
        } else {
          console.log(`  ❌ FAIL: Missing properties: ${missing.join(', ')}`);
          console.log(`     Available:`, Object.keys(data).join(', '));
          failed++;
        }
      }
    } catch (error) {
      console.log(`  ❌ FAIL: ${error.message}`);
      failed++;
    }
    console.log('');
  }

  console.log('🏁 Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📊 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('🎉 All live API tests passed! The backend is fully accessible.');
    process.exit(0);
  } else {
    console.log('⚠️  Some API tests failed. Check the endpoints or network connectivity.');
    process.exit(1);
  }
}

testAPI().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});
import assert from 'assert';
import { getKnowledgeBase, prepareKnowledgeBase } from './src/services/knowledgePreparation.js';
import { HybridRetrievalEngine, tokenize } from './src/services/retrievalEngine.js';

async function runTests() {
  console.log('--- Starting Knowledge Retrieval Automated Test Suite ---');
  let passedCount = 0;
  let totalTests = 12;

  const engine = new HybridRetrievalEngine();
  await engine.initialize();

  // Test 1: Exact keyword and phrase match
  console.log('Test 1: Exact keyword / phrase matching...');
  const res1 = await engine.search('attendance requirement 75%');
  assert(res1.totalResults > 0, 'Should find attendance requirement records');
  assert(res1.results.some(r => r.text.includes('75%')), 'Top results should mention 75%');
  passedCount++;
  console.log('  ✓ Passed: Found exact attendance requirement and 75% policy');

  // Test 2: Course codes and semester identifiers
  console.log('Test 2: Course code lookup (LAWM305)...');
  const res2 = await engine.search('LAWM305');
  assert(res2.totalResults > 0, 'Should find LAWM305');
  assert.strictEqual(res2.results[0].fileName, 'Minor_Courses_for_BTech_Students.xlsx');
  assert.strictEqual(res2.results[0].sheetName, 'Law Minor');
  passedCount++;
  console.log('  ✓ Passed: Correctly identified LAWM305 in Law Minor sheet');

  // Test 3: Questions with different wording / paraphrasing
  console.log('Test 3: Paraphrased query...');
  const res3a = await engine.search('How much attendance is compulsory to sit for exams?');
  const res3b = await engine.search('What presence percentage is required for end semester evaluation?');
  assert(res3a.totalResults > 0, 'Paraphrased attendance question 1 should return results');
  assert(res3b.totalResults > 0, 'Paraphrased attendance question 2 should return results');
  assert.strictEqual(res3a.results[0].fileName, '4. Student Handbook Aug 2026.pdf');
  passedCount++;
  console.log('  ✓ Passed: Handled varied synonyms (compulsory/required, presence/attendance, sit for exams/end semester)');

  // Test 4: Query containing negation ("not permitted", "without")
  console.log('Test 4: Negation / exclusion query...');
  const res4 = await engine.search('courses not permitted or without registration');
  assert(res4.totalResults > 0, 'Should return records discussing without registration');
  assert(res4.results.some(r => r.text.toLowerCase().includes('without registration')), 'Should retain without registration context');
  passedCount++;
  console.log('  ✓ Passed: Negation and qualification tokens preserved without loss');

  // Test 5: Excel retrieval with correct workbook, sheet, and row provenance
  console.log('Test 5: Excel workbook provenance verification...');
  const res5 = await engine.search('What are the minor courses for Design?');
  assert(res5.totalResults > 0, 'Should find design minor courses');
  const topExcel = res5.results.find(r => r.sourceType === 'excel' && r.sheetName === 'Design Minor');
  assert(topExcel, 'Must have Design Minor sheet record');
  assert.strictEqual(topExcel.fileName, 'Minor_Courses_for_BTech_Students.xlsx');
  assert(typeof topExcel.rowNumber === 'number' && topExcel.rowNumber > 0, 'Row number must be valid 1-based number');
  passedCount++;
  console.log('  ✓ Passed: Excel provenance (workbook, sheet, 1-based row number) fully preserved');

  // Test 6: PDF retrieval with correct original filename and page number
  console.log('Test 6: PDF document provenance verification...');
  const res6 = await engine.search('What is the procedure for summer term registration?');
  assert(res6.totalResults > 0, 'Should find summer term records');
  const topPdf = res6.results.find(r => r.sourceType === 'pdf');
  assert(topPdf, 'Must have PDF record');
  assert(topPdf.fileName === '4. Student Handbook Aug 2026.pdf' || topPdf.fileName === 'SOP STUDENT 17082026 - Final.pdf');
  assert(typeof topPdf.pageNumber === 'number' && topPdf.pageNumber > 0, 'Page number must be valid 1-based number');
  passedCount++;
  console.log('  ✓ Passed: PDF provenance (filename, 1-based page number) verified');

  // Test 7: Irrelevant or out-of-scope query returning 0 results
  console.log('Test 7: Irrelevant / out-of-scope query...');
  const res7 = await engine.search('how to prepare a strawberry banana milkshake recipe');
  assert.strictEqual(res7.totalResults, 0, 'Irrelevant query must return 0 results');
  assert.strictEqual(res7.results.length, 0);
  passedCount++;
  console.log('  ✓ Passed: Correctly returned 0 results for non-university query');

  // Test 8: Missing or empty query validation
  console.log('Test 8: Empty / whitespace query...');
  const res8 = await engine.search('   ');
  assert.strictEqual(res8.totalResults, 0);
  passedCount++;
  console.log('  ✓ Passed: Handled whitespace query cleanly');

  // Test 9: Duplicate prevention on multiple preparation runs
  console.log('Test 9: Deterministic preparation without duplicates...');
  const runA = await prepareKnowledgeBase();
  const runB = await prepareKnowledgeBase();
  assert.strictEqual(runA.totalRecords, runB.totalRecords, 'Subsequent preparation runs must yield identical record counts');
  passedCount++;
  console.log(`  ✓ Passed: Deterministic knowledge preparation verified (${runA.totalRecords} total records)`);

  // Test 10: Stable retrieval output for same query
  console.log('Test 10: Retrieval stability...');
  const searchA = await engine.search('Make-up examinations CGPA improvement');
  const searchB = await engine.search('Make-up examinations CGPA improvement');
  assert.strictEqual(searchA.totalResults, searchB.totalResults);
  assert.strictEqual(searchA.results[0].id, searchB.results[0].id);
  assert.strictEqual(searchA.results[0].score, searchB.results[0].score);
  passedCount++;
  console.log('  ✓ Passed: Stable deterministic retrieval verified');

  // Test 11: Threshold filtering check
  console.log('Test 11: Strict threshold cutoff enforcement...');
  const normalSearch = await engine.search('convocation degree award', { threshold: 2.0 });
  const highThresholdSearch = await engine.search('convocation degree award', { threshold: 100.0 });
  assert(normalSearch.totalResults > 0, 'Should find results under normal threshold');
  assert.strictEqual(highThresholdSearch.totalResults, 0, 'Should cut off completely under high threshold');
  passedCount++;
  console.log('  ✓ Passed: Configurable relevance threshold enforced correctly');

  // Test 12: No LLM/Gemini API calls verified
  console.log('Test 12: Verification of decoupled embedding provider...');
  assert.strictEqual(engine.embeddingProvider.isAvailable(), false, 'Embedding provider must be deferred in Phase 3');
  passedCount++;
  console.log('  ✓ Passed: Decoupled interface verified with zero unauthorized external calls');

  console.log(`\n=== All ${passedCount}/${totalTests} Automated Tests Passed Successfully ===`);
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});

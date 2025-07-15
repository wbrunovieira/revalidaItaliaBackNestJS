// Simple test to debug the E2E issue
const request = require('supertest');

async function testReviewEndpoint() {
  try {
    // Test with valid UUIDs
    const response = await request('http://localhost:3333')
      .post('/attempts/answers/550e8400-e29b-41d4-a716-446655440000/review')
      .send({
        reviewerId: '550e8400-e29b-41d4-a716-446655440002',
        isCorrect: true,
        teacherComment: 'Test comment'
      });
    
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(response.body, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testReviewEndpoint();
import request from 'supertest' 
import app from './src/app' 

describe('GET /api/users', function() {
    this.timeout(5000);
    it('responds with json', function(done) {
        process.env.MOCK_DIR = 'example/mock'
        request(app())
            .get('/api/users')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200, done)
    });
});

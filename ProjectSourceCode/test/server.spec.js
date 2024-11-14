// ********************** Initialize server **********************************

const server = require('../src/index'); //TODO: Make sure the path to your index.js is correctly added DONE

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const { assert, expect } = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
    // Sample test case given to test / endpoint.
    it('Returns the default welcome message', done => {
        chai
            .request(server)
            .get('/welcome')
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.status).to.equals('success');
                assert.strictEqual(res.body.message, 'Welcome!');
                done();
            });
    });
});

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************

describe('Testing register API', () => {
    it('positive : /register', done => {
        chai
          .request(server)
          .post('/register')
          .send({id: 1, img: '', username: 'JDPower2077', email: 'john.doe27@gmail.com' ,password: 'fAc3l3$SbA$7aRd_27'})
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.message).to.equal('Success');
            done();
          })
    })
    it('negative : /register', done => {
        chai
          .request(server)
          .post('/register')
          .send({id: '1', img: '', username: 10, email: 10, password: 10})
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.message).to.equals('Invalid input');
            done();
          })
    })
})
//desc

// ********************************************************************************
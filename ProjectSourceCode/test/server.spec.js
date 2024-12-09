// ********************** Initialize server **********************************

const server = require('../src/index'); //TODO: Make sure the path to your index.js is correctly added DONE

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const { assert, expect } = chai;




before(function() {
  this.timeout(5000); //make sure this test doesn't take too long
});

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
            //expect(res.body.message).to.equal('Success');
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

describe('Testing login API', () => {
  it('positive: /login - successful login with valid credentials', done => {
    const agent = chai.request.agent(server);
    agent
      .post('/login')
      .send({
        username: 'test',
        password: '123456'
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.text).to.include('Profile'); // Check for profile page content
        agent.close();
        done();
      });
  });
});


describe('Testing logout functionality', () => {
  it('positive: /logout - successfully destroys session and redirects', done => {
    const agent = chai.request.agent(server);
    // First login to create a session
    agent
      .post('/login')
      .send({ 
        username: 'test', 
        password: '123456' 
      })
      .then(() => {
        // Then test logout
        agent
          .get('/logout')
          .end((err, res) => {
            expect(res).to.have.status(200);
            // Check for login page elements that we know exist
            expect(res.text).to.include('Connect with the celestial lights again soon');
            agent.close();
            done();
          });
      })
      .catch(err => {
        agent.close();
        done(err);
      });
  });
});

describe('Testing social page functionality', () => {
  it('positive: /social - successfully displays posts when logged in', done => {
    const agent = chai.request.agent(server);
    agent
      .post('/login')
      .send({ username: 'test', password: '123456' })
      .then(() => {
        agent
          .get('/social')
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.text).to.include('Post'); // Check for post section
            agent.close();
            done();
          });
      });
  });

  it('negative: /social - redirects to login when not authenticated', done => {
    chai
      .request(server)
      .get('/social')
      .end((err, res) => {
        expect(res).to.redirect;
        expect(res.text).to.include('/login'); // Should redirect to login page
        done();
      });
  });
}); 

//run the tests on docker using docker-compose exec web npm test once it's already up!

// ********************************************************************************
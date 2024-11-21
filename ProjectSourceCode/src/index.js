// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcryptjs'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part C.

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
    extname: 'hbs',
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials',
});

// database configuration
const dbConfig = {
    host: 'dpg-csvpcgjtq21c73frnd50-a', // the database server
    port: 5432, // the database port
    database: process.env.POSTGRES_DB, // the database name
    user: process.env.POSTGRES_USER, // the user account to connect with
    password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
    .then(obj => {
        console.log('Database connection successful'); // you can view this message in the docker compose logs
        obj.done(); // success, release the connection;
    })
    .catch(error => {
        console.log('ERROR:', error.message || error);
    });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        saveUninitialized: false,
        resave: false,
    })
);

app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************

// TODO: - Include API routes here
app.get('/welcome', (req, res) => {
    res.json({ status: 'success', message: 'Welcome!' });
});

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/register', (req, res) => {
    res.render('pages/register');
});

app.post('/register', async (req, res) => {
    const img = "./resources/images/default.png";
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ message: "Invalid input" })
    }
    try {

        const hash = await bcrypt.hash(password, 10);

        const query = 'INSERT INTO users (img, username, email, password) VALUES ($1, $2, $3, $4)';
        const values = [img, username, email, hash];

        await db.none(query, values);
        return res.status(200).json(res.redirect('/login'));
    }
    catch (error) {
        console.error('Database error: ', error);
        return res.redirect('/register');
    }
});

async function getAuroraData(lat, long) {
    const apiUrl = `http://api.auroras.live/v1/?type=all&lat=${lat}&long=${long}&forecast=false&threeday=false`;
    try {
        const response = await axios.get(apiUrl);
        return response.data;
    } catch (error) {
        console.error('Error fetching aurora data:', error);
        throw error;
    }
}

app.get('/aurora', async (req, res) => {
    try {
        const auroraData = await getAuroraData(req.query.latitude, req.query.longitude);

        let aurora_nearby_probability = auroraData.probability.calculated.value;
        let aurora_probaility = auroraData.probability.value;
        let aurora_best_probability = auroraData.probability.highest.value;
        let aurora_best_lat = auroraData.probability.highest.lat;
        let aurora_best_long = auroraData.probability.highest.long;

        const aurora = {
            nearby_prob: aurora_nearby_probability,
            aurora_prob: aurora_probaility,
            best_prob: aurora_best_probability,
            best_lat: aurora_best_lat,
            best_long: aurora_best_long
        };
        res.status(200).render('pages/finder.hbs', {
            nearby_prob: aurora_nearby_probability,
            aurora_prob: aurora_probaility,
            best_prob: aurora_best_probability,
            best_lat: aurora_best_lat,
            best_long: aurora_best_long
        });

    } catch (error) {
        console.log(error);
        res.status(500).send('Error retrieving aurora data');
    }
});

app.get('/login', (req, res) => {
    res.render('pages/login');
});

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const query = 'SELECT * FROM users WHERE username = $1 LIMIT 1';
    const values = [username];

    db.one(query, values)
        .then(data => {
            bcrypt.compare(password, data.password).then(match => {
                if (!match) {
                    return res.render('pages/login', { message: 'Incorrect username or password.' });
                }

                const user = {
                    user_id: data.user_id,
                    profile_pic: data.profile_pic,
                    username: data.username,
                };

                req.session.user = user;
                req.session.save();

                res.redirect('/finder');
            });
        })
        .catch(err => {
            console.log(err);
            res.redirect('/register');
        });
});

// Authentication Middleware.
const auth = (req, res, next) => {
    if (!req.session.user) {
        // Default to login page.
        return res.redirect('/login');
    }
    next();
};

app.use(auth);

app.get('/finder', (req, res) => {
    res.render('pages/finder');
});

app.get('/profile', (req, res) => {
    res.render('pages/profile');
});

app.get('/social', (req, res) => {
    res.render('pages/social');
});

// Finder API calls

// Test Call
// const getData = async () => {
//     const response = await fetch('http://api.auroras.live/v1/?type=ace&data=bz')
//     const data = await response.json();

//     return data;
// };

// getData().then(data => console.log('resolved:', data));

// fetch('http://api.auroras.live/v1/?type=all&lat=40.7813913&long=-73.976902&forecast=false&threeday=false')
//     .then(response => response.json())
//     .then(data => console.log(data))
//     .catch(error => console.error(error));


// fetch('http://api.auroras.live/v1/?type=ace&data=bz')
//     .then(response => response.json())
//     .then(data => console.log(data))
//     .catch(error => console.error(error));

// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000); // for testing: module.exports = app.listen(3000); regularly: app.listen(3000)
console.log('Server is listening on port 3000');
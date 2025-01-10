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
app.use(express.static('src/resources'));


// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

app.use(express.static(__dirname + '/')); // from Write-Up: enables relative paths

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
    extname: 'hbs',
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials',
});

// database configuration
const dbConfig = {
    // host: 'dpg-csvpcgjtq21c73frnd50-a', // the database server use 'db' for the local host
    host: 'db',
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
app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
    //Wasn;t sure if we needed cookies or not so I included it for now
    // cookie: {
    //     maxAge: 1000 * 60 * 60 * 24 // 24 hours
    // }
}));

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
    res.redirect('/home');
});

app.get('/register', (req, res) => {
    res.render('pages/register');
});

app.get('/home', (req, res) => {
    //pass the user to home screen only if it already exists
    if (!req.session.user) {
        res.render('pages/home', {
            user: null
        });
    } else {
        res.render('pages/home', {
            user: req.session.user
        });
    }
});


app.get('/profile', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const query = `
        SELECT posts.*, users.username 
        FROM posts 
        JOIN users ON posts.user_id = users.id 
        WHERE posts.user_id = $1
        ORDER BY posts.id DESC`;

    db.any(query, [req.session.user.user_id])
        .then(posts => {
            console.log('Posts for user:', posts); // Debug log
            res.render('pages/profile', {
                user: req.session.user,
                posts: posts,
                username: req.session.user.username
            });
        })
        .catch(err => {
            console.error('Database error:', err);
            res.status(500).send('Error retrieving posts');
        });
});


const multer = require('multer');
const upload = multer();


app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        //take image from the request and convert it to base64
        const imageBuffer = req.file.buffer;
        const base64Image = imageBuffer.toString('base64');
        const mimeType = req.file.mimetype;
        const base64String = `data:${mimeType};base64,${base64Image}`;

        //insert the image into the database
        const query = 'INSERT INTO posts (img, text, user_id) VALUES ($1, $2, $3)';
        await db.none(query, [base64String, req.body.text, req.session.user.user_id]);

        //reload the page to show the new post
        res.redirect('/profile');
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).send('Error uploading image');
    }
});


app.get('/update-profile-pic', (req, res) => {
    res.redirect('/profile'); // Redirect GET requests to profile page (Onrender issue)
});

app.post('/update-profile-pic', upload.single('image'), async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.session?.user) {
            return res.redirect('/login');
        }

        // Validate file upload
        if (!req.file) {
            throw new Error('No file uploaded');
        }

        const imageBuffer = req.file.buffer;
        const base64Image = imageBuffer.toString('base64');
        const mimeType = req.file.mimetype;
        const base64String = `data:${mimeType};base64,${base64Image}`;

        const query = 'UPDATE users SET img = $1 WHERE id = $2 RETURNING img';
        const result = await db.one(query, [base64String, req.session.user.user_id]);

        // Update session with new profile pic
        req.session.user.profile_pic = result.img;

        res.redirect('/profile');
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).send('Error uploading profile picture');
    }
});


async function convertToBase64(imagePath) {
    // If no image path provided, use default
    const img = imagePath || './resources/images/default.jpeg';

    try {
        // Handle both local files and URLs
        if (img.startsWith('http')) {
            const response = await axios.get(img, { responseType: 'arraybuffer' });
            const base64 = Buffer.from(response.data, 'binary').toString('base64');
            return `data:image/jpeg;base64,${base64}`;
        } else {
            const data = fs.readFileSync(img);
            const base64 = data.toString('base64');
            const fileExtension = img.split('.').pop().toLowerCase();
            return `data:image/${fileExtension};base64,${base64}`;
        }
    } catch (error) {
        console.error('Error converting image to base64:', error);
        throw error;
    }
}

app.post('/register', async (req, res) => {
    const img = "data:image/png;base64,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";
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

        let aurora_nearby_probability = "is " + auroraData.probability.calculated.value + "%.";
        let aurora_probaility = "is " + auroraData.probability.value + "%.";
        let aurora_best_probability = "is " + auroraData.probability.highest.value + "% ";
        let aurora_best_lat = "at the coordinate location (" + auroraData.probability.highest.lat;
        let aurora_best_long = ", " + auroraData.probability.highest.long + ").";

        const aurora = {
            nearby_prob: aurora_nearby_probability,
            aurora_prob: aurora_probaility,
            best_prob: aurora_best_probability,
            best_lat: aurora_best_lat,
            best_long: aurora_best_long
        };
        // Try res.send() instead
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

                req.session.user = {
                    user_id: data.id,
                    username: data.username,
                    profile_pic: data.img || "data:image/png;base64,..." // Add default image here if none
                };

                res.redirect('/profile');
            });
        })
        .catch(err => {
            console.log(err);
            res.render('pages/login', { message: 'Incorrect username or password.' });
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

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.render('pages/logout');
});


app.get('/finder', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('pages/finder', {
        user: req.session.user
    });
});

app.get('/social', (req, res) => {
    const query = 'SELECT  posts.img AS post_img, users.img AS user_img, users.username AS username, posts.text AS text FROM posts JOIN users ON posts.user_id = users.id ORDER BY posts.id DESC;';

    db.any(query)
        .then(results => {
            res.render('pages/social', { posts: results });
        })
        .catch(err => {
            console.error(err);
            res.status(400).send('Error selecting the data from posts');
        });
});

// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
// Only start server if file is run directly
// In index.js
if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port);
}
module.exports = app;
console.log('Server is listening on port 3000');

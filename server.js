const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
require('dotenv').config();

// Cloudinary configuration
const cloudinary = require('cloudinary').v2
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ url: process.env.CLOUDINARY_URL })
} else {
  console.warn('CLOUDINARY_URL is not set in .env file. Image uploads will not work.');
}

// Multer for file uploads (memory storage for Cloudinary)
const multer = require('multer')
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'))
    }
  }
})


//controllers
const venueController = require('./controllers/venueController')//controller for venue page route
const eventController = require('./controllers/eventController')
const timesController = require('./controllers/timesController')
const bookingController = require('./controllers/bookingController')

//middleware
const { requireAuth, requireAdmin, setUserLocals } = require('./middleware/auth')

//env validation
const uri = process.env.MONGO_URI;//use .env variable
if (!uri) {
  console.error("MONGO_URI is not defined in .env file");
  process.exit(1);
}
const port = process.env.PORT;
if (!port) {
  console.error("PORT is not defined in .env file");
  process.exit(1);
}
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  console.error("SESSION_SECRET is not defined in .env file");
  process.exit(1);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));//for parsing form data
app.use(express.static('public'));

// Session middleware (for login)
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
}));

app.set('view engine', 'ejs');
app.set('views', './Views');

// make user available in all EJS views
app.use(setUserLocals)

//request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`); // logs every request
  next();
});

// shortcut routes so /login and /register still work
app.get('/login',    (req, res) => res.redirect('/auth/login'))
app.get('/register', (req, res) => res.redirect('/auth/register'))


//models for view
const Event = require('./models/event');
const Times = require('./models/times');

//------------------------------routes-------------------------------
app.use('/auth', require('./routes/authRoutes'));
app.use('/api/events',require('./routes/eventRoutes'));
app.use('/api/venues',require('./routes/venueRoutes'));
app.use('/api/times',require('./routes/timesRoutes'));
app.use('/api/bookings',require('./routes/bookingRoutes'));
app.use('/api/enquiries',require('./routes/enqueryRoutes'));

// Image upload endpoint
app.post('/api/upload-image', requireAdmin, upload.single('file'), eventController.uploadImage);


//------------------------View Routes-------------------------
// Home – event listing with search / filter
app.get('/', async (req, res) => {
  try {
    let matchStage = {};
    if (req.query.search) { matchStage.name = { $regex: req.query.search, $options: 'i' };}
    if (req.query.category) {matchStage.category = req.query.category;}

    const events = await Event.aggregate([
      { $match: matchStage },
      { $lookup: { from: 'times', localField: '_id', foreignField: 'eventID', as: 'timeSlots'}},
      { $addFields: { totalAvailable: { $sum: '$timeSlots.seatsAvailable' }, earliestDate:{ $min: '$timeSlots.eventTime' }}},
      {
        $match: {
          ...(req.query.date ? {
            earliestDate: {
              $gte: new Date(req.query.date),
              $lt:  new Date(new Date(req.query.date).setDate(new Date(req.query.date).getDate() + 1))
            }
          } : {}),
          ...(req.query.availability === 'available' ? { totalAvailable: { $gt: 0 } } : {}),
          ...(req.query.availability === 'soldout'   ? { totalAvailable: { $eq: 0 } } : {})
        }
      },
      { $lookup: {from: 'venues', localField: 'venueID', foreignField: '_id', as: 'venue'}},
      { $unwind: { path: '$venue', preserveNullAndEmptyArrays: true } }
    ]);
    res.render('index', { events, query: req.query });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading events');
  }
});


// Public event view page
app.get('/view-event', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.redirect('/');
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).send('Invalid event ID');
    const event = await Event.findById(id).populate('venueID').lean(); //get event and venue details
    if (!event) return res.status(404).send('Event not found');
    const timeSlots = await Times.find({ eventID: id }).sort({ eventTime: 1 }).lean();//get time slots for event
    res.render('view-event', { event, timeSlots });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading event');
  }
});

// Auth / misc pages
app.get('/contact', (req, res) => res.render('contact'));


//protected user path
app.get('/booking', requireAuth, bookingController.getBookingPage);


app.get('/events', requireAdmin, eventController.getEventsPage)
app.get('/times-admin', requireAdmin, timesController.getTimesPage)


//admin routes
app.get('/venues', requireAdmin, venueController.getVenuesPage);
app.get('/booking-admin', requireAdmin, bookingController.getAdminBookingPage);
app.get('/enquiries', requireAdmin, (req, res) => res.render('enquiries'));
//database start — start server only after DB connection is established
mongoose.connect(uri)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch(err => { console.error("Could not connect to MongoDB", err); process.exit(1); });
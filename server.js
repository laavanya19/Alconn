const express = require("express");
const path = require('path');
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const session = require("express-session");
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public")); // Serve static files (HTML, CSS, JS)
app.use(express.json()); // To parse JSON body properly

app.use(session({
    secret: process.env.SESSION_SECRET || "secret-key", // Ensure SESSION_SECRET is defined in .env
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set secure: true if using HTTPS
}));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

// Student Schema
const studentSchema = new mongoose.Schema({
    RollNumber: String,
    FirstName: String,
    LastName: String,
    Password: String,
    Department: String,
    "Joining Year": String,
    "Passing Year": String
});

const Student = mongoose.model("Student", studentSchema);

// Routes
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/views/index.html");
});

app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/public/views/login.html");
});

app.get("/student-login", (req, res) => {
    res.sendFile(__dirname + "/public/views/student-login.html");
});

// POST route to handle Student Login
app.post("/student-login", async (req, res) => {
    const { rollNumber, password } = req.body;

    try {
        const student = await Student.findOne({ RollNumber: rollNumber, Password: password });
        if (student) {
            console.log("✅ Student logged in:", student.FirstName);
            // You can send dashboard or redirect here
            res.sendFile(__dirname + "/public/views/student-dashboard.html");
        } else {
            console.log("❌ Invalid credentials");
            res.send("Invalid Roll Number or Password. Please <a href='/student-login'>try again</a>.");
        }
    } catch (err) {
        console.error("❌ Error during login:", err);
        res.status(500).send("Internal Server Error");
    }
});

// API to get student details by Roll Number (for fetching on dashboard)
app.get("/api/student/:rollNumber", async (req, res) => {
    const rollNumber = req.params.rollNumber;

    try {
        const student = await Student.findOne({ RollNumber: rollNumber });
        if (student) {
            res.json(student);
        } else {
            res.status(404).json({ error: "Student not found" });
        }
    } catch (err) {
        console.error("❌ Error fetching student:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/student-dashboard", (req, res) => {
    res.sendFile(__dirname + "/public/views/student-dashboard.html");
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
//alumni login
app.get("/alumni-login", (req, res) => {
    res.sendFile(__dirname + "/public/views/alumni-login.html");
});
//admin-login
app.get("/admin-login", (req, res) => {
    res.sendFile(__dirname + "/public/views/admin-login.html");
});
//alumni-register
// Serve Alumni registration page
app.get("/alumni-register", (req, res) => {
    res.sendFile(__dirname + "/public/views/alumni-register.html");
});
//alumni-dollection
// Alumni Schema
const alumniSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    rollNumber: String,
    passoutYear: Number,
    branch: String,
    phoneNumber: String,
    email: String,
    password: String,
    currentCompany: String,
    currentRole: String,
    pastCompanies: String,
    linkedin: String,
    city: String,
    country: String,
    alumniID: String // To store generated unique Alumni ID
});

const Alumni = mongoose.model("Alumni", alumniSchema); // This will create 'alumni' collection
// POST route to handle Alumni Registration
app.post("/alumni-register", async (req, res) => {
    const {
        firstName, lastName, rollNumber, passoutYear, branch,
        phoneNumber, email, password, currentCompany, currentRole,
        pastCompanies, linkedin, city, country
    } = req.body;

    // Generate Alumni ID (encoding format: BranchCode-PassoutYear-RollNumber)
    const branchCode = branch.substring(0, 3).toUpperCase(); // First 3 letters of branch
    const alumniID = `${branchCode}-${passoutYear}-${rollNumber}`;

    try {
        const newAlumni = new Alumni({
            firstName,
            lastName,
            rollNumber,
            passoutYear,
            branch,
            phoneNumber,
            email,
            password, // Later you can hash this password
            currentCompany,
            currentRole,
            pastCompanies,
            linkedin,
            city,
            country,
            alumniID
        });

        await newAlumni.save(); // Save to MongoDB
        console.log("✅ Alumni registered:", firstName, alumniID);
        res.send(`<h2>Registration Successful!</h2><p>Your Alumni ID: ${alumniID}</p><a href="/alumni-login">Go to Login</a>`);
    } catch (err) {
        console.error("❌ Error registering alumni:", err);
        res.status(500).send("Internal Server Error. Please try again later.");
    }
});


// alumni-dashboard route to serve alumni dashboard page
app.get("/alumni-dashboard", (req, res) => {
    res.sendFile(__dirname + "/public/views/alumni-dashboard.html");
});
// POST route to handle Alumni Login via Email or Roll Number
// POST route to handle Alumni Login via Email, Roll Number, or Alumni ID (API-based for fetch)
// POST route to handle Alumni Login via Email, Roll Number, or Alumni ID (API-based for fetch)
app.post("/alumni-login", async (req, res) => {
    const { emailOrRoll, password } = req.body;

    console.log("📥 Login attempt with:", emailOrRoll, password);

    try {
        // Input normalization
        const searchInput = emailOrRoll.trim().toLowerCase();
        console.log("🔍 Normalized search input:", searchInput);

        // Find alumni by email, rollNumber, or alumniID
        const alumni = await Alumni.findOne({
            $or: [
                { email: searchInput },
                { alumniID: emailOrRoll.trim() }, // Alumni ID is case-sensitive as per DB
                { rollNumber: emailOrRoll.trim() } // Roll number as is
            ]
        });

        console.log("🎯 Alumni found:", alumni);

        if (alumni) {
            // Password match check
            if (alumni.password === password) {
                console.log("✅ Password matched for:", alumni.firstName);

                return res.status(200).json({
                    message: "Login successful",
                    alumni: {
                        firstName: alumni.firstName,
                        lastName: alumni.lastName,
                        alumniID: alumni.alumniID,
                        email: alumni.email,
                        branch: alumni.branch,
                        passoutYear: alumni.passoutYear,
                        currentCompany: alumni.currentCompany,
                        currentRole: alumni.currentRole,
                        linkedin: alumni.linkedin,
                        rollNumber: alumni.rollNumber
                    }
                });
            } else {
                console.log("❌ Password mismatch for:", emailOrRoll);
                return res.status(401).json({ message: "Invalid password. Please try again." });
            }
        } else {
            console.log("❌ No matching alumni found for:", emailOrRoll);
            return res.status(404).json({ message: "Email, Roll Number, or Alumni ID not found. Please register first." });
        }
    } catch (err) {
        console.error("🔥 Error during alumni login:", err);
        return res.status(500).json({ message: "Internal Server Error. Please try again later." });
    }
});

// Alumni mentorship route
app.get("/alumni-mentorship", (req, res) => {
    res.sendFile(__dirname + "/public/views/alumni-mentorship.html");
});
app.use('/views', express.static(__dirname + '/public/views'));

app.get('/alumni-job-offers', (req, res) => {
    res.sendFile(__dirname + '/public/views/alumni-job-offers.html');
});

app.get('/alumni-events', (req, res) => {
    res.sendFile(__dirname + '/public/views/alumni-events.html');
});


// Serve offermentorship.html properly
app.get('/offermentorship', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'offermentorship.html'));
  });
  
  // Keep your schema as is
const mentorshipSchema = new mongoose.Schema({
    mentorName: String,
    expertise: String,
    topic: String,
    description: String,
    duration: Number,
    mode: String, 
    skillsRequired: [String],
    seats: Number,
    timings: String,
    contact: String
});

const Mentorship = mongoose.model("Mentorship", mentorshipSchema);

// Add this route to match your form submission
app.post("/offer-mentorship", async (req, res) => {
    console.log("📥 Mentorship Offer Data:", req.body);
    
    try {
        const {
            mentorName, // From form
            expertise,
            topic,
            description,
            duration,
            mode,
            skillsRequired,
            seats, // From form
            timings, // From form
            contact // From form
        } = req.body;

        const skillsArray = typeof skillsRequired === 'string' ? skillsRequired.split(',').map(skill => skill.trim()) : skillsRequired;
        // Create new mentorship with fields that match your schema
        const newMentorship = new Mentorship({
            mentorName, // Map to schema field
            expertise,
            topic,
            description,
            duration,
            mode,
            skillsRequired: skillsArray, // Already an array from form
            seats, // Map to schema field
            timings, // Map to schema field
            contact // Map to schema field
        });

        await newMentorship.save();
        console.log("✅ Mentorship Offer Registered:", newMentorship);
        res.status(201).json({ message: "Mentorship offer added successfully!" });
    } catch (err) {
        console.error("❌ Error offering mentorship:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
///// changes
app.get("/get-mentorships", async (req, res) => {
    const { alumniEmail } = req.query;

    try {
        const mentorships = await Mentorship.find({ contact: alumniEmail });
        res.json(mentorships);
    } catch (err) {
        console.error("❌ Error fetching mentorships for alumni:", err);
        res.status(500).send("Internal Server Error");
    }
});

//deletion
// Delete mentorship by ID
app.delete('/delete-mentorship/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const deleted = await Mentorship.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Mentorship not found' });
      }
  
      console.log("🗑️ Deleted Mentorship:", deleted);
      res.status(200).json({ message: 'Mentorship deleted successfully' });
    } catch (err) {
      console.error("❌ Error deleting mentorship:", err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  ////job offers
  const jobOfferSchema = new mongoose.Schema({
    jobTitle: String,
    companyName: String,
    location: String,
    description: String,
    applyLink: String,
    postedBy: String,
    skills: [String] // Added this field
  });
  
  jobOfferSchema.index(
    { companyName: 1, applyLink: 1 },
    { unique: true }
  );
  
  const JobOffer = mongoose.model("JobOffer", jobOfferSchema);
  
  app.post("/alumni-job-offers", async (req, res) => {
    try {
      const { jobTitle, companyName, location, description, applyLink, skills } = req.body;
  
      const newJob = new JobOffer({
        jobTitle,
        companyName,
        location,
        description,
        applyLink,
        skills, // Include the skills in the document
      });
  
      await newJob.save();
      res.status(201).json({ message: "Job offer posted successfully!" });
  
    } catch (err) {
      if (err.code === 11000) {
        res.status(409).json({ message: "This job (based on title, company, location, and link) is already posted." });
      } else {
        console.error("❌ Error posting job:", err);
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });
  
  

// GET all job offers
app.get('/job-offers', async (req, res) => {
  try {
    const jobs = await JobOffer.find();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
});

// DELETE job offer
app.delete('/job-offers/:id', async (req, res) => {
  try {
    await JobOffer.findByIdAndDelete(req.params.id);
    res.json({ message: "Job offer deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete job" });
  }
});


  ///// admin shuru
  const adminSchema = new mongoose.Schema({
    email: String,
    password: String
  });
  
  const Admin = mongoose.model("Admin", adminSchema);
  app.get('/admin-dashboard', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'views', 'admin-dashboard.html');
    console.log("Admin dashboard file path:", filePath);
    res.sendFile(filePath);
  });
  
  app.post('/admin-login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const admin = await Admin.findOne({ email, password });
      if (admin) {
        // Login success - redirect to admin dashboard
        res.redirect('/admin-dashboard'); 
      } else {
        res.send("Invalid Admin Credentials");
      }
    } catch (err) {
      console.error("Admin login error:", err);
      res.status(500).send("Server Error");
    }
  });
  app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).send("Logout Error");
      }
      res.clearCookie('connect.sid'); // Clear session cookie
      res.redirect('/admin-login'); // Redirect to the login page
    });
  });
  
/////////// events 

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  mode: { type: String, enum: ['Offline', 'Online'], required: true },
  organizerName: { type: String, required: true },
  registrationLink: { type: String, required: true },
  audience: { type: String, required: true },
  contactInfo: { type: String, required: true },
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
// POST: Create a new event
app.post('/admin/events', async (req, res) => {
    const { title, description, date, time, location, mode, organizerName, registrationLink, audience, contactInfo } = req.body;
  
    try {
      const newEvent = new Event({
        title,
        description,
        date,
        time,
        location,
        mode,
        organizerName,
        registrationLink,
        audience,
        contactInfo
      });
  
      // Save the event to the database
      await newEvent.save();
      res.status(201).json(newEvent);
    } catch (err) {
      console.error("Error posting event:", err);
      res.status(500).send("Server Error");
    }
  });

  //////////////
  // GET: Fetch all events
app.get('/admin/events', async (req, res) => {
    try {
      const events = await Event.find();  // Fetch all events
      res.status(200).json(events);
    } catch (err) {
      console.error("Error fetching events:", err);
      res.status(500).send("Server Error");
    }
  });

  /////////////
  // DELETE: Delete an event
app.delete('/admin/events/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const event = await Event.findByIdAndDelete(id);
      if (!event) {
        return res.status(404).send("Event not found");
      }
      res.status(200).send("Event deleted successfully");
    } catch (err) {
      console.error("Error deleting event:", err);
      res.status(500).send("Server Error");
    }
  });
  
  //// alumni directory
  // Route 1: Get all alumni for Alumni Directory
app.get("/api/alumni", async (req, res) => {
  try {
      const alumniList = await Alumni.find({}, {
          firstName: 1,
          lastName: 1,
          currentCompany: 1,
          currentRole: 1,
          city: 1,
          country: 1,
          linkedin: 1,
          alumniID: 1,
          _id: 0 // optional: don't return internal MongoDB ID
      });
      res.json(alumniList);
  } catch (err) {
      console.error("❌ Error fetching alumni:", err);
      res.status(500).json({ error: "Failed to fetch alumni data" });
  }
});

// Route 2: Handle 'Connect' button logic (you can later store connections if needed)
app.post("/api/connect-alumni", async (req, res) => {
  const { alumniID } = req.body;
  try {
      console.log(`🤝 Connect requested for Alumni ID: ${alumniID}`);
      // Optional: Store connection or update status here
      res.json({ success: true });
  } catch (err) {
      console.error("❌ Error connecting alumni:", err);
      res.status(500).json({ success: false });
  }
});
//// get mentorships to students 
app.get("/mentorships", async (req, res) => {
  try {
      const mentorships = await Mentorship.find({});
      res.json(mentorships); // Send all mentorship offers
  } catch (error) {
      console.error("❌ Error fetching mentorships:", error);
      res.status(500).json({ message: "Server Error" });
  }
});
//// events for students 
// GET: Fetch all events
app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).send("Server Error");
  }
});
/// find jobs for students 
// GET: Fetch all job offers
app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await JobOffer.find().sort({ _id: -1 }); // Optional sorting
    res.json(jobs);
  } catch (err) {
    console.error("Error fetching job offers:", err);
    res.status(500).send("Server Error");
  }
});
/// ai algo 
// Route to handle the student interests and find matching alumni
// app.post('/find-alumni', async (req, res) => {
//   const { interests } = req.body;

//   try {
//       const alumni = await Alumni.find({
//           $or: [
//               { currentRole: { $regex: interests, $options: 'i' } },
//               { pastCompanies: { $regex: interests, $options: 'i' } },
//               { branch: { $regex: interests, $options: 'i' } }
//           ]
//       });
//       res.json(alumni);  // Send the found alumni to the frontend
//   } catch (err) {
//       console.error("Error finding alumni:", err);
//       res.status(500).json({ message: "Internal server error" });
//   }
// });

// Endpoint to handle student interests and find matched alumni
const { spawn } = require('child_process');

// Endpoint to handle student interests and find matched alumni
app.post('/find-alumni', async (req, res) => {
    const studentInterests = req.body.interests;  // Assuming student interests are sent in the request body

    // Query the MongoDB collection to find all alumni
    const alumniProfiles = await Alumni.find({});

    // Prepare the data to send to the Python script
    const data = JSON.stringify({ interests: studentInterests, alumni: alumniProfiles });

    // Run the Python script
    const pythonProcess = spawn('python', ['match_alumni.py']);

    // Send the data to the Python script via stdin
    pythonProcess.stdin.write(data);
    pythonProcess.stdin.end();

    let output = '';

    // Capture the output from the Python script
    pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
    });

    // Handle errors from the Python script
    pythonProcess.stderr.on('data', (data) => {
        console.error('stderr:', data.toString());
    });

    // When the Python script finishes execution
    pythonProcess.on('close', (code) => {
        if (code === 0) {
            // Send the matched alumni profiles back as the response
            res.json(JSON.parse(output));
        } else {
            res.status(500).json({ error: 'An error occurred while processing the request' });
        }
    });
});

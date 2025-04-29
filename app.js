const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const path = require("path");

const userModel = require("./models/user");
const moodModel = require("./models/mood");
const verifyUser = require("./middlewares/auth");

// Database
mongoose
  .connect("mongodb://127.0.0.1:27017/authtestapp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Middlewares
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.get("/", (req, res) => res.render("home"));
app.get("/about", (req, res) => res.render("about"));
app.get("/contact", (req, res) => res.render("contact"));

// Authentication
app.get("/signup", (req, res) => res.render("signup"));
app.post("/create", async (req, res) => {
  const { username, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = await userModel.create({ username, email, password: hash });
  const token = jwt.sign({ email: user.email }, "shivam");
  res.cookie("token", token);
  res.redirect("/afterLogin");
});

app.get("/login", (req, res) => res.render("login"));
app.post("/login", async (req, res) => {
  const user = await userModel.findOne({ email: req.body.email });
  if (!user) return res.send("User not found");

  const isMatch = await bcrypt.compare(req.body.password, user.password);
  if (!isMatch) return res.send("Incorrect password");

  const token = jwt.sign({ email: user.email }, "shivam");
  res.cookie("token", token);
  res.redirect("/afterLogin");
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

// Mood Tracker
app.get("/afterLogin", verifyUser, (req, res) => res.render("moodtracker"));
app.post("/save-mood", verifyUser, async (req, res) => {
  const { date, mood, journal } = req.body;
  let entry = await moodModel.findOne({ userId: req.user._id, date });

  if (entry) {
    entry.mood = mood;
    entry.journal = journal;
    await entry.save();
  } else {
    await moodModel.create({ userId: req.user._id, date, mood, journal });
  }

  res.json({ success: true });
});
app.get("/get-moods", verifyUser, async (req, res) => {
  const moods = await moodModel.find({ userId: req.user._id });
  res.json(moods);
});
app.post("/delete-month-moods", verifyUser, async (req, res) => {
  const { year, month } = req.body;
  const startKey = `${year}-${month}-1`;
  const endKey = `${year}-${month}-31`;

  const result = await moodModel.deleteMany({
    userId: req.user._id,
    date: { $gte: startKey, $lte: endKey },
  });

  res.json({ deletedCount: result.deletedCount });
});

// Profile
app.get("/profile", verifyUser, (req, res) => res.render("profile"));
app.get("/profile-data", verifyUser, async (req, res) => {
  const user = await userModel.findById(req.user._id).select("-password");
  res.json(user);
});
app.post("/update-profile", verifyUser, async (req, res) => {
  const { username, email, dob, bio, profilePhoto } = req.body;
  const updatedUser = await userModel.findByIdAndUpdate(
    req.user._id,
    { username, email, dob, bio, profilePhoto },
    { new: true }
  );
  res.json({ success: true, user: updatedUser });
});
app.post("/change-password", verifyUser, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await userModel.findById(req.user._id);

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch)
    return res.status(400).json({ error: "Old password is incorrect" });

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();
  res.json({ success: true });
});

// Server
const PORT = 3001;
app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);

const express = require("express");
// const userRouter = require("./routes/userRoutes");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const fs = require("fs");
const morgan = require("morgan");
const helmet = require("helmet");
const xss = require("xss-clean");
const path = require("path");
// const privacyRoutes = require("./routes/privacyPolicyRoutes");
// const termsandconditionRoutes = require("./routes/termsAndConditionRoutes");
const setupRoutesV1 = require("./routes/routes");
// const firebase = require("firebase-admin");
// const serviceAcount = require("./worldsnap-c7668-firebase-adminsdk-rrpzh-e4a68043ba.json");
// const hpp = require("hpp");

const app = express();

// firebase.initializeApp({
//   credential: firebase.credential.cert(serviceAcount),
// });
// module.exports = { firebase };
// // app.set('view engine', 'pug');
// app.set('views', path.join(__dirname, 'views'));

//1) GLOBAL MIDDLEWARES
// serving static files
const publicPath = path.join(__dirname, "./public");
app.use(express.static(publicPath));
app.get("/privacy-policy", (req, res) => {
  // Send the privacy policy file
  res.sendFile(path.join(publicPath, "privacy-policy.html"));
});
app.get("/terms-of-service", (req, res) => {
  // Send the privacy policy file
  res.sendFile(path.join(publicPath, "terms-of-use.html"));
});

app.get("/about-us", (req, res) => {
  // Send the about us file
  res.sendFile(path.join(publicPath, "about-us.html"));
});

//set security http headers
app.use(helmet());
// Development logging
app.use(express.json()); //Body parser for JSON data
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(xss());

app.use((req, res, next) => {
  console.log("Hey, from middleware");
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString;
  console.log(req.headers);
  next();
});

// ROUTES
app.get("/", (req, res) => {
  res.status(200).render("base");
});
app.use("/api/v1", setupRoutesV1());
// app.use("/privacy", privacyRoutes);
// app.use("/termsandcondition", termsandconditionRoutes);

// app.all("*", (req, res, next) => {
//   next(new AppError(`can't find ${req.originalUrl} on this server`, 404));
// });

app.use(globalErrorHandler);

module.exports = app;

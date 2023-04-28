// imports
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const cookieParser = require("cookie-parser");

// files
const usersfile = "users.json";

// core modules
const fs = require("fs");

// middlewares
app.set("view-engine", "ejs"); // for rendering web pages
app.use(bodyParser.urlencoded({ extended: true })); // to pares the url body
app.use(cookieParser());

//verifying token
const authtoken = (req, res, next) => {
  const cookToken = req.cookies.token;
  try {
    const decoded = jwt.verify(cookToken, process.env.ACCESS_TOKEN_SECRET);
    const username = decoded.username;
    const mobile = decoded.mobile;
    const email = decoded.email;
    next();
  } catch (err) {
    console.log("error raised"); // testing
    res.redirect("/");
  }
};

app.get("/users-list", authtoken, (req, res) => {
  console.log("hai");
  const data = fs.readFileSync(usersfile);
  const users = JSON.parse(data);
  let row = "";
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const newrow = `<tr>
      <td>${user.username}</td>
      <td>${user.email}</td>
      <td>${user.mobile}</td>
      </tr>`;

    row += newrow;
  }
  res.render("users.ejs", { tableContent: row });

  // console.log("got error");
  // res.redirect("/");
});

app.get("/remove-cookie", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

app.get("/home", authtoken, (req, res) => {
  // decoding token
  const cookToken = req.cookies.token;

  const decoded = jwt.verify(cookToken, process.env.ACCESS_TOKEN_SECRET);
  const username = decoded.username;
  const mobile = decoded.mobile;
  const email = decoded.email;

  res.render("home.ejs", { UserName: username });
});

// end route for login
app.post("/login", (req, res) => {
  // console.log(req.body);
  const { username, password } = req.body;
  // console.log(username, password); // passed
  try {
    const data = fs.readFileSync(usersfile);
    const users = JSON.parse(data);
    // console.log(users); // testing
    const user = users.find((user) => {
      return user.username === username && user.pass === password;
    });
    // console.log(user);
    if (user) {
      const token = jwt.sign(
        { username: user.username, email: user.email, mobile: user.mobile },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "30s" }
      );

      console.log(token);
      // addding token to the cookie
      res.cookie("token", token, { httpOnly: true });
      res.redirect("/home");
    } else {
      res.sendStatus(401);
    }
  } catch (err) {
    console.log(err);
  }
});

//adding user to json file
app.post("/adduser", (req, res) => {
  const { username, email, mobile, pass } = req.body;
  //console.log(username, email, mobile, pass); //passed

  const user = {
    username: username,
    email: email,
    mobile: mobile,
    pass: pass,
  };
  // to fetch data form the usersfile if file is not found it simply returns a new array
  const getUsers = () => {
    try {
      const data = fs.readFileSync(usersfile);
      return data.length === 0 ? [] : JSON.parse(data);
    } catch (err) {
      return [];
    }
  };

  const users = getUsers();
  users.push(user);

  // updating usersfile
  fs.writeFile(usersfile, JSON.stringify(users), (err) => {
    if (err) throw err;
    res.redirect("/"); // redirecting to login page
  });
});

// reg form api
app.get("/regform", (req, res) => {
  res.render("register.ejs");
});

// login form api
app.get("/", (req, res) => {
  res.render("login.ejs");
});

// listner
app.listen(8000, () => {
  console.log("server running on port no: 8000..........");
});

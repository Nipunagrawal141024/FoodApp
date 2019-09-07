const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const Login = require("./model/login");
const session = require("express-session");
const URL = "mongodb://localhost:27017/foodapp";

app.use(session({ secret: "1234567" }));
app.use(express.static("public"));

const mongoose = require("mongoose");
mongoose.connect(URL);

app.listen(3000, () => {
  console.log("Server started....");
});

app.use(express.static("public"));

//congigure view engine :Hbs

// const hbs = require('hbs');
// var path=require('path');
// app.set('views',path.join(__dirname,'view')); //location
// app.set('view engine','hbs');//extension

var hbs = require("express-handlebars");
app.engine(
  "hbs",
  hbs({
    extname: "hbs",
    defaultLayout: "CustomerNav",
    layoutsDir: __dirname + "/views/layouts/"
  })
);
app.set("view engine", "hbs");

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

const User = require("./model/User");

const cart = require("./model/cart");

/*----------------------------------------------------Admin-----------------------------------------------*/

app.get("/home", (request, response) => {
  response.render("home", {
    user: request.session.user,
    layout: "mainlayout.hbs"
  });
});

app.get("/newitem", (request, response) => {
  response.render("newfood", {
    user: request.session.user,
    layout: "mainlayout.hbs"
  }); //1) extention 2) location
});

//configure body parser
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.get("/", (request, response) => {
  Food.find((err, result) => {
    if (err) throw err;
    else {
      response.render("index", {
        data: result,
        Customer: request.session.CustomerName
      });
    }
  });
});

app.get("/Admin-login", (request, response) => {
  response.render("login");
});

app.get("/Admin-Home", (request, response) => {
  response.render("adminhome", {
    user: request.session.user,
    layout: "mainlayout.hbs"
  });
});

app.get("/User-login", (request, response) => {
  response.render("UserLogin");
});

app.get("/User-register", (request, response) => {
  response.render("UserRegister");
});

app.get("/viewlist", (request, response) => {
  if (request.session.user) {
    Food.find((err, result) => {
      console.log(result);
      if (err) throw err;
      else
        response.render("viewfood", {
          data: result,
          layout: "mainlayout.hbs",
          user: request.session.user
        });
    });
  } else response.render("login");
});

/*-----------------------------------Cart Code------------------------------------------------*/

app.get("/cartAction", (request, response) => {
  if (request.session.CustomerName) {
    var newCart = new cart({
      productId: request.query.id,
      userEmail: request.session.CustomerName,
      pQuantity: request.query.count
    });
    //save function return promises
    newCart.save().then(data => {
      Food.find((err, result) => {
        if (err) throw err;
        else {
          response.render("index", {
            data: result,
            Customer: request.session.CustomerName,
            msg: "Cart Updated"
          });
        }
      });
    });
  } else {
    response.render("UserLogin");
  }
});

app.get("/cartItems", (request, response) => {
  cart.aggregate(
    [
      {
        $match: {
          userEmail: request.session.CustomerName
        }
      },
      {
        $lookup: {
          from: "Food",
          localField: "productId",
          foreignField: "Pid",
          as: "items"
        }
      }
    ],
    (err, result) => {
      if (err) throw err;
      // console.log(result[0].items);
      // console.log(result);
      // response.json(result);
      else {
        response.render("cartItemList", {
          data: result,
          Customer: request.session.CustomerName
        });
      }
    }
  );
});

app.post("/cartAction", (request, response) => {
  if (request.session.CustomerName) {
    var newCart = new cart({
      productId: request.query.id,
      userEmail: request.session.CustomerName,
      pQuantity: request.query.count
    });
    //save function return promises
    newCart.save().then(data => {
      Food.find((err, result) => {
        if (err) throw err;
        else {
          response.render("index", {
            data: result,
            Customer: request.session.CustomerName,
            msg: "Cart Updated"
          });
        }
      });
    });
  } else {
    response.render("UserLogin");
  }
});

/*-----------------------------------Cart Code------------------------------------------------*/

app.post("/check", (request, response) => {
  Login.findOne(
    { userid: request.body.uid, password: request.body.pwd },
    (err, result) => {
      if (err) throw err;
      else {
        //  if(result.userid==request.body.uid && result.password==request.body.pwd)
        if (result != null) {
          request.session.user = request.body.uid;
          response.render("adminhome", {
            user: request.session.user,
            layout: "mainlayout.hbs"
          });
        } else {
          response.render("login", { msg: "Oops Try Again " });
        }
      }
    }
  );
});

//Data to drop hardcoded values manually during first time connectivity

// app.get('/check' , (request, response) => {
//   var emp = new Login({
//     userid : "admin",
//     password: "admin"
//   });
//   emp.save().then(data => {
//     console.log("data inserted");
//   });
// });

const upload = require("express-fileupload");
app.use(upload());

const Food = require("./model/addproduct");

app.get("/show", (request, response) => {
  Food.findOne({ _id: request.query.id }, (err, result) => {
    if (err) throw err;
    //console.log(result);
    else
      response.render("showlist", {
        list: result,
        layout: "mainlayout.hbs",
        user: request.session.user
      });
  });
});

app.post("/newfood", (request, response) => {
  //MongoDB code
  console.log("Submit");
  console.log(request.files);

  if (request.files) {
    var random = Math.random()
      .toString(36)
      .slice(-8);
    var alldata = request.files.pfile;
    var filename = alldata.name;
    var altfname = random + filename;
    var newProduct = new Food({
      Name: request.body.name,
      Price: request.body.price,
      Category: request.body.category,
      Food_Available: request.body.availability,
      Imageid: altfname
    });

    alldata.mv("./public/upload/" + altfname, err => {
      if (err) throw err;
      else {
        //save function return promises
        newProduct.save().then(data => {
          response.render("newfood", {
            layout: "mainlayout.hbs",
            user: request.session.user,
            msg: "Data inserted..."
          });
        });
      }
    });
  }
});

app.get("/update", (request, response) => {
  Food.findOne({ _id: request.query.id }, (err, result) => {
    if (err) throw err;
    else
      response.render("viewfood", {
        emp: result,
        layout: "mainlayout.hbs",
        user: request.session.user
      });
  });
});

app.post("/updateAction", (request, response) => {
  // console.log(request.body);
  Food.findOneAndUpdate(request.body.id, {
    Name: request.body.name,
    Price: request.body.price,
    Category: request.body.category,
    Food_Available: request.body.availability
  }).then(err => {
    Food.find((err, result) => {
      if (err) throw err;
      else console.log(result);
      response.render("viewfood", {
        data: result,
        layout: "mainlayout.hbs",
        user: request.session.user
      });
    });
  });
});

app.get("/delete", (request, response) => {
  Food.deleteOne({ _id: request.query.id }, err => {
    if (err) throw err;
    else {
      Food.find((err, result) => {
        if (err) throw err;
        else
          response.render("viewfood", {
            data: result,
            msg: "Data Deleted",
            layout: "mainlayout.hbs",
            user: request.session.user
          });
      });
    }
  });
});

app.get("/view", (request, response) => {
  Food.find((err, result) => {
    if (err) throw err;
    else
      response.render("viewfood", {
        data: result,
        layout: "mainlayout.hbs",
        user: request.session.user
      });
  });
});

app.get("/About", (request, response) => {
  response.render("AboutUs", { Customer: request.session.CustomerName });
});

app.get("/logout", (request, response) => {
  request.session.destroy();
  Food.find((err, result) => {
    if (err) throw err;
    else {
      response.render("index", { data: result });
    }
  });
});

/*-----------------------------------Customer-------------------------------------------------------------------------*/

app.post("/RegisterUser", (request, response) => {
  var newUser = new User({
    UserName: request.body.username,
    Password: request.body.userpassword,
    Email: request.body.useremail,
    Contact: request.body.usercontact,
    Address: request.body.userAddress
  });

  //save function return promises
  newUser.save().then(data => {
    response.render("UserRegister", {
      msg: "Registered Successfuly Now Please Login!"
    });
  });
});

app.post("/loginCheckUser", (request, response) => {
  var name = request.body.useremail;
  User.findOne(
    { Email: request.body.useremail, Password: request.body.userpassword },
    (err, result) => {
      if (err) throw err;
      else if (result != null) {
        Food.find((err, result) => {
          if (err) throw err;
          else {
            request.session.CustomerName = name;
            response.render("index", {
              Customer: request.session.CustomerName,
              data: result
            });
          }
        });
      } else {
        response.render("UserLogin", { msg: "Login Fail" });
      }
    }
  );
});

app.get("/detailInfo", (request, response) => {
  Food.findOne({ _id: request.query.id }, (err, result) => {
    if (err) throw err;
    else
      response.render("viewItemDetail", {
        data: result,
        Customer: request.session.CustomerName
      });
  });
});

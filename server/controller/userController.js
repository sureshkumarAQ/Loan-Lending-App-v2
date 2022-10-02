const User = require("../models/userModels");
  const bcrypt = require("bcrypt");
  const jwt = require("jsonwebtoken");
const { findOne } = require("../models/userModels");
  
  //Create and save new user
  exports.signUp = async (req, res) => {
    //Validate request
    if (!req.body) {
      res.status(400).send({ message: "Content can not be empty" });
      return;
    }
    console.log(req.body)
  
    // Calculating initial loan eliginle criteria score(lecs)
  
    // Store all data in user object
    const user = await new User({
      name: req.body.name,
      password: req.body.password,
      email: req.body.email
    });
    // zwt create a new tokken
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    //save user token
    user.token = token;

    // console.log(token)
  
    // Save user in the database
    await user
      .save(user)
      .then((data) => {
        res.status(201).send(data)
      })
      .catch((err) => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while creating a a new account",
        });
      });
  };

  // Login user
  exports.logIn = async (req, res) => {
  try {
    //Validate request
    if (!req.body) {
      res.status(400).send({ message: "Fill email and password" });
      return;
    }

    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password)
      return res.status(406).send({ err: "Not all field have been entered" });

    // Check if user is already exist or not
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(406).send({ err: "No account with this email" });
    }
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(406).send({ err: "Invalid Credentials" });

    // zwt create a new tokken
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    //save user token
    user.token = token;

    //Store jwt-token in cookie
    res.cookie("jwtoken", token, {
      expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    });

    res.send({token});
    // res.redirect("/loan/loanRequests");
  } catch (err) {
    res.status(500).send("Error while Login");
  }
  };


  exports.getUserProfile = async(req,res)=>{
    
    try {
      const user = req.user;// LogedIn User
      const id = req.params.userID; // Id of the user which we want to access profile
      if(!id)
      {
        res.status(404).send("ID Not Found")
      }
      //User whose profile we want to access
      const UserWithProfile = await User.findById(id).select('-_id -__v -password')
      res.status(201).send({User : UserWithProfile})
    } catch (error) {
      res.status(500).send({
        message:
          err.message || "Some error occurred while fetching user profile",
      });
    }

  }


  exports.editProfile = async(req,res)=>{
    try {
      const user = req.user;// LogedIn User
      const id = req.params.userID; // Id of the user which we want to access profile
      if(!id)
      {
        res.status(404).send("ID Not Found")
      }
      if(id!=user._id)
      {
        res.status(500).send("You can not edit other user`s profile")
      }

      let updatedUser={
        ctc:req.body.ctc,
        bankname:req.body.bankname,
        accountnumber:req.body.accountnumber,
        age:req.body.age,
      }
      await User.findOneAndUpdate({_id:id},updatedUser).exec()
      res.status(200).send("Profile completed successfully ;)");

    } catch (error) {
      res.status(500).send({
        message:
          err.message || "Some error occurred while updating user profile",
      });
    }
  }
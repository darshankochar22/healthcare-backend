const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Update user info
          user.name = profile.displayName;
          user.email = profile.emails[0].value;
          user.picture = profile.photos[0].value;
          user.lastLogin = new Date();
          user.givenName = profile.name.givenName || "";
          user.familyName = profile.name.familyName || "";
          await user.save();
        } else {
          // Create new user
          user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            picture: profile.photos[0].value,
            givenName: profile.name.givenName || "",
            familyName: profile.name.familyName || "",
            lastLogin: new Date(),
          });
          await user.save();
        }

        console.log("User authenticated:", user.email);
        return done(null, user);
      } catch (error) {
        console.error("Passport error:", error);
        return done(error, null);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// JWT token generation
const generateJWT = (user) => {
  return jwt.sign(
    {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        givenName: user.givenName,
        familyName: user.familyName,
        picture: user.picture,
        googleId: user.googleId,
      },
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

module.exports = { generateJWT };

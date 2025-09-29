const express = require("express");
const passport = require("passport");
const { generateJWT } = require("../config/passport");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Google OAuth Routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
  }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = generateJWT(req.user);

      // Determine frontend URL based on referer or default
      const frontendUrl = req.get("Referer")?.includes("localhost")
        ? process.env.FRONTEND_URL
        : process.env.DEPLOYED_FRONTEND_URL || process.env.FRONTEND_URL;

      // Redirect to frontend with token
      res.redirect(`${frontendUrl}/login?token=${token}&success=true`);
    } catch (error) {
      console.error("Token generation error:", error);
      const frontendUrl =
        process.env.DEPLOYED_FRONTEND_URL || process.env.FRONTEND_URL;
      res.redirect(`${frontendUrl}/login?error=token_generation_failed`);
    }
  }
);

// Get user profile (protected route)
router.get("/profile", authenticateToken, (req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      user: req.user,
    },
  });
});

// Verify token endpoint
router.post("/verify", authenticateToken, (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Token is valid",
    data: {
      user: req.user,
    },
  });
});

// Logout route
router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        status: "error",
        message: "Logout failed",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  });
});

// Health check for auth routes
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Auth routes are working!",
  });
});

module.exports = router;

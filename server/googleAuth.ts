import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import passport from 'passport';
import type { Express } from 'express';
import { storage } from './storage';
import { isAuthenticated } from './replitAuth';

// Google OAuth scopes for basic profile access
const GOOGLE_SCOPES = [
  'openid',
  'email', 
  'profile',
];

export async function setupGoogleAuth(app: Express) {
  // Only setup if Google credentials are provided
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log('⚠️  Google OAuth credentials not provided - Google integration disabled');
    return;
  }

  // Google OAuth Strategy
  passport.use('google', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
    scope: GOOGLE_SCOPES,
    accessType: 'offline', // Get refresh token
    prompt: 'consent' // Force consent screen to get refresh token
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // This is called after successful Google OAuth
      // We'll store the Google tokens with the current user
      const googleData = {
        googleId: profile.id,
        accessToken,
        refreshToken,
        profile: {
          email: profile.emails?.[0]?.value,
          name: profile.displayName,
          picture: profile.photos?.[0]?.value,
        }
      };
      
      return done(null, googleData);
    } catch (error) {
      return done(error, null);
    }
  }));

  // Routes for Google OAuth (user-specific)
  
  // Initiate Google OAuth - requires user to be logged in first
  app.get('/auth/google', isAuthenticated, (req, res, next) => {
    // Store the current user ID in session for after OAuth callback
    (req.session as any).pendingUserId = (req.user as any)?.claims?.sub;
    
    passport.authenticate('google', {
      scope: GOOGLE_SCOPES,
      accessType: 'offline',
      prompt: 'consent'
    })(req, res, next);
  });

  // Google OAuth callback
  app.get('/auth/google/callback', 
    passport.authenticate('google', { session: false }),
    async (req, res) => {
      try {
        const googleData = req.user as any;
        const userId = (req.session as any)?.pendingUserId;

        if (!userId || !googleData) {
          return res.redirect('/?error=google_auth_failed');
        }

        // Store Google credentials for the current user
        await storage.updateUserGoogleCredentials(userId, {
          googleId: googleData.googleId,
          accessToken: googleData.accessToken,
          refreshToken: googleData.refreshToken,
          email: googleData.profile.email,
          name: googleData.profile.name,
          picture: googleData.profile.picture,
          connectedAt: new Date(),
        });

        // Clean up session
        delete (req.session as any).pendingUserId;

        res.redirect('/?google_connected=true');
      } catch (error) {
        console.error('Google OAuth callback error:', error);
        res.redirect('/?error=google_auth_failed');
      }
    }
  );

  // Disconnect Google account
  app.post('/api/auth/google/disconnect', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      await storage.removeUserGoogleCredentials(userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Google disconnect error:', error);
      res.status(500).json({ error: 'Failed to disconnect Google account' });
    }
  });

  // Get user's Google connection status
  app.get('/api/auth/google/status', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const googleCredentials = await storage.getUserGoogleCredentials(userId);
      
      res.json({
        connected: !!googleCredentials,
        profile: googleCredentials ? {
          email: googleCredentials.email,
          name: googleCredentials.name,
          picture: googleCredentials.picture,
          connectedAt: googleCredentials.connectedAt,
        } : null
      });
    } catch (error) {
      console.error('Google status error:', error);
      res.status(500).json({ error: 'Failed to get Google status' });
    }
  });
}

// Helper function to get valid Google access token for a user
export async function getGoogleAccessToken(userId: string): Promise<string | null> {
  try {
    const credentials = await storage.getUserGoogleCredentials(userId);
    if (!credentials) return null;

    // TODO: Add token refresh logic if needed
    // For now, return the stored access token
    return credentials.accessToken;
  } catch (error) {
    console.error('Error getting Google access token:', error);
    return null;
  }
}
const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;

let githubEnabled = false;
let serializersConfigured = false;
let strategyConfigured = false;

const getGithubConfig = () => ({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL,
});

const hasGithubConfig = () => {
  const { clientID, clientSecret, callbackURL } = getGithubConfig();
  return Boolean(clientID && clientSecret && callbackURL);
};

const configurePassport = () => {
  if (!serializersConfigured) {
    passport.serializeUser((user, done) => {
      done(null, user);
    });

    passport.deserializeUser((user, done) => {
      done(null, user);
    });

    serializersConfigured = true;
  }

  if (!hasGithubConfig()) {
    githubEnabled = false;
    return;
  }

  if (!strategyConfigured) {
    passport.use(
      new GitHubStrategy(getGithubConfig(), (accessToken, refreshToken, profile, done) => {
        try {
          const email =
            Array.isArray(profile.emails) && profile.emails[0] ? profile.emails[0].value : null;

          done(null, {
            githubId: profile.id,
            username: profile.username || null,
            displayName: profile.displayName || null,
            email,
          });
        } catch (error) {
          done(error);
        }
      })
    );

    strategyConfigured = true;
  }

  githubEnabled = true;
};

const isGithubEnabled = () => {
  if (!githubEnabled) {
    configurePassport();
  }

  return githubEnabled;
};

module.exports = {
  configurePassport,
  isGithubEnabled,
};

module.exports = {
    // Tell Jest to use Node.js environment for testing
    testEnvironment: "node", 
     // Run this file after Jest is set up, before tests start
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"], 
  };
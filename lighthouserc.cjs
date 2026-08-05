module.exports = {
  ci: {
    collect: {
      staticDistDir: '.',
      numberOfRuns: 1,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        maxWaitForFcp: 15000,
        maxWaitForLoad: 45000
      }
    }
  }
}

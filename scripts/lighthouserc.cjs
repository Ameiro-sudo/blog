module.exports = {
  ci: {
    collect: {
      staticDistDir: '.output/public',
      numberOfRuns: 1,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        maxWaitForFcp: 15000,
        maxWaitForLoad: 45000
      }
    }
  }
}

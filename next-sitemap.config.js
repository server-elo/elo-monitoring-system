/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://solidity-learning.com',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: [
    '/api/*',
    '/test/*',
    '/test-minimal',
    '/test-page',
    '/minimal',
    '/performance-dashboard',
    '/demo/*'
  ],
}
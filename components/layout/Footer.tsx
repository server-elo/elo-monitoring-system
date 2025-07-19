'use client';

import { motion } from 'framer-motion';
import { Github, Twitter, Linkedin, Mail, Heart } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Github, href: 'https://github.com/ezekaj/learning_sol', label: 'GitHub' },
    { icon: Twitter, href: 'https://twitter.com/zedigitaltech', label: 'Twitter' },
    { icon: Linkedin, href: 'https://linkedin.com/company/zedigital', label: 'LinkedIn' },
    { icon: Mail, href: 'https://zedigital.tech/contact', label: 'Contact' },
  ];

  const footerLinks = [
    {
      title: 'Platform',
      links: [
        { name: 'Learn Solidity', href: '/learn' },
        { name: 'Code Lab', href: '/code' },
        { name: 'Collaborate', href: '/collaborate' },
        { name: 'Documentation', href: '/documentation' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { name: 'Tutorials', href: '/tutorials' },
        { name: 'Examples', href: '/examples' },
        { name: 'Best Practices', href: '/documentation#best-practices' },
        { name: 'Security Guide', href: '/documentation#security' },
      ],
    },
    {
      title: 'Community',
      links: [
        { name: 'Discord', href: 'https://discord.gg/solidity' },
        { name: 'Forum', href: '/collaborate' },
        { name: 'Blog', href: 'https://zedigital.tech/blog' },
        { name: 'Newsletter', href: 'https://zedigital.tech/newsletter' },
      ],
    },
  ];

  return (
    <footer className="relative bg-gradient-to-t from-gray-900 via-gray-800 to-transparent border-t border-white/10">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                SolLearn
              </h3>
              <p className="text-gray-400 mb-6 max-w-sm">
                The most comprehensive platform for learning Solidity and blockchain development. 
                Build the future with smart contracts.
              </p>
              
              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <social.icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Footer Links */}
          {footerLinks.map((section, sectionIndex) => (
            <div key={section.title}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: sectionIndex * 0.1 }}
                viewport={{ once: true }}
              >
                <h4 className="text-white font-semibold mb-4">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <motion.li
                      key={link.name}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: (sectionIndex * 0.1) + (linkIndex * 0.05) }}
                      viewport={{ once: true }}
                    >
                      <a
                        href={link.href}
                        className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                      >
                        {link.name}
                      </a>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <motion.div
          className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center space-x-2 text-gray-400 text-sm mb-4 md:mb-0">
            <span>© {currentYear} SolLearn. Made with</span>
            <Heart className="w-4 h-4 text-red-400 fill-current" />
            <span>for the blockchain community</span>
          </div>
          
          <div className="flex space-x-6 text-sm">
            <a href="/privacy" className="text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="text-gray-400 hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="/cookies" className="text-gray-400 hover:text-white transition-colors">
              Cookie Policy
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

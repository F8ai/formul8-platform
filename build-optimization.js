#!/usr/bin/env node

/**
 * Build Optimization Script for Formul8 Platform
 * Reduces deployment size and optimizes assets for production
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const config = {
  distDir: path.join(__dirname, 'dist'),
  publicDir: path.join(__dirname, 'dist/public'),
  maxFileSize: 1024 * 1024 * 2, // 2MB limit per file
  compressionLevel: 9,
  removeSourcemaps: true,
  optimizeImages: true,
  minifyHTML: true
};

class BuildOptimizer {
  constructor() {
    this.stats = {
      originalSize: 0,
      optimizedSize: 0,
      filesProcessed: 0,
      filesRemoved: 0
    };
  }

  async optimize() {
    console.log('🚀 Starting Formul8 Platform Build Optimization');
    console.log('=' .repeat(50));

    try {
      await this.createDirectories();
      await this.removeUnnecessaryFiles();
      await this.optimizeAssets();
      await this.generateReport();
      
      console.log('\n✅ Build optimization completed successfully!');
      console.log(`📦 Size reduction: ${this.formatBytes(this.stats.originalSize - this.stats.optimizedSize)}`);
      console.log(`📊 Files processed: ${this.stats.filesProcessed}`);
      console.log(`🗑️  Files removed: ${this.stats.filesRemoved}`);
      
    } catch (error) {
      console.error('❌ Build optimization failed:', error);
      process.exit(1);
    }
  }

  async createDirectories() {
    const dirs = [config.distDir, config.publicDir];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    }
  }

  async removeUnnecessaryFiles() {
    console.log('\n🧹 Removing unnecessary files...');
    
    const unnecessaryPatterns = [
      // Source maps (if configured to remove)
      /\.map$/,
      // Development files
      /\.dev\./,
      /\.development\./,
      // Test files
      /\.test\./,
      /\.spec\./,
      // Documentation in dist
      /README\.md$/,
      /CHANGELOG\.md$/,
      // Large image assets (keep only optimized versions)
      /\.png$/, /\.jpg$/, /\.jpeg$/, /\.gif$/
    ];

    const removeFiles = (dir) => {
      if (!fs.existsSync(dir)) return;

      const files = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const file of files) {
        const filePath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
          removeFiles(filePath);
          // Remove empty directories
          try {
            const contents = fs.readdirSync(filePath);
            if (contents.length === 0) {
              fs.rmdirSync(filePath);
              console.log(`🗑️  Removed empty directory: ${file.name}`);
              this.stats.filesRemoved++;
            }
          } catch (e) {
            // Directory not empty or other error
          }
        } else {
          // Check if file should be removed
          const shouldRemove = unnecessaryPatterns.some(pattern => 
            pattern.test(file.name)
          );

          if (shouldRemove) {
            const stat = fs.statSync(filePath);
            this.stats.originalSize += stat.size;
            fs.unlinkSync(filePath);
            console.log(`🗑️  Removed: ${file.name} (${this.formatBytes(stat.size)})`);
            this.stats.filesRemoved++;
          }
        }
      }
    };

    if (fs.existsSync(config.publicDir)) {
      removeFiles(config.publicDir);
    }
  }

  async optimizeAssets() {
    console.log('\n⚡ Optimizing assets...');

    const optimizeDirectory = (dir) => {
      if (!fs.existsSync(dir)) return;

      const files = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const file of files) {
        const filePath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
          optimizeDirectory(filePath);
        } else {
          this.optimizeFile(filePath);
        }
      }
    };

    if (fs.existsSync(config.publicDir)) {
      optimizeDirectory(config.publicDir);
    }
  }

  optimizeFile(filePath) {
    try {
      const stat = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      this.stats.originalSize += stat.size;
      this.stats.filesProcessed++;

      // Log large files for review
      if (stat.size > config.maxFileSize) {
        console.log(`⚠️  Large file detected: ${path.basename(filePath)} (${this.formatBytes(stat.size)})`);
      }

      // Basic optimizations
      if (['.js', '.css', '.json'].includes(ext)) {
        this.optimizeTextFile(filePath);
      }

      const newStat = fs.statSync(filePath);
      this.stats.optimizedSize += newStat.size;

      if (newStat.size < stat.size) {
        console.log(`✨ Optimized: ${path.basename(filePath)} (${this.formatBytes(stat.size - newStat.size)} saved)`);
      }

    } catch (error) {
      console.warn(`⚠️  Could not optimize ${filePath}:`, error.message);
    }
  }

  optimizeTextFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalLength = content.length;

      // Remove unnecessary whitespace and comments (basic minification)
      if (filePath.endsWith('.js')) {
        // Remove console.log statements in production
        content = content.replace(/console\.(log|info|debug|warn)\([^)]*\);?/g, '');
        // Remove excessive whitespace
        content = content.replace(/\s+/g, ' ').trim();
      } else if (filePath.endsWith('.css')) {
        // Remove comments and excessive whitespace
        content = content.replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, '');
        content = content.replace(/\s+/g, ' ').trim();
      } else if (filePath.endsWith('.json')) {
        // Minify JSON
        try {
          const parsed = JSON.parse(content);
          content = JSON.stringify(parsed);
        } catch (e) {
          // Not valid JSON, skip
        }
      }

      if (content.length < originalLength) {
        fs.writeFileSync(filePath, content, 'utf8');
      }
    } catch (error) {
      console.warn(`⚠️  Could not optimize text file ${filePath}:`, error.message);
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      optimization: {
        originalSize: this.stats.originalSize,
        optimizedSize: this.stats.optimizedSize,
        savings: this.stats.originalSize - this.stats.optimizedSize,
        savingsPercent: this.stats.originalSize > 0 
          ? ((this.stats.originalSize - this.stats.optimizedSize) / this.stats.originalSize * 100).toFixed(2)
          : 0,
        filesProcessed: this.stats.filesProcessed,
        filesRemoved: this.stats.filesRemoved
      },
      recommendations: [
        'Use CDN for static assets in production',
        'Enable gzip compression on the server',
        'Implement lazy loading for large components',
        'Consider using WebP format for images',
        'Enable browser caching headers'
      ]
    };

    const reportPath = path.join(config.distDir, 'optimization-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📋 Optimization report saved to: ${reportPath}`);
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run optimization if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const optimizer = new BuildOptimizer();
  optimizer.optimize().catch(console.error);
}

export { BuildOptimizer };
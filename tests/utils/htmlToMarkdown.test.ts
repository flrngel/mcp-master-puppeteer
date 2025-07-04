import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { extractPageContent, createContentSummary, htmlToMarkdown } from '../../src/utils/htmlToMarkdown';
import { ExtractedContent } from '../../src/types';

describe('htmlToMarkdown utilities', () => {
  describe('htmlToMarkdown', () => {
    it('should convert basic HTML to markdown', () => {
      const html = '<h1>Title</h1><p>This is a <strong>bold</strong> paragraph.</p>';
      const markdown = htmlToMarkdown(html);
      expect(markdown).toBe('# Title\n\nThis is a **bold** paragraph.');
    });

    it('should handle links correctly', () => {
      const html = '<p>Visit <a href="https://example.com">our website</a></p>';
      const markdown = htmlToMarkdown(html);
      expect(markdown).toBe('Visit [our website](https://example.com)');
    });

    it('should handle images', () => {
      const html = '<img src="test.jpg" alt="Test image">';
      const markdown = htmlToMarkdown(html);
      expect(markdown).toBe('![Test image](test.jpg)');
    });

    it('should remove script and style tags', () => {
      const html = '<p>Content</p><script>alert("test");</script><style>body{color:red;}</style>';
      const markdown = htmlToMarkdown(html);
      expect(markdown).toBe('Content');
    });
  });

  describe('createContentSummary', () => {
    it('should create a summary from extracted content', () => {
      const content: ExtractedContent = {
        title: 'Test Page',
        headings: [
          { level: 1, text: 'Main Heading' },
          { level: 2, text: 'Subheading' }
        ],
        paragraphs: ['First paragraph', 'Second paragraph'],
        links: [
          { text: 'Link 1', href: 'https://example.com', context: 'Some context' }
        ],
        images: [
          { src: 'image.jpg', alt: 'Test image' }
        ],
        tables: []
      };

      const summary = createContentSummary(content);
      
      expect(summary).toContain('# Test Page');
      expect(summary).toContain('## Page Structure');
      expect(summary).toContain('- Main Heading');
      expect(summary).toContain('  - Subheading');
      expect(summary).toContain('## Content Preview');
      expect(summary).toContain('First paragraph');
      expect(summary).toContain('## Links (1 total)');
      expect(summary).toContain('[Link 1](https://example.com)');
      expect(summary).toContain('## Images (1 total)');
    });

    it('should handle empty content gracefully', () => {
      const content: ExtractedContent = {
        title: 'Empty Page',
        headings: [],
        paragraphs: [],
        links: [],
        images: [],
        tables: []
      };

      const summary = createContentSummary(content);
      expect(summary).toBe('# Empty Page\n\n');
    });

    it('should limit the number of items shown', () => {
      const content: ExtractedContent = {
        title: 'Test',
        headings: [],
        paragraphs: Array(10).fill('Paragraph'),
        links: Array(20).fill({ text: 'Link', href: '#' }),
        images: Array(10).fill({ src: 'img.jpg', alt: 'Image' }),
        tables: []
      };

      const summary = createContentSummary(content);
      expect(summary).toContain('...and 7 more paragraphs');
      expect(summary).toContain('...and 10 more links');
      expect(summary).toContain('...and 5 more images');
    });
  });
});
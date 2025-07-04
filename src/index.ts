#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Import enhanced tools
import { navigateAnalyze } from './tools/navigateAnalyze.js';
import { screenshotPlus } from './tools/screenshotPlus.js';
import { extractContent } from './tools/extractContent.js';
import { getPageInfo } from './tools/getPageInfo.js';
import { analyzeForms } from './tools/analyzeForms.js';
import { batchInteract } from './tools/batchInteract.js';
import { closeBrowser } from './utils/browserManager.js';

// Global state for resources
const consoleLogs: string[] = [];
const screenshots = new Map<string, string>();

// Define enhanced tools
const TOOLS: Tool[] = [
  {
    name: "puppeteer_navigate_analyze",
    description: "Navigate to a URL and return comprehensive page analysis with metadata, content (in specified format), and errors",
    inputSchema: {
      type: "object",
      properties: {
        url: { 
          type: "string", 
          description: "The URL to navigate to" 
        },
        waitUntil: { 
          type: "string", 
          enum: ["load", "domcontentloaded", "networkidle0", "networkidle2"],
          description: "When to consider navigation succeeded (default: networkidle0)" 
        },
        timeout: { 
          type: "number", 
          description: "Maximum navigation time in milliseconds (default: 30000)" 
        },
        contentFormat: {
          type: "string",
          enum: ["markdown", "html", "plain-text", "structured-json"],
          description: "Format for the page content (default: markdown)"
        },
        includeMetadata: {
          type: "boolean",
          description: "Include basic metadata - description, ogImage (default: true)"
        },
        includePerformance: {
          type: "boolean",
          description: "Include performance metrics and resource counts (default: false)"
        }
      },
      required: ["url"],
    },
  },
  {
    name: "puppeteer_screenshot_plus",
    description: "Take screenshots with detailed metadata including dimensions, file size, and capture settings",
    inputSchema: {
      type: "object",
      properties: {
        name: { 
          type: "string", 
          description: "Name for the screenshot(s)" 
        },
        breakpoints: { 
          type: "array",
          items: { type: "number" },
          description: "Viewport widths for screenshots (default: [375, 768, 1280])" 
        },
        selector: { 
          type: "string", 
          description: "CSS selector for element to screenshot (optional)" 
        },
        fullPage: { 
          type: "boolean", 
          description: "Capture full page height (default: true)" 
        },
        format: { 
          type: "string",
          enum: ["png", "jpeg", "webp"],
          description: "Image format (default: jpeg)" 
        },
        quality: { 
          type: "number", 
          description: "JPEG/WebP quality 0-100 (default: 80)" 
        },
        actions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              selector: { type: "string" },
              value: { type: "string" },
              text: { type: "string" },
              duration: { type: "number" },
              position: { 
                type: "object",
                properties: {
                  x: { type: "number" },
                  y: { type: "number" }
                }
              }
            }
          },
          description: "Actions to perform before screenshot"
        }
      },
      required: ["name"],
    },
  },
  {
    name: "puppeteer_extract_content",
    description: "Extract structured content from the page with format options and detailed metadata",
    inputSchema: {
      type: "object",
      properties: {
        selector: { 
          type: "string", 
          description: "CSS selector to extract from (optional, defaults to full page)" 
        },
        includeHidden: { 
          type: "boolean", 
          description: "Include hidden elements (default: false)" 
        },
        outputFormat: {
          type: "string",
          enum: ["markdown", "html", "plain-text", "structured-json"],
          description: "Output format for the content (default: markdown)"
        },
        includeAnalysis: {
          type: "boolean",
          description: "Include structure analysis (default: true for structured-json, false otherwise)"
        }
      },
    },
  },
  {
    name: "puppeteer_get_page_info",
    description: "Get comprehensive page metadata, structure, accessibility, and SEO information",
    inputSchema: {
      type: "object",
      properties: {
        sections: {
          type: "array",
          items: {
            type: "string",
            enum: ["seo", "accessibility", "performance", "metadata"]
          },
          description: "Sections to include in the analysis (default: [\"seo\", \"metadata\"])"
        }
      },
    },
  },
  {
    name: "puppeteer_analyze_forms",
    description: "Analyze all forms on the page with detailed input information",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "puppeteer_batch_interact",
    description: "Execute multiple page interactions in sequence",
    inputSchema: {
      type: "object",
      properties: {
        actions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { 
                type: "string",
                enum: ["click", "type", "select", "hover", "wait", "waitForSelector", "scroll", "clear", "press"],
                description: "Type of action to perform"
              },
              selector: { type: "string", description: "CSS selector for the element" },
              value: { type: "string", description: "Value for select action" },
              text: { type: "string", description: "Text to type" },
              key: { type: "string", description: "Key to press" },
              duration: { type: "number", description: "Wait duration in ms" },
              timeout: { type: "number", description: "Timeout in ms" },
              position: { 
                type: "object",
                properties: {
                  x: { type: "number" },
                  y: { type: "number" }
                },
                description: "Scroll position"
              }
            },
            required: ["type"]
          },
          description: "Array of actions to perform"
        },
        stopOnError: { 
          type: "boolean", 
          description: "Stop execution on first error (default: false)" 
        }
      },
      required: ["actions"],
    },
  },
  // Keep some original simple tools for backward compatibility
  {
    name: "puppeteer_click",
    description: "Click an element on the page",
    inputSchema: {
      type: "object",
      properties: {
        selector: { type: "string", description: "CSS selector for element to click" },
      },
      required: ["selector"],
    },
  },
  {
    name: "puppeteer_fill",
    description: "Fill out an input field",
    inputSchema: {
      type: "object",
      properties: {
        selector: { type: "string", description: "CSS selector for input field" },
        value: { type: "string", description: "Value to fill" },
      },
      required: ["selector", "value"],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: "mcp-master-puppeteer",
    version: "0.4.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  },
);

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case "puppeteer_navigate_analyze": {
        const result = await navigateAnalyze(args as any);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }],
          isError: false,
        };
      }

      case "puppeteer_screenshot_plus": {
        const result = await screenshotPlus(args as any);
        
        // Store screenshots in resources
        result.screenshots.forEach((screenshot, index) => {
          const resourceName = `${args.name}_${screenshot.viewport.width}px`;
          const base64Data = screenshot.dataUrl.split(',')[1];
          screenshots.set(resourceName, base64Data);
        });
        
        // Return optimized result with images
        const content: any[] = [{
          type: "text",
          text: JSON.stringify({
            screenshots: result.screenshots.map(s => ({
              viewport: s.viewport,
              format: s.format,
              dimensions: s.dimensions,
              fullPage: s.fullPage
            })),
            ...(result.errors ? { errors: result.errors } : {})
          }, null, 2)
        }];
        
        // Add images
        result.screenshots.forEach(screenshot => {
          content.push({
            type: "image",
            data: screenshot.dataUrl.split(',')[1],
            mimeType: `image/${screenshot.format}`,
          });
        });
        
        return { content, isError: false };
      }

      case "puppeteer_extract_content": {
        const result = await extractContent(args as any);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }],
          isError: false,
        };
      }

      case "puppeteer_get_page_info": {
        const result = await getPageInfo(args as any);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }],
          isError: false,
        };
      }

      case "puppeteer_analyze_forms": {
        const result = await analyzeForms();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }],
          isError: false,
        };
      }

      case "puppeteer_batch_interact": {
        const result = await batchInteract(args as any);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }],
          isError: false,
        };
      }

      // Simple backward compatibility tools
      case "puppeteer_click": {
        const { selector } = args as { selector: string };
        const result = await batchInteract({
          actions: [{ type: "click", selector }]
        });
        return {
          content: [{
            type: "text",
            text: result.results[0].success 
              ? `Clicked: ${selector}` 
              : `Failed to click: ${result.results[0].error}`
          }],
          isError: !result.results[0].success,
        };
      }

      case "puppeteer_fill": {
        const { selector, value } = args as { selector: string; value: string };
        const result = await batchInteract({
          actions: [{ type: "type", selector, text: value }]
        });
        return {
          content: [{
            type: "text",
            text: result.results[0].success 
              ? `Filled ${selector} with: ${value}` 
              : `Failed to fill: ${result.results[0].error}`
          }],
          isError: !result.results[0].success,
        };
      }

      default:
        return {
          content: [{
            type: "text",
            text: `Unknown tool: ${name}`,
          }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
      }],
      isError: true,
    };
  }
});

// Setup resource handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "console://logs",
      mimeType: "text/plain",
      name: "Browser console logs",
    },
    ...Array.from(screenshots.keys()).map(name => ({
      uri: `screenshot://${name}`,
      mimeType: "image/png",
      name: `Screenshot: ${name}`,
    })),
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri.toString();

  if (uri === "console://logs") {
    return {
      contents: [{
        uri,
        mimeType: "text/plain",
        text: consoleLogs.join("\n"),
      }],
    };
  }

  if (uri.startsWith("screenshot://")) {
    const name = uri.split("://")[1];
    const screenshot = screenshots.get(name);
    if (screenshot) {
      return {
        contents: [{
          uri,
          mimeType: "image/png",
          blob: screenshot.split(',')[1], // Remove data URL prefix
        }],
      };
    }
  }

  throw new Error(`Resource not found: ${uri}`);
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

// Run server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch(console.error);

// Cleanup on exit
process.on('SIGINT', async () => {
  await closeBrowser();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeBrowser();
  process.exit(0);
});
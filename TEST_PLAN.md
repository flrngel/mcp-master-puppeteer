# Test Plan for Enhanced MCP Puppeteer Server

## Test Strategy

### 1. Unit Tests
- Test individual utility functions in isolation
- Mock Puppeteer browser/page objects
- Focus on data transformation and error handling

### 2. Integration Tests
- Test complete tool workflows
- Use real Puppeteer with test HTML pages
- Verify return data structure and content

### 3. E2E Tests
- Test MCP server protocol communication
- Verify tool registration and execution
- Test error handling and edge cases

## Test Infrastructure

### Setup
1. Jest for test runner
2. Local test server with sample pages
3. Mock MCP client for protocol testing

### Test Pages Needed
- `simple.html` - Basic page with title, headings, paragraphs
- `forms.html` - Various form types and inputs
- `errors.html` - Page with JS errors and console logs
- `media.html` - Images, videos, complex layout
- `slow.html` - Slow loading page for timeout tests

## Test Cases by Tool

### puppeteer_navigate_analyze
1. ✓ Successful navigation with status 200
2. ✓ Handle redirects and return chain
3. ✓ Capture console logs during navigation
4. ✓ Extract meta tags and page info
5. ✓ Convert HTML to markdown correctly
6. ✓ Handle 404/500 errors gracefully
7. ✓ Timeout handling

### puppeteer_screenshot_plus
1. ✓ Basic screenshot with metadata
2. ✓ Multi-breakpoint screenshots
3. ✓ Element-specific screenshots
4. ✓ Handle missing elements
5. ✓ Image format options (PNG/JPEG)
6. ✓ Capture page dimensions correctly
7. ✓ Actions before screenshot

### puppeteer_extract_content
1. ✓ Extract text with heading hierarchy
2. ✓ Extract links with context
3. ✓ Extract images with alt text
4. ✓ Convert tables to markdown
5. ✓ Handle empty pages
6. ✓ Handle complex nested structures

### puppeteer_get_page_info
1. ✓ Extract all meta tags
2. ✓ Count page resources
3. ✓ Basic performance metrics
4. ✓ Page structure outline
5. ✓ Handle pages without metadata

### puppeteer_analyze_forms
1. ✓ Detect all forms on page
2. ✓ Extract form attributes
3. ✓ List all inputs with details
4. ✓ Handle nested forms
5. ✓ Extract validation attributes

### puppeteer_batch_interact
1. ✓ Execute action sequence
2. ✓ Handle action failures
3. ✓ Return state after each action
4. ✓ Capture console during execution
5. ✓ Rollback on error option

## Test Execution Plan

1. **Phase 1**: Set up test infrastructure
   - Install test dependencies
   - Create test HTML pages
   - Set up test server

2. **Phase 2**: Implement utilities with tests
   - HTML to Markdown converter
   - Error collector
   - Page analyzer

3. **Phase 3**: Implement and test each tool
   - Start with simplest tools
   - Build on shared utilities
   - Add integration tests

4. **Phase 4**: E2E testing
   - Test MCP protocol
   - Test real-world scenarios
   - Performance testing

## Success Criteria
- All unit tests pass with >90% coverage
- Integration tests cover all happy paths
- Error scenarios handled gracefully
- Performance within acceptable limits (<3s per tool call)
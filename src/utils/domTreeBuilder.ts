import { Page } from 'puppeteer';

export interface DomTreeOptions {
  showHighlightElements?: boolean;
  focusHighlightIndex?: number;
  viewportExpansion?: number;
  debugMode?: boolean;
}

export interface DomNodeData {
  tagName?: string;
  type?: string;
  text?: string;
  attributes?: Record<string, string | null>;
  xpath?: string;
  children?: string[];
  isVisible?: boolean;
  isTopElement?: boolean;
  isInteractive?: boolean;
  isInViewport?: boolean;
  highlightIndex?: number;
  shadowRoot?: boolean;
}

export interface DomTreeResult {
  rootId: string;
  map: Record<string, DomNodeData>;
}

export async function buildDomTree(page: Page, options: DomTreeOptions = {}): Promise<DomTreeResult> {
  const {
    showHighlightElements = false,
    focusHighlightIndex = -1,
    viewportExpansion = 0,
    debugMode = false
  } = options;

  // Inject the DOM tree building code directly
  const result = await page.evaluate((args, codeString) => {
    // Create and execute the function
    const buildDomTreeInternal = new Function('args', codeString + '\nreturn buildDomTreeInternal(args);');
    return buildDomTreeInternal(args);
  }, {
    showHighlightElements,
    focusHighlightIndex,
    viewportExpansion,
    debugMode
  }, buildDomTreeCode);

  return result as DomTreeResult;
}

// The actual DOM tree building code as a string
const buildDomTreeCode = `
function buildDomTreeInternal(args) {
  const { showHighlightElements, focusHighlightIndex, viewportExpansion, debugMode } = args;
  const doHighlightElements = true;
  let highlightIndex = 0;

  // DOM caching mechanisms
  const DOM_CACHE = {
    boundingRects: new WeakMap(),
    clientRects: new WeakMap(),
    computedStyles: new WeakMap(),
    clearCache: () => {
      DOM_CACHE.boundingRects = new WeakMap();
      DOM_CACHE.clientRects = new WeakMap();
      DOM_CACHE.computedStyles = new WeakMap();
    }
  };

  function getCachedBoundingRect(element) {
    if (!element) return null;
    if (DOM_CACHE.boundingRects.has(element)) {
      return DOM_CACHE.boundingRects.get(element);
    }
    const rect = element.getBoundingClientRect();
    if (rect) {
      DOM_CACHE.boundingRects.set(element, rect);
    }
    return rect;
  }

  function getCachedComputedStyle(element) {
    if (!element) return null;
    if (DOM_CACHE.computedStyles.has(element)) {
      return DOM_CACHE.computedStyles.get(element);
    }
    const style = window.getComputedStyle(element);
    if (style) {
      DOM_CACHE.computedStyles.set(element, style);
    }
    return style;
  }

  function getCachedClientRects(element) {
    if (!element) return null;
    if (DOM_CACHE.clientRects.has(element)) {
      return DOM_CACHE.clientRects.get(element);
    }
    const rects = element.getClientRects();
    if (rects) {
      DOM_CACHE.clientRects.set(element, rects);
    }
    return rects;
  }

  const DOM_HASH_MAP = {};
  const ID = { current: 0 };
  const HIGHLIGHT_CONTAINER_ID = 'puppeteer-highlight-container';
  const xpathCache = new WeakMap();

  function getElementPosition(currentElement) {
    if (!currentElement.parentElement) {
      return 0;
    }

    const tagName = currentElement.nodeName.toLowerCase();
    const siblings = Array.from(currentElement.parentElement.children).filter(
      sib => sib.nodeName.toLowerCase() === tagName
    );

    if (siblings.length === 1) {
      return 0;
    }

    const index = siblings.indexOf(currentElement) + 1;
    return index;
  }

  function getXPathTree(element, stopAtBoundary = true) {
    if (xpathCache.has(element)) return xpathCache.get(element);

    const segments = [];
    let currentElement = element;

    while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
      if (stopAtBoundary && (currentElement.parentNode instanceof ShadowRoot || currentElement.parentNode instanceof HTMLIFrameElement)) {
        break;
      }

      const position = getElementPosition(currentElement);
      const tagName = currentElement.nodeName.toLowerCase();
      const xpathIndex = position > 0 ? '[' + position + ']' : '';
      segments.unshift(tagName + xpathIndex);

      currentElement = currentElement.parentNode;
    }

    const result = segments.join('/');
    xpathCache.set(element, result);
    return result;
  }

  function isTextNodeVisible(textNode) {
    try {
      if (viewportExpansion === -1) {
        const parentElement = textNode.parentElement;
        if (!parentElement) return false;

        try {
          return parentElement.checkVisibility({
            checkOpacity: true,
            checkVisibilityCSS: true
          });
        } catch (e) {
          const style = window.getComputedStyle(parentElement);
          return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        }
      }

      const range = document.createRange();
      range.selectNodeContents(textNode);
      const rects = range.getClientRects();

      if (!rects || rects.length === 0) {
        return false;
      }

      let isAnyRectVisible = false;
      let isAnyRectInViewport = false;

      for (const rect of rects) {
        if (rect.width > 0 && rect.height > 0) {
          isAnyRectVisible = true;

          if (!(rect.bottom < -viewportExpansion || rect.top > window.innerHeight + viewportExpansion || rect.right < -viewportExpansion || rect.left > window.innerWidth + viewportExpansion)) {
            isAnyRectInViewport = true;
            break;
          }
        }
      }

      if (!isAnyRectVisible || !isAnyRectInViewport) {
        return false;
      }

      const parentElement = textNode.parentElement;
      if (!parentElement) return false;

      try {
        return parentElement.checkVisibility({
          checkOpacity: true,
          checkVisibilityCSS: true
        });
      } catch (e) {
        const style = window.getComputedStyle(parentElement);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      }
    } catch (e) {
      console.warn('Error checking text node visibility:', e);
      return false;
    }
  }

  function isElementAccepted(element) {
    if (!element || !element.tagName) return false;

    const alwaysAccept = new Set(['body', 'div', 'main', 'article', 'section', 'nav', 'header', 'footer']);
    const tagName = element.tagName.toLowerCase();

    if (alwaysAccept.has(tagName)) return true;

    const leafElementDenyList = new Set(['svg', 'script', 'style', 'link', 'meta', 'noscript', 'template']);

    return !leafElementDenyList.has(tagName);
  }

  function isElementVisible(element) {
    const style = getCachedComputedStyle(element);
    return element.offsetWidth > 0 && element.offsetHeight > 0 && style?.visibility !== 'hidden' && style?.display !== 'none';
  }

  function isInteractiveElement(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }

    const tagName = element.tagName.toLowerCase();
    const style = getCachedComputedStyle(element);

    const interactiveCursors = new Set(['pointer', 'move', 'text', 'grab', 'grabbing', 'cell', 'copy', 'alias', 'all-scroll', 'col-resize', 'context-menu', 'crosshair', 'e-resize', 'ew-resize', 'help', 'n-resize', 'ne-resize', 'nesw-resize', 'ns-resize', 'nw-resize', 'nwse-resize', 'row-resize', 's-resize', 'se-resize', 'sw-resize', 'vertical-text', 'w-resize', 'zoom-in', 'zoom-out']);

    const nonInteractiveCursors = new Set(['not-allowed', 'no-drop', 'wait', 'progress', 'initial', 'inherit']);

    function doesElementHaveInteractivePointer(element) {
      if (element.tagName.toLowerCase() === 'html') return false;
      if (style?.cursor && interactiveCursors.has(style.cursor)) return true;
      return false;
    }

    let isInteractiveCursor = doesElementHaveInteractivePointer(element);

    if (isInteractiveCursor) {
      return true;
    }

    const interactiveElements = new Set(['a', 'button', 'input', 'select', 'textarea', 'details', 'summary', 'label', 'option', 'optgroup', 'fieldset', 'legend']);

    const explicitDisableTags = new Set(['disabled', 'readonly']);

    if (interactiveElements.has(tagName)) {
      if (style?.cursor && nonInteractiveCursors.has(style.cursor)) {
        return false;
      }

      for (const disableTag of explicitDisableTags) {
        if (element.hasAttribute(disableTag) || element.getAttribute(disableTag) === 'true' || element.getAttribute(disableTag) === '') {
          return false;
        }
      }

      if (element.disabled) {
        return false;
      }

      if (element.readOnly) {
        return false;
      }

      if (element.inert) {
        return false;
      }

      return true;
    }

    const role = element.getAttribute('role');
    const ariaRole = element.getAttribute('aria-role');

    if (element.getAttribute('contenteditable') === 'true' || element.isContentEditable) {
      return true;
    }

    if (element.classList && (element.classList.contains('button') || element.classList.contains('dropdown-toggle') || element.getAttribute('data-index') || element.getAttribute('data-toggle') === 'dropdown' || element.getAttribute('aria-haspopup') === 'true')) {
      return true;
    }

    const interactiveRoles = new Set(['button', 'menu', 'menubar', 'menuitem', 'menuitemradio', 'menuitemcheckbox', 'radio', 'checkbox', 'tab', 'switch', 'slider', 'spinbutton', 'combobox', 'searchbox', 'textbox', 'listbox', 'option', 'scrollbar']);

    const hasInteractiveRole = interactiveElements.has(tagName) || (role && interactiveRoles.has(role)) || (ariaRole && interactiveRoles.has(ariaRole));

    if (hasInteractiveRole) return true;

    try {
      const commonMouseAttrs = ['onclick', 'onmousedown', 'onmouseup', 'ondblclick'];
      for (const attr of commonMouseAttrs) {
        if (element.hasAttribute(attr) || typeof element[attr] === 'function') {
          return true;
        }
      }
    } catch (e) {
      // Ignore
    }

    return false;
  }

  function isTopElement(element) {
    if (viewportExpansion === -1) {
      return true;
    }

    const rects = getCachedClientRects(element);

    if (!rects || rects.length === 0) {
      return false;
    }

    let isAnyRectInViewport = false;
    for (const rect of rects) {
      if (rect.width > 0 && rect.height > 0 && !(rect.bottom < -viewportExpansion || rect.top > window.innerHeight + viewportExpansion || rect.right < -viewportExpansion || rect.left > window.innerWidth + viewportExpansion)) {
        isAnyRectInViewport = true;
        break;
      }
    }

    if (!isAnyRectInViewport) {
      return false;
    }

    let doc = element.ownerDocument;

    if (doc !== window.document) {
      return true;
    }

    const shadowRoot = element.getRootNode();
    if (shadowRoot instanceof ShadowRoot) {
      const centerX = rects[Math.floor(rects.length / 2)].left + rects[Math.floor(rects.length / 2)].width / 2;
      const centerY = rects[Math.floor(rects.length / 2)].top + rects[Math.floor(rects.length / 2)].height / 2;

      try {
        const topEl = shadowRoot.elementFromPoint(centerX, centerY);
        if (!topEl) return false;

        let current = topEl;
        while (current && current !== shadowRoot) {
          if (current === element) return true;
          current = current.parentElement;
        }
        return false;
      } catch (e) {
        return true;
      }
    }

    const margin = 5;
    const rect = rects[Math.floor(rects.length / 2)];

    const checkPoints = [
      { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
      { x: rect.left + margin, y: rect.top + margin },
      { x: rect.right - margin, y: rect.bottom - margin }
    ];

    return checkPoints.some(({ x, y }) => {
      try {
        const topEl = document.elementFromPoint(x, y);
        if (!topEl) return false;

        let current = topEl;
        while (current && current !== document.documentElement) {
          if (current === element) return true;
          current = current.parentElement;
        }
        return false;
      } catch (e) {
        return true;
      }
    });
  }

  function isInExpandedViewport(element, viewportExpansion) {
    if (viewportExpansion === -1) {
      return true;
    }

    const rects = element.getClientRects();

    if (!rects || rects.length === 0) {
      const boundingRect = getCachedBoundingRect(element);
      if (!boundingRect || boundingRect.width === 0 || boundingRect.height === 0) {
        return false;
      }
      return !(boundingRect.bottom < -viewportExpansion || boundingRect.top > window.innerHeight + viewportExpansion || boundingRect.right < -viewportExpansion || boundingRect.left > window.innerWidth + viewportExpansion);
    }

    for (const rect of rects) {
      if (rect.width === 0 || rect.height === 0) continue;

      if (!(rect.bottom < -viewportExpansion || rect.top > window.innerHeight + viewportExpansion || rect.right < -viewportExpansion || rect.left > window.innerWidth + viewportExpansion)) {
        return true;
      }
    }

    return false;
  }

  function isInteractiveCandidate(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;

    const tagName = element.tagName.toLowerCase();

    const interactiveElements = new Set(['a', 'button', 'input', 'select', 'textarea', 'details', 'summary', 'label']);

    if (interactiveElements.has(tagName)) return true;

    const hasQuickInteractiveAttr = element.hasAttribute('onclick') || element.hasAttribute('role') || element.hasAttribute('tabindex') || element.hasAttribute('aria-') || element.hasAttribute('data-action') || element.getAttribute('contenteditable') === 'true';

    return hasQuickInteractiveAttr;
  }

  const DISTINCT_INTERACTIVE_TAGS = new Set(['a', 'button', 'input', 'select', 'textarea', 'summary', 'details', 'label', 'option']);
  const INTERACTIVE_ROLES = new Set(['button', 'link', 'menuitem', 'menuitemradio', 'menuitemcheckbox', 'radio', 'checkbox', 'tab', 'switch', 'slider', 'spinbutton', 'combobox', 'searchbox', 'textbox', 'listbox', 'option', 'scrollbar']);

  function isHeuristicallyInteractive(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;

    if (!isElementVisible(element)) return false;

    const hasInteractiveAttributes = element.hasAttribute('role') || element.hasAttribute('tabindex') || element.hasAttribute('onclick') || typeof element.onclick === 'function';

    const hasInteractiveClass = /\\b(btn|clickable|menu|item|entry|link)\\b/i.test(element.className || '');

    const isInKnownContainer = Boolean(element.closest('button,a,[role="button"],.menu,.dropdown,.list,.toolbar'));

    const hasVisibleChildren = [...element.children].some(child => isElementVisible(child));

    const isParentBody = element.parentElement && element.parentElement.isSameNode(document.body);

    return (isInteractiveElement(element) || hasInteractiveAttributes || hasInteractiveClass) && hasVisibleChildren && isInKnownContainer && !isParentBody;
  }

  function isElementDistinctInteraction(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }

    const tagName = element.tagName.toLowerCase();
    const role = element.getAttribute('role');

    if (tagName === 'iframe') {
      return true;
    }

    if (DISTINCT_INTERACTIVE_TAGS.has(tagName)) {
      return true;
    }

    if (role && INTERACTIVE_ROLES.has(role)) {
      return true;
    }

    if (element.isContentEditable || element.getAttribute('contenteditable') === 'true') {
      return true;
    }

    if (element.hasAttribute('data-testid') || element.hasAttribute('data-cy') || element.hasAttribute('data-test')) {
      return true;
    }

    if (element.hasAttribute('onclick') || typeof element.onclick === 'function') {
      return true;
    }

    try {
      const commonEventAttrs = ['onmousedown', 'onmouseup', 'onkeydown', 'onkeyup', 'onsubmit', 'onchange', 'oninput', 'onfocus', 'onblur'];
      if (commonEventAttrs.some(attr => element.hasAttribute(attr))) {
        return true;
      }
    } catch (e) {
      // Ignore
    }

    if (isHeuristicallyInteractive(element)) {
      return true;
    }

    return false;
  }

  function handleHighlighting(nodeData, node, parentIframe, isParentHighlighted) {
    if (!nodeData.isInteractive) return false;

    let shouldHighlight = false;
    if (!isParentHighlighted) {
      shouldHighlight = true;
    } else {
      if (isElementDistinctInteraction(node)) {
        shouldHighlight = true;
      } else {
        shouldHighlight = false;
      }
    }

    if (shouldHighlight) {
      nodeData.isInViewport = isInExpandedViewport(node, viewportExpansion);

      if (nodeData.isInViewport || viewportExpansion === -1) {
        nodeData.highlightIndex = highlightIndex++;
        return true;
      }
    }

    return false;
  }

  function buildDomTreeRecursive(node, parentIframe = null, isParentHighlighted = false) {
    if (!node || node.id === HIGHLIGHT_CONTAINER_ID || (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.TEXT_NODE)) {
      return null;
    }

    if (node === document.body) {
      const nodeData = {
        tagName: 'body',
        attributes: {},
        xpath: '/body',
        children: []
      };

      for (const child of node.childNodes) {
        const domElement = buildDomTreeRecursive(child, parentIframe, false);
        if (domElement) nodeData.children.push(domElement);
      }

      const id = String(ID.current++);
      DOM_HASH_MAP[id] = nodeData;
      return id;
    }

    if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.TEXT_NODE) {
      return null;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.textContent?.trim();
      if (!textContent) {
        return null;
      }

      const parentElement = node.parentElement;
      if (!parentElement || parentElement.tagName.toLowerCase() === 'script') {
        return null;
      }

      const id = String(ID.current++);
      DOM_HASH_MAP[id] = {
        type: 'TEXT_NODE',
        text: textContent,
        isVisible: isTextNodeVisible(node)
      };
      return id;
    }

    if (node.nodeType === Node.ELEMENT_NODE && !isElementAccepted(node)) {
      return null;
    }

    if (viewportExpansion !== -1 && !node.shadowRoot) {
      const rect = getCachedBoundingRect(node);
      const style = getCachedComputedStyle(node);

      const isFixedOrSticky = style && (style.position === 'fixed' || style.position === 'sticky');

      const hasSize = node.offsetWidth > 0 || node.offsetHeight > 0;

      if (!rect || (!isFixedOrSticky && !hasSize && (rect.bottom < -viewportExpansion || rect.top > window.innerHeight + viewportExpansion || rect.right < -viewportExpansion || rect.left > window.innerWidth + viewportExpansion))) {
        return null;
      }
    }

    const nodeData = {
      tagName: node.tagName.toLowerCase(),
      attributes: {},
      xpath: getXPathTree(node, true),
      children: []
    };

    if (isInteractiveCandidate(node) || node.tagName.toLowerCase() === 'iframe' || node.tagName.toLowerCase() === 'body') {
      const attributeNames = node.getAttributeNames?.() || [];
      for (const name of attributeNames) {
        const value = node.getAttribute(name);
        nodeData.attributes[name] = value;
      }
    }

    let nodeWasHighlighted = false;

    if (node.nodeType === Node.ELEMENT_NODE) {
      nodeData.isVisible = isElementVisible(node);
      if (nodeData.isVisible) {
        nodeData.isTopElement = isTopElement(node);

        const role = node.getAttribute('role');
        const isMenuContainer = role === 'menu' || role === 'menubar' || role === 'listbox';

        if (nodeData.isTopElement || isMenuContainer) {
          nodeData.isInteractive = isInteractiveElement(node);
          nodeWasHighlighted = handleHighlighting(nodeData, node, parentIframe, isParentHighlighted);
        }
      }
    }

    if (node.tagName) {
      const tagName = node.tagName.toLowerCase();

      if (tagName === 'iframe') {
        try {
          const iframeDoc = node.contentDocument || node.contentWindow?.document;
          if (iframeDoc) {
            for (const child of iframeDoc.childNodes) {
              const domElement = buildDomTreeRecursive(child, node, false);
              if (domElement) nodeData.children.push(domElement);
            }
          }
        } catch (e) {
          console.warn('Unable to access iframe:', e);
        }
      } else if (node.isContentEditable || node.getAttribute('contenteditable') === 'true' || node.id === 'tinymce' || node.classList.contains('mce-content-body') || (tagName === 'body' && node.getAttribute('data-id')?.startsWith('mce_'))) {
        for (const child of node.childNodes) {
          const domElement = buildDomTreeRecursive(child, parentIframe, nodeWasHighlighted);
          if (domElement) nodeData.children.push(domElement);
        }
      } else {
        if (node.shadowRoot) {
          nodeData.shadowRoot = true;
          for (const child of node.shadowRoot.childNodes) {
            const domElement = buildDomTreeRecursive(child, parentIframe, nodeWasHighlighted);
            if (domElement) nodeData.children.push(domElement);
          }
        }

        for (const child of node.childNodes) {
          const passHighlightStatusToChild = nodeWasHighlighted || isParentHighlighted;
          const domElement = buildDomTreeRecursive(child, parentIframe, passHighlightStatusToChild);
          if (domElement) nodeData.children.push(domElement);
        }
      }
    }

    if (nodeData.tagName === 'a' && nodeData.children.length === 0 && !nodeData.attributes.href) {
      const rect = getCachedBoundingRect(node);
      const hasSize = (rect && rect.width > 0 && rect.height > 0) || node.offsetWidth > 0 || node.offsetHeight > 0;

      if (!hasSize) {
        return null;
      }
    }

    const id = String(ID.current++);
    DOM_HASH_MAP[id] = nodeData;
    return id;
  }

  const rootId = buildDomTreeRecursive(document.body);

  DOM_CACHE.clearCache();

  return { rootId, map: DOM_HASH_MAP };
}
`;

export async function cleanupHighlights(page: Page): Promise<void> {
  await page.evaluate(() => {
    // Clean up any existing highlights
    const container = document.getElementById('puppeteer-highlight-container');
    if (container) {
      container.remove();
    }

    // Clean up any stored cleanup functions
    if ((window as any)._highlightCleanupFunctions && (window as any)._highlightCleanupFunctions.length) {
      (window as any)._highlightCleanupFunctions.forEach((fn: Function) => fn());
      (window as any)._highlightCleanupFunctions = [];
    }
  });
}

export function extractInteractiveElements(domTree: DomTreeResult): Array<{
  index: number;
  tag: string;
  text?: string;
  href?: string;
  type?: string;
  name?: string;
  value?: string;
  placeholder?: string;
}> {
  const interactiveElements: Array<any> = [];
  
  function traverse(nodeId: string) {
    const node = domTree.map[nodeId];
    if (!node) return;
    
    if (node.highlightIndex !== undefined) {
      // Extract only essential attributes for decision making
      const element: any = {
        index: node.highlightIndex,
        tag: node.tagName || ''
      };
      
      // Add text content if available and short
      if (node.text && node.text.length <= 50) {
        element.text = node.text;
      } else if (node.text) {
        element.text = node.text.substring(0, 47) + '...';
      }
      
      // Only include essential attributes based on tag type
      const attrs = node.attributes || {};
      
      // For links
      if (node.tagName === 'a' && attrs.href) {
        element.href = attrs.href;
      }
      
      // For inputs/buttons
      if ((node.tagName === 'input' || node.tagName === 'button')) {
        if (attrs.type) element.type = attrs.type;
        if (attrs.name) element.name = attrs.name;
        if (attrs.value && attrs.value.length <= 30) element.value = attrs.value;
        if (attrs.placeholder) element.placeholder = attrs.placeholder;
      }
      
      // For selects
      if (node.tagName === 'select' && attrs.name) {
        element.name = attrs.name;
      }
      
      // Extract visible text from children if no direct text
      if (!element.text && node.children) {
        const childTexts: string[] = [];
        for (const childId of node.children) {
          const child = domTree.map[childId];
          if (child && child.type === 'TEXT_NODE' && child.text && child.isVisible) {
            childTexts.push(child.text);
          }
        }
        if (childTexts.length > 0) {
          const combinedText = childTexts.join(' ').trim();
          if (combinedText.length <= 50) {
            element.text = combinedText;
          } else {
            element.text = combinedText.substring(0, 47) + '...';
          }
        }
      }
      
      interactiveElements.push(element);
    }
    
    if (node.children) {
      for (const childId of node.children) {
        traverse(childId);
      }
    }
  }
  
  if (domTree.rootId) {
    traverse(domTree.rootId);
  }
  
  // Sort by highlight index
  return interactiveElements.sort((a, b) => a.index - b.index);
}
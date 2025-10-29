/**
 * UI Text Replacement Fix
 * Replaces "Delayed" with "Sold Undelivered" in ALL UI elements
 * Keeps internal code/database values unchanged
 */

console.log('🏷️ Loading UI Text Replacement Fix...');

window.uiTextReplacementFix = {
    
    // Text mapping for UI display
    textReplacements: {
        'Delayed': 'Sold Undelivered'
    },
    
    /**
     * Replace text in an element
     */
    replaceTextInElement(element) {
        if (!element) return;
        
        // Replace text content
        if (element.textContent) {
            let newText = element.textContent;
            for (const [oldText, newText_] of Object.entries(this.textReplacements)) {
                newText = newText.replace(new RegExp(oldText, 'g'), newText_);
            }
            if (newText !== element.textContent) {
                element.textContent = newText;
            }
        }
        
        // Replace innerHTML content (for badges, etc.)
        if (element.innerHTML) {
            let newHTML = element.innerHTML;
            for (const [oldText, newText_] of Object.entries(this.textReplacements)) {
                newHTML = newHTML.replace(new RegExp(oldText, 'g'), newText_);
            }
            if (newHTML !== element.innerHTML) {
                element.innerHTML = newHTML;
            }
        }
        
        // Replace option text in select elements
        if (element.tagName === 'OPTION' && element.text) {
            let newText = element.text;
            for (const [oldText, newText_] of Object.entries(this.textReplacements)) {
                newText = newText.replace(new RegExp(oldText, 'g'), newText_);
            }
            if (newText !== element.text) {
                element.text = newText;
            }
        }
    },
    
    /**
     * Scan and replace text in all elements
     */
    scanAndReplace() {
        try {
            // Replace in all text nodes
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            
            const textNodes = [];
            let node;
            while (node = walker.nextNode()) {
                textNodes.push(node);
            }
            
            textNodes.forEach(textNode => {
                let newText = textNode.textContent;
                for (const [oldText, newText_] of Object.entries(this.textReplacements)) {
                    newText = newText.replace(new RegExp(oldText, 'g'), newText_);
                }
                if (newText !== textNode.textContent) {
                    textNode.textContent = newText;
                }
            });
            
            // Replace in select options specifically
            const selectElements = document.querySelectorAll('select');
            selectElements.forEach(select => {
                const options = select.querySelectorAll('option');
                options.forEach(option => {
                    this.replaceTextInElement(option);
                });
            });
            
            // Replace in badges and status elements
            const statusElements = document.querySelectorAll('.badge, .status, [class*="status"]');
            statusElements.forEach(element => {
                this.replaceTextInElement(element);
            });
            
        } catch (error) {
            console.warn('Error during text replacement:', error);
        }
    },
    
    /**
     * Override select option generation
     */
    overrideSelectGeneration() {
        // Store original createElement
        const originalCreateElement = document.createElement;
        
        document.createElement = function(tagName) {
            const element = originalCreateElement.call(document, tagName);
            
            // If creating an option element, monitor for text changes
            if (tagName.toLowerCase() === 'option') {
                const originalSetText = Object.getOwnPropertyDescriptor(HTMLOptionElement.prototype, 'text').set;
                
                Object.defineProperty(element, 'text', {
                    set: function(value) {
                        // Replace text before setting
                        let newValue = value;
                        for (const [oldText, newText] of Object.entries(window.uiTextReplacementFix.textReplacements)) {
                            newValue = newValue.replace(new RegExp(oldText, 'g'), newText);
                        }
                        originalSetText.call(this, newValue);
                    },
                    get: function() {
                        return this.textContent;
                    }
                });
            }
            
            return element;
        };
    },
    
    /**
     * Override innerHTML setter to replace text
     */
    overrideInnerHTML() {
        const originalInnerHTMLSetter = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML').set;
        
        Object.defineProperty(Element.prototype, 'innerHTML', {
            set: function(value) {
                // Replace text in HTML content
                let newValue = value;
                for (const [oldText, newText] of Object.entries(window.uiTextReplacementFix.textReplacements)) {
                    newValue = newValue.replace(new RegExp(oldText, 'g'), newText);
                }
                originalInnerHTMLSetter.call(this, newValue);
            },
            get: function() {
                return this.innerHTML;
            }
        });
    },
    
    /**
     * Monitor for dynamic content changes
     */
    startMonitoring() {
        // Use MutationObserver to catch dynamic content
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Replace text in newly added elements
                            this.replaceTextInElement(node);
                            
                            // Replace text in child elements
                            const childElements = node.querySelectorAll('*');
                            childElements.forEach(child => {
                                this.replaceTextInElement(child);
                            });
                        } else if (node.nodeType === Node.TEXT_NODE) {
                            // Replace text in newly added text nodes
                            let newText = node.textContent;
                            for (const [oldText, newText_] of Object.entries(this.textReplacements)) {
                                newText = newText.replace(new RegExp(oldText, 'g'), newText_);
                            }
                            if (newText !== node.textContent) {
                                node.textContent = newText;
                            }
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('✅ UI text replacement monitoring started');
    },
    
    /**
     * Initialize UI text replacement
     */
    initialize() {
        console.log('🚀 Initializing UI text replacement...');
        
        // Initial scan and replace
        this.scanAndReplace();
        
        // Override methods for dynamic content
        this.overrideSelectGeneration();
        this.overrideInnerHTML();
        
        // Start monitoring for changes
        this.startMonitoring();
        
        // Periodic re-scan for any missed content
        setInterval(() => {
            this.scanAndReplace();
        }, 2000); // Every 2 seconds
        
        console.log('✅ UI text replacement initialized');
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            window.uiTextReplacementFix.initialize();
        }, 1000);
    });
} else {
    // DOM is already ready
    setTimeout(() => {
        window.uiTextReplacementFix.initialize();
    }, 1000);
}

// Also run after page load
window.addEventListener('load', function() {
    setTimeout(() => {
        window.uiTextReplacementFix.scanAndReplace();
    }, 2000);
});

console.log('✅ UI Text Replacement Fix loaded');
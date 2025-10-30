/**
 * Safe UI Text Replacement Fix
 * Replaces "Delayed" with "Canceled" in ALL UI elements
 * Fixed version that prevents recursive call stack errors
 */

console.log('🏷️ Loading Safe UI Text Replacement Fix...');

window.safeUITextReplacementFix = {
    
    // Text mapping for UI display
    textReplacements: {
        'Delayed': 'Canceled'
    },
    
    // Flag to prevent recursive calls
    isProcessing: false,
    
    /**
     * Replace text in an element safely
     */
    replaceTextInElement(element) {
        if (!element || this.isProcessing) return;
        
        try {
            this.isProcessing = true;
            
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
            
        } catch (error) {
            console.warn('Error replacing text in element:', error);
        } finally {
            this.isProcessing = false;
        }
    },
    
    /**
     * Scan and replace text in all elements safely
     */
    scanAndReplace() {
        if (this.isProcessing) return;
        
        try {
            this.isProcessing = true;
            
            // Replace in text nodes only (safer approach)
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function(node) {
                        // Skip script and style nodes
                        const parent = node.parentNode;
                        if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        return NodeFilter.FILTER_ACCEPT;
                    }
                },
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
                    if (option.textContent.includes('Delayed')) {
                        option.textContent = option.textContent.replace('Delayed', 'Canceled');
                    }
                    if (option.text && option.text.includes('Delayed')) {
                        option.text = option.text.replace('Delayed', 'Canceled');
                    }
                });
            });
            
            // Replace in badges and status elements
            const statusElements = document.querySelectorAll('.badge, .status, [class*="status"]');
            statusElements.forEach(element => {
                if (element.textContent.includes('Delayed')) {
                    element.textContent = element.textContent.replace('Delayed', 'Canceled');
                }
            });
            
        } catch (error) {
            console.warn('Error during safe text replacement:', error);
        } finally {
            this.isProcessing = false;
        }
    },
    
    /**
     * Monitor for dynamic content changes safely
     */
    startMonitoring() {
        // Use MutationObserver to catch dynamic content
        const observer = new MutationObserver((mutations) => {
            if (this.isProcessing) return;
            
            let shouldProcess = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    shouldProcess = true;
                }
            });
            
            if (shouldProcess) {
                // Debounce the processing
                clearTimeout(this.processingTimeout);
                this.processingTimeout = setTimeout(() => {
                    this.scanAndReplace();
                }, 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('✅ Safe UI text replacement monitoring started');
    },
    
    /**
     * Initialize safe UI text replacement
     */
    initialize() {
        console.log('🚀 Initializing safe UI text replacement...');
        
        // Initial scan and replace
        setTimeout(() => {
            this.scanAndReplace();
        }, 1000);
        
        // Start monitoring for changes
        this.startMonitoring();
        
        // Periodic re-scan for any missed content (less frequent)
        setInterval(() => {
            if (!this.isProcessing) {
                this.scanAndReplace();
            }
        }, 5000); // Every 5 seconds
        
        console.log('✅ Safe UI text replacement initialized');
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            window.safeUITextReplacementFix.initialize();
        }, 1500);
    });
} else {
    // DOM is already ready
    setTimeout(() => {
        window.safeUITextReplacementFix.initialize();
    }, 1500);
}

// Also run after page load
window.addEventListener('load', function() {
    setTimeout(() => {
        if (window.safeUITextReplacementFix && !window.safeUITextReplacementFix.isProcessing) {
            window.safeUITextReplacementFix.scanAndReplace();
        }
    }, 3000);
});

console.log('✅ Safe UI Text Replacement Fix loaded');
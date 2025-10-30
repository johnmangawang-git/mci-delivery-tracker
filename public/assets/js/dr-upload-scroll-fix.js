/**
 * DR UPLOAD SCROLL FIX
 * Fixes UI freeze and scrolling issues after DR upload
 */

console.log('🔧 Loading DR Upload Scroll Fix...');

(function() {
    'use strict';
    
    /**
     * Enhanced modal cleanup to prevent UI freeze
     */
    function forceModalCleanup() {
        console.log('🧹 Force cleaning up modal state...');
        
        try {
            // Remove all modal backdrops
            const modalBackdrops = document.querySelectorAll('.modal-backdrop');
            modalBackdrops.forEach(backdrop => {
                if (backdrop && backdrop.parentNode) {
                    backdrop.parentNode.removeChild(backdrop);
                }
            });
            
            // Remove modal-open class from body
            document.body.classList.remove('modal-open');
            
            // Force re-enable scrolling
            document.body.style.overflow = '';
            document.body.style.overflowY = '';
            document.body.style.paddingRight = '';
            document.body.style.position = '';
            
            // Remove any Bootstrap modal classes that might interfere
            document.body.classList.remove('modal-scrollbar-measure');
            
            // Force scroll to work
            document.documentElement.style.overflow = '';
            document.documentElement.style.overflowY = '';
            
            console.log('✅ Modal cleanup completed');
            
        } catch (error) {
            console.error('❌ Error during modal cleanup:', error);
        }
    }
    
    /**
     * Debounced function to prevent multiple rapid calls
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Enhanced confirmDRUpload wrapper
     */
    function wrapConfirmDRUpload() {
        if (typeof window.confirmDRUpload === 'function') {
            const originalConfirmDRUpload = window.confirmDRUpload;
            
            window.confirmDRUpload = async function(...args) {
                console.log('🔄 Enhanced confirmDRUpload with scroll fix...');
                
                try {
                    // Call original function
                    const result = await originalConfirmDRUpload.apply(this, args);
                    
                    // Immediate cleanup
                    forceModalCleanup();
                    
                    // Debounced cleanup after a short delay
                    const debouncedCleanup = debounce(forceModalCleanup, 100);
                    debouncedCleanup();
                    
                    // Final cleanup after longer delay
                    setTimeout(() => {
                        forceModalCleanup();
                        
                        // Force scroll to top to test scrolling
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        
                        console.log('✅ DR Upload scroll fix applied');
                    }, 500);
                    
                    return result;
                    
                } catch (error) {
                    console.error('❌ Error in enhanced confirmDRUpload:', error);
                    
                    // Still try to cleanup even if there's an error
                    forceModalCleanup();
                    
                    throw error;
                }
            };
            
            console.log('✅ Enhanced confirmDRUpload function wrapped');
        }
    }
    
    /**
     * Monitor for scroll issues and fix them
     */
    function monitorScrollIssues() {
        let scrollCheckInterval;
        
        // Check if scrolling is working every 2 seconds
        scrollCheckInterval = setInterval(() => {
            const bodyStyle = window.getComputedStyle(document.body);
            const htmlStyle = window.getComputedStyle(document.documentElement);
            
            // Check if overflow is hidden or body has modal-open class
            if (bodyStyle.overflow === 'hidden' || 
                document.body.classList.contains('modal-open') ||
                htmlStyle.overflow === 'hidden') {
                
                console.log('⚠️ Detected scroll issue, fixing...');
                forceModalCleanup();
            }
        }, 2000);
        
        // Stop monitoring after 30 seconds
        setTimeout(() => {
            clearInterval(scrollCheckInterval);
            console.log('📊 Stopped scroll monitoring');
        }, 30000);
    }
    
    /**
     * Add keyboard shortcut to force fix scroll issues
     */
    function addKeyboardShortcut() {
        document.addEventListener('keydown', function(event) {
            // Ctrl + Shift + S to force fix scroll
            if (event.ctrlKey && event.shiftKey && event.key === 'S') {
                event.preventDefault();
                console.log('🔧 Manual scroll fix triggered');
                forceModalCleanup();
                
                // Show toast if available
                if (typeof window.showToast === 'function') {
                    window.showToast('Scroll fix applied', 'info');
                }
            }
        });
    }
    
    /**
     * Initialize DR upload scroll fix
     */
    function initDRUploadScrollFix() {
        console.log('🚀 Initializing DR Upload Scroll Fix...');
        
        // Wrap the confirmDRUpload function
        wrapConfirmDRUpload();
        
        // Start monitoring for scroll issues
        monitorScrollIssues();
        
        // Add keyboard shortcut
        addKeyboardShortcut();
        
        // Listen for modal events
        document.addEventListener('hidden.bs.modal', function(event) {
            if (event.target.id === 'drUploadModal') {
                console.log('🔄 DR Upload modal hidden, applying scroll fix...');
                setTimeout(forceModalCleanup, 100);
            }
        });
        
        console.log('✅ DR Upload Scroll Fix initialized');
        console.log('💡 Use Ctrl+Shift+S to manually fix scroll issues');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDRUploadScrollFix);
    } else {
        initDRUploadScrollFix();
    }
    
    // Re-initialize when confirmDRUpload function is redefined
    const observer = new MutationObserver(() => {
        if (typeof window.confirmDRUpload === 'function' && 
            !window.confirmDRUpload.toString().includes('Enhanced confirmDRUpload with scroll fix')) {
            wrapConfirmDRUpload();
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Export for global access
    window.drUploadScrollFix = {
        forceModalCleanup,
        wrapConfirmDRUpload
    };
    
    console.log('✅ DR Upload Scroll Fix loaded');
    
})();
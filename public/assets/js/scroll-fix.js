/**
 * SCROLL FIX UTILITY
 * Fixes scrolling issues caused by lingering modal states
 */

console.log('🔧 Loading Scroll Fix Utility...');

// Global function to restore scrolling
window.restoreScrolling = function() {
    console.log('🔄 Restoring scrolling...');
    
    try {
        // Remove modal-open class from body
        if (document.body.classList.contains('modal-open')) {
            document.body.classList.remove('modal-open');
            console.log('✅ Removed modal-open class');
        }
        
        // Reset body styles
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        document.body.style.position = '';
        
        // Reset html styles as well
        document.documentElement.style.overflow = '';
        document.documentElement.style.height = '';
        
        // Remove all modal backdrops
        const backdrops = document.querySelectorAll('.modal-backdrop');
        if (backdrops.length > 0) {
            backdrops.forEach(backdrop => backdrop.remove());
            console.log(`✅ Removed ${backdrops.length} modal backdrop(s)`);
        }
        
        // Close any lingering modals
        const openModals = document.querySelectorAll('.modal.show');
        if (openModals.length > 0) {
            openModals.forEach(modal => {
                modal.classList.remove('show');
                modal.style.display = 'none';
            });
            console.log(`✅ Closed ${openModals.length} open modal(s)`);
        }
        
        console.log('✅ Scrolling restored successfully');
        
    } catch (error) {
        console.error('❌ Error restoring scrolling:', error);
    }
};

// Enhanced modal cleanup function
window.cleanupModals = function() {
    console.log('🧹 Cleaning up modals...');
    
    // Use multiple cleanup methods for reliability
    const cleanupMethods = [
        // Method 1: Standard cleanup
        () => {
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        },
        
        // Method 2: Remove all backdrops
        () => {
            document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
                if (backdrop && backdrop.parentNode) {
                    backdrop.parentNode.removeChild(backdrop);
                }
            });
        },
        
        // Method 3: Force body styles
        () => {
            document.body.style.overflow = 'auto';
            document.body.style.paddingRight = '0';
            document.documentElement.style.overflow = 'auto';
        },
        
        // Method 4: Close all modals
        () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('show');
                modal.style.display = 'none';
                modal.setAttribute('aria-hidden', 'true');
            });
        }
    ];
    
    // Execute all cleanup methods
    cleanupMethods.forEach((method, index) => {
        try {
            method();
            console.log(`✅ Cleanup method ${index + 1} completed`);
        } catch (error) {
            console.warn(`⚠️ Cleanup method ${index + 1} failed:`, error);
        }
    });
    
    console.log('✅ Modal cleanup completed');
};

// Auto-restore scrolling when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Auto-checking scroll state on page load...');
    
    // Check if scrolling is disabled
    setTimeout(() => {
        const bodyHasModalOpen = document.body.classList.contains('modal-open');
        const bodyOverflowHidden = document.body.style.overflow === 'hidden';
        const hasBackdrops = document.querySelectorAll('.modal-backdrop').length > 0;
        
        if (bodyHasModalOpen || bodyOverflowHidden || hasBackdrops) {
            console.log('⚠️ Detected scroll issues on page load, auto-fixing...');
            window.restoreScrolling();
        } else {
            console.log('✅ No scroll issues detected');
        }
    }, 1000);
});

// Auto-restore scrolling when modals are closed
document.addEventListener('hidden.bs.modal', function(event) {
    console.log('🔄 Modal closed, ensuring scrolling is restored...');
    setTimeout(() => {
        window.restoreScrolling();
    }, 100);
});

// Keyboard shortcut to restore scrolling (Ctrl+Shift+S)
document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        console.log('🎹 Keyboard shortcut triggered: Restoring scrolling...');
        window.restoreScrolling();
        
        // Show a brief notification
        if (typeof showToast === 'function') {
            showToast('Scrolling restored!', 'success');
        } else {
            console.log('✅ Scrolling restored via keyboard shortcut');
        }
    }
});

// Periodic check for scroll issues (every 30 seconds)
setInterval(() => {
    const bodyHasModalOpen = document.body.classList.contains('modal-open');
    const hasBackdrops = document.querySelectorAll('.modal-backdrop').length > 0;
    const openModals = document.querySelectorAll('.modal.show').length;
    
    // Only fix if there are issues but no actual open modals
    if ((bodyHasModalOpen || hasBackdrops) && openModals === 0) {
        console.log('🔄 Periodic check: Found scroll issues with no open modals, auto-fixing...');
        window.restoreScrolling();
    }
}, 30000);

console.log('✅ Scroll Fix Utility loaded successfully');
console.log('💡 Use Ctrl+Shift+S to manually restore scrolling if needed');
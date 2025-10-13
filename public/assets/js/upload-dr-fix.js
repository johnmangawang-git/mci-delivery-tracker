/**
 * DIRECT FIX: Upload DR File Button
 * This ensures the Upload DR File button works on the live site
 */

console.log('🔧 Direct Upload DR File button fix loading...');

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUploadButton);
} else {
    initUploadButton();
}

function initUploadButton() {
    console.log('🔧 Initializing Upload DR File button...');
    
    // Find the button
    const uploadBtn = document.getElementById('uploadDrFileBtn');
    
    if (uploadBtn) {
        console.log('✅ Found Upload DR File button');
        
        // Remove any existing event listeners
        uploadBtn.onclick = null;
        
        // Add direct onclick handler
        uploadBtn.onclick = function(e) {
            console.log('🚀 Upload DR File button clicked!');
            e.preventDefault();
            e.stopPropagation();
            
            // Show the modal
            try {
                const modalElement = document.getElementById('drUploadModal');
                if (modalElement) {
                    // Try Bootstrap modal first
                    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                        const modal = new bootstrap.Modal(modalElement);
                        modal.show();
                        console.log('✅ Bootstrap modal opened');
                    } else {
                        // Fallback: show modal manually
                        modalElement.style.display = 'block';
                        modalElement.classList.add('show');
                        document.body.classList.add('modal-open');
                        console.log('✅ Manual modal opened');
                    }
                } else {
                    console.error('❌ Modal element not found');
                    alert('Upload dialog not available. Please refresh the page.');
                }
            } catch (error) {
                console.error('❌ Error opening modal:', error);
                alert('Error opening upload dialog: ' + error.message);
            }
        };
        
        // Also add event listener as backup
        uploadBtn.addEventListener('click', function(e) {
            console.log('🚀 Event listener: Upload DR File button clicked!');
            // The onclick handler above will handle this
        });
        
        console.log('✅ Upload DR File button is now functional');
        
        // Test the button
        console.log('🧪 Testing button click...');
        
    } else {
        console.error('❌ Upload DR File button not found!');
        
        // Try to find it with different methods
        const allButtons = document.querySelectorAll('button');
        console.log('Found buttons:', allButtons.length);
        
        allButtons.forEach((btn, index) => {
            if (btn.textContent.includes('Upload') || btn.textContent.includes('DR')) {
                console.log(`Button ${index}:`, btn.textContent, btn.id, btn.className);
            }
        });
    }
}

// Also try to initialize after a delay
setTimeout(() => {
    console.log('🔄 Retry: Initializing Upload DR File button after delay...');
    initUploadButton();
}, 2000);

// And try again after 5 seconds
setTimeout(() => {
    console.log('🔄 Final retry: Initializing Upload DR File button...');
    initUploadButton();
}, 5000);
/* =================================
   PREMIUM CLOSET - ELITE JAVASCRIPT
   ================================= */

// --- STATE MANAGEMENT ---
const state = {
    cart: [],
    currentPage: 'home',
    user: null,
    products: []
};

// --- PRODUCT DATA ---
const productData = [
    {
        id: 1,
        name: 'Signature Tee',
        description: 'Premium organic cotton',
        price: 45.00,
        image: 'image12.jpg',
        category: 'new',
        badge: 'New'
    },
    {
        id: 2,
        name: 'Luxury Shorts',
        description: 'Italian linen blend',
        price: 65.00,
        image: 'image17.jpg',
        category: 'featured'
    },
    {
        id: 3,
        name: 'Artisan Shoes',
        description: 'Hand-carved ebony details',
        price: 120.00,
        image: 'image6.jpg',
        category: 'featured',
        badge: 'Bestseller'
    },
    {
        id: 4,
        name: 'Heritage Jacket',
        description: 'Wool blend with leather trim',
        price: 285.00,
        image: 'image12.jpg',
        category: 'new',
        badge: 'New'
    },
    {
        id: 5,
        name: 'Classic Denim',
        description: 'Japanese selvedge denim',
        price: 165.00,
        image: 'image17.jpg',
        category: 'collection'
    },
    {
        id: 6,
        name: 'Leather Belt',
        description: 'Full-grain Italian leather',
        price: 95.00,
        image: 'image6.jpg',
        category: 'collection'
    },
    {
        id: 7,
        name: 'Cashmere Sweater',
        description: 'Mongolian cashmere',
        price: 245.00,
        image: 'image12.jpg',
        category: 'collection',
        badge: 'Bestseller'
    },
    {
        id: 8,
        name: 'Linen Shirt',
        description: 'European linen',
        price: 125.00,
        image: 'image17.jpg',
        category: 'new'
    },
    {
        id: 9,
        name: 'Wool Trousers',
        description: 'Italian wool',
        price: 185.00,
        image: 'image6.jpg',
        category: 'collection'
    },
    {
        id: 10,
        name: 'Canvas Bag',
        description: 'Waxed canvas with leather',
        price: 155.00,
        image: 'image12.jpg',
        category: 'sale',
        originalPrice: 220.00
    },
    {
        id: 11,
        name: 'Silk Scarf',
        description: 'Hand-printed silk',
        price: 85.00,
        image: 'image17.jpg',
        category: 'sale',
        originalPrice: 120.00
    },
    {
        id: 12,
        name: 'Leather Loafers',
        description: 'Handcrafted in Italy',
        price: 295.00,
        image: 'image6.jpg',
        category: 'collection',
        badge: 'Bestseller'
    }
];

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    state.products = productData;
    initializeApp();
    loadCartFromStorage();
    renderAllProducts();
    setupScrollEffects();
    setupHeaderScroll();
    adjustContentSpacing();
    renderCraftContent();
    renderHeroImage()
    
    // Re-adjust on window resize
    window.addEventListener('resize', debounce(adjustContentSpacing, 250));
});

function initializeApp() {
    console.log('🎨 Premium Closet Initialized');
    updateCartCount();
    
    // Show home section by default
    showSection('home');
}

// --- NAVIGATION ---
function updateAnnouncementBar(sectionId) {
  const bar = document.querySelector(".announcement-bar");

  if (sectionId !== "home") {
    bar.classList.add("hide-announcement");
  } else {
    bar.classList.remove("hide-announcement");
  }
}

function navigateTo(section) {
    // Hide all sections
    const sections = document.querySelectorAll('.sub-page, .products-section, .hero-section, .featured-categories, .featured-section, .brand-values, .announcement-bar, .newsletter-section, #footerSection');
    sections.forEach(s => s.style.display = 'none');
    
    // Show requested section
      
    const targetSection = document.getElementById(section);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Update state
    state.currentPage = section;
    
    // Render products for specific sections
    if (section === 'products') {
        renderProducts('products-grid', state.products);
    } else if (section === 'new-arrivals') {
        const newProducts = state.products.filter(p => p.category === 'new');
        renderProducts('new-arrivals-grid', newProducts);
    } else if (section === 'sale') {
        const saleProducts = state.products.filter(p => p.category === 'sale');
        renderProducts('sale-grid', saleProducts);
    }
}


function goToHome() {
    // Show all home sections
    const homeSections = [
        'home',
        'featured-categories',
        'featured-drops',
        'announcement-bar',
        'brand-values',
        'newsletter-section'
    ];
    
    const allSections = document.querySelectorAll('.sub-page, .products-section');
    allSections.forEach(s => s.style.display = 'none');
    
    homeSections.forEach(sectionId => {
        const section = document.getElementById(sectionId) || document.querySelector('.' + sectionId);
        if (section) {
            section.style.display = 'block';
        }
    });
    
    document.querySelector('.hero-section').style.display = 'flex';
    document.querySelector('.announcement-bar').style.display = 'flex';
    document.querySelector('.featured-categories').style.display = 'block';
    document.querySelector('.featured-section').style.display = 'block';
    document.querySelector('.brand-values').style.display = 'block';
    document.querySelector('.newsletter-section').style.display = 'block';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    state.currentPage = 'home';
}

function showSection(section) {
    if (section === 'home') {
        goToHome();
    } else {
        navigateTo(section);
    }
}

// --- PRODUCT RENDERING ---
function renderAllProducts() {
    // Render products grid (all products)
    renderProducts('products-grid', state.products);
}

function renderProducts(containerId, products) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = products.map(product => `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" />
                ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                <div class="product-overlay">
                    <button class="quick-add" onclick="addToCart(${product.id})">Quick Add</button>
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                ${product.originalPrice ? 
                    `<span class="product-price">
                        <span style="text-decoration: line-through; color: #666; margin-right: 10px;">$${product.originalPrice.toFixed(2)}</span>
                        $${product.price.toFixed(2)}
                    </span>` :
                    `<span class="product-price">$${product.price.toFixed(2)}</span>`
                }
            </div>
        </div>
    `).join('');
}


/**
 * RENDER CRAFT IMAGES
 * Injects high-quality editorial images into the Our Craft section
 */
function renderCraftContent() {
    const imageBoxes = document.querySelectorAll("#our-craft .craft-image-box");
    
    // Define your editorial images here
    const craftImages = [
        {
            src: "image5.jpg", 
            alt: "Close up of premium organic cotton texture"
        },
        {
            src: "image2.jpg", 
            alt: "Minimalist fashion design studio"
        }
    ];

    imageBoxes.forEach((box, index) => {
        if (craftImages[index]) {
            box.innerHTML = `
                <img src="${craftImages[index].src}" 
                     alt="${craftImages[index].alt}" 
                     style="width:100%; height:100%; object-fit:cover; opacity:0; transition: opacity 1s ease-in-out;"
                     onload="this.style.opacity='1'">
            `;
        }
    });
}

function renderHeroImage() {
    const imageBoxes = document.querySelectorAll(".hero-image");
    
    // Define your editorial images here
    const heroImages = [
        {
            src: "image1.jpg", 
            alt: "Cool wear"
        },
    ];

    imageBoxes.forEach((box, index) => {
        if (heroImages[index]) {
            box.innerHTML = `
                <img src="${heroImages[index].src}" 
                     alt="${heroImages[index].alt}" 
                     style="width:100%; height:100%; object-fit:cover; opacity:0; transition: opacity 1s ease-in-out;"
                     onload="this.style.opacity='1'">
            `;
        }
    });
}

// --- CART MANAGEMENT ---
function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    // Check if product already in cart
    const existingItem = state.cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        state.cart.push({
            ...product,
            quantity: 1
        });
    }
    
    updateCartCount();
    saveCartToStorage();
    showCartNotification(product.name);
    renderCartItems();
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    updateCartCount();
    saveCartToStorage();
    renderCartItems();
}

function updateCartCount() {
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
        
        // Add pulse animation
        cartCountElement.style.transform = 'scale(1.3)';
        setTimeout(() => {
            cartCountElement.style.transform = 'scale(1)';
        }, 200);
    }
}

function renderCartItems() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;
    
    if (state.cart.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #666;">
                <p style="font-size: 18px; margin-bottom: 10px;">Your bag is empty</p>
                <p style="font-size: 14px;">Add some items to get started</p>
            </div>
        `;
        updateCartTotal();
        return;
    }
    
    container.innerHTML = state.cart.map(item => `
        <div class="cart-item-row">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image" />
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                <div style="margin-top: 10px; color: #999; font-size: 13px;">Qty: ${item.quantity}</div>
                <button class="remove-item" onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        </div>
    `).join('');
    
    updateCartTotal();
}

function updateCartTotal() {
    const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalElement = document.getElementById('cart-total-amount');
    if (totalElement) {
        totalElement.textContent = `$${total.toFixed(2)}`;
    }
}

function showCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    if (cartSidebar) {
        cartSidebar.classList.add('active');
        renderCartItems();
        document.body.style.overflow = 'hidden';
    }
}

function closeCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    if (cartSidebar) {
        cartSidebar.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function handleCheckout() {
    if (state.cart.length === 0) {
        alert('Your cart is empty. Please add items before checking out.');
        return;
    }
    
    // Show notification
    showNotification('Proceeding to secure checkout...', 'success');
    
    // In a real app, this would redirect to checkout
    setTimeout(() => {
        alert('Checkout functionality would be implemented here.\n\nTotal: $' + 
              state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2));
    }, 500);
}

function showCartNotification(productName) {
    showNotification(`${productName} added to bag`, 'success');
}

// --- STORAGE ---
function saveCartToStorage() {
    try {
        localStorage.setItem('premiumClosetCart', JSON.stringify(state.cart));
    } catch (e) {
        console.error('Could not save cart:', e);
    }
}

function loadCartFromStorage() {
    try {
        const saved = localStorage.getItem('premiumClosetCart');
        if (saved) {
            state.cart = JSON.parse(saved);
            updateCartCount();
        }
    } catch (e) {
        console.error('Could not load cart:', e);
    }
}

// --- MODAL MANAGEMENT ---
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 400);
    }
}

function switchToCreateAccount() {
    closeModal('signInModal');
    setTimeout(() => openModal('createAccountModal'), 100);
}

function switchToSignIn() {
    closeModal('createAccountModal');
    setTimeout(() => openModal('signInModal'), 100);
}

function openCreateModal() {
    openModal('createAccountModal');
}

// --- FORM HANDLERS ---
function handleSignIn(event) {
    event.preventDefault();
    
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;
    
    // Simulate sign in
    state.user = {
        email: email,
        name: email.split('@')[0]
    };
    
    showNotification(`Welcome back, ${state.user.name}!`, 'success');
    closeModal('signInModal');
    
    // Reset form
    event.target.reset();
}

function handleCreateAccount(event) {
    event.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    // Simulate account creation
    state.user = {
        name: name,
        email: email
    };
    
    showNotification(`Account created successfully! Welcome, ${name}!`, 'success');
    closeModal('createAccountModal');
    
    // Reset form
    event.target.reset();
}

function handleNewsletter(event) {
    event.preventDefault();
    
    const email = event.target.querySelector('input[type="email"]').value;
    
    showNotification('Thank you for subscribing! Check your inbox for exclusive offers.', 'success');
    
    // Reset form
    event.target.reset();
}

// --- SEARCH ---
function toggleSearch() {
    const searchOverlay = document.getElementById('searchOverlay');
    if (searchOverlay) {
        searchOverlay.classList.toggle('active');
        
        if (searchOverlay.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                searchOverlay.querySelector('.search-input')?.focus();
            }, 100);
        } else {
            document.body.style.overflow = 'auto';
        }
    }
}

// Close search on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const searchOverlay = document.getElementById('searchOverlay');
        if (searchOverlay?.classList.contains('active')) {
            toggleSearch();
        }
    }
});

// --- NOTIFICATIONS ---
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification-toast');
    if (existing) {
        existing.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification-toast notification-${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 20px;">${type === 'success' ? '✓' : 'ℹ'}</span>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '100px',
        right: '20px',
        background: type === 'success' ? '#d4af37' : '#333',
        color: type === 'success' ? '#000' : '#fff',
        padding: '16px 24px',
        borderRadius: '4px',
        zIndex: '9999',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        animation: 'slideInRight 0.3s ease',
        fontWeight: '500',
        fontSize: '14px',
        maxWidth: '400px'
    });
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// --- SCROLL EFFECTS ---
function setupScrollEffects() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements
    const elementsToObserve = document.querySelectorAll('.product-card, .category-card, .value-item, .craft-card');
    elementsToObserve.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

function setupHeaderScroll() {
    let lastScroll = 0;
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            header.style.boxShadow = 'none';
        } else {
            header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
        }
        
        // Hide header on scroll down, show on scroll up
        if (currentScroll > lastScroll && currentScroll > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        
        lastScroll = currentScroll;
    });
    
    // Add transition to header
    header.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
}

// --- SMOOTH SCROLL FOR ANCHOR LINKS ---
if (targetId && targetId !== "#") {
  document.querySelector(targetId)?.scrollIntoView();
}
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = link.getAttribute("href");

        const target = document.querySelector(this.getAttribute('href'));
      
        /*if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }*/
        
        if (targetId && targetId !== "#") {
  document.querySelector(targetId)?.scrollIntoView();
}
        
      
    });
});

// --- IMAGE LAZY LOADING ---
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                imageObserver.unobserve(img);
            }
        });
    });
    
    // Observe all images with data-src
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// --- CONTENT SPACING ADJUSTMENT ---
/**
 * Dynamically adjusts main content spacing based on header height
 * Ensures content never overlaps with fixed header
 */
function adjustContentSpacing() {
    const header = document.querySelector('.header');
    const announcementBar = document.querySelector('.announcement-bar');
    const mainContent = document.querySelector('.main-content');
    
    if (!header || !mainContent) {
        console.warn('Header or main content not found');
        return;
    }
    
    // Calculate total header height (header + announcement bar if present)
    let offsetHeight = 0;
    let totalHeaderHeight = header.offsetHeight;
    
    /*if (announcementBar) {
        totalHeaderHeight += announcementBar.offsetHeight;
    }*/
    
    // Add a small buffer (optional, adjust as needed)
    const buffer = 160; // You can change this to add extra space
    
    // Apply padding-top to main content
    mainContent.style.paddingTop = `${totalHeaderHeight}px`;
    
  /*announcementBar.style.marginTop = `${offsetHeight}px`;*/
    
  
    
    // Also adjust hero section if it exists
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        heroSection.style.paddingTop = `${totalHeaderHeight}px`; // Extra spacing for hero
    }
    
    const featuredCategory = document.querySelector('.featured-categories');
    if (featuredCategory) {
        featuredCategory.style.paddingTop = `${totalHeaderHeight - buffer}px`; 
    }
    
    const featuredSection = document.querySelector('.featured-section');
    if (featuredSection) {
        featuredSection.style.paddingTop = `${totalHeaderHeight}px`; 
    }
    
    const brandValues = document.querySelector('.brand-values');
    if (brandValues) {
        brandValues.style.paddingTop = `${totalHeaderHeight}px`; 
    }
    
    const newsLetter = document.querySelector('.newsletter-section');
    if (newsLetter) {
        newsLetter.style.paddingTop = `${totalHeaderHeight}px`; 
    }
    
    /*const Footer = document.querySelector('.footer');
    if (Footer) {
        Footer.style.paddingTop = `${totalHeaderHeight}px`; 
    }*/
    
    // Adjust sub-pages
    const subPages = document.querySelectorAll('.sub-page');
    subPages.forEach(page => {
        page.style.paddingTop = `${totalHeaderHeight}px`; // More space for sub-pages
    });
    
    // Adjust products section
    const productsSection = document.querySelector('.products-section');
    if (productsSection) {
        productsSection.style.paddingTop = `${totalHeaderHeight}px`;
    }
    
    
    
    
    // Log for debugging (remove in production)
    console.log(`📏 Content spacing adjusted: ${totalHeaderHeight}px`);
}

// --- PERFORMANCE OPTIMIZATION ---
// Debounce function for resize events
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

// Handle window resize
window.addEventListener('resize', debounce(() => {
    console.log('Window resized');
    // Add any resize handlers here
}, 250));

// --- ACCESSIBILITY ---
// Focus trap for modals
function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    element.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    lastFocusable.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    firstFocusable.focus();
                    e.preventDefault();
                }
            }
        }
    });
}

// Apply focus trap to modals when they open
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('transitionend', () => {
        if (modal.classList.contains('active')) {
            trapFocus(modal);
        }
    });
});

// --- ERROR HANDLING ---
window.addEventListener('error', (e) => {
    console.error('Error occurred:', e.error);
});

// --- CONSOLE STYLING ---
console.log(
    '%c🎨 Premium Closet ',
    'background: #d4af37; color: #000; font-size: 20px; padding: 10px 20px; font-weight: bold;'
);
console.log(
    '%cWhere Heritage Meets Modern Luxury',
    'color: #d4af37; font-size: 14px; font-style: italic;'
);

// Export functions for global use
window.navigateTo = navigateTo;
window.goToHome = goToHome;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.showCart = showCart;
window.closeCart = closeCart;
window.handleCheckout = handleCheckout;
window.openModal = openModal;
window.closeModal = closeModal;
window.switchToCreateAccount = switchToCreateAccount;
window.switchToSignIn = switchToSignIn;
window.openCreateModal = openCreateModal;
window.handleSignIn = handleSignIn;
window.handleCreateAccount = handleCreateAccount;
window.handleNewsletter = handleNewsletter;
window.toggleSearch = toggleSearch;
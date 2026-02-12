/* ==========================================
   PREMIUM CLOSET - COMPLETE JAVASCRIPT
   Full Backend Integration
   ========================================== */

// ==========================================
// CONFIGURATION
// ==========================================
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : 'https://cc.cctamcc.site'; // CHANGE THIS TO YOUR ACTUAL BACKEND URL

// ==========================================
// STATE MANAGEMENT
// ==========================================
const state = {
    cart: [],
    currentPage: 'home',
    user: null,
    products: [],
    token: localStorage.getItem('token') || null,
    orders: [],
    isAdmin: false,
};

// ==========================================
// API CLIENT
// ==========================================
class API {
  static async request(endpoint, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    if (state.token) {
      defaultHeaders['Authorization'] = `Bearer ${state.token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  static async register(userData) {
    const response = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response;
  }

  static async login(credentials) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return response;
  }

  static async logout() {
    await this.request('/api/auth/logout', { method: 'POST' });
  }

  static async getMe() {
    return await this.request('/api/auth/me');
  }

  // Product endpoints
  static async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/api/products?${query}`);
  }

  static async getProduct(id) {
    return await this.request(`/api/products/${id}`);
  }

  // Cart endpoints
  static async getCart() {
    return await this.request('/api/cart');
  }

  static async addToCart(productId, quantity = 1) {
    return await this.request('/api/cart/add', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  }

  // Order endpoints
  static async createOrder(orderData) {
    return await this.request('/api/checkout/confirm', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  static async getUserOrders() {
    return await this.request('/api/orders/user');
  }

  // Payment endpoints
  static async initiateMpesa(orderId, phoneNumber) {
    return await this.request('/api/payments/mpesa/stk-push', {
      method: 'POST',
      body: JSON.stringify({ orderId, phoneNumber }),
    });
  }

  // Admin endpoints
  static async getAdminOrders() {
    return await this.request('/api/admin/orders');
  }

  static async getAnalytics() {
    return await this.request('/api/admin/analytics');
  }

  // Newsletter
  static async subscribeNewsletter(email) {
    return await this.request('/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }
}

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
    setupScrollEffects();
    setupHeaderScroll();
    adjustContentSpacing();
    renderCraftContent();
    renderHeroImage();
    
    window.addEventListener('resize', debounce(adjustContentSpacing, 250));
    
    // Setup search input
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            handleSearch(e.target.value);
        }, 500));
    }
});

async function initializeApp() {
    console.log('🎨 Premium Closet Initialized');
    
    // Check if user is logged in
    if (state.token) {
        try {
            const response = await API.getMe();
            state.user = response.data.user;
            state.isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(state.user.role);
            updateUIForLoggedInUser();
        } catch (error) {
            // Token invalid, clear it
            state.token = null;
            localStorage.removeItem('token');
        }
    }
    
    // Load products from API
    await loadProducts();
    
    // Load cart
    await loadCart();
    
    // Show home section
    showSection('home');
}

// ==========================================
// AUTHENTICATION
// ==========================================
async function handleSignIn(event) {
    event.preventDefault();
    
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;
    
    try {
        const response = await API.login({ email, password });
        
        state.token = response.data.token;
        state.user = response.data.user;
        state.isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(state.user.role);
        
        localStorage.setItem('token', state.token);
        
        showNotification(`Welcome back, ${state.user.name}!`, 'success');
        closeModal('signInModal');
        updateUIForLoggedInUser();
        
        // Reload cart for logged-in user
        await loadCart();
        
        event.target.reset();
    } catch (error) {
        showNotification(error.message || 'Login failed', 'error');
    }
}

async function handleCreateAccount(event) {
    event.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    try {
        const response = await API.register({ name, email, password });
        
        state.token = response.data.token;
        state.user = response.data.user;
        state.isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(state.user.role);
        
        localStorage.setItem('token', state.token);
        
        showNotification(`Account created! Welcome, ${name}!`, 'success');
        closeModal('createAccountModal');
        updateUIForLoggedInUser();
        
        event.target.reset();
    } catch (error) {
        showNotification(error.message || 'Registration failed', 'error');
    }
}

async function handleLogout() {
    try {
        await API.logout();
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    state.token = null;
    state.user = null;
    state.isAdmin = false;
    localStorage.removeItem('token');
    
    showNotification('Logged out successfully', 'success');
    updateUIForLoggedOutUser();
    
    // Reload cart for guest
    await loadCart();
}

function updateUIForLoggedInUser() {
    const signInBtn = document.querySelector('.btn-signin');
    if (signInBtn) {
        signInBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="10" cy="7" r="4"/>
                <path d="M3 20v-2c0-2.2 1.8-4 4-4h6c2.2 0 4 1.8 4 4v2"/>
            </svg>
        `;
        signInBtn.onclick = () => openModal('userMenuModal');
    }
    
    // Show admin button if admin
    if (state.isAdmin) {
        addAdminButton();
    }
}

function updateUIForLoggedOutUser() {
    const signInBtn = document.querySelector('.btn-signin');
    if (signInBtn) {
        signInBtn.onclick = () => openModal('signInModal');
    }
    removeAdminButton();
}

function addAdminButton() {
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !document.getElementById('admin-btn')) {
        const adminBtn = document.createElement('button');
        adminBtn.id = 'admin-btn';
        adminBtn.className = 'btn-icon';
        adminBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="10" y="3" width="7" height="7"/>
                <rect x="3" y="10" width="7" height="7"/>
                <rect x="10" y="10" width="7" height="7"/>
            </svg>
        `;
        adminBtn.onclick = () => navigateTo('admin-dashboard');
        adminBtn.title = 'Admin Dashboard';
        headerActions.insertBefore(adminBtn, headerActions.firstChild);
    }
}

function removeAdminButton() {
    const adminBtn = document.getElementById('admin-btn');
    if (adminBtn) adminBtn.remove();
}

// ==========================================
// PRODUCT MANAGEMENT
// ==========================================
async function loadProducts(params = {}) {
    try {
        const response = await API.getProducts(params);
        state.products = response.data.products;
        renderAllProducts();
        return response;
    } catch (error) {
        showNotification('Failed to load products', 'error');
        console.error('Load products error:', error);
        return { data: { products: [] } };
    }
}

function renderAllProducts() {
    renderProducts('products-grid', state.products);
    
    // Render featured grid (first 8 products)
    const featuredProducts = state.products.slice(0, 8);
    renderProducts('featured-grid', featuredProducts);
    
    // Render category-specific grids
    const newProducts = state.products.filter(p => p.badge === 'New' || p.category === 'new');
    renderProducts('new-arrivals-grid', newProducts);
    
    const saleProducts = state.products.filter(p => p.originalPrice && p.originalPrice > p.price);
    renderProducts('sale-grid', saleProducts);
}

function renderProducts(containerId, products) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">No products found</p>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" />
                ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                <div class="product-overlay">
                    <button class="quick-add" onclick="addToCart('${product.id}')">Quick Add</button>
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                ${product.originalPrice ? 
                    `<span class="product-price">
                        <span style="text-decoration: line-through; color: #666; margin-right: 10px;">KES ${Number(product.originalPrice).toFixed(2)}</span>
                        KES ${Number(product.price).toFixed(2)}
                    </span>` :
                    `<span class="product-price">KES ${Number(product.price).toFixed(2)}</span>`
                }
            </div>
        </div>
    `).join('');
}

// ==========================================
// CART MANAGEMENT
// ==========================================
async function loadCart() {
    try {
        const response = await API.getCart();
        state.cart = response.data.cart.items || [];
        updateCartCount();
        return response;
    } catch (error) {
        console.error('Load cart error:', error);
        state.cart = [];
        updateCartCount();
    }
}

async function addToCart(productId) {
    try {
        await API.addToCart(productId, 1);
        await loadCart();
        
        const product = state.products.find(p => p.id === productId);
        showNotification(`${product?.name || 'Item'} added to cart`, 'success');
        
        renderCartItems();
    } catch (error) {
        showNotification(error.message || 'Failed to add to cart', 'error');
    }
}

function updateCartCount() {
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
        cartCountElement.style.transform = 'scale(1.3)';
        setTimeout(() => {
            cartCountElement.style.transform = 'scale(1)';
        }, 200);
    }
}

async function renderCartItems() {
    await loadCart(); // Refresh cart data
    
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
            <img src="${item.product.image}" alt="${item.product.name}" class="cart-item-image" />
            <div class="cart-item-details">
                <div class="cart-item-name">${item.product.name}</div>
                <div class="cart-item-price">KES ${Number(item.price).toFixed(2)}</div>
                <div style="margin-top: 10px; color: #999; font-size: 13px;">Qty: ${item.quantity}</div>
            </div>
        </div>
    `).join('');
    
    updateCartTotal();
}

function updateCartTotal() {
    const total = state.cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    const totalElement = document.getElementById('cart-total-amount');
    if (totalElement) {
        totalElement.textContent = `KES ${total.toFixed(2)}`;
    }
}

async function handleCheckout() {
    if (state.cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }
    
    if (!state.user) {
        showNotification('Please sign in to checkout', 'error');
        closeCart();
        openModal('signInModal');
        return;
    }
    
    // Close cart and show checkout modal
    closeCart();
    openModal('checkoutModal');
}

async function processCheckout(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const shippingAddress = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        address1: formData.get('address1'),
        address2: formData.get('address2') || '',
        city: formData.get('city'),
        state: formData.get('state') || '',
        postalCode: formData.get('postalCode') || '',
        country: 'Kenya',
    };
    
    const paymentMethod = formData.get('paymentMethod') || 'MPESA';
    
    try {
        showNotification('Processing order...', 'info');
        
        const response = await API.createOrder({
            shippingAddress,
            paymentMethod,
        });
        
        const order = response.data.order;
        
        closeModal('checkoutModal');
        
        // If M-Pesa, show payment modal
        if (paymentMethod === 'MPESA') {
            openMpesaPaymentModal(order);
        } else {
            showNotification('Order created successfully!', 'success');
            navigateTo('my-orders');
        }
        
        // Clear cart
        state.cart = [];
        updateCartCount();
        
    } catch (error) {
        showNotification(error.message || 'Checkout failed', 'error');
    }
}

function openMpesaPaymentModal(order) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'mpesaModal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal('mpesaModal')">&times;</button>
            <h2>M-Pesa Payment</h2>
            <p style="text-align: center; margin-bottom: 30px;">Order Total: <strong style="color: var(--accent-gold);">KES ${Number(order.total).toFixed(2)}</strong></p>
            <form onsubmit="processMpesaPayment(event, '${order.id}')">
                <div class="form-group">
                    <label>Phone Number (254XXXXXXXXX)</label>
                    <input type="tel" id="mpesa-phone" required pattern="254[0-9]{9}" placeholder="254712345678" />
                </div>
                <button type="submit" class="btn-primary" style="width: 100%;">Pay with M-Pesa</button>
            </form>
            <p style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
                You will receive an STK push on your phone
            </p>
        </div>
    `;
    document.body.appendChild(modal);
}

async function processMpesaPayment(event, orderId) {
    event.preventDefault();
    
    const phoneNumber = document.getElementById('mpesa-phone').value;
    
    try {
        showNotification('Sending STK push to your phone...', 'info');
        
        await API.initiateMpesa(orderId, phoneNumber);
        
        closeModal('mpesaModal');
        showNotification('Please check your phone and enter M-Pesa PIN', 'success');
        
        navigateTo('my-orders');
    } catch (error) {
        showNotification(error.message || 'M-Pesa payment failed', 'error');
    }
}

// ==========================================
// MY ORDERS
// ==========================================
async function loadMyOrders() {
    if (!state.user) {
        showNotification('Please sign in to view orders', 'error');
        return;
    }
    
    try {
        const response = await API.getUserOrders();
        state.orders = response.data.orders;
        renderMyOrders();
    } catch (error) {
        showNotification('Failed to load orders', 'error');
    }
}

function renderMyOrders() {
    const container = document.getElementById('my-orders-container');
    if (!container) return;
    
    if (state.orders.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">No orders yet</p>';
        return;
    }
    
    container.innerHTML = state.orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <strong>Order #${order.orderNumber}</strong>
                    <span class="order-status status-${order.status.toLowerCase()}">${order.status}</span>
                </div>
                <div style="font-size: 18px; color: var(--accent-gold); font-weight: 600;">KES ${Number(order.total).toFixed(2)}</div>
            </div>
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        <img src="${item.productImage}" alt="${item.productName}" />
                        <div>
                            <div>${item.productName}</div>
                            <div>Qty: ${item.quantity} × KES ${Number(item.price).toFixed(2)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="order-footer">
                <small>Ordered on ${new Date(order.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</small>
            </div>
        </div>
    `).join('');
}

// ==========================================
// ADMIN DASHBOARD
// ==========================================
async function loadAdminDashboard() {
    if (!state.isAdmin) {
        showNotification('Access denied', 'error');
        navigateTo('home');
        return;
    }
    
    try {
        const [ordersResponse, analyticsResponse] = await Promise.all([
            API.getAdminOrders(),
            API.getAnalytics(),
        ]);
        
        renderAdminDashboard(ordersResponse.data.orders, analyticsResponse.data);
    } catch (error) {
        showNotification('Failed to load admin dashboard', 'error');
    }
}

function renderAdminDashboard(orders, analytics) {
    const container = document.getElementById('admin-dashboard-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="admin-stats">
            <div class="stat-card">
                <h3>${analytics.totalOrders}</h3>
                <p>Total Orders</p>
            </div>
            <div class="stat-card">
                <h3>KES ${Number(analytics.totalRevenue).toFixed(2)}</h3>
                <p>Total Revenue</p>
            </div>
            <div class="stat-card">
                <h3>${analytics.totalCustomers}</h3>
                <p>Total Customers</p>
            </div>
        </div>
        
        <div class="admin-orders">
            <h2>Recent Orders</h2>
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.slice(0, 20).map(order => `
                        <tr>
                            <td>${order.orderNumber}</td>
                            <td>${order.user.name}</td>
                            <td>KES ${Number(order.total).toFixed(2)}</td>
                            <td><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></td>
                            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ==========================================
// NEWSLETTER
// ==========================================
async function handleNewsletter(event) {
    event.preventDefault();
    
    const email = event.target.querySelector('input[type="email"]').value;
    
    try {
        await API.subscribeNewsletter(email);
        showNotification('Successfully subscribed to newsletter!', 'success');
        event.target.reset();
    } catch (error) {
        showNotification(error.message || 'Subscription failed', 'error');
    }
}

// ==========================================
// SEARCH
// ==========================================
async function handleSearch(query) {
    if (!query.trim()) {
        await loadProducts();
        return;
    }
    
    try {
        const response = await API.getProducts({ search: query });
        state.products = response.data.products;
        renderAllProducts();
        navigateTo('products');
    } catch (error) {
        showNotification('Search failed', 'error');
    }
}

// ==========================================
// NAVIGATION
// ==========================================
function navigateTo(section) {
    // Hide all sections
    const sections = document.querySelectorAll('.sub-page, .products-section, .hero-section, .featured-categories, .featured-section, .brand-values, .newsletter-section');
    sections.forEach(s => s.style.display = 'none');
    
    // Show target section
    const targetSection = document.getElementById(section);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    state.currentPage = section;
    
    // Load data based on section
    if (section === 'my-orders') {
        loadMyOrders();
    } else if (section === 'admin-dashboard') {
        loadAdminDashboard();
    }
    
    // Show/hide footer
    const footer = document.getElementById('footerSection');
    if (footer) {
        footer.style.display = section === 'home' ? 'block' : 'none';
    }
}

function goToHome() {
    const homeSections = ['home', 'featured-categories', 'featured-drops', 'brand-values', 'newsletter-section'];
    
    // Hide all sub-pages
    const allSections = document.querySelectorAll('.sub-page, .products-section');
    allSections.forEach(s => s.style.display = 'none');
    
    // Show home sections
    document.querySelector('.hero-section').style.display = 'flex';
    document.querySelector('.announcement-bar').style.display = 'flex';
    document.querySelector('.featured-categories').style.display = 'block';
    document.querySelector('.featured-section').style.display = 'block';
    document.querySelector('.brand-values').style.display = 'block';
    document.querySelector('.newsletter-section').style.display = 'block';
    
    const footer = document.getElementById('footerSection');
    if (footer) footer.style.display = 'block';
    
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

// ==========================================
// MODALS
// ==========================================
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
            
            // Remove dynamic modals
            if (modalId === 'mpesaModal') {
                modal.remove();
            }
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

// ==========================================
// CART SIDEBAR
// ==========================================
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

// ==========================================
// SEARCH OVERLAY
// ==========================================
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

// ==========================================
// NOTIFICATIONS
// ==========================================
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification-toast notification-${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 20px;">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
            <span>${message}</span>
        </div>
    `;
    
    Object.assign(notification.style, {
        position: 'fixed',
        top: '100px',
        right: '20px',
        background: type === 'success' ? '#d4af37' : type === 'error' ? '#e74c3c' : '#3498db',
        color: type === 'success' ? '#000' : '#fff',
        padding: '16px 24px',
        borderRadius: '4px',
        zIndex: '9999',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        animation: 'slideInRight 0.3s ease',
        fontWeight: '500',
        fontSize: '14px',
        maxWidth: '400px',
    });
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
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

// ==========================================
// SCROLL EFFECTS
// ==========================================
function setupScrollEffects() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px',
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
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
        
        if (currentScroll > lastScroll && currentScroll > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        
        lastScroll = currentScroll;
    });
    
    header.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
}

function adjustContentSpacing() {
    const header = document.querySelector('.header');
    const mainContent = document.querySelector('.main-content');
    
    if (!header || !mainContent) return;
    
    const headerHeight = header.offsetHeight;
    mainContent.style.paddingTop = `${headerHeight}px`;
}

function renderCraftContent() {
    const imageBoxes = document.querySelectorAll("#our-craft .craft-image-box");
    const craftImages = [
        { src: "image5.jpg", alt: "Premium materials" },
        { src: "image2.jpg", alt: "Design studio" },
    ];

    imageBoxes.forEach((box, index) => {
        if (craftImages[index]) {
            box.innerHTML = `<img src="${craftImages[index].src}" alt="${craftImages[index].alt}" style="width:100%; height:100%; object-fit:cover; opacity:0; transition: opacity 1s ease-in-out;" onload="this.style.opacity='1'">`;
        }
    });
}

function renderHeroImage() {
    const imageBox = document.querySelector(".hero-image");
    if (imageBox) {
        imageBox.innerHTML = `<img src="image1.jpg" alt="Hero" style="width:100%; height:100%; object-fit:cover; opacity:0; transition: opacity 1s ease-in-out;" onload="this.style.opacity='1'">`;
    }
}

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const searchOverlay = document.getElementById('searchOverlay');
        if (searchOverlay?.classList.contains('active')) {
            toggleSearch();
        }
    }
});

// ==========================================
// CONSOLE STYLING
// ==========================================
console.log('%c🎨 Premium Closet ', 'background: #d4af37; color: #000; font-size: 20px; padding: 10px 20px; font-weight: bold;');
console.log('%cWhere Heritage Meets Modern Luxury', 'color: #d4af37; font-size: 14px; font-style: italic;');

// ==========================================
// GLOBAL EXPORTS
// ==========================================
window.navigateTo = navigateTo;
window.goToHome = goToHome;
window.addToCart = addToCart;
window.showCart = showCart;
window.closeCart = closeCart;
window.handleCheckout = handleCheckout;
window.processCheckout = processCheckout;
window.processMpesaPayment = processMpesaPayment;
window.openModal = openModal;
window.closeModal = closeModal;
window.switchToCreateAccount = switchToCreateAccount;
window.switchToSignIn = switchToSignIn;
window.handleSignIn = handleSignIn;
window.handleCreateAccount = handleCreateAccount;
window.handleLogout = handleLogout;
window.handleNewsletter = handleNewsletter;
window.toggleSearch = toggleSearch;

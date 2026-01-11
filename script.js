/**
 * CLASSIC CLOSET - CORE ENGINE
 * Logic for: Modals, Product Injection, and Cart Management
 */

// 1. DATABASE: Centralized Product Information
const products = [
    { id: 1, name: "Premium Classic Tee", price: 45.00, desc: "100% Organic Egyptian Cotton", img: "image1.jpg" },
    { id: 2, name: "Luxury Linen Shorts", price: 65.00, desc: "Breathable Italian tailored fit", img: "image2.jpg" },
    { id: 3, name: "Artisan Leather Shoes", price: 120.00, desc: "Hand-stitched premium leather", img: "image3.jpg" },
    { id: 4, name: "Heritage Wood Mask", price: 210.00, desc: "Hand-carved Ebony wood artifact", img: "image4.jpg" }
];

// 2. STATE: Application Data
let cart = [];

// 3. INITIALIZATION: Run when page loads
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    setupCartCounter();
});

// 4. MODAL LOGIC: Clean handling of Sign In / Create Account
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto'; // Re-enable scrolling
    }
}

// Switching functions (for the links inside modals)
function switchToCreateAccount() {
    closeModal('signInModal');
    setTimeout(() => openModal('createAccountModal'), 300);
}

function switchToSignIn() {
    closeModal('createAccountModal');
    setTimeout(() => openModal('signInModal'), 300);
}

// Bind the Header Sign In button
document.querySelector('.btn-signin').addEventListener('click', () => openModal('signInModal'));

// For the large banner button
function openCreateModal() {
    openModal('createAccountModal');
}

// 5. PRODUCT ENGINE: Dynamically builds your 2-column grid
function renderProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-image">
                <img src="${product.img}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <span class="product-price">$${product.price}</span>
                <button class="add-to-cart" onclick="addToCart(${product.id})">ADD TO BAG</button>
            </div>
        </div>
    `).join('');
}

function setupCartCounter() {
    const cartCountElement = document.getElementById('cart-count');
    // Check if there is a saved cart in the browser's memory
    const savedCart = localStorage.getItem('classicClosetCart');
    
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
    
    if (cartCountElement) {
        cartCountElement.innerText = cart.length;
    }
}

// 6. CART SYSTEM: Functionality and Feedback
function addToCart(productId) {
    const item = products.find(p => p.id === productId);
    if (item) {
        cart.push(item);
        updateCartDisplay();
        
        // IQ Move: Visual Feedback
        alert(`${item.name} added to your closet.`);
    }
}

function updateCartDisplay() {
    const counter = document.getElementById('cart-count');
    if (counter) counter.innerText = cart.length;
}

function showCart() {
    if (cart.length === 0) {
        alert("Your closet is empty. Start shopping our collection.");
    } else {
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        alert(`Shopping Bag: ${cart.length} items\nTotal: $${total.toFixed(2)}`);
    }
}

// 7. FORM HANDLERS: Professional submission logic
function handleSignIn(event) {
    event.preventDefault();
    const email = document.getElementById('signin-email').value;
    alert(`Welcome back, member! Logged in as: ${email}`);
    closeModal('signInModal');
}

function handleCreateAccount(event) {
    event.preventDefault();
    const name = document.getElementById('signup-name').value;
    alert(`Account created successfully. Welcome to the Closet, ${name}!`);
    closeModal('createAccountModal');
}

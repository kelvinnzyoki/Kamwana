/**
 * CLASSIC CLOSET - CORE ENGINE
 * Organized for: Performance, Persistence, and Dynamic UI
 */

// 1. DATABASE: Centralized Product Information
const products = [
  { id: 1, name: "Premium Classic Tee", price: 45.0, desc: "100% Organic Egyptian Cotton", img: "image1.jpg" },
  { id: 2, name: "Luxury Linen Shorts", price: 65.0, desc: "Breathable Italian tailored fit", img: "image2.jpg" },
  { id: 3, name: "Artisan Leather Shoes", price: 120.0, desc: "Hand-stitched premium leather", img: "image3.jpg" },
  { id: 4, name: "Heritage Wood Mask", price: 210.0, desc: "Hand-carved Ebony wood artifact", img: "image4.jpg" },
  { id: 5, name: "Tribal Teak Sculpture", price: 180.0, desc: "Hand-carved African Teak", img: "image5.jpg" },
  { id: 6, name: "Nomad Linen Shirt", price: 55.0, desc: "Sustainable flax fiber", img: "image6.jpg" },
  { id: 7, name: "Ebony Bracelet Set", price: 35.0, desc: "Polished hardwood beads", img: "image7.jpg" },
  { id: 8, name: "Savannah Fedora", price: 85.0, desc: "Hand-woven straw", img: "image8.jpg" },
  { id: 9, name: "Dusk Cargo Pants", price: 95.0, desc: "Reinforced cotton twill", img: "image9.jpg" },
  { id: 10, name: "Artisan Wood Comb", price: 25.0, desc: "Anti-static sandalwood", img: "image10.jpg" },
  { id: 11, name: "Canvas Field Bag", price: 110.0, desc: "Water-resistant heavy canvas", img: "image11.jpg" },
  { id: 12, name: "Desert Suede Boots", price: 155.0, desc: "Premium treated suede", img: "image12.jpg" },
  { id: 13, name: "Sahara Silk Scarf", price: 40.0, desc: "Hand-printed natural silk", img: "image13.jpg" },
  { id: 14, name: "Safari Vest", price: 130.0, desc: "Multi-pocket utility wear", img: "image14.jpg" },
  { id: 15, name: "Indigo Dye Hoodie", price: 75.0, desc: "Natural vegetable dye", img: "image15.jpg" },
  { id: 16, name: "Teak Serving Tray", price: 60.0, desc: "Single block carving", img: "image16.jpg" },
  { id: 17, name: "Brass Motif Ring", price: 30.0, desc: "Recycled artisan brass", img: "image17.jpg" },
  { id: 18, name: "Terracotta Vase", price: 50.0, desc: "Hand-thrown clay", img: "image18.jpg" },
  { id: 19, name: "Woven Wall Hanging", price: 90.0, desc: "Traditional loom weave", img: "image19.jpg" }
];

// 2. STATE MANAGEMENT
let cart = [];

/**
 * 3. INITIALIZATION
 * Runs all critical setup functions when the window loads
 */
document.addEventListener("DOMContentLoaded", () => {
    loadCart();             // Load saved items
    renderProducts();       // Fill the main collection
    renderNewArrivals();    // Fill arrivals section
    renderSaleItems();      // Fill sale section
    adjustContentSpacing(); // Set header offsets
    
    // 2. SET LANDING PAGE STATE
    // This forces the website to start at "Home" regardless of CSS defaults
    goToHome();
    
    // Global Event Listeners
    window.addEventListener("resize", adjustContentSpacing);
    
    // Close modals on outside click
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    };
});

// --- 4. PERSISTENT CART LOGIC ---

function loadCart() {
    const savedCart = localStorage.getItem("classicClosetCart");
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartDisplay();
    }
}

function saveCart() {
    localStorage.setItem("classicClosetCart", JSON.stringify(cart));
}

function addToCart(productId) {
    const item = products.find((p) => p.id === productId);
    if (item) {
        const cartItem = { ...item, cartId: Date.now() + Math.random() };
        cart.push(cartItem);
        saveCart();
        updateCartDisplay();
        alert(`${item.name} added to your bag.`);
    }
}

function removeFromCart(cartId) {
    cart = cart.filter(item => item.cartId !== cartId);
    saveCart();
    updateCartDisplay();
    showCart(); 
}

function updateCartDisplay() {
    const counter = document.getElementById("cart-count");
    if (counter) counter.innerText = cart.length;
}

function showCart() {
    const sidebar = document.getElementById("cartSidebar");
    const container = document.getElementById("cart-items-container");
    const totalEl = document.getElementById("cart-total-amount");
    
    container.innerHTML = ""; // Clear current view
    
    cart.forEach(item => {
        container.innerHTML += `
            <div class="cart-item-row">
                <div>
                    <p style="margin:0; font-size:0.8rem;">${item.name}</p>
                    <small style="color:#888">$${item.price.toFixed(2)}</small>
                </div>
                <button class="remove-item" onclick="removeFromCart(${item.cartId})">REMOVE</button>
            </div>
        `;
    });

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    totalEl.innerText = `$${total.toFixed(2)}`;
    
    sidebar.classList.add("active");
}

function closeCart() {
    document.getElementById("cartSidebar").classList.remove("active");
}

// --- 5. NAVIGATION SYSTEM ---

function navigateTo(pageId) {
    const homeSections = ["home", "signup-cta-section", "featured-drops-section", "all-image-section"];
    const subPages = document.querySelectorAll(".sub-page, .products-section");

    // Hide Home
    homeSections.forEach(id => {
        const el = document.getElementById(id) || document.querySelector("." + id);
        if (el) el.style.display = "none";
    });

    // Hide all Sub-pages
    subPages.forEach(page => page.style.display = "none");

    // Show Target
    const target = document.getElementById(pageId);
    if (target) {
        // Special case for the Products grid to maintain CSS layout
        target.style.display = (pageId === "products" || target.classList.contains('products-grid')) ? "grid" : "block";
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(adjustContentSpacing, 50); 
}

function goToHome() {
    const homeSections = ["home", "signupCta", "featured-drops"];
    const subPages = document.querySelectorAll(".sub-page, .products-section");

    subPages.forEach(p => p.style.display = "none");
    homeSections.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = (id === "featured-drops-section") ? "grid" : "block";
        }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(adjustContentSpacing, 50);
}

// --- 6. RENDER ENGINES ---

function renderProducts() {
    const grid = document.getElementById("products-grid");
    if (!grid) return;
    grid.innerHTML = products.map(product => createProductCard(product)).join("");
}

function renderSaleItems() {
    const grid = document.getElementById("sale-grid");
    if (!grid) return;
    const saleItems = products.filter(p => p.price < 100);
    grid.innerHTML = saleItems.map(p => createProductCard(p, true)).join("");
}

function renderNewArrivals() {
    const grid = document.getElementById("new-arrivals-grid");
    if (!grid) return;
    const recentItems = products.slice(-3);
    grid.innerHTML = recentItems.map(p => createProductCard(p)).join("");
}

// Helper to keep code DRY (Don't Repeat Yourself)
function createProductCard(product, isSale = false) {
    return `
        <div class="product-card">
            <div class="product-image"><img src="${product.img}" alt="${product.name}"></div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <span class="product-price" style="${isSale ? 'color: #ff4d4d;' : ''}">$${product.price.toFixed(2)}</span>
                <button class="add-to-cart" onclick="addToCart(${product.id})">ADD TO BAG</button>
            </div>
        </div>`;
}

// --- 7. UI HELPERS & MODALS ---

function adjustContentSpacing() {
    const header = document.querySelector(".header");
    if (!header) return;
    
    const headerHeight = header.offsetHeight;
    const sections = [
        document.querySelector(".signup-cta-section"),
        document.getElementById("featured-drops-section"),
        document.querySelector(".main-content"),
        ...document.querySelectorAll(".sub-page")
    ];

    sections.forEach(el => { if(el) el.style.marginTop = "0"; });

    // Apply margin only to the first visible element
    for (let el of sections) {
        if (el && window.getComputedStyle(el).display !== "none") {
            el.style.marginTop = `${headerHeight}px`;
            break; 
        }
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
}

/**
 * SMOOTH MODAL TRANSITION
 * Switches content boxes without flicking the background overlay
 */
function switchToCreateAccount() {
  const signInModal = document.getElementById("signInModal");
  const createModal = document.getElementById("createAccountModal");

  // 1. Fade out the current content
  signInModal.querySelector('.modal-content').style.opacity = "0";
  signInModal.querySelector('.modal-content').style.transform = "translateY(-20px)";

  setTimeout(() => {
    signInModal.classList.remove("active");
    signInModal.style.display = "none";

    // 2. Prepare and Fade in the new content
    createModal.style.display = "flex";
    createModal.classList.add("active");
    const content = createModal.querySelector('.modal-content');
    content.style.opacity = "0";
    content.style.transform = "translateY(20px)";
    
    // Force a reflow for the animation to trigger
    content.offsetHeight; 
    
    content.style.opacity = "1";
    content.style.transform = "translateY(0)";
  }, 200); // Shorter duration for snappiness
}

function switchToSignIn() {
  const signInModal = document.getElementById("signInModal");
  const createModal = document.getElementById("createAccountModal");

  createModal.querySelector('.modal-content').style.opacity = "0";
  createModal.querySelector('.modal-content').style.transform = "translateY(-20px)";

  setTimeout(() => {
    createModal.classList.remove("active");
    createModal.style.display = "none";

    signInModal.style.display = "flex";
    signInModal.classList.add("active");
    const content = signInModal.querySelector('.modal-content');
    content.style.opacity = "0";
    content.style.transform = "translateY(20px)";
    
    content.offsetHeight; 
    
    content.style.opacity = "1";
    content.style.transform = "translateY(0)";
  }, 200);
}

// For the large "Join Now" banner button
function openCreateModal() {
  openModal("createAccountModal");
}

/**
 * MODAL ENGINE
 * Updated to handle .active classes or .style.display depending on your CSS
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add("active"); // Trigger CSS animations
        modal.style.display = "flex";  // Ensure visibility
        document.body.style.overflow = "hidden"; // Prevent background scroll
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove("active");
        setTimeout(() => {
            modal.style.display = "none";
        }, 300); // Match this to your CSS transition time
        document.body.style.overflow = "auto";
    }
}



// Form Submission Handlers
function handleSignIn(event) {
    event.preventDefault();
    closeModal("signInModal");
    alert("Welcome back!");
}

function handleCreateAccount(event) {
    event.preventDefault();
    closeModal("createAccountModal");
    alert("Account created!");
}

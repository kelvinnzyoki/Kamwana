/**
 * CLASSIC CLOSET - CORE ENGINE
 * Logic for: Modals, Product Injection, and Cart Management
 */

// 1. DATABASE: Centralized Product Information
const products = [
  {
    id: 1,
    name: "Premium Classic Tee",
    price: 45.0,
    desc: "100% Organic Egyptian Cotton",
    img: "image1.jpg",
  },
  {
    id: 2,
    name: "Luxury Linen Shorts",
    price: 65.0,
    desc: "Breathable Italian tailored fit",
    img: "image2.jpg",
  },
  {
    id: 3,
    name: "Artisan Leather Shoes",
    price: 120.0,
    desc: "Hand-stitched premium leather",
    img: "image3.jpg",
  },
  {
    id: 4,
    name: "Heritage Wood Mask",
    price: 210.0,
    desc: "Hand-carved Ebony wood artifact",
    img: "image4.jpg",
  },
  {
    id: 5,
    name: "Heritage Wood Mask",
    price: 210.0,
    desc: "Hand-carved Ebony wood artifact",
    img: "image5.jpg",
  },
  {
    id: 6,
    name: "Heritage Wood Mask",
    price: 210.0,
    desc: "Hand-carved Ebony wood artifact",
    img: "image6.jpg",
  },
  {
    id: 7,
    name: "Heritage Wood Mask",
    price: 210.0,
    desc: "Hand-carved Ebony wood artifact",
    img: "image7.jpg",
  },
  {
    id: 8,
    name: "Heritage Wood Mask",
    price: 210.0,
    desc: "Hand-carved Ebony wood artifact",
    img: "image8.jpg",
  },
  {
    id: 9,
    name: "Heritage Wood Mask",
    price: 210.0,
    desc: "Hand-carved Ebony wood artifact",
    img: "image9.jpg",
  },
  {
    id: 10,
    name: "Heritage Wood Mask",
    price: 210.0,
    desc: "Hand-carved Ebony wood artifact",
    img: "image10.jpg",
  },
  {
    id: 11,
    name: "Heritage Wood Mask",
    price: 210.0,
    desc: "Hand-carved Ebony wood artifact",
    img: "image11.jpg",
  },
  {
    id: 12,
    name: "Heritage Wood Mask",
    price: 210.0,
    desc: "Hand-carved Ebony wood artifact",
    img: "image12.jpg",
  },
  {
    id: 13,
    name: "Heritage Wood Mask",
    price: 210.0,
    desc: "Hand-carved Ebony wood artifact",
    img: "image13.jpg",
  },
  {
    id: 14,
    name: "Heritage Wood Mask",
    price: 210.0,
    desc: "Hand-carved Ebony wood artifact",
    img: "image14.jpg",
  },
  {
    id: 15,
    name: "Heritage Wood Mask",
    price: 210.0,
    desc: "Hand-carved Ebony wood artifact",
    img: "image15.jpg",
  },
  {
    id: 16,
    name: "Heritage Wood Mask",
    price: 210.0,
    desc: "Hand-carved Ebony wood artifact",
    img: "image16.jpg",
  },
  {
    id: 17,
    name: "Heritage Wood Mask",
    price: 210.0,
    desc: "Hand-carved Ebony wood artifact",
    img: "image17.jpg",
  },
  {
    id: 18,
    name: "Heritage Wood Mask",
    price: 210.0,
    desc: "Hand-carved Ebony wood artifact",
    img: "image18.jpg",
  },
  {
    id: 19,
    name: "Heritage Wood Mask",
    price: 210.0,
    desc: "Hand-carved Ebony wood artifact",
    img: "image19.jpg",
  },
];

// 2. STATE: Application Data
let cart = [];

// 3. INITIALIZATION: Run when page loads
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  setupCartCounter();

  const signInBtn = document.querySelector(".btn-signin");
  if (signInBtn) {
    signInBtn.addEventListener("click", () => openModal("signInModal"));
  }
});

// 4. MODAL LOGIC: Clean handling of Sign In / Create Account
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden"; // Prevent background scrolling
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "auto"; // Re-enable scrolling
  }
}

// Switching functions (for the links inside modals)
function switchToCreateAccount() {
  closeModal("signInModal");
  setTimeout(() => openModal("createAccountModal"), 300);
}

function switchToSignIn() {
  closeModal("createAccountModal");
  setTimeout(() => openModal("signInModal"), 300);
}

// For the large banner button
function openCreateModal() {
  openModal("createAccountModal");
}

// 5. PRODUCT ENGINE: Dynamically builds your 2-column grid
function renderProducts() {
  const grid = document.getElementById("products-grid");
  grid.innerHTML = products
    .map(
      (product) => `
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
    `
    )
    .join("");
}

function setupCartCounter() {
  const cartCountElement = document.getElementById("cart-count");
  // Check if there is a saved cart in the browser's memory
  const savedCart = localStorage.getItem("classicClosetCart");

  if (savedCart) {
    cart = JSON.parse(savedCart);
  }

  if (cartCountElement) {
    cartCountElement.innerText = cart.length;
  }
}

// 6. CART SYSTEM: Functionality and Feedback
function addToCart(productId) {
  const item = products.find((p) => p.id === productId);
  if (item) {
    cart.push(item);
    updateCartDisplay();

    // IQ Move: Visual Feedback
    alert(`${item.name} added to your closet.`);
  }
}

function updateCartDisplay() {
  const counter = document.getElementById("cart-count");
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
  const email = document.getElementById("signin-email").value;
  alert(`Welcome back, member! Logged in as: ${email}`);
  closeModal("signInModal");
}

function handleCreateAccount(event) {
  event.preventDefault();
  const name = document.getElementById("signup-name").value;
  alert(`Account created successfully. Welcome to the Closet, ${name}!`);
  closeModal("createAccountModal");
}

/**
 * Page Navigation System
 * Handles switching between the Shop and Sub-pages
 */
function navigateTo(pageId) {
  // 1. Get all sections we might want to hide
  const mainSections = ["home", "products", "signup-cta-section"];
  const subPages = document.querySelectorAll(".sub-page");

  // 2. Hide Homepage Sections
  mainSections.forEach((id) => {
    const el = document.getElementById(id) || document.querySelector("." + id);
    if (el) el.style.display = "none";
  });

  // 3. Hide all other Sub-pages
  subPages.forEach((page) => (page.style.display = "none"));

  // 4. Show the requested page
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.style.display = "block";
    window.scrollTo(0, 0); // Reset scroll to top
  }
}

// Function to return to the Home/Shop
function goToHome() {
  location.reload(); // Simplest way to reset the shop state
}

// Add Click Listeners to your Navigation Links
// Example: <a href="#" onclick="navigateTo('fit-guide')">Size Guide</a>

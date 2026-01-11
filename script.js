const products = [
  {
    id: 1,
    name: "Premium Cotton T-Shirt",
    price: "$45.00",
    category: "Apparel",
    img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: 2,
    name: "Linen Summer Shorts",
    price: "$65.00",
    category: "Apparel",
    img: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: 3,
    name: "Minimalist Leather Sneakers",
    price: "$120.00",
    category: "Footwear",
    img: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: 4,
    name: "Hand-Carved Ebony Sculpture",
    price: "$210.00",
    category: "Wood Carvings",
    img: "https://images.unsplash.com/photo-1610631835061-f09c733229b0?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: 5,
    name: "Heritage Teak Mask",
    price: "$180.00",
    category: "Wood Carvings",
    img: "https://images.unsplash.com/photo-1563223552-30d01fda3ead?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: 6,
    name: "Classic White Runner",
    price: "$95.00",
    category: "Footwear",
    img: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&q=80&w=400",
  },
];

const productGrid = document.getElementById("product-grid");
const cartCountDisplay = document.getElementById("cart-count");
let cartCount = 0;

function loadProducts() {
  productGrid.innerHTML = products
    .map(
      (product) => `
        <div class="product-card">
            <div class="product-image">
                <img src="${product.img}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.price}</p>
                <button class="add-btn" onclick="addToCart()">Add to Bag</button>
            </div>
        </div>
    `
    )
    .join("");
}

function addToCart() {
  cartCount++;
  cartCountDisplay.innerText = cartCount;
  // Simple feedback
  alert("Added to cart!");
}

window.onload = loadProducts;

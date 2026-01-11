const products = [
            {
                id: 1,
                name: "Premium T-Shirt",
                description: "100% organic cotton with refined tailoring for the discerning individual",
                price: 29.99,
                emoji: "👕"
            },
            {
                id: 2,
                name: "Classic Shorts",
                description: "Breathable fabric engineered for comfort and sophisticated style",
                price: 39.99,
                emoji: "🩳"
            },
            {
                id: 3,
                name: "Designer Shoes",
                description: "Handcrafted footwear where artisan tradition meets contemporary design",
                price: 89.99,
                emoji: "👟"
            },
            {
                id: 4,
                name: "Artisan Wood Carving",
                description: "Unique handmade pieces, each tells its own story through time",
                price: 149.99,
                emoji: "🪵"
            }
        ];

        let cart = [];

        function renderProducts() {
            const grid = document.getElementById('products-grid');
            grid.innerHTML = products.map(product => `
                <div class="product-card">
                    <div class="product-image">
                        ${product.emoji}
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-description">${product.description}</p>
                        <div class="product-footer">
                            <span class="product-price">$${product.price}</span>
                            <button class="add-to-cart" onclick="addToCart(${product.id})">ADD TO CART</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function addToCart(productId) {
            const product = products.find(p => p.id === productId);
            cart.push(product);
            updateCartCount();
            
            const btn = event.target;
            btn.textContent = 'ADDED';
            setTimeout(() => {
                btn.textContent = 'ADD TO CART';
            }, 1500);
        }

        function updateCartCount() {
            document.getElementById('cart-count').textContent = cart.length;
        }

        function showCart() {
            if (cart.length === 0) {
                alert('Your cart is empty. Explore our collection to begin.');
            } else {
                const cartSummary = cart.map(item => `${item.name} - $${item.price}`).join('\n');
                const total = cart.reduce((sum, item) => sum + item.price, 0).toFixed(2);
                alert(`YOUR CART:\n\n${cartSummary}\n\nTotal: $${total}`);
            }
        }

        renderProducts();
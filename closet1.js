const products = [
            {
                id: 1,
                name: "Premium T-Shirt",
                description: "100% organic cotton, perfect fit for any occasion",
                price: 29.99,
                emoji: "👕",
                gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            },
            {
                id: 2,
                name: "Classic Shorts",
                description: "Breathable fabric, ideal for summer adventures",
                price: 39.99,
                emoji: "🩳",
                gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            },
            {
                id: 3,
                name: "Designer Shoes",
                description: "Handcrafted comfort meets modern style",
                price: 89.99,
                emoji: "👟",
                gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
            },
            {
                id: 4,
                name: "Artisan Wood Carving",
                description: "Unique handmade pieces, each tells a story",
                price: 149.99,
                emoji: "🪵",
                gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
            }
        ];

        let cart = [];

        function renderProducts() {
            const grid = document.getElementById('products-grid');
            grid.innerHTML = products.map(product => `
                <div class="product-card">
                    <div class="product-image" style="background: ${product.gradient}">
                        ${product.emoji}
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-description">${product.description}</p>
                        <div class="product-footer">
                            <span class="product-price">$${product.price}</span>
                            <button class="add-to-cart" onclick="addToCart(${product.id})">Add to Cart</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function addToCart(productId) {
            const product = products.find(p => p.id === productId);
            cart.push(product);
            updateCartCount();
            
            // Visual feedback
            const btn = event.target;
            btn.textContent = '✓ Added!';
            setTimeout(() => {
                btn.textContent = 'Add to Cart';
            }, 1500);
        }

        function updateCartCount() {
            document.getElementById('cart-count').textContent = cart.length;
        }

        function showCart() {
            if (cart.length === 0) {
                alert('Your cart is empty! Start shopping to add items.');
            } else {
                const cartSummary = cart.map(item => `${item.name} - $${item.price}`).join('\n');
                const total = cart.reduce((sum, item) => sum + item.price, 0).toFixed(2);
                alert(`Your Cart:\n\n${cartSummary}\n\nTotal: $${total}`);
            }
        }

        renderProducts();
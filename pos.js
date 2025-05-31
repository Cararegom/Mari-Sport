class POSManager {
    constructor(app) {
        this.app = app;
        this.cart = [];
    }

    renderProducts() {
        const container = document.getElementById('pos-products');
        container.innerHTML = '';

        this.app.products.forEach(product => {
            if (product.stock > 0) {
                const productCard = document.createElement('div');
                productCard.className = 'pos-product-card';
                productCard.innerHTML = `
                    <img src="${product.imagen_url || 'https://via.placeholder.com/100x100?text=Imagen'}" alt="${product.nombre}">
                    <div class="name">${product.nombre}</div>
                    <div class="price">$${product.precio}</div>
                `;
                productCard.addEventListener('click', () => {
                    this.addToCart(product);
                });
                container.appendChild(productCard);
            }
        });
    }

    addToCart(product) {
        const existingItem = this.cart.find(item => item.id === product.id);
        if (existingItem) {
            if (existingItem.quantity < product.stock) {
                existingItem.quantity++;
            }
        } else {
            this.cart.push({
                ...product,
                quantity: 1
            });
        }
        this.renderCart();
    }

    renderCart() {
        const container = document.getElementById('cart-items');
        const totalElement = document.getElementById('cart-total');
        const completeBtn = document.getElementById('complete-sale');

        if (this.cart.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #6c757d; padding: 2rem;">Carrito vacío</div>';
            totalElement.textContent = '0';
            completeBtn.disabled = true;
            return;
        }

        container.innerHTML = '';
        let total = 0;

        this.cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            
            const itemTotal = item.precio * item.quantity;
            total += itemTotal;

            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.nombre}</div>
                    <div class="cart-item-details">$${item.precio} x ${item.quantity} = $${itemTotal.toFixed(2)}</div>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="app.pos.updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="app.pos.updateQuantity(${item.id}, 1)">+</button>
                    <button class="qty-btn" onclick="app.pos.removeFromCart(${item.id})" style="background: #dc3545; margin-left: 0.5rem;">×</button>
                </div>
            `;
            container.appendChild(cartItem);
        });

        totalElement.textContent = total.toFixed(2);
        completeBtn.disabled = false;
    }

    updateQuantity(productId, change) {
        const item = this.cart.find(item => item.id === productId);
        const product = this.app.products.find(p => p.id === productId);
        
        if (item) {
            const newQuantity = item.quantity + change;
            if (newQuantity <= 0) {
                this.removeFromCart(productId);
            } else if (newQuantity <= product.stock) {
                item.quantity = newQuantity;
                this.renderCart();
            }
        }
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.renderCart();
    }

    async completeSale() {
        if (this.cart.length === 0) return;

        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        const total = parseFloat(document.getElementById('cart-total').textContent);

        try {
            // Update stock in database
            for (const cartItem of this.cart) {
                const product = this.app.products.find(p => p.id === cartItem.id);
                if (product) {
                    const newStock = product.stock - cartItem.quantity;
                    await this.app.supabase
                        .from('productos')
                        .update({ stock: newStock })
                        .eq('id', product.id);
                    
                    product.stock = newStock;
                }
            }

            // Clear cart
            this.cart = [];
            this.renderCart();
            this.renderProducts();

            alert('¡Venta completada exitosamente!');
        } catch (error) {
            console.error('Error completing sale:', error);
            alert('Error al completar la venta.');
        }
    }
}
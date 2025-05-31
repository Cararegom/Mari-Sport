class MariSportApp {
    constructor() {
        this.supabase = window.supabase.createClient(
            'https://ktbkqqiqeogwfnxjnpxw.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0YmtxcWlxZW9nd2ZueGpucHh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NDYyNTEsImV4cCI6MjA2NDIyMjI1MX0.z84-xZz2H-VwpeqjITrjLDnEg35Slv485H534Ur7qbo'
        );
        
        this.products = [];
        this.cart = [];
        this.customers = [];
        this.creditSales = [];
        this.payments = [];
        this.sales = [];
        this.currentEditingProduct = null;
        this.currentEditingCustomer = null;
        this.currentCreditSale = null;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadProducts();
        await this.loadCustomers();
        await this.loadCreditSales();
        await this.loadPayments();
        await this.loadSales();
        this.renderPOSProducts();
        this.renderCatalog();
        this.renderInventory();
        this.renderCustomers();
        this.updateStats();
        this.updateTrackingSummary();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });

        // Credit tabs
        document.querySelectorAll('.credit-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.creditSection;
                this.switchCreditSection(section);
            });
        });

        // POS Events
        document.getElementById('complete-sale').addEventListener('click', () => this.completeSale());

        // Product Modal Events
        document.getElementById('add-product-btn').addEventListener('click', () => this.openProductModal());
        document.getElementById('product-form').addEventListener('submit', (e) => this.handleProductSubmit(e));
        document.getElementById('cancel-product').addEventListener('click', () => this.closeProductModal());
        document.querySelector('#product-modal .close').addEventListener('click', () => this.closeProductModal());

        // Customer Modal Events
        document.getElementById('add-customer-btn').addEventListener('click', () => this.openCustomerModal());
        document.getElementById('customer-form').addEventListener('submit', (e) => this.handleCustomerSubmit(e));
        document.getElementById('cancel-customer').addEventListener('click', () => this.closeCustomerModal());
        document.getElementById('close-customer-modal').addEventListener('click', () => this.closeCustomerModal());

        // Credit Sale Modal Events
        document.getElementById('new-credit-sale-btn').addEventListener('click', () => this.openCreditSaleModal());
        document.getElementById('credit-sale-form').addEventListener('submit', (e) => this.handleCreditSaleSubmit(e));
        document.getElementById('cancel-credit-sale').addEventListener('click', () => this.closeCreditSaleModal());
        document.getElementById('close-credit-sale-modal').addEventListener('click', () => this.closeCreditSaleModal());

        // Payment Modal Events
        document.getElementById('payment-form').addEventListener('submit', (e) => this.handlePaymentSubmit(e));
        document.getElementById('cancel-payment').addEventListener('click', () => this.closePaymentModal());
        document.getElementById('close-payment-modal').addEventListener('click', () => this.closePaymentModal());

        // Filters
        document.getElementById('category-filter').addEventListener('change', () => this.filterCatalog());
        document.getElementById('size-filter').addEventListener('change', () => this.filterCatalog());

        // Search
        document.getElementById('customer-search').addEventListener('input', (e) => this.searchCustomers(e.target.value));

        // Stats period
        document.getElementById('stats-period').addEventListener('change', () => this.updateStats());

        // Image upload
        document.getElementById('product-image-file').addEventListener('change', (e) => this.handleImageUpload(e));
        document.getElementById('product-image').addEventListener('input', (e) => this.previewImageUrl(e.target.value));

        // Modal click outside to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    switchSection(section) {
        document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
        
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
        document.getElementById(section).classList.add('active');

        if (section === 'stats') {
            this.updateStats();
        }
    }

    switchCreditSection(section) {
        document.querySelectorAll('.credit-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.credit-subsection').forEach(sec => sec.classList.remove('active'));
        
        document.querySelector(`[data-credit-section="${section}"]`).classList.add('active');
        document.getElementById(section).classList.add('active');

        if (section === 'payments') {
            this.renderPendingDebts();
        } else if (section === 'tracking') {
            this.updateTrackingSummary();
            this.renderActiveDebts();
        } else if (section === 'credit-sales') {
            this.renderCreditSales();
        }
    }

    // Product Management
    async loadProducts() {
        try {
            const { data, error } = await this.supabase
                .from('productos')
                .select('*')
                .order('creado_en', { ascending: false });

            if (error) throw error;
            this.products = data || [];
        } catch (error) {
            this.showNotification('Error al cargar productos', 'error');
        }
    }

    async saveProduct(productData) {
        try {
            if (this.currentEditingProduct) {
                const { error } = await this.supabase
                    .from('productos')
                    .update(productData)
                    .eq('id', this.currentEditingProduct);

                if (error) throw error;
                this.showNotification('Producto actualizado exitosamente', 'success');
            } else {
                const { error } = await this.supabase
                    .from('productos')
                    .insert([productData]);

                if (error) throw error;
                this.showNotification('Producto agregado exitosamente', 'success');
            }

            await this.loadProducts();
            this.renderPOSProducts();
            this.renderCatalog();
            this.renderInventory();
        } catch (error) {
            this.showNotification('Error al guardar producto', 'error');
        }
    }

    async deleteProduct(id) {
    const confirmed = await this.showConfirmation('¿Estás segura de que deseas eliminar este producto?');
    if (!confirmed) return;

    console.log('Intentando eliminar producto con ID:', id); // NUEVO

    try {
        const { error, data } = await this.supabase
            .from('productos')
            .delete()
            .eq('id', id);

        if (error) throw error;

        console.log('Respuesta Supabase:', data); // NUEVO

        await this.loadProducts();
        this.renderPOSProducts();
        this.renderCatalog();
        this.renderInventory();
        this.showNotification('Producto eliminado exitosamente', 'success');
    } catch (error) {
        this.showNotification('Error al eliminar producto', 'error');
        console.error(error); // NUEVO
    }
}


    async updateProductStock(id, newStock) {
        try {
            const { error } = await this.supabase
                .from('productos')
                .update({ stock: newStock })
                .eq('id', id);

            if (error) throw error;
            await this.loadProducts();
        } catch (error) {
            this.showNotification('Error al actualizar stock', 'error');
        }
    }

    // Customer Management
    async loadCustomers() {
        try {
            const { data, error } = await this.supabase
                .from('clientes')
                .select('*')
                .order('creado_en', { ascending: false });

            if (error) throw error;
            this.customers = data || [];
        } catch (error) {
            this.showNotification('Error al cargar clientes', 'error');
        }
    }

    async saveCustomer(customerData) {
        try {
            if (this.currentEditingCustomer) {
                const { error } = await this.supabase
                    .from('clientes')
                    .update(customerData)
                    .eq('id', this.currentEditingCustomer);

                if (error) throw error;
                this.showNotification('Cliente actualizado exitosamente', 'success');
            } else {
                const { error } = await this.supabase
                    .from('clientes')
                    .insert([customerData]);

                if (error) throw error;
                this.showNotification('Cliente agregado exitosamente', 'success');
            }

            await this.loadCustomers();
            this.renderCustomers();
            this.populateCreditCustomers();
        } catch (error) {
            this.showNotification('Error al guardar cliente', 'error');
        }
    }

    async deleteCustomer(id) {
        const confirmed = await this.showConfirmation('¿Estás segura de que deseas eliminar este cliente?');
        if (!confirmed) return;

        try {
            const { error } = await this.supabase
                .from('clientes')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await this.loadCustomers();
            this.renderCustomers();
            this.showNotification('Cliente eliminado exitosamente', 'success');
        } catch (error) {
            this.showNotification('Error al eliminar cliente', 'error');
        }
    }

    // Credit Sales Management
    async loadCreditSales() {
        try {
            const { data, error } = await this.supabase
                .from('ventas_fiadas')
                .select(`
                    *,
                    clientes(nombre, telefono)
                `)
                .order('creado_en', { ascending: false });

            if (error) throw error;
            this.creditSales = data || [];
        } catch (error) {
            this.showNotification('Error al cargar ventas fiadas', 'error');
        }
    }

    async saveCreditSale(saleData) {
        try {
            const { error } = await this.supabase
                .from('ventas_fiadas')
                .insert([saleData]);

            if (error) throw error;

            await this.loadCreditSales();
            this.renderCreditSales();
            this.updateTrackingSummary();
            this.showNotification('Venta a crédito registrada exitosamente', 'success');
        } catch (error) {
            this.showNotification('Error al registrar venta a crédito', 'error');
        }
    }

    // Payments Management
    async loadPayments() {
        try {
            const { data, error } = await this.supabase
                .from('abonos')
                .select('*')
                .order('creado_en', { ascending: false });

            if (error) throw error;
            this.payments = data || [];
        } catch (error) {
            this.showNotification('Error al cargar pagos', 'error');
        }
    }

    async savePayment(paymentData) {
        try {
            const { error } = await this.supabase
                .from('abonos')
                .insert([paymentData]);

            if (error) throw error;

            // Update sale balance
            const sale = this.creditSales.find(s => s.id === paymentData.venta_id);
            if (sale) {
                const newBalance = sale.saldo_pendiente - paymentData.monto;
                const status = newBalance <= 0 ? 'pagada' : 'pendiente';

                await this.supabase
                    .from('ventas_fiadas')
                    .update({ 
                        saldo_pendiente: Math.max(0, newBalance),
                        estado: status
                    })
                    .eq('id', paymentData.venta_id);
            }

            await this.loadCreditSales();
            await this.loadPayments();
            this.renderPendingDebts();
            this.updateTrackingSummary();
            this.renderActiveDebts();
            this.showNotification('Pago registrado exitosamente', 'success');
setTimeout(() => {
    window.location.reload();
}, 2000); // 2 segundos después del mensaje

        } catch (error) {
            this.showNotification('Error al registrar pago', 'error');
        }
    }

    // Sales Management
    async loadSales() {
        try {
            const { data, error } = await this.supabase
                .from('ventas')
                .select('*')
                .order('fecha', { ascending: false });

            if (error) {
                // If table doesn't exist, create it
                this.sales = [];
                return;
            }
            this.sales = data || [];
        } catch (error) {
            this.sales = [];
        }
    }

    async saveSale(saleData) {
        try {
            // First try to insert into ventas table
            const { error } = await this.supabase
                .from('ventas')
                .insert([saleData]);

            if (error) {
                // If table doesn't exist, store in localStorage as backup
                const sales = JSON.parse(localStorage.getItem('mariSportSales') || '[]');
                sales.push({
                    ...saleData,
                    id: Date.now().toString(),
                    fecha: new Date().toISOString()
                });
                localStorage.setItem('mariSportSales', JSON.stringify(sales));
                this.sales = sales;
            } else {
                await this.loadSales();
            }

            this.updateStats();
        } catch (error) {
            // Fallback to localStorage
            const sales = JSON.parse(localStorage.getItem('mariSportSales') || '[]');
            sales.push({
                ...saleData,
                id: Date.now().toString(),
                fecha: new Date().toISOString()
            });
            localStorage.setItem('mariSportSales', JSON.stringify(sales));
            this.sales = sales;
            this.updateStats();
        }
    }

    // Image Upload
    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;

            const { data, error } = await this.supabase.storage
                .from('ropa-deportiva')
                .upload(fileName, file);

            if (error) throw error;

            const { data: publicData } = this.supabase.storage
                .from('ropa-deportiva')
                .getPublicUrl(fileName);

            document.getElementById('product-image').value = publicData.publicUrl;
            this.previewImageUrl(publicData.publicUrl);

            this.showNotification('Imagen subida exitosamente', 'success');
        } catch (error) {
            this.showNotification('Error al subir imagen', 'error');
        }
    }

    previewImageUrl(url) {
        const preview = document.getElementById('image-preview');
        if (url) {
            preview.innerHTML = `<img src="${url}" style="max-width: 100px; max-height: 100px; object-fit: cover; border-radius: 5px;">`;
        } else {
            preview.innerHTML = '';
        }
    }

    // POS Methods
    addToCart(product) {
        const existingItem = this.cart.find(item => 
            item.id === product.id && 
            item.talla === product.selectedSize && 
            item.color === product.selectedColor
        );

        if (existingItem) {
            if (existingItem.quantity < product.stock) {
                existingItem.quantity++;
            } else {
                this.showNotification('No hay suficiente stock disponible', 'warning');
                return;
            }
        } else {
            if (product.stock > 0) {
                this.cart.push({
                    ...product,
                    quantity: 1,
                    talla: product.selectedSize || 'M',
                    color: product.selectedColor || 'N/A'
                });
            } else {
                this.showNotification('Producto sin stock', 'warning');
                return;
            }
        }

        this.renderCart();
        this.updateCartTotal();
    }

    removeFromCart(index) {
        this.cart.splice(index, 1);
        this.renderCart();
        this.updateCartTotal();
    }

    updateQuantity(index, change) {
        const item = this.cart[index];
        const newQuantity = item.quantity + change;

        if (newQuantity <= 0) {
            this.removeFromCart(index);
        } else if (newQuantity <= item.stock) {
            item.quantity = newQuantity;
            this.renderCart();
            this.updateCartTotal();
        } else {
            this.showNotification('No hay suficiente stock disponible', 'warning');
        }
    }

    async completeSale() {
        if (this.cart.length === 0) {
            this.showNotification('El carrito está vacío', 'warning');
            return;
        }

        const total = this.cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

        const saleData = {
            productos: JSON.stringify(this.cart),
            total: total,
            forma_pago: paymentMethod,
            fecha: new Date().toISOString().split('T')[0]
        };

        // Update stock for each product
        for (const item of this.cart) {
            const newStock = item.stock - item.quantity;
            await this.updateProductStock(item.id, newStock);
        }

        await this.saveSale(saleData);

        this.cart = [];
        this.renderCart();
        this.updateCartTotal();
        this.renderPOSProducts();
        this.renderCatalog();
        this.renderInventory();

        this.showNotification('Venta completada exitosamente', 'success');
    }

    // Render Methods
    renderPOSProducts() {
        const container = document.getElementById('pos-products');
        container.innerHTML = '';

        this.products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'pos-product-card';
            card.innerHTML = `
                <img src="${product.imagen_url || 'https://via.placeholder.com/100'}" alt="${product.nombre}" onerror="this.src='https://via.placeholder.com/100'">
                <div class="name">${product.nombre}</div>
                <div class="price">$${product.precio}</div>
                <div class="stock">Stock: ${product.stock}</div>
            `;

            if (product.stock > 0) {
                card.addEventListener('click', () => this.addToCart(product));
            } else {
                card.style.opacity = '0.5';
                card.style.cursor = 'not-allowed';
            }

            container.appendChild(card);
        });
    }

    renderCart() {
        const container = document.getElementById('cart-items');
        
        if (this.cart.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6c757d;">El carrito está vacío</p>';
            return;
        }

        container.innerHTML = this.cart.map((item, index) => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.nombre}</div>
                    <div class="cart-item-details">$${item.precio} - ${item.talla} - ${item.color}</div>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="app.updateQuantity(${index}, -1)">-</button>
                    <span style="margin: 0 0.5rem;">${item.quantity}</span>
                    <button class="qty-btn" onclick="app.updateQuantity(${index}, 1)">+</button>
                    <button class="qty-btn" style="background: #dc3545; margin-left: 0.5rem;" onclick="app.removeFromCart(${index})">×</button>
                </div>
            </div>
        `).join('');
    }

    updateCartTotal() {
        const total = this.cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
        document.getElementById('cart-total').textContent = total.toFixed(2);
        
        const completeBtn = document.getElementById('complete-sale');
        completeBtn.disabled = this.cart.length === 0;
    }

    renderCatalog() {
        const container = document.getElementById('catalog-grid');
        const categoryFilter = document.getElementById('category-filter').value;
        const sizeFilter = document.getElementById('size-filter').value;

        let filteredProducts = this.products;

        if (categoryFilter) {
            filteredProducts = filteredProducts.filter(p => p.categoria === categoryFilter);
        }

        if (sizeFilter) {
            filteredProducts = filteredProducts.filter(p => p.talla && p.talla.includes(sizeFilter));
        }

        container.innerHTML = filteredProducts.map(product => `
            <div class="catalog-card">
                <img src="${product.imagen_url || 'https://via.placeholder.com/200'}" alt="${product.nombre}" onerror="this.src='https://via.placeholder.com/200'">
                <div class="catalog-card-content">
                    <div class="catalog-card-name">${product.nombre}</div>
                    <div class="catalog-card-price">$${product.precio}</div>
                    <div class="catalog-card-stock">Stock: ${product.stock}</div>
                </div>
            </div>
        `).join('');
    }

    filterCatalog() {
        this.renderCatalog();
    }

    renderInventory() {
        const tbody = document.querySelector('#inventory-table tbody');
        tbody.innerHTML = this.products.map(product => `
            <tr>
                <td><img src="${product.imagen_url || 'https://via.placeholder.com/50'}" alt="${product.nombre}" onerror="this.src='https://via.placeholder.com/50'"></td>
                <td>${product.nombre}</td>
                <td>${product.categoria}</td>
                <td>$${product.precio}</td>
                <td>${product.stock}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="app.editProduct('${product.id}')">Editar</button>
                    <button class="action-btn delete-btn" onclick="app.deleteProduct('${product.id}')">Eliminar</button>
                </td>
            </tr>
        `).join('');
    }

    renderCustomers() {
        const container = document.getElementById('customers-grid');
        
        container.innerHTML = this.customers.map(customer => {
            const customerDebts = this.creditSales.filter(sale => 
                sale.cliente_id === customer.id && sale.estado !== 'pagada'
            );
            const totalDebt = customerDebts.reduce((sum, sale) => sum + sale.saldo_pendiente, 0);

            return `
                <div class="customer-card">
                    <div class="customer-name">${customer.nombre}</div>
                    <div class="customer-phone">${customer.telefono}</div>
                    <div class="customer-address">${customer.direccion || 'Sin dirección'}</div>
                    <div class="customer-debt ${totalDebt === 0 ? 'no-debt' : ''}">
                        ${totalDebt === 0 ? 'Sin deudas' : `Debe: $${totalDebt.toFixed(2)}`}
                    </div>
                    <div class="customer-actions">
                        <button class="btn-secondary" onclick="app.editCustomer('${customer.id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-primary" onclick="app.deleteCustomer('${customer.id}')">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderCreditSales() {
        const container = document.getElementById('credit-sales-list');
        
        container.innerHTML = this.creditSales.map(sale => {
            const customer = sale.clientes;
            const progress = ((sale.total - sale.saldo_pendiente) / sale.total) * 100;
            
            return `
                <div class="credit-sale-card">
                    <div class="credit-sale-header">
                        <div>
                            <div class="credit-sale-customer">${customer?.nombre}</div>
                            <div class="credit-sale-date">${new Date(sale.fecha_inicio).toLocaleDateString()}</div>
                        </div>
                        <div class="credit-sale-status status-${sale.estado}">${sale.estado.toUpperCase()}</div>
                    </div>
                    
                    <div class="credit-sale-details">
                        <div class="debt-progress">
                            <div class="debt-progress-bar" style="width: ${progress}%"></div>
                        </div>
                        
                        <div class="debt-amounts">
                            <span class="amount-total">Total: $${sale.total.toFixed(2)}</span>
                            <span class="amount-paid">Pagado: $${(sale.total - sale.saldo_pendiente).toFixed(2)}</span>
                            <span class="amount-pending">Pendiente: $${sale.saldo_pendiente.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderPendingDebts() {
        const container = document.getElementById('pending-debts');
        const pendingDebts = this.creditSales.filter(sale => sale.estado !== 'pagada');

        container.innerHTML = pendingDebts.map(sale => {
            const customer = sale.clientes;
            const payments = this.payments.filter(p => p.venta_id === sale.id);
            const today = new Date();
            const dueDate = new Date(sale.fecha_limite);
            const isOverdue = today > dueDate;
            const isDueSoon = (dueDate - today) / (1000 * 60 * 60 * 24) <= 3 && !isOverdue;

            return `
                <div class="debt-card ${isOverdue ? 'overdue' : isDueSoon ? 'due-soon' : ''}">
                    <div class="debt-header">
                        <div class="debt-customer">${customer?.nombre}</div>
                        <div class="debt-status ${isOverdue ? 'status-overdue' : isDueSoon ? 'status-due-soon' : 'status-active'}">
                            ${isOverdue ? 'VENCIDA' : isDueSoon ? 'PRÓXIMA A VENCER' : 'ACTIVA'}
                        </div>
                    </div>
                    
                    <div class="debt-amounts">
                        <span class="amount-total">Total: $${sale.total.toFixed(2)}</span>
                        <span class="amount-pending">Pendiente: $${sale.saldo_pendiente.toFixed(2)}</span>
                    </div>
                    
                    <div style="margin: 1rem 0;">
                        <strong>Fecha límite:</strong> ${dueDate.toLocaleDateString()}
                    </div>
                    
                    <button class="btn-primary" onclick="app.openPaymentModal('${sale.id}')">
                        <i class="fas fa-money-bill"></i> Registrar Abono
                    </button>
                    
                    ${payments.length > 0 ? `
                        <div class="payment-history">
                            <h5>Historial de Pagos</h5>
                            ${payments.map(payment => `
                                <div class="payment-item">
                                    <span class="payment-date">${new Date(payment.fecha_abono).toLocaleDateString()}</span>
                                    <span class="payment-amount">$${payment.monto.toFixed(2)}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    renderActiveDebts() {
        const container = document.getElementById('active-debts');
        const activeDebts = this.creditSales.filter(sale => sale.estado !== 'pagada');

        container.innerHTML = activeDebts.map(sale => {
            const customer = sale.clientes;
            return `
                <div class="debt-card">
                    <div class="debt-header">
                        <div class="debt-customer">${customer?.nombre}</div>
                        <div class="debt-status status-${sale.estado}">${sale.estado.toUpperCase()}</div>
                    </div>
                    <div class="debt-amounts">
                        <span class="amount-total">Total: $${sale.total.toFixed(2)}</span>
                        <span class="amount-pending">Pendiente: $${sale.saldo_pendiente.toFixed(2)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateStats() {
        const period = document.getElementById('stats-period').value;
        const now = new Date();
        let startDate;

        switch (period) {
            case 'day':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
        }

        // Filter sales by period
        const periodSales = this.sales.filter(sale => {
            const saleDate = new Date(sale.fecha);
            return saleDate >= startDate;
        });

        // Calculate totals
        const totalSales = periodSales.reduce((sum, sale) => sum + sale.total, 0);
        const totalOrders = periodSales.length;
        const avgSale = totalOrders > 0 ? totalSales / totalOrders : 0;

        // Update UI
        document.getElementById('total-sales').textContent = `$${totalSales.toFixed(2)}`;
        document.getElementById('total-orders').textContent = totalOrders;
        document.getElementById('avg-sale').textContent = `$${avgSale.toFixed(2)}`;

        // Calculate best sellers
        const productSales = {};
        periodSales.forEach(sale => {
            const productos = JSON.parse(sale.productos || '[]');
            productos.forEach(product => {
                if (!productSales[product.nombre]) {
                    productSales[product.nombre] = {
                        name: product.nombre,
                        quantity: 0,
                        revenue: 0,
                        image: product.imagen_url
                    };
                }
                productSales[product.nombre].quantity += product.quantity;
                productSales[product.nombre].revenue += product.precio * product.quantity;
            });
        });

        const bestSellers = Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        this.renderBestSellers(bestSellers);
    }

    renderBestSellers(bestSellers) {
        const container = document.getElementById('best-sellers-list');
        
        if (bestSellers.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6c757d;">No hay datos de ventas para este período</p>';
            return;
        }

        container.innerHTML = bestSellers.map(product => `
            <div class="best-seller-item">
                <img src="${product.image || 'https://via.placeholder.com/50'}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/50'">
                <div class="best-seller-info">
                    <div class="best-seller-name">${product.name}</div>
                    <div class="best-seller-sales">${product.quantity} vendidos - $${product.revenue.toFixed(2)}</div>
                </div>
            </div>
        `).join('');
    }

    updateTrackingSummary() {
        const totalCredit = this.creditSales.reduce((sum, sale) => sum + sale.total, 0);
        const totalPending = this.creditSales.reduce((sum, sale) => sum + sale.saldo_pendiente, 0);
        const totalCollected = totalCredit - totalPending;

        document.getElementById('total-credit').textContent = `$${totalCredit.toFixed(2)}`;
        document.getElementById('total-collected').textContent = `$${totalCollected.toFixed(2)}`;
        document.getElementById('total-pending').textContent = `$${totalPending.toFixed(2)}`;
    }

    // Modal Methods
    openProductModal(productId = null) {
        this.currentEditingProduct = productId;
        const modal = document.getElementById('product-modal');
        const form = document.getElementById('product-form');
        const title = document.getElementById('modal-title');

        if (productId) {
            const product = this.products.find(p => p.id === productId);
            title.textContent = 'Editar Producto';
            
            document.getElementById('product-name').value = product.nombre;
            document.getElementById('product-category').value = product.categoria;
            document.getElementById('product-price').value = product.precio;
            document.getElementById('product-image').value = product.imagen_url || '';
            document.getElementById('product-colors').value = product.color || '';
            document.getElementById('product-stock').value = product.stock;
            
            if (product.imagen_url) {
                this.previewImageUrl(product.imagen_url);
            }
        } else {
            title.textContent = 'Agregar Producto';
            form.reset();
            document.getElementById('image-preview').innerHTML = '';
        }

        modal.style.display = 'block';
    }

    closeProductModal() {
        document.getElementById('product-modal').style.display = 'none';
        this.currentEditingProduct = null;
    }

    async handleProductSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const sizesChecked = Array.from(document.querySelectorAll('.size-checkboxes input:checked'))
            .map(cb => cb.value);

        const productData = {
            nombre: formData.get('product-name') || document.getElementById('product-name').value,
            categoria: formData.get('product-category') || document.getElementById('product-category').value,
            precio: parseFloat(formData.get('product-price') || document.getElementById('product-price').value),
            imagen_url: document.getElementById('product-image').value,
            talla: sizesChecked.join(', '),
            color: formData.get('product-colors') || document.getElementById('product-colors').value,
            stock: parseInt(formData.get('product-stock') || document.getElementById('product-stock').value)
        };

        await this.saveProduct(productData);
        this.closeProductModal();
    }

    editProduct(id) {
        this.openProductModal(id);
    }

    openCustomerModal(customerId = null) {
        this.currentEditingCustomer = customerId;
        const modal = document.getElementById('customer-modal');
        const form = document.getElementById('customer-form');
        const title = document.getElementById('customer-modal-title');

        if (customerId) {
            const customer = this.customers.find(c => c.id === customerId);
            title.textContent = 'Editar Cliente';
            
            document.getElementById('customer-name').value = customer.nombre;
            document.getElementById('customer-phone').value = customer.telefono;
            document.getElementById('customer-address').value = customer.direccion || '';
        } else {
            title.textContent = 'Agregar Cliente';
            form.reset();
        }

        modal.style.display = 'block';
    }

    closeCustomerModal() {
        document.getElementById('customer-modal').style.display = 'none';
        this.currentEditingCustomer = null;
    }

    async handleCustomerSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const customerData = {
            nombre: formData.get('customer-name') || document.getElementById('customer-name').value,
            telefono: formData.get('customer-phone') || document.getElementById('customer-phone').value,
            direccion: formData.get('customer-address') || document.getElementById('customer-address').value
        };

        await this.saveCustomer(customerData);
        this.closeCustomerModal();
    }

    editCustomer(id) {
        this.openCustomerModal(id);
    }

    searchCustomers(query) {
        const filtered = this.customers.filter(customer => 
            customer.nombre.toLowerCase().includes(query.toLowerCase()) ||
            customer.telefono.includes(query)
        );
        
        this.renderFilteredCustomers(filtered);
    }

    renderFilteredCustomers(customers) {
        const container = document.getElementById('customers-grid');
        
        container.innerHTML = customers.map(customer => {
            const customerDebts = this.creditSales.filter(sale => 
                sale.cliente_id === customer.id && sale.estado !== 'pagada'
            );
            const totalDebt = customerDebts.reduce((sum, sale) => sum + sale.saldo_pendiente, 0);

            return `
                <div class="customer-card">
                    <div class="customer-name">${customer.nombre}</div>
                    <div class="customer-phone">${customer.telefono}</div>
                    <div class="customer-address">${customer.direccion || 'Sin dirección'}</div>
                    <div class="customer-debt ${totalDebt === 0 ? 'no-debt' : ''}">
                        ${totalDebt === 0 ? 'Sin deudas' : `Debe: $${totalDebt.toFixed(2)}`}
                    </div>
                    <div class="customer-actions">
                        <button class="btn-secondary" onclick="app.editCustomer('${customer.id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-primary" onclick="app.deleteCustomer('${customer.id}')">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    openCreditSaleModal() {
        const modal = document.getElementById('credit-sale-modal');
        const form = document.getElementById('credit-sale-form');
        
        form.reset();
        this.populateCreditCustomers();
        this.populateCreditProducts();
        
        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('first-payment-date').value = tomorrow.toISOString().split('T')[0];
        
        modal.style.display = 'block';
    }

    closeCreditSaleModal() {
        document.getElementById('credit-sale-modal').style.display = 'none';
    }

    populateCreditCustomers() {
        const select = document.getElementById('credit-customer');
        select.innerHTML = '<option value="">Seleccionar cliente...</option>';
        
        this.customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.nombre;
            select.appendChild(option);
        });
    }

    populateCreditProducts() {
        const container = document.getElementById('credit-products-selector');
        container.innerHTML = '';
        
        this.products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'credit-product-card';
            card.innerHTML = `
                <img src="${product.imagen_url || 'https://via.placeholder.com/100'}" alt="${product.nombre}" onerror="this.src='https://via.placeholder.com/100'">
                <div class="name">${product.nombre}</div>
                <div class="price">$${product.precio}</div>
            `;
            
            card.addEventListener('click', () => this.toggleCreditProduct(product, card));
            container.appendChild(card);
        });
    }

    toggleCreditProduct(product, cardElement) {
        cardElement.classList.toggle('selected');
        this.updateSelectedCreditProducts();
    }

    updateSelectedCreditProducts() {
        const selectedCards = document.querySelectorAll('.credit-product-card.selected');
        const container = document.getElementById('selected-credit-products');
        const totalInput = document.getElementById('credit-total');
        
        let total = 0;
        let productsHtml = '';
        
        selectedCards.forEach(card => {
            const productName = card.querySelector('.name').textContent;
            const productPrice = parseFloat(card.querySelector('.price').textContent.replace('$', ''));
            
            total += productPrice;
            productsHtml += `
                <div class="selected-product-item">
                    <span>${productName}</span>
                    <span>$${productPrice.toFixed(2)}</span>
                </div>
            `;
        });
        
        container.innerHTML = productsHtml || '<p style="text-align: center; color: #6c757d;">No hay productos seleccionados</p>';
        totalInput.value = total.toFixed(2);
    }

    async handleCreditSaleSubmit(e) {
        e.preventDefault();
        
        const customerId = document.getElementById('credit-customer').value;
        const selectedCards = document.querySelectorAll('.credit-product-card.selected');
        const total = parseFloat(document.getElementById('credit-total').value);
        const initialPayment = parseFloat(document.getElementById('initial-payment').value) || 0;
        const firstPaymentDate = document.getElementById('first-payment-date').value;
        const termType = document.getElementById('payment-term-type').value;
        const termValue = parseInt(document.getElementById('payment-term-value').value);

        if (!customerId || selectedCards.length === 0) {
            this.showNotification('Por favor selecciona un cliente y al menos un producto', 'warning');
            return;
        }

        // Calculate due date
        const dueDate = new Date(firstPaymentDate);
        if (termType === 'days') {
            dueDate.setDate(dueDate.getDate() + termValue);
        } else {
            dueDate.setMonth(dueDate.getMonth() + termValue);
        }

        // Get selected products
        const products = [];
        selectedCards.forEach(card => {
            const productName = card.querySelector('.name').textContent;
            const productPrice = parseFloat(card.querySelector('.price').textContent.replace('$', ''));
            products.push({ nombre: productName, precio: productPrice, quantity: 1 });
        });

        const saleData = {
            cliente_id: customerId,
            productos: JSON.stringify(products),
            total: total,
            abono_inicial: initialPayment,
            saldo_pendiente: total - initialPayment,
            fecha_inicio: new Date().toISOString().split('T')[0],
            fecha_limite: dueDate.toISOString().split('T')[0],
            estado: (total - initialPayment) <= 0 ? 'pagada' : 'pendiente'
        };

        await this.saveCreditSale(saleData);
        this.closeCreditSaleModal();
    }

    openPaymentModal(saleId) {
        this.currentCreditSale = saleId;
        const modal = document.getElementById('payment-modal');
        const form = document.getElementById('payment-form');
        
        const sale = this.creditSales.find(s => s.id === saleId);
        const customer = sale.clientes;
        
        document.getElementById('debt-info').innerHTML = `
            <h4>Deuda de ${customer?.nombre}</h4>
            <p><strong>Total:</strong> $${sale.total.toFixed(2)}</p>
            <p><strong>Saldo pendiente:</strong> $${sale.saldo_pendiente.toFixed(2)}</p>
            <p><strong>Fecha límite:</strong> ${new Date(sale.fecha_limite).toLocaleDateString()}</p>
        `;
        
        document.getElementById('payment-amount').max = sale.saldo_pendiente;
        document.getElementById('payment-date').value = new Date().toISOString().split('T')[0];
        
        form.reset();
        modal.style.display = 'block';
    }

    closePaymentModal() {
        document.getElementById('payment-modal').style.display = 'none';
        this.currentCreditSale = null;
    }

    async handlePaymentSubmit(e) {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('payment-amount').value);
        const date = document.getElementById('payment-date').value;
        const notes = document.getElementById('payment-notes').value;

        const paymentData = {
            venta_id: this.currentCreditSale,
            monto: amount,
            fecha_abono: date,
            notas: notes
        };
        console.log('Payment data que se envía:', paymentData);

        await this.savePayment(paymentData);
        this.closePaymentModal();
    }

    // Notification System
    showNotification(message, type = 'success', callback = null) {
        return new Promise((resolve) => {
            const overlay = document.getElementById('notification-overlay');
            const icon = document.getElementById('notification-icon');
            const messageEl = document.getElementById('notification-message');
            const buttonsEl = document.getElementById('notification-buttons');

            // Set icon based on type
            let iconClass = '';
            switch (type) {
                case 'success':
                    iconClass = 'fas fa-check';
                    break;
                case 'error':
                    iconClass = 'fas fa-times';
                    break;
                case 'warning':
                    iconClass = 'fas fa-exclamation-triangle';
                    break;
                case 'confirm':
                    iconClass = 'fas fa-question';
                    break;
            }

            icon.className = `notification-icon ${type}`;
            icon.innerHTML = `<i class="${iconClass}"></i>`;
            messageEl.textContent = message;

            // Add OK button
            buttonsEl.innerHTML = `
                <button class="notification-btn primary" onclick="app.closeNotification(); ${callback ? callback + '()' : ''}">
                    OK
                </button>
            `;

            overlay.classList.add('show');

            // Auto close after 3 seconds for success/error
            if (type === 'success' || type === 'error') {
                setTimeout(() => {
                    this.closeNotification();
                    resolve(true);
                }, 3000);
            } else {
                resolve(true);
            }
        });
    }

    showConfirmation(message) {
        return new Promise((resolve) => {
            const overlay = document.getElementById('notification-overlay');
            const icon = document.getElementById('notification-icon');
            const messageEl = document.getElementById('notification-message');
            const buttonsEl = document.getElementById('notification-buttons');

            icon.className = 'notification-icon confirm';
            icon.innerHTML = '<i class="fas fa-question"></i>';
            messageEl.textContent = message;

            buttonsEl.innerHTML = `
                <button class="notification-btn secondary" onclick="app.closeNotification(); app.resolveConfirmation(false)">
                    Cancelar
                </button>
                <button class="notification-btn primary" onclick="app.closeNotification(); app.resolveConfirmation(true)">
                    Confirmar
                </button>
            `;

            this.confirmationResolver = resolve;
            overlay.classList.add('show');
        });
    }

    resolveConfirmation(result) {
        if (this.confirmationResolver) {
            this.confirmationResolver(result);
            this.confirmationResolver = null;
        }
    }

    closeNotification() {
        document.getElementById('notification-overlay').classList.remove('show');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MariSportApp();
});
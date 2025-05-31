class FitVibesApp {
    constructor() {
        // Initialize Supabase
        this.supabase = supabase.createClient(
            'https://ktbkqqiqeogwfnxjnpxw.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0YmtxcWlxZW9nd2ZueGpucHh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NDYyNTEsImV4cCI6MjA2NDIyMjI1MX0.z84-xZz2H-VwpeqjITrjLDnEg35Slv485H534Ur7qbo'
        );
        
        // Initialize managers
        this.db = new DatabaseManager(this.supabase);
        this.pos = new POSManager(this);
        
        this.products = [];
        this.sales = [];
        this.customers = [];
        this.creditSales = [];
        this.payments = [];
        this.currentSection = 'pos';
        this.currentCreditSection = 'customers';
        this.editingProduct = null;
        this.editingCustomer = null;
        this.selectedCreditSale = null;

        this.initializeApp();
        this.setupEventListeners();
    }

    async initializeApp() {
        try {
            this.products = await this.db.loadProducts();
            this.customers = await this.db.loadCustomers();
            this.creditSales = await this.db.loadCreditSales();
            this.payments = await this.db.loadPayments();
            
            this.pos.renderProducts();
            this.renderCatalog();
            this.renderInventory();
            this.renderStats();
            this.renderCustomers();
            this.renderCreditSales();
            this.renderPayments();
            this.renderTracking();
        } catch (error) {
            console.error('Error initializing app:', error);
            alert('Error al cargar los datos. Revisa tu conexión.');
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });

        // Credit Navigation
        document.querySelectorAll('.credit-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.creditSection;
                this.switchCreditSection(section);
            });
        });

        // POS Events
        document.getElementById('complete-sale').addEventListener('click', () => {
            this.pos.completeSale();
        });

        // Inventory Events
        document.getElementById('add-product-btn').addEventListener('click', () => {
            this.openProductModal();
        });

        // Modal Events
        document.querySelector('.close').addEventListener('click', () => {
            this.closeProductModal();
        });

        document.getElementById('cancel-product').addEventListener('click', () => {
            this.closeProductModal();
        });

        document.getElementById('product-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });

        // Filter Events
        document.getElementById('category-filter').addEventListener('change', () => {
            this.renderCatalog();
        });

        document.getElementById('size-filter').addEventListener('change', () => {
            this.renderCatalog();
        });

        // Stats Events
        document.getElementById('stats-period').addEventListener('change', () => {
            this.renderStats();
        });

        // Credit Events
        document.getElementById('add-customer-btn').addEventListener('click', () => {
            this.openCustomerModal();
        });

        document.getElementById('new-credit-sale-btn').addEventListener('click', () => {
            this.openCreditSaleModal();
        });

        document.getElementById('customer-search').addEventListener('input', (e) => {
            this.searchCustomers(e.target.value);
        });

        // Customer Modal Events
        document.getElementById('close-customer-modal').addEventListener('click', () => {
            this.closeCustomerModal();
        });

        document.getElementById('cancel-customer').addEventListener('click', () => {
            this.closeCustomerModal();
        });

        document.getElementById('customer-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCustomer();
        });

        // Credit Sale Modal Events
        document.getElementById('close-credit-sale-modal').addEventListener('click', () => {
            this.closeCreditSaleModal();
        });

        document.getElementById('cancel-credit-sale').addEventListener('click', () => {
            this.closeCreditSaleModal();
        });

        document.getElementById('credit-sale-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCreditSale();
        });

        // Payment Modal Events
        document.getElementById('close-payment-modal').addEventListener('click', () => {
            this.closePaymentModal();
        });

        document.getElementById('cancel-payment').addEventListener('click', () => {
            this.closePaymentModal();
        });

        document.getElementById('payment-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePayment();
        });

        // Modal click outside to close
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('product-modal');
            const customerModal = document.getElementById('customer-modal');
            const creditSaleModal = document.getElementById('credit-sale-modal');
            const paymentModal = document.getElementById('payment-modal');
            
            if (e.target === modal) {
                this.closeProductModal();
            } else if (e.target === customerModal) {
                this.closeCustomerModal();
            } else if (e.target === creditSaleModal) {
                this.closeCreditSaleModal();
            } else if (e.target === paymentModal) {
                this.closePaymentModal();
            }
        });

        // Image preview for product form
        document.getElementById('product-image-file').addEventListener('change', (e) => {
            this.previewImage(e.target.files[0]);
        });
    }

    previewImage(file) {
        const preview = document.getElementById('image-preview');
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" style="max-width: 200px; max-height: 200px; border-radius: 8px;">`;
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
        }
    }

    switchSection(sectionName) {
        // Update nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');

        this.currentSection = sectionName;

        // Refresh content based on section
        if (sectionName === 'catalog') {
            this.renderCatalog();
        } else if (sectionName === 'inventory') {
            this.renderInventory();
        } else if (sectionName === 'stats') {
            this.renderStats();
        } else if (sectionName === 'credit') {
            this.renderCustomers();
            this.renderCreditSales();
            this.renderPayments();
            this.renderTracking();
        }
    }

    switchCreditSection(sectionName) {
        // Update credit tabs
        document.querySelectorAll('.credit-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-credit-section="${sectionName}"]`).classList.add('active');

        // Update credit subsections
        document.querySelectorAll('.credit-subsection').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');

        this.currentCreditSection = sectionName;

        // Refresh content based on subsection
        if (sectionName === 'customers') {
            this.renderCustomers();
        } else if (sectionName === 'credit-sales') {
            this.renderCreditSales();
        } else if (sectionName === 'payments') {
            this.renderPayments();
        } else if (sectionName === 'tracking') {
            this.renderTracking();
        }
    }

    renderPOSProducts() {
        const container = document.getElementById('pos-products');
        container.innerHTML = '';

        this.products.forEach(product => {
            if (product.stock > 0) {
                const productCard = document.createElement('div');
                productCard.className = 'pos-product-card';
                productCard.innerHTML = `
                    <img src="${product.imagen_url || 'https://via.placeholder.com/100x100?text=Imagen'}" alt="${product.nombre}">
                    <div class="name">${product.nombre}</div>
                    <div class="price">$${product.precio}</div>
                `;
                productCard.addEventListener('click', () => {
                    this.pos.addToCart(product);
                });
                container.appendChild(productCard);
            }
        });
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

        container.innerHTML = '';

        filteredProducts.forEach(product => {
            const card = document.createElement('div');
            card.className = 'catalog-card';
            card.innerHTML = `
                <img src="${product.imagen_url || 'https://via.placeholder.com/200x200?text=Imagen'}" alt="${product.nombre}">
                <div class="catalog-card-content">
                    <div class="catalog-card-name">${product.nombre}</div>
                    <div class="catalog-card-price">$${product.precio}</div>
                    <div class="catalog-card-stock">Stock: ${product.stock} unidades</div>
                    <div style="margin-top: 0.5rem;">
                        <small><strong>Tallas:</strong> ${product.talla || 'No especificado'}</small><br>
                        <small><strong>Colores:</strong> ${product.color || 'No especificado'}</small>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    getCategoryName(category) {
        const names = {
            'tops': 'Tops',
            'bottoms': 'Bottoms',
            'conjuntos': 'Conjuntos',
            'accesorios': 'Accesorios'
        };
        return names[category] || category;
    }

    async openProductModal(product = null) {
        this.editingProduct = product;
        const modal = document.getElementById('product-modal');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('product-form');

        if (product) {
            title.textContent = 'Editar Producto';
            document.getElementById('product-name').value = product.nombre;
            document.getElementById('product-category').value = product.categoria;
            document.getElementById('product-price').value = product.precio;
            document.getElementById('product-image').value = product.imagen_url || '';
            document.getElementById('product-colors').value = product.color || '';
            document.getElementById('product-stock').value = product.stock;

            // Set size checkboxes
            document.querySelectorAll('.size-checkboxes input').forEach(checkbox => {
                checkbox.checked = product.talla && product.talla.includes(checkbox.value);
            });
        } else {
            title.textContent = 'Agregar Producto';
            form.reset();
            document.getElementById('image-preview').innerHTML = '';
        }

        modal.style.display = 'block';
    }

    closeProductModal() {
        document.getElementById('product-modal').style.display = 'none';
        this.editingProduct = null;
    }

    async uploadProductImage(file) {
        if (!file) return null;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            
            const { data, error } = await this.supabase.storage
                .from('ropa-deportiva')
                .upload(fileName, file);

            if (error) throw error;

            const { data: { publicUrl } } = this.supabase.storage
                .from('ropa-deportiva')
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }

    async saveProduct() {
        const form = document.getElementById('product-form');

        const selectedSizes = [];
        document.querySelectorAll('.size-checkboxes input:checked').forEach(checkbox => {
            selectedSizes.push(checkbox.value);
        });

        const colors = document.getElementById('product-colors').value;

        let imageUrl = document.getElementById('product-image').value;
        const imageFile = document.getElementById('product-image-file').files[0];

        try {
            // Upload image if file is selected
            if (imageFile) {
                imageUrl = await this.uploadProductImage(imageFile);
            }

            const productData = {
                nombre: document.getElementById('product-name').value,
                categoria: document.getElementById('product-category').value,
                precio: parseFloat(document.getElementById('product-price').value),
                imagen_url: imageUrl,
                talla: selectedSizes.join(', '),
                color: colors,
                stock: parseInt(document.getElementById('product-stock').value)
            };

            if (this.editingProduct) {
                // Update existing product
                const { error } = await this.supabase
                    .from('productos')
                    .update(productData)
                    .eq('id', this.editingProduct.id);

                if (error) throw error;

                const index = this.products.findIndex(p => p.id === this.editingProduct.id);
                this.products[index] = { ...this.editingProduct, ...productData };
            } else {
                // Add new product
                const { data, error } = await this.supabase
                    .from('productos')
                    .insert([productData])
                    .select()
                    .single();

                if (error) throw error;

                this.products.push(data);
            }

            this.renderInventory();
            this.renderPOSProducts();
            this.renderCatalog();
            this.closeProductModal();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Error al guardar el producto.');
        }
    }

    editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            this.openProductModal(product);
        }
    }

    async deleteProduct(productId) {
        if (confirm('¿Estás segura de que quieres eliminar este producto?')) {
            try {
                const { error } = await this.supabase
                    .from('productos')
                    .delete()
                    .eq('id', productId);

                if (error) throw error;

                this.products = this.products.filter(p => p.id !== productId);
                this.renderInventory();
                this.renderPOSProducts();
                this.renderCatalog();
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('Error al eliminar el producto.');
            }
        }
    }

    renderInventory() {
        const tbody = document.querySelector('#inventory-table tbody');
        tbody.innerHTML = '';

        this.products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><img src="${product.imagen_url || 'https://via.placeholder.com/50x50?text=Img'}" alt="${product.nombre}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;"></td>
                <td>${product.nombre}</td>
                <td>${this.getCategoryName(product.categoria)}</td>
                <td>$${product.precio}</td>
                <td>${product.stock}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="app.editProduct('${product.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="action-btn delete-btn" onclick="app.deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderStats() {
        const period = document.getElementById('stats-period').value;
        const stats = this.calculateStats(period);

        document.getElementById('total-sales').textContent = `$${stats.totalSales.toFixed(2)}`;
        document.getElementById('total-orders').textContent = stats.totalOrders;
        document.getElementById('avg-sale').textContent = `$${stats.avgSale.toFixed(2)}`;

        this.renderBestSellers(stats.bestSellers);
    }

    calculateStats(period) {
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

        const filteredSales = this.sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= startDate;
        });

        const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
        const totalOrders = filteredSales.length;
        const avgSale = totalOrders > 0 ? totalSales / totalOrders : 0;

        // Calculate best sellers
        const productSales = {};
        filteredSales.forEach(sale => {
            sale.items.forEach(item => {
                if (!productSales[item.id]) {
                    productSales[item.id] = {
                        product: this.products.find(p => p.id === item.id),
                        quantity: 0,
                        revenue: 0
                    };
                }
                productSales[item.id].quantity += item.quantity;
                productSales[item.id].revenue += item.quantity * item.price;
            });
        });

        const bestSellers = Object.values(productSales)
            .filter(item => item.product)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        return {
            totalSales,
            totalOrders,
            avgSale,
            bestSellers
        };
    }

    renderBestSellers(bestSellers) {
        const container = document.getElementById('best-sellers-list');
        
        if (bestSellers.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #6c757d;">No hay datos de ventas para mostrar</div>';
            return;
        }

        container.innerHTML = '';

        bestSellers.forEach(item => {
            const sellerItem = document.createElement('div');
            sellerItem.className = 'best-seller-item';
            sellerItem.innerHTML = `
                <img src="${item.product.imagen_url || 'https://via.placeholder.com/50x50?text=Img'}" alt="${item.product.nombre}" onerror="this.src='https://via.placeholder.com/50x50?text=Img'">
                <div class="best-seller-info">
                    <div class="best-seller-name">${item.product.nombre}</div>
                    <div class="best-seller-sales">${item.quantity} vendidos - $${item.revenue.toFixed(2)}</div>
                </div>
            `;
            container.appendChild(sellerItem);
        });
    }

    async openCustomerModal(customer = null) {
        this.editingCustomer = customer;
        const modal = document.getElementById('customer-modal');
        const title = document.getElementById('customer-modal-title');
        const form = document.getElementById('customer-form');

        if (customer) {
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
        this.editingCustomer = null;
    }

    async saveCustomer() {
        const customerData = {
            nombre: document.getElementById('customer-name').value,
            telefono: document.getElementById('customer-phone').value,
            direccion: document.getElementById('customer-address').value
        };

        try {
            if (this.editingCustomer) {
                const { error } = await this.supabase
                    .from('clientes')
                    .update(customerData)
                    .eq('id', this.editingCustomer.id);

                if (error) throw error;

                const index = this.customers.findIndex(c => c.id === this.editingCustomer.id);
                this.customers[index] = { ...this.editingCustomer, ...customerData };
            } else {
                const { data, error } = await this.supabase
                    .from('clientes')
                    .insert([customerData])
                    .select()
                    .single();

                if (error) throw error;

                this.customers.push(data);
            }

            this.renderCustomers();
            this.closeCustomerModal();
        } catch (error) {
            console.error('Error saving customer:', error);
            alert('Error al guardar el cliente.');
        }
    }

    editCustomer(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (customer) {
            this.openCustomerModal(customer);
        }
    }

    async deleteCustomer(customerId) {
        if (confirm('¿Estás segura de que quieres eliminar este cliente?')) {
            try {
                const { error } = await this.supabase
                    .from('clientes')
                    .delete()
                    .eq('id', customerId);

                if (error) throw error;

                this.customers = this.customers.filter(c => c.id !== customerId);
                this.renderCustomers();
            } catch (error) {
                console.error('Error deleting customer:', error);
                alert('Error al eliminar el cliente.');
            }
        }
    }

    renderCustomers() {
        const container = document.getElementById('customers-grid');
        container.innerHTML = '';

        this.customers.forEach(customer => {
            const customerDebt = this.getCustomerDebt(customer.id);
            const card = document.createElement('div');
            card.className = 'customer-card';
            
            card.innerHTML = `
                <div class="customer-name">${customer.nombre}</div>
                <div class="customer-phone"><i class="fas fa-phone"></i> ${customer.telefono}</div>
                <div class="customer-address"><i class="fas fa-map-marker-alt"></i> ${customer.direccion || 'Sin dirección'}</div>
                <div class="customer-debt ${customerDebt > 0 ? '' : 'no-debt'}">
                    ${customerDebt > 0 ? `Debe: $${customerDebt.toFixed(2)}` : 'Sin deudas'}
                </div>
                <div class="customer-actions">
                    <button class="action-btn edit-btn" onclick="app.editCustomer('${customer.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="action-btn delete-btn" onclick="app.deleteCustomer('${customer.id}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                    ${customerDebt > 0 ? `<button class="action-btn" style="background: #28a745; color: white;" onclick="app.openPaymentModal('${customer.id}')">
                        <i class="fas fa-dollar-sign"></i> Pagar
                    </button>` : ''}
                </div>
            `;
            container.appendChild(card);
        });
    }

    searchCustomers(query) {
        const container = document.getElementById('customers-grid');
        container.innerHTML = '';

        const filteredCustomers = this.customers.filter(customer => 
            customer.nombre.toLowerCase().includes(query.toLowerCase()) ||
            customer.telefono.includes(query)
        );

        filteredCustomers.forEach(customer => {
            const customerDebt = this.getCustomerDebt(customer.id);
            const card = document.createElement('div');
            card.className = 'customer-card';
            
            card.innerHTML = `
                <div class="customer-name">${customer.nombre}</div>
                <div class="customer-phone"><i class="fas fa-phone"></i> ${customer.telefono}</div>
                <div class="customer-address"><i class="fas fa-map-marker-alt"></i> ${customer.direccion || 'Sin dirección'}</div>
                <div class="customer-debt ${customerDebt > 0 ? '' : 'no-debt'}">
                    ${customerDebt > 0 ? `Debe: $${customerDebt.toFixed(2)}` : 'Sin deudas'}
                </div>
                <div class="customer-actions">
                    <button class="action-btn edit-btn" onclick="app.editCustomer('${customer.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="action-btn delete-btn" onclick="app.deleteCustomer('${customer.id}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                    ${customerDebt > 0 ? `<button class="action-btn" style="background: #28a745; color: white;" onclick="app.openPaymentModal('${customer.id}')">
                        <i class="fas fa-dollar-sign"></i> Pagar
                    </button>` : ''}
                </div>
            `;
            container.appendChild(card);
        });
    }

    getCustomerDebt(customerId) {
        const customerCreditSales = this.creditSales.filter(sale => 
            sale.cliente_id === customerId && sale.estado === 'pendiente'
        );
        
        let totalDebt = 0;
        customerCreditSales.forEach(sale => {
            totalDebt += sale.saldo_pendiente;
        });
        
        return totalDebt;
    }

    async openCreditSaleModal() {
        const modal = document.getElementById('credit-sale-modal');
        const customerSelect = document.getElementById('credit-customer');
        
        // Populate customer select
        customerSelect.innerHTML = '<option value="">Seleccionar cliente...</option>';
        this.customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.nombre;
            customerSelect.appendChild(option);
        });

        // Populate products
        this.renderCreditProductsSelector();
        
        // Set default first payment date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('first-payment-date').value = tomorrow.toISOString().split('T')[0];

        this.pos.creditCart = [];
        this.pos.updateCreditTotal();
        
        modal.style.display = 'block';
    }

    renderCreditProductsSelector() {
        const container = document.getElementById('credit-products-selector');
        container.innerHTML = '';

        this.products.forEach(product => {
            if (product.stock > 0) {
                const productCard = document.createElement('div');
                productCard.className = 'credit-product-card';
                productCard.innerHTML = `
                    <img src="${product.imagen_url || 'https://via.placeholder.com/100x100?text=Imagen'}" alt="${product.nombre}" style="width: 100%; height: 60px; object-fit: cover; border-radius: 5px; margin-bottom: 0.5rem;" onerror="this.src='https://via.placeholder.com/100x100?text=Imagen'">
                    <div style="font-size: 0.8rem; font-weight: bold;">${product.nombre}</div>
                    <div style="color: #28a745; font-weight: bold;">$${product.precio}</div>
                `;
                productCard.addEventListener('click', () => {
                    this.pos.toggleCreditProduct(product, productCard);
                });
                container.appendChild(productCard);
            }
        });
    }

    async saveCreditSale() {
        if (this.pos.creditCart.length === 0) {
            alert('Selecciona al menos un producto');
            return;
        }

        const customerId = document.getElementById('credit-customer').value;
        const total = parseFloat(document.getElementById('credit-total').value);
        const initialPayment = parseFloat(document.getElementById('initial-payment').value) || 0;
        const firstPaymentDate = document.getElementById('first-payment-date').value;
        const termType = document.getElementById('payment-term-type').value;
        const termValue = parseInt(document.getElementById('payment-term-value').value);

        let dueDate = new Date(firstPaymentDate);
        if (termType === 'days') {
            dueDate.setDate(dueDate.getDate() + termValue);
        } else {
            dueDate.setMonth(dueDate.getMonth() + termValue);
        }

        try {
            const creditSaleData = {
                cliente_id: customerId,
                productos: JSON.stringify(this.pos.creditCart),
                total: total,
                abono_inicial: initialPayment,
                saldo_pendiente: total - initialPayment,
                fecha_inicio: new Date().toISOString().split('T')[0],
                fecha_limite: dueDate.toISOString().split('T')[0],
                estado: 'pendiente'
            };

            const { data, error } = await this.supabase
                .from('ventas_fiadas')
                .insert([creditSaleData])
                .select()
                .single();

            if (error) throw error;

            // Update stock
            for (const cartItem of this.pos.creditCart) {
                const product = this.products.find(p => p.id === cartItem.id);
                if (product) {
                    const newStock = product.stock - cartItem.quantity;
                    await this.supabase
                        .from('productos')
                        .update({ stock: newStock })
                        .eq('id', product.id);
                    
                    product.stock = newStock;
                }
            }

            this.creditSales.push(data);
            this.closeCreditSaleModal();
            this.renderCreditSales();
            this.renderTracking();

            alert('¡Venta a crédito registrada exitosamente!');
        } catch (error) {
            console.error('Error saving credit sale:', error);
            alert('Error al guardar la venta a crédito.');
        }
    }

    markAsPaid(saleId) {
        if (confirm('¿Marcar esta deuda como completamente pagada?')) {
            this.pos.markAsPaid(saleId);
        }
    }

    renderCreditSales() {
        const container = document.getElementById('credit-sales-list');
        container.innerHTML = '';

        this.creditSales.forEach(sale => {
            const customer = this.customers.find(c => c.id === sale.cliente_id);
            const progressPercent = ((sale.total - sale.saldo_pendiente) / sale.total) * 100;

            const isOverdue = new Date(sale.fecha_limite) < new Date() && sale.estado === 'pendiente';
            const statusClass = sale.estado === 'pagada' ? 'status-paid' : 
                               isOverdue ? 'status-overdue' : 'status-active';

            const card = document.createElement('div');
            card.className = 'credit-sale-card';
            
            card.innerHTML = `
                <div class="credit-sale-header">
                    <div>
                        <div class="credit-sale-customer">${customer ? customer.nombre : 'Cliente eliminado'}</div>
                        <div class="credit-sale-date">Fecha: ${new Date(sale.fecha_inicio).toLocaleDateString()}</div>
                        <div class="credit-sale-date">Vence: ${new Date(sale.fecha_limite).toLocaleDateString()}</div>
                    </div>
                    <div class="credit-sale-status ${statusClass}">
                        ${sale.estado === 'pagada' ? 'Pagado' : isOverdue ? 'Vencido' : 'Activo'}
                    </div>
                </div>
                
                <div class="credit-sale-details">
                    <div class="debt-amounts">
                        <span class="amount-total">Total: $${sale.total.toFixed(2)}</span>
                        <span class="amount-paid">Pagado: $${(sale.total - sale.saldo_pendiente).toFixed(2)}</span>
                        <span class="amount-pending">Pendiente: $${sale.saldo_pendiente.toFixed(2)}</span>
                    </div>
                    
                    <div class="debt-progress">
                        <div class="debt-progress-bar" style="width: ${progressPercent}%"></div>
                    </div>
                </div>

                ${sale.estado === 'pendiente' ? `
                    <div class="customer-actions">
                        <button class="action-btn" style="background: #28a745; color: white;" onclick="app.openPaymentModal('${sale.cliente_id}', '${sale.id}')">
                            <i class="fas fa-dollar-sign"></i> Registrar Pago
                        </button>
                        <button class="action-btn" style="background: #17a2b8; color: white;" onclick="app.markAsPaid('${sale.id}')">
                            <i class="fas fa-check"></i> Marcar como Pagado
                        </button>
                    </div>
                ` : ''}
            `;
            container.appendChild(card);
        });
    }

    openPaymentModal(customerId, saleId = null) {
        const modal = document.getElementById('payment-modal');
        const customer = this.customers.find(c => c.id === customerId);
        
        let targetSale = null;
        if (saleId) {
            targetSale = this.creditSales.find(s => s.id === saleId);
        } else {
            // Find the first active debt for this customer
            targetSale = this.creditSales.find(s => s.cliente_id === customerId && s.estado === 'pendiente');
        }

        if (!targetSale) {
            alert('No se encontró deuda activa para este cliente');
            return;
        }

        this.selectedCreditSale = targetSale;

        const payments = this.getPaymentsByDebtId(targetSale.id);
        const totalPaid = targetSale.abono_inicial + payments.reduce((sum, p) => sum + p.monto, 0);
        const remaining = targetSale.total - totalPaid;

        const debtInfo = document.getElementById('debt-info');
        debtInfo.innerHTML = `
            <h4>${customer.nombre}</h4>
            <p><strong>Total de la deuda:</strong> $${targetSale.total.toFixed(2)}</p>
            <p><strong>Pagado hasta ahora:</strong> $${totalPaid.toFixed(2)}</p>
            <p><strong>Pendiente por pagar:</strong> $${remaining.toFixed(2)}</p>
            <p><strong>Fecha límite:</strong> ${new Date(targetSale.fecha_limite).toLocaleDateString()}</p>
        `;

        // Set today's date as default
        document.getElementById('payment-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('payment-amount').value = '';
        document.getElementById('payment-notes').value = '';

        modal.style.display = 'block';
    }

    closePaymentModal() {
        document.getElementById('payment-modal').style.display = 'none';
        this.selectedCreditSale = null;
    }

    async savePayment() {
        if (!this.selectedCreditSale) return;

        const amount = parseFloat(document.getElementById('payment-amount').value);
        const date = document.getElementById('payment-date').value;

        if (amount > this.selectedCreditSale.saldo_pendiente) {
            alert('El monto excede la deuda pendiente');
            return;
        }

        try {
            const paymentData = {
                venta_id: this.selectedCreditSale.id,
                monto: amount,
                fecha_abono: date
            };

            const { error: paymentError } = await this.supabase
                .from('abonos')
                .insert([paymentData]);

            if (paymentError) throw paymentError;

            // Update credit sale balance
            const newBalance = this.selectedCreditSale.saldo_pendiente - amount;
            const newStatus = newBalance <= 0 ? 'pagada' : 'pendiente';

            const { error: updateError } = await this.supabase
                .from('ventas_fiadas')
                .update({ 
                    saldo_pendiente: newBalance,
                    estado: newStatus
                })
                .eq('id', this.selectedCreditSale.id);

            if (updateError) throw updateError;

            // Update local data
            this.selectedCreditSale.saldo_pendiente = newBalance;
            this.selectedCreditSale.estado = newStatus;

            await this.db.loadPayments();

            this.closePaymentModal();
            this.renderPayments();
            this.renderCreditSales();
            this.renderTracking();

            alert('¡Pago registrado exitosamente!');
        } catch (error) {
            console.error('Error saving payment:', error);
            alert('Error al registrar el pago.');
        }
    }

    getPaymentsByDebtId(creditSaleId) {
        return this.payments.filter(payment => payment.venta_id === creditSaleId);
    }

    renderPayments() {
        const container = document.getElementById('pending-debts');
        container.innerHTML = '';

        const activeDebts = this.creditSales.filter(sale => sale.estado === 'pendiente');

        if (activeDebts.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #6c757d; padding: 2rem;">No hay deudas activas</div>';
            return;
        }

        activeDebts.forEach(sale => {
            const customer = this.customers.find(c => c.id === sale.cliente_id);
            const payments = this.getPaymentsByDebtId(sale.id);

            const isOverdue = new Date(sale.fecha_limite) < new Date();
            const daysDiff = Math.ceil((new Date(sale.fecha_limite) - new Date()) / (1000 * 60 * 60 * 24));
            const isDueSoon = daysDiff <= 3 && daysDiff > 0;

            const card = document.createElement('div');
            card.className = `debt-card ${isOverdue ? 'overdue' : isDueSoon ? 'due-soon' : ''}`;
            
            card.innerHTML = `
                <div class="debt-header">
                    <div class="debt-customer">${customer ? customer.nombre : 'Cliente eliminado'}</div>
                    <div class="debt-status ${isOverdue ? 'status-overdue' : isDueSoon ? 'status-active' : ''}">
                        ${isOverdue ? 'Vencido' : isDueSoon ? 'Vence pronto' : 'Al día'}
                    </div>
                </div>
                
                <div class="debt-amounts">
                    <span class="amount-total">Total: $${sale.total.toFixed(2)}</span>
                    <span class="amount-paid">Pagado: $${(sale.total - sale.saldo_pendiente).toFixed(2)}</span>
                    <span class="amount-pending">Pendiente: $${sale.saldo_pendiente.toFixed(2)}</span>
                </div>
                
                <div style="margin: 0.5rem 0; font-size: 0.9rem;">
                    <strong>Fecha límite:</strong> ${new Date(sale.fecha_limite).toLocaleDateString()}
                    ${isOverdue ? `<span style="color: #dc3545;"> (${Math.abs(daysDiff)} días vencido)</span>` : 
                      isDueSoon ? `<span style="color: #ffc107;"> (${daysDiff} días restantes)</span>` : ''}
                </div>

                <div class="customer-actions">
                    <button class="action-btn" style="background: #28a745; color: white;" onclick="app.openPaymentModal('${sale.cliente_id}', '${sale.id}')">
                        <i class="fas fa-dollar-sign"></i> Registrar Pago
                    </button>
                </div>

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
            `;
            container.appendChild(card);
        });
    }

    renderActiveDebts() {
        const container = document.getElementById('active-debts');
        container.innerHTML = '';

        const activeDebts = this.creditSales.filter(sale => sale.estado === 'pendiente');

        if (activeDebts.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #6c757d; padding: 2rem;">No hay deudas activas</div>';
            return;
        }

        // Sort by due date
        activeDebts.sort((a, b) => new Date(a.fecha_limite) - new Date(b.fecha_limite));

        activeDebts.forEach(sale => {
            const customer = this.customers.find(c => c.id === sale.cliente_id);

            const isOverdue = new Date(sale.fecha_limite) < new Date();
            const daysDiff = Math.ceil((new Date(sale.fecha_limite) - new Date()) / (1000 * 60 * 60 * 24));
            const isDueSoon = daysDiff <= 3 && daysDiff > 0;

            const card = document.createElement('div');
            card.className = `debt-card ${isOverdue ? 'overdue' : isDueSoon ? 'due-soon' : ''}`;
            
            card.innerHTML = `
                <div class="debt-header">
                    <div class="debt-customer">${customer ? customer.nombre : 'Cliente eliminado'}</div>
                    <div class="debt-status ${isOverdue ? 'status-overdue' : isDueSoon ? 'status-active' : ''}">
                        ${isOverdue ? 'Vencido' : isDueSoon ? 'Vence pronto' : 'Al día'}
                    </div>
                </div>
                
                <div class="debt-amounts">
                    <span class="amount-pending" style="font-size: 1.2rem;">Debe: $${sale.saldo_pendiente.toFixed(2)}</span>
                </div>
                
                <div style="margin: 0.5rem 0; font-size: 0.9rem;">
                    <strong>Fecha límite:</strong> ${new Date(sale.fecha_limite).toLocaleDateString()}
                    ${isOverdue ? `<span style="color: #dc3545;"> (${Math.abs(daysDiff)} días vencido)</span>` : 
                      isDueSoon ? `<span style="color: #ffc107;"> (${daysDiff} días restantes)</span>` : ''}
                </div>

                <div class="customer-actions">
                    <button class="action-btn" style="background: #28a745; color: white;" onclick="app.openPaymentModal('${sale.cliente_id}', '${sale.id}')">
                        <i class="fas fa-dollar-sign"></i> Registrar Pago
                    </button>
                    <button class="action-btn" style="background: #17a2b8; color: white;" onclick="app.markAsPaid('${sale.id}')">
                        <i class="fas fa-check"></i> Marcar como Pagado
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    updateTrackingSummary() {
        const totalCredit = this.creditSales.reduce((sum, sale) => sum + sale.total, 0);
        const totalPending = this.creditSales.reduce((sum, sale) => sum + sale.saldo_pendiente, 0);
        const totalCollected = totalCredit - totalPending;

        document.getElementById('total-credit').textContent = `$${totalCredit.toFixed(2)}`;
        document.getElementById('total-collected').textContent = `$${totalCollected.toFixed(2)}`;
        document.getElementById('total-pending').textContent = `$${totalPending.toFixed(2)}`;
    }

    renderTracking() {
        this.updateTrackingSummary();
        this.renderActiveDebts();
    }
}

class DatabaseManager {
    constructor(supabase) {
        this.supabase = supabase;
    }

    async loadProducts() {
        try {
            const { data, error } = await this.supabase
                .from('productos')
                .select('*')
                .order('creado_en', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error loading products:', error);
            return [];
        }
    }

    async loadCustomers() {
        try {
            const { data, error } = await this.supabase
                .from('clientes')
                .select('*')
                .order('creado_en', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error loading customers:', error);
            return [];
        }
    }

    async loadCreditSales() {
        try {
            const { data, error } = await this.supabase
                .from('ventas_fiadas')
                .select('*')
                .order('creado_en', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error loading credit sales:', error);
            return [];
        }
    }

    async loadPayments() {
        try {
            const { data, error } = await this.supabase
                .from('abonos')
                .select('*')
                .order('creado_en', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error loading payments:', error);
            return [];
        }
    }
}

class POSManager {
    constructor(app) {
        this.app = app;
        this.cart = [];
        this.creditCart = [];
    }

    renderProducts() {
        this.app.renderPOSProducts();
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
                    <button class="qty-btn" onclick="app.pos.updateCartQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="app.pos.updateCartQuantity(${item.id}, 1)">+</button>
                    <button class="qty-btn" onclick="app.pos.removeFromCart(${item.id})" style="background: #dc3545; margin-left: 0.5rem;">×</button>
                </div>
            `;
            container.appendChild(cartItem);
        });

        totalElement.textContent = total.toFixed(2);
        completeBtn.disabled = false;
    }

    updateCartQuantity(productId, change) {
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
            this.app.renderPOSProducts();

            alert('¡Venta completada exitosamente!');
        } catch (error) {
            console.error('Error completing sale:', error);
            alert('Error al completar la venta.');
        }
    }

    toggleCreditProduct(product, cardElement) {
        const existingItem = this.creditCart.find(item => item.id === product.id);
        
        if (existingItem) {
            this.creditCart = this.creditCart.filter(item => item.id !== product.id);
            cardElement.classList.remove('selected');
        } else {
            this.creditCart.push({
                ...product,
                quantity: 1
            });
            cardElement.classList.add('selected');
        }
        
        this.renderSelectedCreditProducts();
        this.updateCreditTotal();
    }

    renderSelectedCreditProducts() {
        const container = document.getElementById('selected-credit-products');
        
        if (this.creditCart.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #6c757d;">No hay productos seleccionados</div>';
            return;
        }

        container.innerHTML = '';
        this.creditCart.forEach(item => {
            const productItem = document.createElement('div');
            productItem.className = 'selected-product-item';
            productItem.innerHTML = `
                <div>
                    <strong>${item.nombre}</strong><br>
                    <small>$${item.precio} x ${item.quantity} = $${(item.precio * item.quantity).toFixed(2)}</small>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <button class="qty-btn" onclick="app.pos.updateCreditQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="app.pos.updateCreditQuantity(${item.id}, 1)">+</button>
                </div>
            `;
            container.appendChild(productItem);
        });
    }

    updateCreditQuantity(productId, change) {
        const item = this.creditCart.find(item => item.id === productId);
        const product = this.app.products.find(p => p.id === productId);
        
        if (item) {
            const newQuantity = item.quantity + change;
            if (newQuantity <= 0) {
                this.creditCart = this.creditCart.filter(item => item.id !== productId);
                // Unselect the product card
                document.querySelectorAll('.credit-product-card').forEach(card => {
                    if (card.textContent.includes(product.nombre)) {
                        card.classList.remove('selected');
                    }
                });
            } else if (newQuantity <= product.stock) {
                item.quantity = newQuantity;
            }
            this.renderSelectedCreditProducts();
            this.updateCreditTotal();
        }
    }

    updateCreditTotal() {
        const total = this.creditCart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
        document.getElementById('credit-total').value = total.toFixed(2);
    }

    markAsPaid(saleId) {
        if (confirm('¿Marcar esta deuda como completamente pagada?')) {
            this.app.markAsPaid(saleId);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FitVibesApp();
});
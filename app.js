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
        this.sales = []; // Ventas del POS
        this.categories = [];
        this.purchases = []; // Compras de mercancía
        this.financialMovements = []; // Ingresos y Egresos
        this.currentPurchaseItems = [];
        this.currentCreditSaleItems = [];
        this.currentEditingProduct = null;
        this.currentEditingCustomer = null;
        this.currentCreditSale = null;
        this.currentReceivingPurchase = null; // Para la recepción de mercancía
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadCategories(); 
        await this.loadProducts();
        await this.loadCustomers();
        await this.loadCreditSales();
        await this.loadPayments();
        await this.loadSales();
        await this.loadPurchases(); 
        await this.loadFinancialMovements();
        
        this.renderPOSProducts();
        this.renderCatalog();
        this.renderInventory();
        this.renderCustomers();
        this.updateStats();
        this.updateTrackingSummary();
    }

    setupEventListeners() {
        // Navegación principal
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchSection(e.currentTarget.dataset.section));
        });

        // Pestañas de Crédito
        document.querySelectorAll('.credit-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchCreditSection(e.currentTarget.dataset.creditSection));
        });

        // Gestión de Categorías
        document.getElementById('manage-categories-btn').onclick = () => this.openCategoryModal();
        document.getElementById('close-category-modal').onclick = () => this.closeCategoryModal();
        document.getElementById('cancel-category').onclick = () => this.closeCategoryModal();
        document.getElementById('category-form').onsubmit = (e) => this.handleCategorySubmit(e);

        // POS
        document.getElementById('complete-sale').addEventListener('click', () => this.completeSale());

        // Modal de Producto
        document.getElementById('add-product-btn').addEventListener('click', () => this.openProductModal());
        document.getElementById('product-form').addEventListener('submit', (e) => this.handleProductSubmit(e));
        document.getElementById('cancel-product').addEventListener('click', () => this.closeProductModal());
        document.querySelector('#product-modal .close').addEventListener('click', () => this.closeProductModal());
        document.getElementById('product-image-file').addEventListener('change', (e) => this.handleImageUpload(e));
        document.getElementById('product-image').addEventListener('input', (e) => this.previewImageUrl(e.target.value));
        
        // Modal de Cliente
        document.getElementById('add-customer-btn').addEventListener('click', () => this.openCustomerModal());
        document.getElementById('customer-form').addEventListener('submit', (e) => this.handleCustomerSubmit(e));
        document.getElementById('cancel-customer').addEventListener('click', () => this.closeCustomerModal());
        document.getElementById('close-customer-modal').addEventListener('click', () => this.closeCustomerModal());
        document.getElementById('customer-search').addEventListener('input', (e) => this.searchCustomers(e.target.value));

        // Modal de Venta a Crédito
        document.getElementById('new-credit-sale-btn').addEventListener('click', () => this.openCreditSaleModal());
        document.getElementById('credit-sale-form').addEventListener('submit', (e) => this.handleCreditSaleSubmit(e));
        document.getElementById('cancel-credit-sale').addEventListener('click', () => this.closeCreditSaleModal());
        document.getElementById('close-credit-sale-modal').addEventListener('click', () => this.closeCreditSaleModal());
        const creditProductsSelector = document.getElementById('credit-products-selector');
        if (creditProductsSelector) {
            creditProductsSelector.addEventListener('change', (e) => {
                if (e.target.classList.contains('credit-product-quantity')) this.updateSelectedCreditProducts();
            });
            creditProductsSelector.addEventListener('click', (e) => {
                const card = e.target.closest('.credit-product-card');
                if (card) {
                    card.classList.toggle('selected');
                    this.updateSelectedCreditProducts();
                }
            });
        }
document.getElementById('view-all-purchases-btn')?.addEventListener('click', () => this.showPurchaseHistory());

// Cerrar el modal
document.getElementById('close-purchase-history-modal')?.addEventListener('click', () => {
  document.getElementById('purchase-history-modal').style.display = 'none';
});

// Cerrar el modal
document.getElementById('close-purchase-history-modal')?.addEventListener('click', () => {
  document.getElementById('purchase-history-modal').style.display = 'none';
});

        // Modal de Pagos (Abonos)
        document.getElementById('payment-form').addEventListener('submit', (e) => this.handlePaymentSubmit(e));
        document.getElementById('cancel-payment').addEventListener('click', () => this.closePaymentModal());
        document.getElementById('close-payment-modal').addEventListener('click', () => this.closePaymentModal());

        // Modal de Compras (Mercancía)
        const registerPurchaseBtn = document.getElementById('register-purchase-btn');
        if (registerPurchaseBtn) registerPurchaseBtn.addEventListener('click', () => this.openPurchaseModal());
        const purchaseForm = document.getElementById('purchase-form');
        if (purchaseForm) purchaseForm.addEventListener('submit', (e) => this.handlePurchaseSubmit(e));
        const cancelPurchaseBtn = document.getElementById('cancel-purchase');
        if (cancelPurchaseBtn) cancelPurchaseBtn.addEventListener('click', () => this.closePurchaseModal());
        const closePurchaseModalBtn = document.getElementById('close-purchase-modal');
        if (closePurchaseModalBtn) closePurchaseModalBtn.addEventListener('click', () => this.closePurchaseModal());
        
        // Gestión de Recepciones de Mercancía
        const manageReceptionsBtn = document.getElementById('manage-receptions-btn');
        if (manageReceptionsBtn) manageReceptionsBtn.addEventListener('click', () => this.openReceptionManagementModal());
        const closeReceptionManagementModalBtn = document.getElementById('close-reception-management-modal');
        if (closeReceptionManagementModalBtn) closeReceptionManagementModalBtn.addEventListener('click', () => this.closeReceptionManagementModal());
        const receptionStatusFilter = document.getElementById('reception-status-filter');
        if (receptionStatusFilter) receptionStatusFilter.addEventListener('change', () => this.renderPendingReceptionsList());

        const activeDebtsContainer = document.getElementById('active-debts');
if (activeDebtsContainer) {
    activeDebtsContainer.addEventListener('click', (e) => {
        // Busca si el clic fue en una tarjeta de resumen de cliente
        const summaryCard = e.target.closest('.customer-debt-summary');
        
        // Si se encontró una tarjeta, obtén su ID y llama a la función para expandir/contraer
        if (summaryCard) {
            const customerId = summaryCard.dataset.customerId;
            if (customerId) {
                this.toggleCustomerDebtDetails(customerId);
            }
        }
    });
}

    // Listener para la nueva sección de Caja
document.getElementById('sales-history-date').addEventListener('change', () => this.renderSalesHistory());

// Listeners para el nuevo modal de edición
document.getElementById('close-edit-sale-modal').onclick = () => document.getElementById('edit-sale-modal').style.display = 'none';
document.getElementById('cancel-edit-sale').onclick = () => document.getElementById('edit-sale-modal').style.display = 'none';
document.getElementById('edit-sale-form').onsubmit = (e) => this.handleUpdateSale(e);

        // Modal de Registrar Recepción
        const receivePurchaseForm = document.getElementById('receive-purchase-form');
        if(receivePurchaseForm) receivePurchaseForm.addEventListener('submit', (e) => this.handleReceivePurchaseSubmit(e));
        const cancelReceivePurchaseBtn = document.getElementById('cancel-receive-purchase');
        if(cancelReceivePurchaseBtn) cancelReceivePurchaseBtn.addEventListener('click', () => this.closeReceivePurchaseModal());
        const closeReceivePurchaseModalBtn = document.getElementById('close-receive-purchase-modal');
        if(closeReceivePurchaseModalBtn) closeReceivePurchaseModalBtn.addEventListener('click', () => this.closeReceivePurchaseModal());

        // Filtros de Catálogo
        document.getElementById('category-filter').addEventListener('change', () => this.filterCatalog());
        document.getElementById('size-filter').addEventListener('change', () => this.filterCatalog());
        const downloadCatalogPdfBtn = document.getElementById('download-catalog-pdf-btn');
        if (downloadCatalogPdfBtn) downloadCatalogPdfBtn.addEventListener('click', () => this.downloadCatalogPDF());


        // Estadísticas
        document.getElementById('stats-period').addEventListener('change', () => this.updateStats());

        
        // Cierre de modales al hacer clic fuera
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }
    
     generarEstadoCuentaCliente(clienteId) {
        const cliente = this.customers.find(c => c.id === clienteId);
        const ventasCliente = this.creditSales.filter(s => s.cliente_id === clienteId);
        const abonosCliente = this.payments.filter(a => ventasCliente.some(v => v.id === a.venta_id));
        generarPDFEstadoCuenta({ cliente, ventasCliente, abonosCliente });
    }

    // --- Métodos de Navegación ---
    switchSection(sectionId) {
        document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
        document.querySelector(`.nav-tab[data-section="${sectionId}"]`).classList.add('active');
        document.getElementById(sectionId).classList.add('active');
        if (sectionId === 'stats') this.updateStats();
        if (sectionId === 'catalog') this.renderCatalog();
        if (sectionId === 'cash-register')
            this.renderSalesHistory();
    
    }

    switchCreditSection(sectionId) {
        document.querySelectorAll('.credit-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.credit-subsection').forEach(sec => sec.classList.remove('active'));
        document.querySelector(`.credit-tab[data-credit-section="${sectionId}"]`).classList.add('active');
        document.getElementById(sectionId).classList.add('active');
        if (sectionId === 'payments') this.renderPendingDebts();
        else if (sectionId === 'tracking') { this.updateTrackingSummary(); this.renderActiveDebts(); }
        else if (sectionId === 'credit-sales') this.renderCreditSales();
    }

    // --- Gestión de Datos Maestros (Productos, Categorías, Clientes) ---
    async loadProducts() {
        try {
            const { data, error } = await this.supabase.from('productos').select('*').order('nombre', { ascending: true });
            if (error) throw error;
            this.products = data || [];
        } catch (error) { 
            console.error("Error cargando productos:", error);
            this.showNotification('Error al cargar productos: ' + error.message, 'error'); 
        }
    }
    
    async loadCategories() {
        try {
            const { data, error } = await this.supabase.from('categorias').select('*').order('nombre', { ascending: true });
            if (error) throw error;
            this.categories = data || [];
        } catch (error) { 
            this.categories = []; 
            console.error("Error cargando categorías:", error);
            this.showNotification('Error al cargar categorías: ' + error.message, 'error'); 
        }
        this.renderCategoriesList();
        this.populateCategorySelects();
    }

    async loadCustomers() {
        try {
            const { data, error } = await this.supabase.from('clientes').select('*').order('nombre', { ascending: true });
            if (error) throw error;
            this.customers = data || [];
        } catch (error) { 
            console.error("Error cargando clientes:", error);
            this.showNotification('Error al cargar clientes: ' + error.message, 'error'); 
        }
    }

// app.js - REEMPLAZA esta función
async loadPurchases() {
    try {
        // Ahora consultamos los detalles de compra y unimos la información de la orden y el producto.
        const { data, error } = await this.supabase
            .from('detalles_compra')
            .select(`
                *,
                ordenes_compra ( fecha_compra, proveedor ),
                productos ( nombre, imagen_url )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error en loadPurchases Supabase:", error);
            throw error;
        }
        // El array this.purchases ahora contendrá los detalles de cada producto comprado.
        this.purchases = data || [];
    } catch (error) {
        this.showNotification('Error al cargar detalles de compras: ' + error.message, 'error');
        console.error("Error detallado al cargar detalles de compras:", error);
        this.purchases = [];
    }
}


//=================================================
// FUNCIÓN CENTRAL PARA FORMATEAR MONEDA
//=================================================
formatCurrency(number) {
    // Si el número no es válido, devuelve $0
    if (isNaN(number) || number === null) {
        number = 0;
    }

    // Usamos el formateador de números nativo de JavaScript para moneda colombiana (COP)
    // y le indicamos que no queremos dígitos decimales (minimumFractionDigits: 0).
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number);
}
openPurchaseModal() {
        const modal = document.getElementById('purchase-modal');
        if (!modal) return;
        
        document.getElementById('purchase-form').reset();
        document.getElementById('purchase-date').valueAsDate = new Date();
        this.currentPurchaseItems = [];
        this.renderPurchaseList();
        
        const selector = document.getElementById('purchase-product-selector');
        if (!selector) {
            console.error("El elemento 'purchase-product-selector' no se encontró en el HTML.");
            return;
        }

        // Construimos todo el HTML de los productos y lo insertamos de una vez
        const productsHTML = this.products.map(product => {
            // Usamos comillas simples para el string y dobles para los atributos HTML internos
            return `
                <div class="credit-product-card" onclick="app.addProductToPurchaseList('${product.id}')">
                    <img src="${product.imagen_url || 'https://via.placeholder.com/80'}" alt="${product.nombre}" onerror="this.src='https://via.placeholder.com/80';this.onerror=null;">
                    <div class="name">${product.nombre}</div>
                    <div class="stock">Stock actual: ${product.stock}</div>
                </div>
            `;
        }).join('');

        selector.innerHTML = productsHTML;
        modal.style.display = 'block';
    }
// NUEVA FUNCIÓN 1
addProductToPurchaseList(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    // Evitar duplicados en la lista
    if (this.currentPurchaseItems.some(item => item.id === productId)) {
        this.showNotification('Este producto ya está en la lista de compra.', 'warning', 2000);
        return;
    }

    this.currentPurchaseItems.push({
        id: product.id,
        nombre: product.nombre,
        cantidad_comprada: 1,
        precio_compra_unitario: 0
    });
    this.renderPurchaseList();
}

// NUEVA FUNCIÓN 2
renderPurchaseList() {
        const container = document.getElementById('selected-purchase-items');
        const totalCostEl = document.getElementById('purchase-total-cost');
        let totalCost = 0;

        if (this.currentPurchaseItems.length === 0) {
            container.innerHTML = '<p class="empty-message">Añade productos del selector de arriba.</p>';
            totalCostEl.textContent = '0.00';
            return;
        }

        container.innerHTML = this.currentPurchaseItems.map((item, index) => {
            const itemTotal = (item.cantidad_comprada || 0) * (item.precio_compra_unitario || 0);
            totalCost += itemTotal;
            return `
                <div class="purchase-item-row">
                    <span>${item.nombre}</span>
                    <div class="purchase-item-inputs">
                        <label>Cant:</label>
                        <input type="number" value="${item.cantidad_comprada}" min="1" onchange="app.updatePurchaseItem(${index}, 'cantidad', this.value)">
                        <label>Costo U:</label>
                        <input type="number" value="${item.precio_compra_unitario}" step="0.01" min="0" onchange="app.updatePurchaseItem(${index}, 'costo', this.value)">
                        <button type="button" class="remove-btn" onclick="app.removePurchaseItem(${index})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        totalCostEl.textContent = totalCost.toFixed(2);
    }
    closePurchaseModal() {
        const modal = document.getElementById('purchase-modal');
        if (modal) modal.style.display = 'none';
    }

    populateProductsForPurchaseModal() {
        const select = document.getElementById('purchase-product');
        if (!select) return;
        select.innerHTML = '<option value="">Seleccionar producto...</option>';
        this.products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.nombre} (Stock actual: ${product.stock})`;
            select.appendChild(option);
        });
    }
// NUEVA FUNCIÓN DE AYUDA 1
    updatePurchaseItem(index, field, value) {
        if (!this.currentPurchaseItems[index]) return;
        
        if (field === 'cantidad') {
            this.currentPurchaseItems[index].cantidad_comprada = parseInt(value, 10) || 1;
        } else if (field === 'costo') {
            this.currentPurchaseItems[index].precio_compra_unitario = parseFloat(value) || 0;
        }
        this.renderPurchaseList(); // Vuelve a dibujar la lista para actualizar el total
    }

    // NUEVA FUNCIÓN DE AYUDA 2
    removePurchaseItem(index) {
        this.currentPurchaseItems.splice(index, 1);
        this.renderPurchaseList();
    }
async handlePurchaseSubmit(e) {
    e.preventDefault();
    const fechaCompra = document.getElementById('purchase-date').value;
    const proveedor = document.getElementById('purchase-supplier').value;
    const notasCompra = document.getElementById('purchase-notes').value;

    if (!fechaCompra) {
        return this.showNotification('La fecha de compra es obligatoria.', 'warning');
    }
    if (this.currentPurchaseItems.length === 0) {
        return this.showNotification('Debes agregar al menos un producto a la compra.', 'warning');
    }

    // Validar que todos los items tengan cantidad y precio válidos
    for (const item of this.currentPurchaseItems) {
        if (item.cantidad_comprada <= 0 || item.precio_compra_unitario < 0) {
            return this.showNotification(`La cantidad y el costo para "${item.nombre}" deben ser positivos.`, 'warning');
        }
    }

    const costoTotal = this.currentPurchaseItems.reduce((sum, item) => sum + (item.cantidad_comprada * item.precio_compra_unitario), 0);

    try {
        // 1. Insertar la orden de compra principal
        const { data: orden, error: ordenError } = await this.supabase
            .from('ordenes_compra')
            .insert([{
                fecha_compra: fechaCompra,
                proveedor: proveedor || null,
                notas_compra: notasCompra || null,
                costo_total: costoTotal
            }])
            .select()
            .single();

        if (ordenError) throw ordenError;

        // 2. Preparar los detalles de la compra
        const detallesData = this.currentPurchaseItems.map(item => ({
            orden_id: orden.id,
            producto_id: item.id,
            cantidad_comprada: item.cantidad_comprada,
            precio_compra_unitario: item.precio_compra_unitario
        }));

        // 3. Insertar todos los detalles
        const { error: detallesError } = await this.supabase
            .from('detalles_compra')
            .insert(detallesData);

        if (detallesError) throw detallesError;

        // 4. Registrar el egreso financiero
        const { error: movementError } = await this.supabase
            .from('movimientos_financieros')
            .insert([{
                tipo: 'egreso',
                descripcion: `Compra a ${proveedor || 'varios'} (Orden ID: ${orden.id.substring(0, 8)})`,
                monto: costoTotal,
                fecha: fechaCompra,
                referencia_id: orden.id,
                tabla_referencia: 'ordenes_compra'
            }]);

        if (movementError) {
            console.error("Error al registrar egreso:", movementError);
            this.showNotification('Compra registrada, pero hubo un error al crear el registro financiero.', 'warning');
        }

        this.showNotification('Compra registrada exitosamente.', 'success');

        // Recargar datos relevantes
        await this.loadFinancialMovements();
        this.updateStats();
        this.closePurchaseModal();

    } catch (error) {
        console.error("Error al registrar la compra:", error);
        this.showNotification('Error al registrar la compra: ' + error.message, 'error');
    }
}    
    


    // --- Gestión de Recepción de Mercancía ---
    openReceptionManagementModal() {
        const modal = document.getElementById('reception-management-modal');
        if (!modal) return;
        this.renderPendingReceptionsList();
        modal.style.display = 'block';
    }

    closeReceptionManagementModal() {
        const modal = document.getElementById('reception-management-modal');
        if (modal) modal.style.display = 'none';
    }

// app.js - REEMPLAZA esta función
async renderPendingReceptionsList() {
    const listContainer = document.getElementById('pending-receptions-list');
    if (!listContainer) return;

    await this.loadPurchases(); // Forzamos la recarga para tener los datos más recientes

    const filterValue = document.getElementById('reception-status-filter').value;
    let filteredPurchases = filterValue ? this.purchases.filter(p => p.estado_recepcion === filterValue) : this.purchases;

    if (filteredPurchases.length === 0) {
        listContainer.innerHTML = "<p>No hay compras que cumplan con el filtro.</p>";
        return;
    }

    listContainer.innerHTML = `
        <table class="inventory-table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Fecha Compra</th>
                    <th>Cant. Comprada</th>
                    <th>Cant. Recibida</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${filteredPurchases.map(item => {
                    const productName = item.productos?.nombre || 'Producto no encontrado';
                    const fechaCompra = item.ordenes_compra?.fecha_compra ? new Date(item.ordenes_compra.fecha_compra).toLocaleDateString() : 'N/A';
                    const qtyPending = item.cantidad_comprada - item.cantidad_recibida;
                    
                    return `
                        <tr>
                            <td>${productName}</td>
                            <td>${fechaCompra}</td>
                            <td>${item.cantidad_comprada}</td>
                            <td>${item.cantidad_recibida}</td>
                            <td><span class="status-${item.estado_recepcion}">${item.estado_recepcion.replace('_', ' ').toUpperCase()}</span></td>
                            <td>
                                ${item.estado_recepcion !== 'recibida_total' ? 
                                `<button class="btn-primary small-btn" onclick="app.openReceivePurchaseModal('${item.id}')">
                                    <i class="fas fa-dolly"></i> Recibir (${qtyPending > 0 ? qtyPending : 0} pend.)
                                 </button>` : 
                                'Completada'}
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}
// app.js - REEMPLAZA esta función
openReceivePurchaseModal(purchaseDetailId) {
    this.currentReceivingPurchase = this.purchases.find(p => p.id === purchaseDetailId);
    if (!this.currentReceivingPurchase) {
        return this.showNotification("Detalle de compra no encontrado.", "error");
    }

    const modal = document.getElementById('receive-purchase-modal');
    if (!modal) return;

    const productName = this.currentReceivingPurchase.productos?.nombre || 'Producto no encontrado';
    document.getElementById('receive-product-info').innerHTML = `
        <strong>Producto:</strong> ${productName}<br>
        <strong>Proveedor:</strong> ${this.currentReceivingPurchase.ordenes_compra?.proveedor || 'N/A'}`;
    
    document.getElementById('receive-purchase-id').value = purchaseDetailId;
    document.getElementById('receive-quantity-ordered').value = this.currentReceivingPurchase.cantidad_comprada;
    document.getElementById('receive-quantity-already-received').value = this.currentReceivingPurchase.cantidad_recibida;
    
    const quantityToReceiveInput = document.getElementById('receive-quantity-now');
    const maxReceivable = this.currentReceivingPurchase.cantidad_comprada - this.currentReceivingPurchase.cantidad_recibida;
    quantityToReceiveInput.value = maxReceivable > 0 ? maxReceivable : 0;
    quantityToReceiveInput.max = maxReceivable;
    quantityToReceiveInput.min = 0;

    document.getElementById('receive-date').valueAsDate = new Date();
    document.getElementById('receive-notes').value = '';
    
    modal.style.display = 'block';
}

    closeReceivePurchaseModal() {
        const modal = document.getElementById('receive-purchase-modal');
        if (modal) modal.style.display = 'none';
        this.currentReceivingPurchase = null;
    }

// app.js - REEMPLAZA esta función
async handleReceivePurchaseSubmit(e) {
    e.preventDefault();
    if (!this.currentReceivingPurchase) return;

    const purchaseDetailId = document.getElementById('receive-purchase-id').value;
    const cantidadARecibirAhora = parseInt(document.getElementById('receive-quantity-now').value, 10);
    const fechaRecepcion = document.getElementById('receive-date').value;

    if (isNaN(cantidadARecibirAhora) || cantidadARecibirAhora < 0 || !fechaRecepcion) {
        return this.showNotification('La cantidad y la fecha son obligatorias.', 'warning');
    }

    const maxReceivable = this.currentReceivingPurchase.cantidad_comprada - this.currentReceivingPurchase.cantidad_recibida;
    if (cantidadARecibirAhora > maxReceivable) {
        return this.showNotification(`No puedes recibir más de la cantidad pendiente (${maxReceivable}).`, 'warning');
    }

    try {
        // 1. Actualizar el stock del producto si se recibe mercancía
        if (cantidadARecibirAhora > 0) {
            const productToUpdate = this.products.find(p => p.id === this.currentReceivingPurchase.producto_id);
            if (!productToUpdate) throw new Error("Producto no encontrado para actualizar stock.");
            
            const newStock = productToUpdate.stock + cantidadARecibirAhora;
            const { error: stockUpdateError } = await this.supabase
                .from('productos')
                .update({ stock: newStock })
                .eq('id', this.currentReceivingPurchase.producto_id);
            if (stockUpdateError) throw stockUpdateError;
        }
        
        // 2. Actualizar el detalle de la compra
        const nuevaCantidadRecibidaTotal = this.currentReceivingPurchase.cantidad_recibida + cantidadARecibirAhora;
        const nuevoEstado = nuevaCantidadRecibidaTotal >= this.currentReceivingPurchase.cantidad_comprada ? 'recibida_total' : 'recibida_parcial';
        
        const { error: detailUpdateError } = await this.supabase
            .from('detalles_compra')
            .update({ 
                cantidad_recibida: nuevaCantidadRecibidaTotal,
                estado_recepcion: nuevoEstado 
            })
            .eq('id', purchaseDetailId);
        if (detailUpdateError) throw detailUpdateError;

        this.showNotification('Recepción registrada y stock actualizado.', 'success');
        
        // 3. Recargar y refrescar las vistas
        await this.loadProducts(); 
        await this.loadPurchases();
        this.renderInventory();
        this.renderPOSProducts();
        this.renderCatalog();
        this.renderPendingReceptionsList(); 
        this.closeReceivePurchaseModal();

    } catch (error) {
        console.error("Error en handleReceivePurchaseSubmit:", error);
        this.showNotification('Error al registrar la recepción: ' + error.message, 'error');
    }
}
// app.js - REEMPLAZA el método showPurchaseHistory con esta versión corregida

async showPurchaseHistory() {
    const modal = document.getElementById('purchase-history-modal');
    const table = document.querySelector('#purchase-history-modal .inventory-table');
    
    if (!modal || !table) {
        console.error('El modal o la tabla del historial de compras no existen en el HTML.');
        return;
    }

    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Cargando historial...</td></tr>';
    modal.style.display = 'block';

    try {
        const { data: compras, error } = await this.supabase
            .from('ordenes_compra')
            .select(`*, detalles_compra (*, productos (nombre))`)
            .order('fecha_compra', { ascending: false });

        if (error) throw error;

        if (compras.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay compras registradas.</td></tr>';
        } else {
            tbody.innerHTML = compras.map(compra => {
                const fechaFormateada = new Date(compra.fecha_compra).toLocaleDateString();
                
                const detallesHtml = compra.detalles_compra.map(detalle => `
                    <li class="purchase-detail-item">
                        <span class="product-name">${detalle.productos.nombre || 'Producto no encontrado'}</span>
                        <span class="product-meta">
                            Cant: ${detalle.cantidad_comprada} &bull; Costo U: ${this.formatCurrency(detalle.precio_compra_unitario)}
                        </span>
                    </li>
                `).join('');

                return `
                    <tr class="purchase-history-main-row" onclick="app.togglePurchaseDetails('${compra.id}')">
                        <td>${fechaFormateada}</td>
                        <td>${compra.proveedor || '-'}</td>
                        <td>${this.formatCurrency(compra.costo_total)}</td>
                        <td>
                            <button class="btn-secondary small-btn" id="btn-toggle-${compra.id}">
                                <i class="fas fa-plus"></i> Ver Detalles
                            </button>
                        </td>
                    </tr>
                    <tr class="purchase-history-details-row" id="details-${compra.id}">
                        <td colspan="4">
                            <div class="details-card">
                                <h6>Productos en esta compra:</h6>
                                <ul class="purchase-details-list">
                                    ${detallesHtml}
                                </ul>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: red;">Error al cargar el historial.</td></tr>`;
        this.showNotification('Error al cargar el historial de compras: ' + err.message, 'error');
        console.error("Error en historial de compras:", err);
    }
}

// app.js - AÑADE ESTE NUEVO MÉTODO A TU CLASE

// app.js - REEMPLAZA POR COMPLETO tu método toggleCustomerDebtDetails con este

toggleCustomerDebtDetails(customerId) {
    const targetDetailsContainer = document.getElementById(`details-for-customer-${customerId}`);
    const targetSummaryCard = document.querySelector(`.customer-debt-summary[data-customer-id="${customerId}"]`);
    
    if (!targetDetailsContainer || !targetSummaryCard) {
        console.error("No se encontraron los elementos para el cliente:", customerId);
        return;
    }

    // Comprueba si la tarjeta que clickeamos ya estaba expandida ANTES de cerrar todo.
    const wasAlreadyExpanded = targetDetailsContainer.style.display === 'block';

    // --- PASO 1: CERRAR TODAS LAS TARJETAS ---
    // Ocultamos todos los contenedores de detalles.
    const allDetailContainers = document.querySelectorAll('.customer-debt-details');
    allDetailContainers.forEach(container => {
        container.style.display = 'none';
    });

    // Quitamos el estado 'expanded' de todas las tarjetas de resumen.
    const allSummaryCards = document.querySelectorAll('.customer-debt-summary');
    allSummaryCards.forEach(card => {
        card.classList.remove('expanded');
    });

    // --- PASO 2: ABRIR LA TARJETA CORRECTA (si no estaba ya abierta) ---
    // Si la tarjeta que clickeamos no era la que ya estaba abierta, la expandimos.
    // Si era la que ya estaba abierta, el efecto es simplemente cerrarla (lo que ya hicimos en el paso 1).
    if (!wasAlreadyExpanded) {
        targetDetailsContainer.style.display = 'block';
        targetSummaryCard.classList.add('expanded');
    }
}

togglePurchaseDetails(orderId) {
    const detailsRow = document.getElementById(`details-${orderId}`);
    const button = document.getElementById(`btn-toggle-${orderId}`);
    if (!detailsRow || !button) return;

    // Cambia la visibilidad de la fila de detalles
    const isVisible = detailsRow.style.display === 'table-row';
    detailsRow.style.display = isVisible ? 'none' : 'table-row';

    // Cambia el texto y el ícono del botón
    button.innerHTML = isVisible 
        ? '<i class="fas fa-plus"></i> Ver Detalles' 
        : '<i class="fas fa-minus"></i> Ocultar';
}
    // --- Gestión Financiera (Ingresos y Egresos) ---
    async loadFinancialMovements() {
        try {
            const { data, error } = await this.supabase
                .from('movimientos_financieros')
                .select('*')
                .order('fecha', { ascending: false });
            if (error) {
                console.error("Error cargando movimientos financieros (Supabase):", error);
                // Verificar si es un error 404 por tabla no existente
                if (error.code === 'PGRST200' && error.message.includes("relation \"movimientos_financieros\" does not exist")) {
                     this.showNotification('Tabla de movimientos financieros no encontrada. Verifica la configuración.', 'error');
                } else {
                    throw error;
                }
            }
            this.financialMovements = data || [];
        } catch (error) {
            this.showNotification('Error al cargar movimientos financieros: ' + error.message, 'error');
            console.error("Error detallado al cargar movimientos financieros:", error);
            this.financialMovements = [];
        }
    }

    // --- Gestión de Ventas (POS y Crédito) ---
    async loadSales() { 
        try {
            const { data, error } = await this.supabase.from('ventas').select('*').order('fecha', { ascending: false });
            if (error) throw error; 
            this.sales = data || [];
        } catch (error) {
            this.sales = [];
            console.warn("Error al cargar ventas POS:", error.message);
        }
    }

// app.js - REEMPLAZA esta función
async saveSale(saleData) {
    try {
        const saleItems = JSON.parse(saleData.productos);
        const grupoVentaId = self.crypto.randomUUID(); // Creamos un ID único para toda esta transacción

        // 1. Primero, registramos el movimiento financiero para obtener su ID
        const financialMovementData = {
            tipo: 'ingreso',
            descripcion: `Venta POS (${saleData.forma_pago})`,
            monto: saleData.total,
            fecha: new Date(saleData.fecha).toISOString(),
            referencia_id: grupoVentaId, // Usamos el grupo_venta_id como referencia inicial
            tabla_referencia: 'ventas'
        };
        const { data: savedMovement, error: movementError } = await this.supabase
            .from('movimientos_financieros')
            .insert(financialMovementData)
            .select('id')
            .single();

        if (movementError) throw movementError;
        
        // 2. Ahora, preparamos los registros de venta, incluyendo el ID del grupo y el ID del movimiento
        const newVentasRecords = saleItems.map(item => ({
            producto_id: item.id,
            cantidad: item.quantity,
            total: item.precio_venta * item.quantity, // Usamos precio_venta
            fecha: new Date(saleData.fecha).toISOString(),
            forma_pago: saleData.forma_pago,
            pagado: true,
            grupo_venta_id: grupoVentaId, // Asignamos el ID del grupo a cada item
        }));

        // 3. Insertamos todos los items de la venta
        const { error: salesError } = await this.supabase
            .from('ventas')
            .insert(newVentasRecords);
        if (salesError) throw salesError;

        // Recargamos datos y actualizamos vistas
        await this.loadSales();
        await this.loadFinancialMovements();
        this.updateStats();

    } catch (error) {
        console.error("Error en saveSale:", error);
        this.showNotification('Error al guardar venta POS: ' + error.message, 'error');
    }
}


    
    async loadCreditSales() {
        try {
            const { data, error } = await this.supabase
                .from('ventas_fiadas')
                .select(`*, clientes(id, nombre, telefono)`)
                .order('fecha_inicio', { ascending: false });
            if (error) throw error;
            this.creditSales = data || [];
        } catch (error) { 
            console.error("Error cargando ventas a crédito:", error);
            this.showNotification('Error al cargar ventas a crédito: ' + error.message, 'error'); 
        }
    }

    async saveCreditSale(saleData) {
        try {
            const productsInCreditSale = JSON.parse(saleData.productos);
            for (const item of productsInCreditSale) {
                const productInDb = this.products.find(p => p.id === item.id);
                if (!productInDb || productInDb.stock < item.quantity) {
                    throw new Error(`Stock insuficiente para ${item.nombre}. Disponible: ${productInDb?.stock || 0}. Necesario: ${item.quantity}`);
                }
            }

            const { data: savedCreditSale, error } = await this.supabase
                .from('ventas_fiadas')
                .insert([saleData])
                .select()
                .single();
            if (error) throw error;

            for (const item of productsInCreditSale) {
                const productInDb = this.products.find(p => p.id === item.id);
                const newStock = productInDb.stock - item.quantity;
                await this.updateProductStock(item.id, newStock, false); 
            }
            
            if (saleData.abono_inicial > 0) {
                const financialMovementData = {
                    tipo: 'ingreso',
                    descripcion: `Abono inicial venta a crédito ID: ${savedCreditSale.id}`,
                    monto: saleData.abono_inicial,
                    fecha: new Date(saleData.fecha_inicio).toISOString(),
                    referencia_id: savedCreditSale.id,
                    tabla_referencia: 'ventas_fiadas'
                };
                const { error: movementError } = await this.supabase
                    .from('movimientos_financieros')
                    .insert([financialMovementData]);
                if (movementError) console.warn("Error registrando abono inicial como ingreso:", movementError.message);
            }
            const productosFiados = JSON.parse(saleData.productos);
const cliente = this.customers.find(c => c.id === saleData.cliente_id);
generarPDFVenta({
    productos: productosFiados,
    cliente,
    total: saleData.total,
    fecha: new Date().toLocaleString(),
    tipo: 'credito',
    abono_inicial: saleData.abono_inicial,
    saldo_pendiente: saleData.saldo_pendiente
});

            await this.loadProducts(); 
            await this.loadCreditSales();
            if (saleData.abono_inicial > 0) await this.loadFinancialMovements();
            this.renderCreditSales();
            this.updateTrackingSummary();
            if (saleData.abono_inicial > 0) this.updateStats();
            this.renderPOSProducts(); 
            this.renderCatalog(); 
            this.renderInventory(); 
            this.showNotification('Venta a crédito registrada.', 'success');
        } catch (error) {
            console.error("Error en saveCreditSale:", error);
            this.showNotification('Error al registrar venta a crédito: ' + error.message, 'error');
        }
    }

    // --- Gestión de Pagos (Abonos a Crédito) ---
    async loadPayments() {
        try {
            const { data, error } = await this.supabase.from('abonos').select('*').order('fecha_abono', { ascending: false });
            if (error) throw error;
            this.payments = data || [];
        } catch (error) { 
            console.error("Error cargando abonos:", error);
            this.showNotification('Error al cargar abonos: ' + error.message, 'error'); 
        }
    }

    async savePayment(paymentData) { 
    try {
        const { data: savedAbono, error: abonoError } = await this.supabase
            .from('abonos')
            .insert([paymentData])
            .select()
            .single();
        if (abonoError) throw abonoError;

        const sale = this.creditSales.find(s => s.id === paymentData.venta_id);
        if (sale) {
            const newBalance = sale.saldo_pendiente - paymentData.monto;
            const status = newBalance <= 0 ? 'pagada' : 'pendiente';
            await this.supabase.from('ventas_fiadas')
                .update({ saldo_pendiente: Math.max(0, newBalance), estado: status })
                .eq('id', paymentData.venta_id);
        }

        const financialMovementData = {
            tipo: 'ingreso',
            descripcion: `Abono a venta crédito ID: ${paymentData.venta_id}`,
            monto: paymentData.monto,
            fecha: new Date(paymentData.fecha_abono).toISOString(),
            referencia_id: savedAbono.id,
            tabla_referencia: 'abonos'
        };
        const { error: movementError } = await this.supabase
            .from('movimientos_financieros')
            .insert([financialMovementData]);
        if (movementError) {
            console.error("Error registrando ingreso por abono:", movementError);
            this.showNotification('Abono guardado, pero error registrando ingreso financiero.', 'warning');
        }

        // Recarga datos antes de generar el PDF para tener abonos y saldo actualizado
        await this.loadCreditSales();
        await this.loadPayments();
        await this.loadFinancialMovements();

        // Genera el PDF del abono
        if (sale) {
            const cliente = sale.clientes;
            const abonos = this.payments.filter(p => p.venta_id === sale.id);
            // Incluye el nuevo abono recién agregado:
            abonos.unshift({
                ...paymentData,
                fecha_abono: paymentData.fecha_abono,
                monto: paymentData.monto,
            });
            generarPDFAbono({
                cliente,
                sale: { ...sale, saldo_pendiente: Math.max(0, sale.saldo_pendiente - paymentData.monto) },
                abono: paymentData,
                abonos
            });
        }

        this.renderPendingDebts();
        this.updateTrackingSummary();
        this.renderActiveDebts();
        this.updateStats(); 
        this.showNotification('Abono registrado exitosamente.', 'success');
    } catch (error) {
        console.error("Error en savePayment:", error);
        this.showNotification('Error al registrar abono: ' + error.message, 'error');
    }
}

    
    // --- POS ---
async completeSale() {
    if (this.cart.length === 0) return this.showNotification('El carrito está vacío', 'warning');
    
    const paymentMethodEl = document.querySelector('input[name="payment"]:checked');
    if (!paymentMethodEl) return this.showNotification('Selecciona un método de pago.', 'warning');
    const paymentMethod = paymentMethodEl.value;
    const total = this.cart.reduce((sum, item) => sum + (item.precio_venta * item.quantity), 0);

    for (const item of this.cart) {
        const productInDb = this.products.find(p => p.id === item.id);
        if (!productInDb || productInDb.stock < item.quantity) {
             return this.showNotification(`Stock insuficiente para ${item.nombre}. Disponible: ${productInDb?.stock || 0}`, 'error');
        }
    }
    
    const saleData = {
        productos: JSON.stringify(this.cart.map(item => ({
            id: item.id,
            nombre: item.nombre,
            precio: item.precio_venta,
            quantity: item.quantity,
            talla: item.talla,
            color: item.color
        }))),
        total: total,
        forma_pago: paymentMethod,
        fecha: new Date().toISOString()
    };

    for (const item of this.cart) {
        const productInDb = this.products.find(p => p.id === item.id);
        const newStock = productInDb.stock - item.quantity;
        await this.updateProductStock(item.id, newStock, false); 
    }

    generarPDFVenta({
        productos: this.cart.map(item => ({ ...item, precio: item.precio_venta })),
        cliente: null,
        total: total,
        fecha: new Date().toLocaleString(),
        tipo: 'contado'
    });

    await this.saveSale(saleData); 
    await this.loadProducts(); 

    this.cart = [];
    this.renderCart();
    this.updateCartTotal();
    this.renderPOSProducts();
    this.renderCatalog();
    this.renderInventory();
    this.showNotification('Venta completada exitosamente.', 'success');
}


    // --- PDF Catálogo ---
    async downloadCatalogPDF() {
        if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF === 'undefined') {
            return this.showNotification("Error: Librería jsPDF no cargada.", "error");
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Catálogo de Productos - Mari Sport", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

        const tableColumn = ["Imagen", "Nombre", "Categoría", "Precio", "Stock", "Tallas", "Colores"];
        const tableRows = [];
        
        let filteredProducts = this.products; 
        const categoryFilter = document.getElementById('category-filter').value;
        const sizeFilter = document.getElementById('size-filter').value;
        if (categoryFilter) filteredProducts = filteredProducts.filter(p => p.categoria === categoryFilter);
        if (sizeFilter) filteredProducts = filteredProducts.filter(p => p.talla && p.talla.split(',').map(s => s.trim()).includes(sizeFilter));

        for (const product of filteredProducts) {
            const productData = [
                '', 
                product.nombre,
                product.categoria || 'N/A',
                `$${product.precio.toFixed(2)}`,
                product.stock,
                product.talla || 'N/A',
                product.color || 'N/A'
            ];
            tableRows.push(productData);
        }

        if (!doc.autoTable) { 
             return this.showNotification("Error: Librería jsPDF-AutoTable no cargada.", "error");
        }

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 35,
             columns: [
                { header: 'Imagen', dataKey: 0 }, 
                { header: 'Nombre', dataKey: 1 },
                { header: 'Categoría', dataKey: 2 },
                { header: 'Precio', dataKey: 3 },
                { header: 'Stock', dataKey: 4 },
                { header: 'Tallas', dataKey: 5 },
                { header: 'Colores', dataKey: 6 },
            ],
            columnStyles: {
                0: { cellWidth: 20, halign: 'center' }, 
                1: { cellWidth: 40 }, 
            },
        });
        
        doc.save(`catalogo-marisport-${new Date().toISOString().split('T')[0]}.pdf`);
        this.showNotification("Catálogo PDF generado.", "success", 1500);
    }

    // --- Métodos de Actualización de Stock (Común) ---
    async updateProductStock(productId, newStock, reloadAllProducts = true) {
        try {
            const { error } = await this.supabase
                .from('productos')
                .update({ stock: newStock })
                .eq('id', productId);
            if (error) throw error;

            const productIndex = this.products.findIndex(p => p.id === productId);
            if (productIndex !== -1) {
                this.products[productIndex].stock = newStock;
            }
            if (reloadAllProducts) { 
                await this.loadProducts();
            }
        } catch (error) {
            console.error("Error actualizando stock:", error);
            this.showNotification('Error al actualizar stock: ' + error.message, 'error');
        }
    }

    // --- Estadísticas ---
   async updateStats() {
    const totalSalesEl = document.getElementById('total-sales');
    const totalExpensesEl = document.getElementById('total-expenses');
    const generalBalanceEl = document.getElementById('general-balance');
    const avgSaleEl = document.getElementById('avg-sale');
    const totalOrdersEl = document.getElementById('total-orders');
    const statsPeriodEl = document.getElementById('stats-period');
    const bestSellersList = document.getElementById('best-sellers-list');

    if (!statsPeriodEl) return;

    let period = statsPeriodEl.value;
    const now = new Date();
    let startDate;

        switch (period) {
            case 'day': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
            case 'month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
            case 'year': startDate = new Date(now.getFullYear(), 0, 1); break;
            default: startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }
        
        console.log("Actualizando estadísticas para el período desde:", startDate.toLocaleDateString());

        if (this.sales.length === 0 && this.financialMovements.length === 0 && this.products.length === 0) {
            console.log("Datos no cargados, recargando todo para estadísticas...");
            await this.loadSales();
            await this.loadFinancialMovements();
            await this.loadProducts(); // Necesario para nombres de productos en best-sellers
        } else if(this.financialMovements.length === 0) {
            await this.loadFinancialMovements();
        }


        const periodSales = this.sales.filter(sale => new Date(sale.fecha) >= startDate);
        const totalSalesFromPOS = periodSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
        const totalOrdersCount = periodSales.length;
        const avgSaleValue = totalOrdersCount > 0 ? totalSalesFromPOS / totalOrdersCount : 0;

        document.getElementById('total-orders').textContent = totalOrdersCount;
        document.getElementById('avg-sale').textContent = `$${avgSaleValue.toFixed(2)}`;

        const productSalesSummary = {};
        periodSales.forEach(sale => {
            const product = this.products.find(p => p.id === sale.producto_id);
            if (product) {
                if (!productSalesSummary[product.nombre]) {
                    productSalesSummary[product.nombre] = { name: product.nombre, quantity: 0, revenue: 0, image: product.imagen_url };
                }
                productSalesSummary[product.nombre].quantity += (sale.cantidad || 0);
                productSalesSummary[product.nombre].revenue += (sale.total || 0);
            } else {
                console.warn(`Producto con ID ${sale.producto_id} no encontrado para la venta ${sale.id} en estadísticas.`);
            }
        });
        const bestSellersData = Object.values(productSalesSummary).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
        this.renderBestSellers(bestSellersData);
        
        console.log("Movimientos financieros antes de filtrar:", this.financialMovements);
        const periodMovements = this.financialMovements.filter(mov => new Date(mov.fecha) >= startDate);
        console.log("Movimientos financieros del período:", periodMovements);

        const totalIngresos = periodMovements.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + (m.monto || 0), 0);
        const totalEgresos = periodMovements.filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + (m.monto || 0), 0);
        const balanceGeneral = totalIngresos - totalEgresos;

        console.log("Total Ingresos Calculados:", totalIngresos, "Total Egresos Calculados:", totalEgresos, "Balance:", balanceGeneral);

        document.getElementById('total-sales').textContent = this.formatCurrency(totalIngresos);
if (totalExpensesEl) totalExpensesEl.textContent = this.formatCurrency(totalEgresos);
if (generalBalanceEl) generalBalanceEl.textContent = this.formatCurrency(balanceGeneral);
document.getElementById('avg-sale').textContent = this.formatCurrency(avgSaleValue);
    }

    // --- Renderizado y UI ---
    populateCategorySelects() { 
        const productCategorySelect = document.getElementById('product-category');
        const filterCategorySelect = document.getElementById('category-filter');
        
        if (productCategorySelect) {
            const currentProductCat = productCategorySelect.value;
            productCategorySelect.innerHTML = '<option value="">Seleccionar...</option>';
            this.categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.nombre; 
                opt.textContent = cat.nombre;
                productCategorySelect.appendChild(opt);
            });
            productCategorySelect.value = currentProductCat;
        }

        if (filterCategorySelect) {
            const currentFilterCat = filterCategorySelect.value;
            filterCategorySelect.innerHTML = '<option value="">Todas las categorías</option>';
            this.categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.nombre; 
                opt.textContent = cat.nombre;
                filterCategorySelect.appendChild(opt);
            });
            filterCategorySelect.value = currentFilterCat;
        }
    }
    
    // app.js - AÑADE ESTOS NUEVOS MÉTODOS A TU CLASE

renderSalesHistory() {
    const container = document.getElementById('sales-history-list');
    const filterDate = document.getElementById('sales-history-date').value;
    if (!container) return;

    // 1. Filtramos las ventas si se ha seleccionado una fecha
    let salesToRender = this.sales;
    if (filterDate) {
        salesToRender = this.sales.filter(s => s.fecha.startsWith(filterDate));
    }

    // 2. Agrupamos los items de venta por su 'grupo_venta_id'
    const groupedSales = salesToRender.reduce((acc, sale) => {
        const groupId = sale.grupo_venta_id;
        if (!groupId) return acc;
        if (!acc[groupId]) {
            acc[groupId] = {
                items: [],
                total: 0,
                fecha: sale.fecha,
                forma_pago: sale.forma_pago,
                id: groupId
            };
        }
        acc[groupId].items.push(sale);
        acc[groupId].total += sale.total;
        return acc;
    }, {});

    // Ordenamos las ventas por fecha, de más reciente a más antigua
    const sortedSales = Object.values(groupedSales).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    if (sortedSales.length === 0) {
        container.innerHTML = `<p class="empty-message">No hay ventas registradas ${filterDate ? 'para esta fecha' : ''}.</p>`;
        return;
    }

    // 3. Renderizamos cada grupo de venta como una tarjeta
    container.innerHTML = sortedSales.map(group => {
        const productosHtml = JSON.parse(group.items[0]?.productos_string_agg || '[]').map(p => `<li>${p.nombre} (x${p.quantity}) - ${this.formatCurrency(p.precio_venta)}</li>`).join('');

        return `
            <div class="sale-history-card">
                <div class="sale-history-header">
                    <div>
                        <strong>Fecha:</strong> ${new Date(group.fecha).toLocaleString()} <br>
                        <strong>Pago con:</strong> ${group.forma_pago}
                    </div>
                    <div class="sale-history-total">
                        Total: ${this.formatCurrency(group.total)}
                    </div>
                </div>
                <div class="sale-history-body">
                    <strong>Productos:</strong>
                    <ul>${group.items.map(item => `<li>${this.products.find(p => p.id === item.producto_id)?.nombre || 'Producto borrado'} (x${item.cantidad}) - ${this.formatCurrency(item.total)}</li>`).join('')}</ul>
                </div>
                <div class="sale-history-actions">
                    <button class="btn-secondary small-btn" onclick="app.openEditSaleModal('${group.id}')"><i class="fas fa-edit"></i> Editar</button>
                    <button class="btn-danger small-btn" onclick="app.deleteSaleGroup('${group.id}')"><i class="fas fa-trash"></i> Eliminar</button>
                </div>
            </div>`;
    }).join('');
}

async deleteSaleGroup(groupId) {
    const confirmed = await this.showConfirmation("¿Seguro que quieres eliminar esta venta? Esta acción es irreversible y afectará el stock y los registros financieros.");
    if (!confirmed) return;

    try {
        // 1. Encontrar todos los items de la venta
        const salesToDelete = this.sales.filter(s => s.grupo_venta_id === groupId);
        if (salesToDelete.length === 0) throw new Error("Venta no encontrada.");

        // 2. Revertir el stock de cada producto
        for (const item of salesToDelete) {
            const product = this.products.find(p => p.id === item.producto_id);
            if (product) {
                const newStock = product.stock + item.cantidad;
                await this.updateProductStock(item.producto_id, newStock, false);
            }
        }
        
        // 3. Eliminar el movimiento financiero asociado
        const { error: movementError } = await this.supabase
            .from('movimientos_financieros')
            .delete()
            .eq('referencia_id', groupId);
        if (movementError) console.warn("Advertencia: No se encontró o no se pudo eliminar el movimiento financiero asociado.");

        // 4. Eliminar los registros de la venta
        const { error: saleError } = await this.supabase
            .from('ventas')
            .delete()
            .eq('grupo_venta_id', groupId);
        if (saleError) throw saleError;
        
        this.showNotification("Venta eliminada y stock restaurado.", "success");

        // 5. Recargar todos los datos y vistas
        await this.init();

    } catch (error) {
        console.error("Error al eliminar el grupo de venta:", error);
        this.showNotification("Error: " + error.message, "error");
    }
}

openEditSaleModal(groupId) {
    const saleGroup = this.sales.filter(s => s.grupo_venta_id === groupId);
    if (saleGroup.length === 0) return;
    
    const modal = document.getElementById('edit-sale-modal');
    document.getElementById('edit-sale-group-id').textContent = groupId.substring(0, 8);
    document.getElementById('edit-payment-method').value = saleGroup[0].forma_pago;
    
    // Guardamos el ID en el formulario para usarlo al guardar
    modal.dataset.currentGroupId = groupId;
    
    modal.style.display = 'block';
}

async handleUpdateSale(e) {
    e.preventDefault();
    const modal = document.getElementById('edit-sale-modal');
    const groupId = modal.dataset.currentGroupId;
    const newPaymentMethod = document.getElementById('edit-payment-method').value;

    try {
        // Actualizar el método de pago en la tabla 'ventas'
        const { error: saleError } = await this.supabase
            .from('ventas')
            .update({ forma_pago: newPaymentMethod })
            .eq('grupo_venta_id', groupId);
        if (saleError) throw saleError;

        // Actualizar la descripción en 'movimientos_financieros'
        const { error: movementError } = await this.supabase
            .from('movimientos_financieros')
            .update({ descripcion: `Venta POS (${newPaymentMethod})` })
            .eq('referencia_id', groupId);
        if (movementError) console.warn("Advertencia: No se pudo actualizar el movimiento financiero.");
        
        this.showNotification("Venta actualizada.", "success");
        modal.style.display = 'none';

        await this.loadSales();
        await this.loadFinancialMovements();
        this.renderSalesHistory();
        this.updateStats();

    } catch (error) {
        console.error("Error al actualizar la venta:", error);
        this.showNotification("Error: " + error.message, "error");
    }
}

    openCategoryModal() {
        document.getElementById('category-modal').style.display = 'block';
        document.getElementById('category-form').reset();
        document.getElementById('category-id').value = '';
        this.renderCategoriesList(); 
    }

    closeCategoryModal() {
        document.getElementById('category-modal').style.display = 'none';
    }

    async handleCategorySubmit(e) {
        e.preventDefault();
        const id = document.getElementById('category-id').value;
        const nombre = document.getElementById('category-name').value.trim();
        if (!nombre) return this.showNotification('El nombre de la categoría es obligatorio.', 'warning');

        try {
            let error;
            if (id) { 
                ({ error } = await this.supabase.from('categorias').update({ nombre }).eq('id', id));
            } else { 
                ({ error } = await this.supabase.from('categorias').insert({ nombre }));
            }
            if (error) throw error;
            this.showNotification(id ? 'Categoría actualizada.' : 'Categoría creada.', 'success');
            this.closeCategoryModal();
            await this.loadCategories(); 
            this.populateCategorySelects(); 
        } catch (err) {
            console.error("Error guardando categoría:", err);
            this.showNotification('Error al guardar categoría: ' + err.message, 'error');
        }
    }

    renderCategoriesList() {
        const list = document.getElementById('categories-list');
        if (!list) return;
        list.innerHTML = ''; 
        if (this.categories.length === 0) {
            list.innerHTML = "<li>No hay categorías.</li>";
            return;
        }
        this.categories.forEach(cat => {
            const li = document.createElement('li');
            li.innerHTML = `
              <span>${cat.nombre}</span>
              <div class="category-actions">
                <button class="edit-btn small-btn" data-id="${cat.id}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn small-btn" data-id="${cat.id}"><i class="fas fa-trash"></i></button>
              </div>`;
            list.appendChild(li);
        });
        list.querySelectorAll('.edit-btn').forEach(btn => btn.onclick = () => this.editCategory(btn.dataset.id));
        list.querySelectorAll('.delete-btn').forEach(btn => btn.onclick = () => this.deleteCategory(btn.dataset.id));
    }

    editCategory(id) {
        const cat = this.categories.find(c => c.id === id);
        if (!cat) return;
        document.getElementById('category-id').value = cat.id;
        document.getElementById('category-name').value = cat.nombre;
    }

    async deleteCategory(id) {
        const confirmed = await this.showConfirmation('¿Eliminar esta categoría? Los productos asociados no se eliminarán pero perderán esta categoría.');
        if (!confirmed) return;
        try {
            const { error } = await this.supabase.from('categorias').delete().eq('id', id);
            if (error) throw error;
            this.showNotification('Categoría eliminada.', 'success');
            await this.loadCategories(); 
            this.populateCategorySelects();
        } catch (err) {
            console.error("Error eliminando categoría:", err);
            this.showNotification('Error al eliminar categoría: ' + err.message, 'error');
        }
    }

openProductModal(productId = null) {
        this.currentEditingProduct = productId; 
        this.populateCategorySelects(); 
        
        const modal = document.getElementById('product-modal');
        const form = document.getElementById('product-form');
        const title = document.getElementById('modal-title');
        const imagePreview = document.getElementById('image-preview');
        const stockInput = document.getElementById('product-stock');

        form.reset(); 
        if(imagePreview) imagePreview.innerHTML = '';

        if (productId) {
            const product = this.products.find(p => p.id === productId);
            if (!product) {
                this.showNotification("Producto no encontrado", "error");
                this.closeProductModal();
                return;
            }
            title.textContent = 'Editar Producto';
            
            document.getElementById('product-name').value = product.nombre;
            document.getElementById('product-category').value = product.categoria; 
            document.getElementById('product-price').value = product.precio;
            document.getElementById('product-image').value = product.imagen_url || '';
            document.getElementById('product-colors').value = product.color || ''; 
            if (stockInput) stockInput.value = product.stock;
            
            const currentSizes = product.talla ? product.talla.split(',').map(s => s.trim()) : [];
            document.querySelectorAll('.size-checkboxes input[type="checkbox"]').forEach(cb => {
                cb.checked = currentSizes.includes(cb.value);
            });
            
            if (product.imagen_url) this.previewImageUrl(product.imagen_url);
        } else {
            title.textContent = 'Agregar Producto';
            this.currentEditingProduct = null; 
            if (stockInput) stockInput.value = 0;
        }
        
        // MODIFICACIÓN: El código que ocultaba el campo de stock ha sido eliminado.
        // Ahora el campo siempre estará visible y editable.
        if (stockInput) {
             stockInput.readOnly = false;
             stockInput.parentElement.style.display = 'block';
        }

        modal.style.display = 'block';
    }
    closeProductModal() {
        document.getElementById('product-modal').style.display = 'none';
        this.currentEditingProduct = null;
        document.getElementById('product-form').reset();
        const imagePreview = document.getElementById('image-preview');
        if (imagePreview) imagePreview.innerHTML = '';
    }

async handleProductSubmit(e) {
        e.preventDefault();
        
        const nombre = document.getElementById('product-name').value;
        const categoria = document.getElementById('product-category').value;
        const precio = parseFloat(document.getElementById('product-price').value);
        // MODIFICACIÓN 1: Se lee el valor del stock desde el formulario.
        const stock = parseInt(document.getElementById('product-stock').value, 10);
        const imagen_url = document.getElementById('product-image').value;
        const colors = document.getElementById('product-colors').value;

        const sizesChecked = Array.from(document.querySelectorAll('.size-checkboxes input:checked'))
            .map(cb => cb.value);
        
        if (!nombre || !categoria || isNaN(precio)) {
            return this.showNotification('Por favor, completa los campos obligatorios (Nombre, Categoría, Precio).', 'warning');
        }
        if (precio < 0) return this.showNotification('Precio no puede ser negativo.', 'warning');

        // MODIFICACIÓN 2: Se añade una validación para el campo de stock.
        if (isNaN(stock) || stock < 0) {
            return this.showNotification('El stock debe ser un número positivo y válido.', 'warning');
        }

        // MODIFICACIÓN 3: Se incluye el stock en el objeto de datos que se enviará a la base de datos.
        const productData = {
            nombre, categoria, precio,
            stock: stock, // <-- Stock añadido aquí
            imagen_url: imagen_url || null,
            talla: sizesChecked.join(', '),
            color: colors || null,
        };

        try {
            if (this.currentEditingProduct) {
                // Al editar, el objeto 'productData' ya contiene el nuevo stock.
                const { error } = await this.supabase
                    .from('productos')
                    .update(productData) 
                    .eq('id', this.currentEditingProduct);
                if (error) throw error;
                this.showNotification('Producto actualizado.', 'success');
            } else {
                // MODIFICACIÓN 4: Al crear, ya no se fuerza el stock a 0, sino que se usa el valor del formulario.
                const { error } = await this.supabase
                    .from('productos')
                    .insert([productData]);
                if (error) throw error;
                // La notificación ahora muestra el stock inicial real.
                this.showNotification(`Producto agregado. Stock inicial: ${stock}.`, 'success');
            }
            await this.loadProducts();
            this.renderInventory();
            this.renderPOSProducts();
            this.renderCatalog();
            this.closeProductModal();
        } catch (error) {
            console.error("Error guardando producto:", error);
            this.showNotification('Error al guardar producto: ' + error.message, 'error');
        }
    }
    
    
    editProduct(id) { this.openProductModal(id); }

    async deleteProduct(id) {
        const confirmed = await this.showConfirmation('¿Eliminar este producto? Esto es irreversible.');
        if (!confirmed) return;
        try {
            const { error } = await this.supabase.from('productos').delete().eq('id', id);
            if (error) throw error;
            this.showNotification('Producto eliminado.', 'success');
            await this.loadProducts();
            this.renderInventory();
            this.renderPOSProducts();
            this.renderCatalog();
        } catch (err) {
            console.error("Error eliminando producto:", err);
            this.showNotification('Error al eliminar producto: ' + err.message, 'error');
        }
    }
    
    renderInventory() {
        const tbody = document.querySelector('#inventory-table tbody');
        if(!tbody) return;
        tbody.innerHTML = this.products.map(product => `
            <tr>
                <td><img src="${product.imagen_url || 'https://via.placeholder.com/50'}" alt="${product.nombre}" onerror="this.src='https://via.placeholder.com/50'; this.onerror=null;"></td>
                <td>${product.nombre}</td>
                <td>${product.categoria || 'N/A'}</td>
                <td>${this.formatCurrency(product.precio)}</td>
                <td>${product.stock !== undefined ? product.stock : 'N/A'}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="app.editProduct('${product.id}')"><i class="fas fa-edit"></i> Editar</button>
                    <button class="action-btn delete-btn" onclick="app.deleteProduct('${product.id}')"><i class="fas fa-trash"></i> Eliminar</button>
                </td>
            </tr>
        `).join('');
    }

    renderPOSProducts() {
        const container = document.getElementById('pos-products');
        if(!container) return;
        container.innerHTML = '';
        this.products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'pos-product-card';
            card.innerHTML = `
                <img src="${product.imagen_url || 'https://via.placeholder.com/100'}" alt="${product.nombre}" onerror="this.src='https://via.placeholder.com/100'; this.onerror=null;">
                <div class="name">${product.nombre}</div>
                <div class="price">${this.formatCurrency(product.precio)}</div>                <div class="stock">Stock: ${product.stock > 0 ? product.stock : 'Agotado'}</div>
            `;
            if (product.stock > 0) {
                card.addEventListener('click', () => this.addToCart(product));
            } else {
                card.classList.add('disabled');
            }
            container.appendChild(card);
        });
    }
    
    renderCatalog() {
        const container = document.getElementById('catalog-grid');
        if (!container) return;
    
        const categoryFilterVal = document.getElementById('category-filter').value;
        const sizeFilterVal = document.getElementById('size-filter').value;
    
        let displayProducts = this.products;
        if (categoryFilterVal) {
            displayProducts = displayProducts.filter(p => p.categoria === categoryFilterVal);
        }
        if (sizeFilterVal) {
            displayProducts = displayProducts.filter(p => p.talla && p.talla.split(',').map(s => s.trim()).includes(sizeFilterVal));
        }
    
        if (displayProducts.length === 0) {
            container.innerHTML = "<p>No hay productos que coincidan con los filtros.</p>";
            return;
        }
    
        container.innerHTML = displayProducts.map(product => `
            <div class="catalog-card">
                <img src="${product.imagen_url || 'https://via.placeholder.com/200'}" alt="${product.nombre}" onerror="this.src='https://via.placeholder.com/200'; this.onerror=null;">
                <div class="catalog-card-content">
                    <h4 class="catalog-card-name">${product.nombre}</h4>
                    <p class="catalog-card-price">${this.formatCurrency(product.precio)}</p>                    <p class="catalog-card-stock">Stock: ${product.stock > 0 ? product.stock : 'Agotado'}</p>
                    ${product.talla ? `<p class="catalog-card-meta">Tallas: ${product.talla}</p>` : ''}
                    ${product.color ? `<p class="catalog-card-meta">Colores: ${product.color}</p>` : ''}
                </div>
            </div>
        `).join('');
    }
    filterCatalog() { this.renderCatalog(); }

    // app.js - AÑADE ESTOS 4 NUEVOS MÉTODOS A TU CLASE

updateCartItemPrice(index, newPrice) {
    if (this.cart[index]) {
        this.cart[index].precio_venta = parseFloat(newPrice) || 0;
        this.updateCartTotal();
    }
}

addProductToCreditSale(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product || product.stock <= 0) return;

    const existingItem = this.currentCreditSaleItems.find(item => item.id === productId);
    if (!existingItem) {
        this.currentCreditSaleItems.push({ ...product, quantity: 1, precio_venta: product.precio });
    }
    this.updateSelectedCreditProducts();
}

removeCreditItem(productId) {
    this.currentCreditSaleItems = this.currentCreditSaleItems.filter(item => item.id !== productId);
    this.updateSelectedCreditProducts();
}

updateCreditItem(productId, field, value) {
    const item = this.currentCreditSaleItems.find(item => item.id === productId);
    if (!item) return;

    if (field === 'quantity') {
        item.quantity = parseInt(value) || 1;
    } else if (field === 'price') {
        item.precio_venta = parseFloat(value) || 0;
    }
    this.updateSelectedCreditProducts();
}



addToCart(product) {
    const selectedSize = product.selectedSize || 'M'; 
    const selectedColor = product.selectedColor || 'N/A';

    const existingItem = this.cart.find(item => 
        item.id === product.id && item.talla === selectedSize && item.color === selectedColor
    );

    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
        } else {
            return this.showNotification('No hay suficiente stock disponible.', 'warning');
        }
    } else {
        if (product.stock > 0) {
            this.cart.push({ 
                ...product, 
                quantity: 1, 
                precio_venta: product.precio,
                talla: selectedSize, 
                color: selectedColor 
            });
        } else {
            return this.showNotification('Producto sin stock.', 'warning');
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

        if (newQuantity <= 0) this.removeFromCart(index);
        else if (newQuantity <= item.stock) {
            item.quantity = newQuantity;
            this.renderCart(); this.updateCartTotal();
        } else this.showNotification('No hay suficiente stock.', 'warning');
    }

renderCart() {
    const container = document.getElementById('cart-items');
    if (!container) return;

    if (this.cart.length === 0) {
        container.innerHTML = '<p class="empty-cart-message">El carrito está vacío</p>';
        return;
    }

    container.innerHTML = this.cart.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item-info">
                <span class="cart-item-name">${item.nombre}</span>
                <div class="cart-item-price-editor">
                    <label>$</label>
                    <input type="number" class="price-input" value="${item.precio_venta}" 
                           oninput="app.updateCartItemPrice(${index}, this.value)" 
                           step="1000" min="0">
                </div>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" onclick="app.updateQuantity(${index}, -1)">-</button>
                <span class="cart-item-quantity">${item.quantity}</span>
                <button class="qty-btn" onclick="app.updateQuantity(${index}, 1)">+</button>
                <button class="remove-btn" onclick="app.removeFromCart(${index})"><i class="fas fa-times"></i></button>
            </div>
        </div>`).join('');
}


    updateCartTotal() {
    const total = this.cart.reduce((sum, item) => sum + ((item.precio_venta || 0) * item.quantity), 0);
    document.getElementById('cart-total-display').textContent = this.formatCurrency(total);
    document.getElementById('complete-sale').disabled = this.cart.length === 0;
}

    renderBestSellers(bestSellers) {
        const container = document.getElementById('best-sellers-list');
        if(!container) return;
        if (bestSellers.length === 0) {
            container.innerHTML = '<p class="empty-message">No hay datos de ventas para este período.</p>';
            return;
        }
        container.innerHTML = bestSellers.map(product => `
            <div class="best-seller-item">
                <img src="${product.image || 'https://via.placeholder.com/50'}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/50'; this.onerror=null;">
                <div class="best-seller-info">
                    <div class="best-seller-name">${product.name}</div>
<div class="best-seller-sales">${product.quantity} vendidos - ${this.formatCurrency(product.revenue)}</div>
                </div>
            </div>`).join('');
    }
    
    showNotification(message, type = 'success', duration = 3000) {
        const overlay = document.getElementById('notification-overlay');
        const iconEl = document.getElementById('notification-icon');
        const messageEl = document.getElementById('notification-message');
        const buttonsEl = document.getElementById('notification-buttons'); 

        if (!overlay || !iconEl || !messageEl || !buttonsEl) {
            console.error("Elementos de notificación no encontrados.");
            alert(message); 
            return Promise.resolve();
        }
        
        buttonsEl.innerHTML = ''; 

        let iconClass = '';
        switch (type) {
            case 'success': iconClass = 'fas fa-check-circle'; break;
            case 'error': iconClass = 'fas fa-times-circle'; break;
            case 'warning': iconClass = 'fas fa-exclamation-triangle'; break;
            default: iconClass = 'fas fa-info-circle'; break;
        }

        iconEl.className = `notification-icon ${type}`; 
        iconEl.innerHTML = `<i class="${iconClass}"></i>`; 
        messageEl.textContent = message;
        overlay.classList.add('show');

        return new Promise((resolve) => {
            if (type !== 'confirm') { 
                setTimeout(() => {
                    this.closeNotification();
                    resolve(true); 
                }, duration);
            }
        });
    }

    showConfirmation(message) {
        return new Promise((resolve) => {
            const overlay = document.getElementById('notification-overlay');
            const iconEl = document.getElementById('notification-icon');
            const messageEl = document.getElementById('notification-message');
            const buttonsEl = document.getElementById('notification-buttons');

            if (!overlay || !iconEl || !messageEl || !buttonsEl) {
                const confirmed = confirm(message);
                resolve(confirmed);
                return;
            }
            
            this.confirmationResolver = resolve; 

            iconEl.className = 'notification-icon confirm';
            iconEl.innerHTML = '<i class="fas fa-question-circle"></i>';
            messageEl.textContent = message;

            buttonsEl.innerHTML = `
                <button class="notification-btn secondary" id="confirm-cancel-btn-dynamic">Cancelar</button>
                <button class="notification-btn primary" id="confirm-ok-btn-dynamic">Confirmar</button>
            `; 

            document.getElementById('confirm-cancel-btn-dynamic').onclick = () => {
                this.closeNotification();
                if (this.confirmationResolver) this.confirmationResolver(false);
                this.confirmationResolver = null;
            };
            document.getElementById('confirm-ok-btn-dynamic').onclick = () => {
                this.closeNotification();
                if (this.confirmationResolver) this.confirmationResolver(true);
                this.confirmationResolver = null;
            };
            overlay.classList.add('show');
        });
    }
    
    closeNotification() {
        const overlay = document.getElementById('notification-overlay');
        if (overlay) overlay.classList.remove('show');
    }    

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `public/${Date.now()}.${fileExt}`; 
    
            const { error: uploadError } = await this.supabase.storage
                .from('ropa-deportiva') 
                .upload(fileName, file);
            if (uploadError) throw uploadError;
    
            const { data: publicUrlData } = this.supabase.storage
                .from('ropa-deportiva')
                .getPublicUrl(fileName);
            if (!publicUrlData || !publicUrlData.publicUrl) {
                throw new Error("No se pudo obtener la URL pública.");
            }
            document.getElementById('product-image').value = publicUrlData.publicUrl;
            this.previewImageUrl(publicUrlData.publicUrl);
            this.showNotification('Imagen subida.', 'success', 1500);
        } catch (error) {
            console.error("Error subiendo imagen:", error);
            this.showNotification('Error al subir imagen: ' + error.message, 'error');
        }
    }

    previewImageUrl(url) {
        const preview = document.getElementById('image-preview');
        if (!preview) return;
        preview.innerHTML = url ? `<img src="${url}" alt="Vista previa" style="max-width: 100px; max-height: 100px; object-fit: cover;">` : '';
    }

    openCustomerModal(customerId = null) {
        this.currentEditingCustomer = customerId;
        const modal = document.getElementById('customer-modal');
        const form = document.getElementById('customer-form');
        const title = document.getElementById('customer-modal-title');
        form.reset();

        if (customerId) {
            const customer = this.customers.find(c => c.id === customerId);
            if (!customer) return this.showNotification("Cliente no encontrado.", "error");
            title.textContent = 'Editar Cliente';
            document.getElementById('customer-name').value = customer.nombre;
            document.getElementById('customer-phone').value = customer.telefono;
            document.getElementById('customer-address').value = customer.direccion || '';
        } else {
            title.textContent = 'Agregar Cliente';
        }
        modal.style.display = 'block';
    }

    closeCustomerModal() {
        document.getElementById('customer-modal').style.display = 'none';
        this.currentEditingCustomer = null;
    }

    async handleCustomerSubmit(e) {
        e.preventDefault();
        const name = document.getElementById('customer-name').value;
        const phone = document.getElementById('customer-phone').value;
        const address = document.getElementById('customer-address').value;
        if (!name || !phone) return this.showNotification('Nombre y teléfono son obligatorios.', 'warning');
        
        const customerData = { nombre: name, telefono: phone, direccion: address || null };
        try {
            if (this.currentEditingCustomer) {
                const { error } = await this.supabase.from('clientes').update(customerData).eq('id', this.currentEditingCustomer);
                if (error) throw error;
                this.showNotification('Cliente actualizado.', 'success');
            } else {
                const { error } = await this.supabase.from('clientes').insert([customerData]);
                if (error) throw error;
                this.showNotification('Cliente agregado.', 'success');
            }
            await this.loadCustomers();
            this.renderCustomers();
            this.closeCustomerModal();
        } catch (err) {
            console.error("Error guardando cliente:", err);
            this.showNotification('Error al guardar cliente: ' + err.message, 'error');
        }
    }
    editCustomer(id) { this.openCustomerModal(id); }

    async deleteCustomer(id) {
        const confirmed = await this.showConfirmation('¿Eliminar este cliente? Esto también puede afectar ventas a crédito asociadas.');
        if (!confirmed) return;
        try {
            const { error } = await this.supabase.from('clientes').delete().eq('id', id);
            if (error) throw error;
            this.showNotification('Cliente eliminado.', 'success');
            await this.loadCustomers();
            this.renderCustomers();
        } catch (err) {
            console.error("Error eliminando cliente:", err);
            this.showNotification('Error al eliminar cliente: ' + err.message, 'error');
        }
    }

    renderCustomers(customersToRender = this.customers) {
        const container = document.getElementById('customers-grid');
        if (!container) return;
        if (customersToRender.length === 0 && this.customers.length > 0) { 
            container.innerHTML = "<p>No se encontraron clientes con ese criterio.</p>";
            return;
        }
        if (this.customers.length === 0 && customersToRender.length === 0) { 
             container.innerHTML = "<p>No hay clientes registrados. ¡Agrega uno!</p>";
             return;
        }
        container.innerHTML = customersToRender.map(customer => {
    const customerDebts = this.creditSales.filter(sale => sale.cliente_id === customer.id && sale.estado !== 'pagada');
    const totalDebt = customerDebts.reduce((sum, sale) => sum + (sale.saldo_pendiente || 0), 0);
    return `
        <div class="customer-card">
            <div class="customer-info">
                <strong class="customer-name">${customer.nombre}</strong>
                <span class="customer-phone">${customer.telefono}</span>
                <span class="customer-address">${customer.direccion || 'Sin dirección'}</span>
            </div>
            <div class="customer-debt ${totalDebt > 0 ? 'has-debt' : ''}">
                ${totalDebt > 0 ? `Debe: $${totalDebt.toFixed(2)}` : 'Sin deudas'}
            </div>
            <div class="customer-actions">
                <button class="btn-secondary small-btn" onclick="app.editCustomer('${customer.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn-danger small-btn" onclick="app.deleteCustomer('${customer.id}')"><i class="fas fa-trash"></i></button>
                <button class="btn-primary small-btn" onclick="app.generarEstadoCuentaCliente('${customer.id}')">
                    <i class="fas fa-file-pdf"></i> Estado de Cuenta
                </button>
            </div>
        </div>`;
}).join('');

    }
    searchCustomers(query) {
        const lowerQuery = query.toLowerCase();
        const filtered = this.customers.filter(c => c.nombre.toLowerCase().includes(lowerQuery) || (c.telefono && c.telefono.includes(query)));
        this.renderCustomers(filtered);
    }

openCreditSaleModal() {
    const modal = document.getElementById('credit-sale-modal');
    const form = document.getElementById('credit-sale-form');
    form.reset();
    
    this.currentCreditSaleItems = [];
    this.updateSelectedCreditProducts(); // Llama para limpiar la vista
    
    this.populateCreditCustomers();
    this.populateCreditProducts();
    document.getElementById('first-payment-date').valueAsDate = new Date(new Date().setDate(new Date().getDate() + 1));
    modal.style.display = 'block';
}


    closeCreditSaleModal() { document.getElementById('credit-sale-modal').style.display = 'none'; }

    populateCreditCustomers() {
        const select = document.getElementById('credit-customer');
        select.innerHTML = '<option value="">Seleccionar cliente...</option>';
        this.customers.forEach(c => select.innerHTML += `<option value="${c.id}">${c.nombre}</option>`);
    }

populateCreditProducts() {
    const container = document.getElementById('credit-products-selector');
    container.innerHTML = ''; 
    this.products.filter(p => p.stock > 0).forEach(product => {
        container.innerHTML += `
            <div class="credit-product-card" onclick="app.addProductToCreditSale('${product.id}')">
                <img src="${product.imagen_url || 'https://via.placeholder.com/80'}" alt="${product.nombre}" onerror="this.src='https://via.placeholder.com/80';this.onerror=null;">
                <div class="name">${product.nombre}</div>
                <div class="price">${this.formatCurrency(product.precio)}</div>
                <div class="stock">Stock: ${product.stock}</div>
            </div>`;
    });
}


updateSelectedCreditProducts() {
    const displayContainer = document.getElementById('selected-credit-products');
    const totalInput = document.getElementById('credit-total');
    let currentTotal = 0;

    if (this.currentCreditSaleItems.length === 0) {
        displayContainer.innerHTML = '<p class="empty-message">No hay productos seleccionados.</p>';
        totalInput.value = '0.00';
        return;
    }

    displayContainer.innerHTML = this.currentCreditSaleItems.map(item => {
        const subtotal = (item.precio_venta || 0) * item.quantity;
        currentTotal += subtotal;
        return `
            <div class="selected-product-item">
                <span class="product-name">${item.nombre}</span>
                <div class="product-controls">
                    Cant: <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="${item.stock}" oninput="app.updateCreditItem('${item.id}', 'quantity', this.value)">
                    Precio: <input type="number" class="price-input" value="${item.precio_venta}" step="1000" min="0" oninput="app.updateCreditItem('${item.id}', 'price', this.value)">
                    <button class="remove-btn small-btn" onclick="app.removeCreditItem('${item.id}')"><i class="fas fa-times"></i></button>
                </div>
            </div>`;
    }).join('');

    totalInput.value = currentTotal.toFixed(2);
}


async handleCreditSaleSubmit(e) {
    e.preventDefault();
    const customerId = document.getElementById('credit-customer').value;
    const total = parseFloat(document.getElementById('credit-total').value);
    const initialPayment = parseFloat(document.getElementById('initial-payment').value) || 0;
    const firstPaymentDate = document.getElementById('first-payment-date').value;
    
    if (!customerId || this.currentCreditSaleItems.length === 0 || total < 0 || !firstPaymentDate)
        return this.showNotification('Verifica todos los campos: cliente, productos, total y fecha límite.', 'warning');
    if (initialPayment > total) return this.showNotification('Abono inicial no puede ser mayor al total.', 'warning');

    const productsInSale = this.currentCreditSaleItems.map(item => ({
        id: item.id,
        nombre: item.nombre,
        precio: item.precio_venta,
        quantity: item.quantity
    }));

    for (const item of this.currentCreditSaleItems) {
        if (item.quantity > item.stock) {
            return this.showNotification(`Stock insuficiente para ${item.nombre}.`, 'error');
        }
    }
    
    const saleData = {
        cliente_id: customerId,
        productos: JSON.stringify(productsInSale),
        total, 
        abono_inicial: initialPayment,
        saldo_pendiente: total - initialPayment,
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_limite: new Date(firstPaymentDate + 'T00:00:00').toISOString().split('T')[0],
        estado: (total - initialPayment) <= 0 ? 'pagada' : 'pendiente'
    };

    await this.saveCreditSale(saleData); 
    this.closeCreditSaleModal();
}



    renderCreditSales() {
        const container = document.getElementById('credit-sales-list');
        if (!container) return;
        if (this.creditSales.length === 0) {
            container.innerHTML = "<p class='empty-message'>No hay ventas a crédito.</p>"; return;
        }
        container.innerHTML = this.creditSales.map(sale => {
            const customer = sale.clientes; 
            const pagado = (sale.total || 0) - (sale.saldo_pendiente || 0);
            const progress = (sale.total || 0) > 0 ? (pagado / sale.total) * 100 : 0;
            return `
                <div class="credit-sale-card status-${sale.estado}">
                    <div class="credit-sale-header">
                        <span class="customer-name">${customer?.nombre || 'Cliente Desc.'}</span>
                        <span class="status">${sale.estado?.toUpperCase()}</span>
                    </div>
                    <div class="credit-sale-body">
                        <p>Fecha: ${new Date(sale.fecha_inicio + "T00:00:00").toLocaleDateString()} / Límite: ${new Date(sale.fecha_limite + "T00:00:00").toLocaleDateString()}</p>
                        <div class="debt-progress"><div class="debt-progress-bar" style="width: ${progress}%;"></div></div>
<p>Total: ${this.formatCurrency(sale.total)} | Pagado: ${this.formatCurrency(pagado)} | Pendiente: ${this.formatCurrency(sale.saldo_pendiente)}</p>                    </div>
                    <div class="credit-sale-actions">
                        ${sale.estado !== 'pagada' ? `<button class="btn-primary small-btn" onclick="app.openPaymentModal('${sale.id}')"><i class="fas fa-hand-holding-usd"></i> Registrar Abono</button>` : ''}
                    </div>
                </div>`;
        }).join('');
    }



    // app.js - AÑADE ESTE NUEVO MÉTODO A TU CLASE

updateCartItemPrice(index, newPrice) {
    if (this.cart[index]) {
        // Asignamos el nuevo precio de venta, asegurando que sea un número válido.
        this.cart[index].precio_venta = parseFloat(newPrice) || 0;
        // No es necesario volver a renderizar todo el carrito, solo actualizamos el total.
        this.updateCartTotal();
    }
}
    openPaymentModal(saleId) {
        this.currentCreditSale = saleId;
        const modal = document.getElementById('payment-modal');
        const form = document.getElementById('payment-form');
        form.reset();
        const sale = this.creditSales.find(s => s.id === saleId);
        if (!sale) return this.showNotification("Venta no encontrada.", "error");
        
        document.getElementById('debt-info').innerHTML = `
            <h4>Deuda de ${sale.clientes?.nombre || 'Cliente Desc.'}</h4>
<p>Total: ${this.formatCurrency(sale.total)} | Pendiente: ${this.formatCurrency(sale.saldo_pendiente)}</p>            <p>Límite: ${new Date(sale.fecha_limite+"T00:00:00").toLocaleDateString()}</p>`;
        const paymentAmountInput = document.getElementById('payment-amount');
        paymentAmountInput.max = sale.saldo_pendiente;
        paymentAmountInput.value = sale.saldo_pendiente.toFixed(2);
        document.getElementById('payment-date').valueAsDate = new Date();
        modal.style.display = 'block';
    }
    closePaymentModal() { document.getElementById('payment-modal').style.display = 'none'; this.currentCreditSale = null; }

    async handlePaymentSubmit(e) {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('payment-amount').value);
        const date = document.getElementById('payment-date').value;
        const notes = document.getElementById('payment-notes').value;
        const sale = this.creditSales.find(s => s.id === this.currentCreditSale);

        if (isNaN(amount) || amount <= 0) return this.showNotification('Monto debe ser positivo.', 'warning');
        if (sale && amount > sale.saldo_pendiente) return this.showNotification('Abono no puede exceder saldo pendiente.', 'warning');
        
        const paymentData = { venta_id: this.currentCreditSale, monto: amount, fecha_abono: date, notas: notes || null };
        await this.savePayment(paymentData); 
        this.closePaymentModal();
    }
renderPendingDebts() {
        const container = document.getElementById('pending-debts');
        if (!container) return;
        
        const pending = this.creditSales.filter(s => s.estado !== 'pagada');
        
        if (pending.length === 0) {
            container.innerHTML = "<p class='empty-message'>No hay deudas pendientes.</p>";
            return;
        }

        container.innerHTML = pending.map(sale => {
            const customer = sale.clientes;
            const payments = this.payments.filter(p => p.venta_id === sale.id);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = new Date(sale.fecha_limite + "T00:00:00");
            const isOverdue = today > dueDate;
            const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            const isDueSoon = diffDays >= 0 && diffDays <= 3;
            let statusClass = isOverdue ? 'overdue' : (isDueSoon ? 'due-soon' : 'active');
            let statusText = isOverdue ? 'VENCIDA' : (isDueSoon ? `VENCE EN ${diffDays} DÍA(S)` : 'ACTIVA');

            // --- SIMPLIFICACIÓN PARA EVITAR ERRORES ---
            // 1. Generamos el HTML del historial de pagos por separado.
            let paymentHistoryHtml = '<p class="no-payments">Sin abonos aún.</p>';
            if (payments.length > 0) {
                const paymentItems = payments.map(p =>
                    // Usamos la función formatCurrency en cada monto del historial
                    `<div>${new Date(p.fecha_abono + "T00:00:00").toLocaleDateString()}: ${this.formatCurrency(p.monto)}</div>`
                ).join('');

                paymentHistoryHtml = `
                    <div class="payment-history">
                        <h5>Historial:</h5>
                        ${paymentItems}
                    </div>
                `;
            }

            // 2. Ahora, el return principal es mucho más limpio y fácil de leer.
            return `
                <div class="debt-card ${statusClass}">
                    <div class="debt-header">
                        <span class="debt-customer">${customer?.nombre || 'Cliente Desc.'}</span>
                        <span class="debt-status-tag">${statusText}</span>
                    </div>
                    <p>Total: ${this.formatCurrency(sale.total)} | Pendiente: ${this.formatCurrency(sale.saldo_pendiente)} | Límite: ${dueDate.toLocaleDateString()}</p>
                    <button class="btn-primary" onclick="app.openPaymentModal('${sale.id}')"><i class="fas fa-money-bill"></i> Registrar Abono</button>
                    
                    ${paymentHistoryHtml}
                </div>
            `;
        }).join('');
    }    



// app.js - REEMPLAZA POR COMPLETO tu método renderActiveDebts con esta versión

// app.js - REEMPLAZA POR COMPLETO tu método renderActiveDebts con esta versión final y robusta

renderActiveDebts() {
    const container = document.getElementById('active-debts');
    if (!container) return;

    const activeSales = this.creditSales.filter(s => s.estado !== 'pagada');
    if (activeSales.length === 0) {
        container.innerHTML = "<p class='empty-message'>¡Felicidades! No hay deudas activas.</p>";
        return;
    }

    const debtsByCustomer = activeSales.reduce((acc, sale) => {
        const customerId = sale.cliente_id;
        if (!acc[customerId]) {
            // Aseguramos que el objeto 'customer' exista aunque la relación falle
            acc[customerId] = {
                customer: sale.clientes || { id: customerId, nombre: 'Cliente no encontrado' },
                sales: [],
                totalDebt: 0
            };
        }
        acc[customerId].sales.push(sale);
        acc[customerId].totalDebt += sale.saldo_pendiente;
        return acc;
    }, {});

    // Usamos Object.entries para obtener el ID (la clave del objeto) de forma segura
    container.innerHTML = Object.entries(debtsByCustomer).map(([customerId, debtInfo]) => {
        
        const detailsHtml = debtInfo.sales.map(sale => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = new Date(sale.fecha_limite + 'T00:00:00');
            const diffTime = dueDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let dueDateStatus, dueDateClass;
            if (diffDays < 0) {
                dueDateStatus = `Vencida hace ${Math.abs(diffDays)} días`;
                dueDateClass = 'status-overdue';
            } else if (diffDays === 0) {
                dueDateStatus = 'Vence Hoy';
                dueDateClass = 'status-due-today';
            } else {
                dueDateStatus = `Vence en ${diffDays} días`;
                dueDateClass = 'status-pending';
            }

            const salePayments = this.payments.filter(p => p.venta_id === sale.id);
            const totalPaidForSale = salePayments.reduce((sum, p) => sum + p.monto, 0);
            
            const productsHtml = (JSON.parse(sale.productos || '[]')).map(p => 
                `<li class="product-item"><span class="product-item-name">${p.nombre} (x${p.quantity})</span><span class="product-item-subtotal">${this.formatCurrency(p.precio * p.quantity)}</span></li>`
            ).join('');

            const paymentsHtml = salePayments.map(p =>
                `<li class="payment-item"><span class="payment-item-date">Abono el ${new Date(p.fecha_abono + 'T00:00:00').toLocaleDateString()}</span><span class="payment-item-amount">${this.formatCurrency(p.monto)}</span></li>`
            ).join('');

            return `
                <div class="sale-card status-${sale.estado}">
                    <div class="sale-card-header">
                        <h4>Venta del ${new Date(sale.fecha_inicio + 'T00:00:00').toLocaleDateString()}</h4>
                        <span class="status-tag ${dueDateClass}">${dueDateStatus}</span>
                    </div>
                    <div class="sale-card-body">
                        <div class="products-section">
                            <h5>Productos</h5>
                            <ul>${productsHtml}</ul>
                        </div>
                        <div class="payments-section">
                            <h5>Abonos</h5>
                            ${paymentsHtml.length > 0 ? `<ul>${paymentsHtml}</ul>` : '<p style="font-style: italic; font-size: 0.9em; padding: 0.5rem;">Sin abonos para esta venta.</p>'}
                        </div>
                    </div>
                    <div class="sale-card-footer">
                        <div class="footer-totals">
                           <span>Total: ${this.formatCurrency(sale.total)}</span>
                           <span class="saldo">Saldo: ${this.formatCurrency(sale.saldo_pendiente)}</span>
                        </div>
                        <button class="btn-primary small-btn" onclick="event.stopPropagation(); app.openPaymentModal('${sale.id}')">
                            <i class="fas fa-hand-holding-usd"></i> Registrar Abono
                        </button>
                    </div>
                </div>`;
        }).join('');

        return `
            <div class="customer-debt-container">
                <div class="customer-debt-summary" data-customer-id="${customerId}">
                    <span class="customer-name">${debtInfo.customer.nombre}</span>
                    <div class="debt-info">
                        <span class="total-debt">Deuda Total: ${this.formatCurrency(debtInfo.totalDebt)}</span>
                        <i class="fas fa-chevron-down expand-icon"></i>
                    </div>
                </div>
                <div class="customer-debt-details" id="details-for-customer-${customerId}">
                    ${detailsHtml}
                </div>
            </div>
        `;
    }).join('');
}


    updateTrackingSummary() {
        const totalCredit = this.creditSales.reduce((sum, s) => sum + (s.total || 0), 0);
        const totalPending = this.creditSales.reduce((sum, s) => sum + (s.saldo_pendiente || 0), 0);
        document.getElementById('total-credit').textContent = this.formatCurrency(totalCredit);
document.getElementById('total-collected').textContent = this.formatCurrency(totalCredit - totalPending);
document.getElementById('total-pending').textContent = this.formatCurrency(totalPending);
    }
    
    
} // Fin de la clase MariSportApp
function generarPDFEstadoCuenta({ cliente, ventasCliente, abonosCliente }) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString();

    // Encabezado principal
    doc.setFontSize(18);
    doc.text("Estado de Cuenta", 14, 16);
    doc.setFontSize(12);
    doc.text("Mari Sport", 14, 24);
    doc.setFontSize(11);
    doc.text(`Fecha: ${today}`, 150, 16);

    // Info cliente
    let y = 33;
    doc.setFontSize(12);
    doc.text(`Cliente: ${cliente.nombre || ''}`, 14, y);
    y += 7;
    doc.text(`Teléfono: ${cliente.telefono || 'N/A'}`, 14, y);
    y += 7;
    doc.text(`Dirección: ${cliente.direccion || 'N/A'}`, 14, y);
    y += 10;

    ventasCliente.forEach((venta, idx) => {
        doc.setFontSize(12);
        doc.setTextColor(54, 162, 235);
        doc.text(`${idx + 1}. Venta fiada: ${venta.fecha_inicio}  |  Estado: ${venta.estado?.toUpperCase() || ''}`, 14, y);
        y += 6;
        doc.setFontSize(11);
        doc.setTextColor(60, 60, 60);

        // TABLA de productos
        let productos = [];
        try {
            productos = Array.isArray(venta.productos_parsed) ? venta.productos_parsed : JSON.parse(venta.productos || "[]");
        } catch (e) { productos = []; }

        doc.autoTable({
            head: [["Producto", "Cantidad", "Precio U.", "Subtotal"]],
            body: productos.map(p => [
                p.nombre,
                p.quantity,
                `$${Number(p.precio).toFixed(2)}`,
                `$${(Number(p.precio) * Number(p.quantity)).toFixed(2)}`
            ]),
            startY: y,
            theme: 'grid',
            headStyles: { fillColor: [54, 162, 235], halign: 'center' },
            bodyStyles: { halign: 'center' },
            margin: { left: 18, right: 12 },
            styles: { fontSize: 10 }
        });

        y = doc.autoTable.previous.finalY + 4;

        // Totales venta
        doc.setFontSize(11);
        doc.setTextColor(20, 20, 20);
        doc.text(`Total: $${Number(venta.total).toFixed(2)}   |   Abono inicial: $${Number(venta.abono_inicial).toFixed(2)}   |   Saldo pendiente: $${Number(venta.saldo_pendiente).toFixed(2)}`, 18, y);
        y += 7;

        // Historial de abonos
        const abonosVenta = abonosCliente.filter(a => a.venta_id === venta.id);
        if (abonosVenta.length > 0) {
            doc.setFontSize(10);
            doc.setTextColor(0, 120, 0);
            doc.text("Abonos:", 22, y);
            abonosVenta.forEach((abono, ai) => {
                doc.text(`${abono.fecha_abono}: $${Number(abono.monto).toFixed(2)}`, 40, y);
                y += 5;
            });
        }
        y += 7;
        doc.setTextColor(0, 0, 0);
        // Salto de página si se pasa
        if (y > 260) { doc.addPage(); y = 20; }
    });

    doc.save(`estado-cuenta-${cliente.nombre.replace(/ /g, '_')}-${today.replace(/\//g, '-')}.pdf`);
}


//---------------------------------------------------------------------------------------------//

        
       function generarPDFAbono({ cliente, sale, abono, abonos }) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString();

    doc.setFontSize(18);
    doc.text("Comprobante de Abono", 14, 16);
    doc.setFontSize(12);
    doc.text("Mari Sport", 14, 24);
    doc.setFontSize(11);
    doc.text(`Fecha emisión: ${today}`, 150, 16);

    doc.setFontSize(12);
    doc.text(`Cliente: ${cliente?.nombre || ''}`, 14, 34);
    doc.text(`Teléfono: ${cliente?.telefono || 'N/A'}`, 14, 40);

    doc.setFontSize(11);
    doc.text(`Venta a crédito: ${sale.fecha_inicio}`, 14, 47);

    doc.setFontSize(12);
    doc.setTextColor(0, 120, 0);
    doc.text(`ABONO REALIZADO: $${Number(abono.monto).toFixed(2)} (${abono.fecha_abono})`, 14, 56);

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Saldo pendiente actual: $${Number(sale.saldo_pendiente).toFixed(2)}`, 14, 65);

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text("Historial de abonos:", 14, 72);

    let y = 78;
    abonos.forEach((a, i) => {
        doc.text(`${i + 1}. ${a.fecha_abono}: $${Number(a.monto).toFixed(2)}`, 20, y);
        y += 5;
        if (y > 260) { doc.addPage(); y = 20; }
    });

    doc.save(`abono-marisport-${today.replace(/\//g, '-')}.pdf`);
}
//-----------------------------------------------------------------------------------------------//

function generarPDFVenta({ productos, cliente = null, total, fecha, tipo = 'contado', abono_inicial = 0, saldo_pendiente = 0 }) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString();

    doc.setFontSize(18);
    doc.text("Comprobante de Venta", 14, 16);
    doc.setFontSize(12);
    doc.text("Mari Sport", 14, 24);
    doc.setFontSize(11);
    doc.text(`Fecha emisión: ${today}`, 150, 16);

    if (cliente) {
        doc.setFontSize(12);
        doc.text(`Cliente: ${cliente.nombre || ''}`, 14, 34);
        doc.text(`Teléfono: ${cliente.telefono || ''}`, 14, 40);
    }
    doc.setFontSize(11);
    doc.text(`Tipo: ${tipo === 'credito' ? 'Venta a Crédito' : 'Contado'}`, 14, 48);

    doc.autoTable({
        head: [["Producto", "Cantidad", "Precio U.", "Subtotal"]],
        body: productos.map(p => [
            p.nombre,
            p.quantity,
            `$${Number(p.precio).toFixed(2)}`,
            `$${(Number(p.precio) * Number(p.quantity)).toFixed(2)}`
        ]),
        startY: 54,
        theme: 'grid',
        headStyles: { fillColor: [54, 162, 235], halign: 'center' },
        bodyStyles: { halign: 'center' },
        margin: { left: 18, right: 12 },
        styles: { fontSize: 10 }
    });

    let y = doc.autoTable.previous.finalY + 7;
    doc.setFontSize(12);
    doc.text(`Total: $${Number(total).toFixed(2)}`, 14, y);

    if (tipo === 'credito') {
        doc.text(`Abono inicial: $${Number(abono_inicial).toFixed(2)}`, 14, y + 7);
        doc.text(`Saldo pendiente: $${Number(saldo_pendiente).toFixed(2)}`, 14, y + 14);
    }

    doc.save(`venta-marisport-${today.replace(/\//g, '-')}.pdf`);
}



document.addEventListener('DOMContentLoaded', () => {
    window.app = new MariSportApp();
});
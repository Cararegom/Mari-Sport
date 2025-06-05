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

        // NUEVO: Historial de Compras
        const viewAllPurchasesBtn = document.getElementById('view-all-purchases-btn');
        if (viewAllPurchasesBtn) viewAllPurchasesBtn.addEventListener('click', () => this.toggleAllPurchasesView());


        // Cierre de modales al hacer clic fuera
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    // --- Métodos de Navegación ---
    switchSection(sectionId) {
        document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
        document.querySelector(`.nav-tab[data-section="${sectionId}"]`).classList.add('active');
        document.getElementById(sectionId).classList.add('active');
        if (sectionId === 'stats') this.updateStats();
        if (sectionId === 'catalog') this.renderCatalog(); 
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

    // --- Gestión de Compras (Mercancía) ---
    async loadPurchases() {
        try {
            const { data, error } = await this.supabase
                .from('compras')
                .select(`
                    *,
                    productos:producto_id (nombre, imagen_url)
                `)
                .order('fecha_compra', { ascending: false });

            if (error) {
                console.error("Error en loadPurchases Supabase:", error);
                throw error;
            }
            this.purchases = data || [];
        } catch (error) {
            this.showNotification('Error al cargar compras: ' + error.message, 'error');
            console.error("Error detallado al cargar compras:", error);
            this.purchases = [];
        }
    }

    openPurchaseModal() {
        const modal = document.getElementById('purchase-modal');
        if (!modal) return;
        document.getElementById('purchase-form').reset();
        this.populateProductsForPurchaseModal();
        document.getElementById('purchase-date').valueAsDate = new Date();
        modal.style.display = 'block';
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

    async handlePurchaseSubmit(e) {
        e.preventDefault();
        const productoId = document.getElementById('purchase-product').value;
        const cantidadComprada = parseInt(document.getElementById('purchase-quantity').value);
        const precioCompraUnitario = parseFloat(document.getElementById('purchase-cost-price').value);
        const fechaCompra = document.getElementById('purchase-date').value;
        const proveedor = document.getElementById('purchase-supplier').value;
        const notasCompra = document.getElementById('purchase-notes').value;

        if (!productoId || !cantidadComprada || isNaN(precioCompraUnitario) || !fechaCompra) {
            return this.showNotification('Completa los campos obligatorios (Producto, Cantidad, Precio, Fecha).', 'warning');
        }
        if (cantidadComprada <= 0 || precioCompraUnitario < 0) {
            return this.showNotification('Cantidad y Precio deben ser positivos.', 'warning');
        }

        const purchaseData = {
            producto_id: productoId,
            cantidad_comprada: cantidadComprada,
            precio_compra_unitario: precioCompraUnitario,
            fecha_compra: fechaCompra,
            proveedor: proveedor || null,
            notas_compra: notasCompra || null,
            cantidad_recibida: 0, 
            estado_recepcion: 'pendiente'
        };

        try {
            const { data: savedPurchase, error: purchaseError } = await this.supabase
                .from('compras')
                .insert([purchaseData])
                .select()
                .single();

            if (purchaseError) throw purchaseError;

            const totalPurchaseCost = cantidadComprada * precioCompraUnitario;
            const product = this.products.find(p => p.id === productoId);
            
            console.log("Registrando egreso:", { // Log para depuración
                tipo: 'egreso',
                descripcion: `Compra de: ${product ? product.nombre : 'Producto ID ' + productoId}`,
                monto: totalPurchaseCost,
                fecha: fechaCompra,
                referencia_id: savedPurchase.id,
                tabla_referencia: 'compras'
            });

            const { error: movementError } = await this.supabase
                .from('movimientos_financieros')
                .insert([{
                    tipo: 'egreso',
                    descripcion: `Compra de: ${product ? product.nombre : 'Producto ID ' + productoId}`,
                    monto: totalPurchaseCost,
                    fecha: fechaCompra,
                    referencia_id: savedPurchase.id,
                    tabla_referencia: 'compras'
                }]);
            
            if (movementError) {
                console.error("Error al registrar egreso financiero:", movementError);
                // No lanzar error aquí para que la compra se considere registrada, pero notificar
                this.showNotification('Compra registrada, pero hubo un error al registrar el egreso: ' + movementError.message, 'warning');
            } else {
                 console.log("Egreso registrado con éxito.");
            }

            await this.loadPurchases();
            await this.loadFinancialMovements(); // Es crucial recargar esto
            this.updateStats(); 

            this.showNotification('Compra registrada. Pendiente de recepción.', 'success');
            this.closePurchaseModal();
        } catch (error) {
            console.error("Error en handlePurchaseSubmit:", error);
            this.showNotification('Error al registrar la compra: ' + error.message, 'error');
        }
    }
    
    // --- NUEVO: Historial de Todas las Compras ---
    toggleAllPurchasesView() {
        const container = document.getElementById('all-purchases-container');
        if (container) {
            if (container.style.display === 'none' || container.style.display === '') {
                this.renderAllPurchases();
                container.style.display = 'block';
                document.getElementById('view-all-purchases-btn').innerHTML = '<i class="fas fa-eye-slash"></i> Ocultar Historial';
            } else {
                container.style.display = 'none';
                document.getElementById('view-all-purchases-btn').innerHTML = '<i class="fas fa-history"></i> Ver Historial de Compras';
            }
        }
    }

    async renderAllPurchases() {
        const tbody = document.getElementById('all-purchases-list');
        if (!tbody) {
            console.error("Contenedor de lista de todas las compras no encontrado.");
            return;
        }

        if (!this.purchases || this.purchases.length === 0) {
            // Forzar recarga si está vacío por si acaso
            console.log("No hay compras en this.purchases, intentando recargar...");
            await this.loadPurchases(); 
        }
        
        // Verificar si después de la recarga sigue vacío o si falta info de productos
         if (this.purchases.some(p => p.producto_id && !p.productos)) { 
            console.log("Algunas compras no tienen datos de producto anidados, recargando compras...");
            await this.loadPurchases(); // Asegura que el join se haya hecho
        }


        if (this.purchases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">No hay compras registradas.</td></tr>';
            return;
        }

        tbody.innerHTML = this.purchases.map(purchase => {
            const productName = purchase.productos?.nombre || `ID: ${purchase.producto_id || 'N/A'}`;
            const totalCost = (purchase.cantidad_comprada * purchase.precio_compra_unitario).toFixed(2);
            return `
                <tr>
                    <td>${productName}</td>
                    <td>${new Date(purchase.fecha_compra + "T00:00:00").toLocaleDateString()}</td>
                    <td>${purchase.proveedor || 'N/A'}</td>
                    <td>${purchase.cantidad_comprada}</td>
                    <td>$${parseFloat(purchase.precio_compra_unitario).toFixed(2)}</td>
                    <td>$${totalCost}</td>
                    <td>${purchase.cantidad_recibida}</td>
                    <td><span class="status-${purchase.estado_recepcion}">${purchase.estado_recepcion ? purchase.estado_recepcion.replace('_', ' ').toUpperCase() : 'N/A'}</span></td>
                    <td>${purchase.fecha_ultima_recepcion ? new Date(purchase.fecha_ultima_recepcion + "T00:00:00").toLocaleDateString() : 'N/A'}</td>
                </tr>
            `;
        }).join('');
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

    async renderPendingReceptionsList() {
        const listContainer = document.getElementById('pending-receptions-list');
        if (!listContainer) return;
        
        if (this.purchases.some(p => p.producto_id && !p.productos)) { 
            await this.loadPurchases();
        }

        const filterValue = document.getElementById('reception-status-filter').value;
        let filteredPurchases;

        if (filterValue) {
            filteredPurchases = this.purchases.filter(p => p.estado_recepcion === filterValue);
        } else { // Mostrar todas por defecto si el filtro está vacío (para 'Todas' en el select)
            filteredPurchases = this.purchases; 
        }


        if (filteredPurchases.length === 0) {
            listContainer.innerHTML = "<p>No hay compras que cumplan con el filtro.</p>";
            return;
        }

        let html = `
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
        `;
        filteredPurchases.forEach(purchase => {
            const productName = purchase.productos?.nombre || `ID: ${purchase.producto_id || 'N/A'}`;
            const qtyPending = purchase.cantidad_comprada - purchase.cantidad_recibida;
            html += `
                <tr>
                    <td>${productName}</td>
                    <td>${new Date(purchase.fecha_compra  + "T00:00:00").toLocaleDateString()}</td>
                    <td>${purchase.cantidad_comprada}</td>
                    <td>${purchase.cantidad_recibida}</td>
                    <td><span class="status-${purchase.estado_recepcion}">${purchase.estado_recepcion ? purchase.estado_recepcion.replace('_', ' ').toUpperCase() : 'N/A'}</span></td>
                    <td>
                        ${purchase.estado_recepcion !== 'recibida_total' ? 
                        `<button class="btn-primary small-btn" onclick="app.openReceivePurchaseModal('${purchase.id}')">
                            <i class="fas fa-dolly"></i> Recibir (${qtyPending > 0 ? qtyPending + ' pend.' : ''})
                         </button>` : 
                        'Completada'}
                    </td>
                </tr>
            `;
        });
        html += `</tbody></table>`;
        listContainer.innerHTML = html;
    }

    openReceivePurchaseModal(purchaseId) {
        this.currentReceivingPurchase = this.purchases.find(p => p.id === purchaseId);
        if (!this.currentReceivingPurchase) {
            return this.showNotification("Compra no encontrada.", "error");
        }

        const modal = document.getElementById('receive-purchase-modal');
        if (!modal) return;

        const productInfoEl = document.getElementById('receive-product-info');
        const productName = this.currentReceivingPurchase.productos?.nombre || `ID: ${this.currentReceivingPurchase.producto_id || 'N/A'}`;
        productInfoEl.innerHTML = `<strong>Producto:</strong> ${productName}<br>
                                   <strong>Proveedor:</strong> ${this.currentReceivingPurchase.proveedor || 'N/A'}`;
        
        document.getElementById('receive-purchase-id').value = purchaseId;
        document.getElementById('receive-quantity-ordered').value = this.currentReceivingPurchase.cantidad_comprada;
        document.getElementById('receive-quantity-already-received').value = this.currentReceivingPurchase.cantidad_recibida;
        
        const quantityToReceiveInput = document.getElementById('receive-quantity-now');
        const maxReceivable = this.currentReceivingPurchase.cantidad_comprada - this.currentReceivingPurchase.cantidad_recibida;
        quantityToReceiveInput.value = maxReceivable > 0 ? maxReceivable : 0; // Evitar negativo si ya se recibió todo por error
        quantityToReceiveInput.max = maxReceivable;
        quantityToReceiveInput.min = 0;

        document.getElementById('receive-date').valueAsDate = new Date();
        document.getElementById('receive-notes').value = this.currentReceivingPurchase.notas_recepcion || '';
        
        modal.style.display = 'block';
    }

    closeReceivePurchaseModal() {
        const modal = document.getElementById('receive-purchase-modal');
        if (modal) modal.style.display = 'none';
        this.currentReceivingPurchase = null;
    }

    async handleReceivePurchaseSubmit(e) {
        e.preventDefault();
        if (!this.currentReceivingPurchase) return;

        const purchaseId = document.getElementById('receive-purchase-id').value;
        const cantidadARecibirAhora = parseInt(document.getElementById('receive-quantity-now').value);
        const fechaRecepcion = document.getElementById('receive-date').value;
        const notasRecepcion = document.getElementById('receive-notes').value;

        const maxReceivable = this.currentReceivingPurchase.cantidad_comprada - this.currentReceivingPurchase.cantidad_recibida;

        if (isNaN(cantidadARecibirAhora) || cantidadARecibirAhora < 0) {
            return this.showNotification(`La cantidad a recibir no puede ser negativa.`, 'warning');
        }
        if (cantidadARecibirAhora > maxReceivable) {
             return this.showNotification(`No puedes recibir más de lo pendiente (${maxReceivable}).`, 'warning');
        }
        if (!fechaRecepcion) {
            return this.showNotification("La fecha de recepción es obligatoria.", "warning");
        }

        try {
            if (cantidadARecibirAhora > 0) {
                const productToUpdate = this.products.find(p => p.id === this.currentReceivingPurchase.producto_id);
                if (!productToUpdate) throw new Error("Producto asociado a la compra no encontrado para actualizar stock.");
                
                const newStock = productToUpdate.stock + cantidadARecibirAhora;
                const { error: stockUpdateError } = await this.supabase
                    .from('productos')
                    .update({ stock: newStock })
                    .eq('id', this.currentReceivingPurchase.producto_id);
                if (stockUpdateError) throw stockUpdateError;
                productToUpdate.stock = newStock; 
            }
            
            const nuevaCantidadRecibidaTotal = this.currentReceivingPurchase.cantidad_recibida + cantidadARecibirAhora;
            let nuevoEstadoRecepcion = this.currentReceivingPurchase.estado_recepcion;
            if (nuevaCantidadRecibidaTotal >= this.currentReceivingPurchase.cantidad_comprada) {
                nuevoEstadoRecepcion = 'recibida_total';
            } else if (nuevaCantidadRecibidaTotal > 0) {
                nuevoEstadoRecepcion = 'recibida_parcial';
            } else { // Si sigue siendo 0 y se intentó recibir 0, se queda en pendiente.
                 nuevoEstadoRecepcion = 'pendiente';
            }

            const updateData = {
                cantidad_recibida: nuevaCantidadRecibidaTotal,
                estado_recepcion: nuevoEstadoRecepcion,
                notas_recepcion: notasRecepcion
            };
            if (cantidadARecibirAhora > 0 || !this.currentReceivingPurchase.fecha_ultima_recepcion) { // Actualizar fecha si se recibe algo o si es la primera vez
                updateData.fecha_ultima_recepcion = fechaRecepcion;
            }


            const { error: purchaseUpdateError } = await this.supabase
                .from('compras')
                .update(updateData)
                .eq('id', purchaseId);
            if (purchaseUpdateError) throw purchaseUpdateError;

            this.showNotification('Recepción registrada y stock actualizado.', 'success');
            
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

    async saveSale(saleData) { 
        try {
            const saleItems = JSON.parse(saleData.productos);
            const newVentasRecords = saleItems.map(item => ({
                producto_id: item.id,
                cantidad: item.quantity,
                total: item.precio * item.quantity,
                fecha: new Date(saleData.fecha).toISOString(),
                forma_pago: saleData.forma_pago,
                pagado: true, 
            }));

            const { data: insertedSales, error: salesError } = await this.supabase
                .from('ventas')
                .insert(newVentasRecords)
                .select();
            if (salesError) throw salesError;

            const financialMovementData = {
                tipo: 'ingreso',
                descripcion: `Venta POS (${saleData.forma_pago})`,
                monto: saleData.total, 
                fecha: new Date(saleData.fecha).toISOString(),
            };
            const { error: movementError } = await this.supabase
                .from('movimientos_financieros')
                .insert([financialMovementData]);
            if (movementError) {
                console.error("Error registrando ingreso por venta POS:", movementError);
                this.showNotification('Venta guardada, pero error registrando ingreso financiero.', 'warning');
            }

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
                .select(`*, clientes(nombre, telefono)`)
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

            await this.loadCreditSales();
            await this.loadPayments();
            await this.loadFinancialMovements();
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
        const total = this.cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);

        for (const item of this.cart) {
            const productInDb = this.products.find(p => p.id === item.id);
            if (!productInDb || productInDb.stock < item.quantity) {
                 return this.showNotification(`Stock insuficiente para ${item.nombre}. Disponible: ${productInDb?.stock || 0}`, 'error');
            }
        }
        
        const saleData = {
            productos: JSON.stringify(this.cart.map(item => ({
                id: item.id, nombre: item.nombre, precio: item.precio,
                quantity: item.quantity, talla: item.talla, color: item.color
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
        const statsPeriodEl = document.getElementById('stats-period');
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

        document.getElementById('total-sales').textContent = `$${totalIngresos.toFixed(2)}`; 
        const totalExpensesEl = document.getElementById('total-expenses');
        if (totalExpensesEl) totalExpensesEl.textContent = `$${totalEgresos.toFixed(2)}`;
        const generalBalanceEl = document.getElementById('general-balance');
        if (generalBalanceEl) generalBalanceEl.textContent = `$${balanceGeneral.toFixed(2)}`;
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
        const stockInput = document.getElementById('product-stock'); // Obtener el input de stock

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
            if (stockInput) stockInput.value = product.stock; // Mostrar stock actual
            
            const currentSizes = product.talla ? product.talla.split(',').map(s => s.trim()) : [];
            document.querySelectorAll('.size-checkboxes input[type="checkbox"]').forEach(cb => {
                cb.checked = currentSizes.includes(cb.value);
            });
            
            if (product.imagen_url) this.previewImageUrl(product.imagen_url);
        } else {
            title.textContent = 'Agregar Producto';
            this.currentEditingProduct = null; 
            if (stockInput) stockInput.value = 0; // Stock 0 para nuevos productos
        }
        // Ocultar o deshabilitar el campo de stock en el modal de producto si se gestiona por recepciones
        if (stockInput) {
             stockInput.readOnly = true; // Hacerlo de solo lectura
             stockInput.parentElement.style.display = 'none'; // Ocultarlo
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
        const imagen_url = document.getElementById('product-image').value;
        const colors = document.getElementById('product-colors').value;

        const sizesChecked = Array.from(document.querySelectorAll('.size-checkboxes input:checked'))
            .map(cb => cb.value);
        
        if (!nombre || !categoria || isNaN(precio)) {
            return this.showNotification('Por favor, completa los campos obligatorios (Nombre, Categoría, Precio).', 'warning');
        }
        if (precio < 0) return this.showNotification('Precio no puede ser negativo.', 'warning');

        const productData = {
            nombre, categoria, precio,
            imagen_url: imagen_url || null,
            talla: sizesChecked.join(', '),
            color: colors || null,
        };

        try {
            if (this.currentEditingProduct) { 
                const { error } = await this.supabase
                    .from('productos')
                    .update(productData) 
                    .eq('id', this.currentEditingProduct);
                if (error) throw error;
                this.showNotification('Producto actualizado.', 'success');
            } else { 
                productData.stock = 0; 
                const { error } = await this.supabase
                    .from('productos')
                    .insert([productData]);
                if (error) throw error;
                this.showNotification('Producto agregado. Stock inicial: 0.', 'success');
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
                <td>$${product.precio ? product.precio.toFixed(2) : '0.00'}</td>
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
                <div class="price">$${product.precio ? product.precio.toFixed(2) : '0.00'}</div>
                <div class="stock">Stock: ${product.stock > 0 ? product.stock : 'Agotado'}</div>
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
                    <p class="catalog-card-price">$${product.precio ? product.precio.toFixed(2) : '0.00'}</p>
                    <p class="catalog-card-stock">Stock: ${product.stock > 0 ? product.stock : 'Agotado'}</p>
                    ${product.talla ? `<p class="catalog-card-meta">Tallas: ${product.talla}</p>` : ''}
                    ${product.color ? `<p class="catalog-card-meta">Colores: ${product.color}</p>` : ''}
                </div>
            </div>
        `).join('');
    }
    filterCatalog() { this.renderCatalog(); }

    addToCart(product) {
        const selectedSize = product.selectedSize || 'M'; 
        const selectedColor = product.selectedColor || 'N/A';

        const existingItem = this.cart.find(item => 
            item.id === product.id && item.talla === selectedSize && item.color === selectedColor
        );

        if (existingItem) {
            if (existingItem.quantity < product.stock) existingItem.quantity++;
            else return this.showNotification('No hay suficiente stock disponible.', 'warning');
        } else {
            if (product.stock > 0) {
                this.cart.push({ ...product, quantity: 1, talla: selectedSize, color: selectedColor });
            } else return this.showNotification('Producto sin stock.', 'warning');
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
        if(!container) return;
        if (this.cart.length === 0) {
            container.innerHTML = '<p class="empty-cart-message">El carrito está vacío</p>';
            return;
        }
        container.innerHTML = this.cart.map((item, index) => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <span class="cart-item-name">${item.nombre}</span>
                    <span class="cart-item-details">$${item.precio ? item.precio.toFixed(2) : '0.00'} ${item.talla ? `- ${item.talla}` : ''} ${item.color ? `- ${item.color}` : ''}</span>
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
        const total = this.cart.reduce((sum, item) => sum + ((item.precio || 0) * item.quantity), 0);
        document.getElementById('cart-total').textContent = total.toFixed(2);
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
                    <div class="best-seller-sales">${product.quantity} vendidos - $${product.revenue ? product.revenue.toFixed(2) : '0.00'}</div>
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
        document.getElementById('selected-credit-products').innerHTML = '<p class="empty-message">No hay productos seleccionados.</p>';
        document.getElementById('credit-total').value = '0.00';
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
                <div class="credit-product-card" data-product-id="${product.id}">
                    <img src="${product.imagen_url || 'https://via.placeholder.com/80'}" alt="${product.nombre}" onerror="this.src='https://via.placeholder.com/80';this.onerror=null;">
                    <div class="name">${product.nombre}</div>
                    <div class="price">$${product.precio ? product.precio.toFixed(2) : '0.00'}</div>
                    <div class="stock">Stock: ${product.stock}</div>
                    <input type="number" class="credit-product-quantity" value="1" min="1" max="${product.stock}">
                </div>`;
        });
    }
    updateSelectedCreditProducts() {
        const selectedCards = document.querySelectorAll('#credit-products-selector .credit-product-card.selected');
        const displayContainer = document.getElementById('selected-credit-products');
        const totalInput = document.getElementById('credit-total');
        let currentTotal = 0;
        let productsHtml = '';

        selectedCards.forEach(card => {
            const product = this.products.find(p => p.id === card.dataset.productId);
            if (!product) return;
            const quantityInput = card.querySelector('.credit-product-quantity');
            let quantity = parseInt(quantityInput.value);

            if (isNaN(quantity) || quantity < 1) quantity = 1;
            if (quantity > product.stock) {
                quantity = product.stock;
                this.showNotification(`Stock máximo para ${product.nombre} es ${product.stock}.`, 'warning', 2000);
            }
            quantityInput.value = quantity; 

            currentTotal += (product.precio || 0) * quantity;
            productsHtml += `
                <div class="selected-product-item">
                    <span>${product.nombre} (x${quantity})</span>
                    <span>$${((product.precio || 0) * quantity).toFixed(2)}</span>
                </div>`;
        });
        displayContainer.innerHTML = productsHtml || '<p class="empty-message">No hay productos seleccionados.</p>';
        totalInput.value = currentTotal.toFixed(2);
    }
    async handleCreditSaleSubmit(e) {
        e.preventDefault();
        const customerId = document.getElementById('credit-customer').value;
        const total = parseFloat(document.getElementById('credit-total').value);
        const initialPayment = parseFloat(document.getElementById('initial-payment').value) || 0;
        const firstPaymentDate = document.getElementById('first-payment-date').value;
        const termType = document.getElementById('payment-term-type').value;
        const termValue = parseInt(document.getElementById('payment-term-value').value);
        const selectedCards = document.querySelectorAll('#credit-products-selector .credit-product-card.selected');

        if (!customerId || selectedCards.length === 0 || total <= 0 || !firstPaymentDate || !termValue || termValue < 1)
            return this.showNotification('Verifica todos los campos: cliente, productos, total, fecha y plazo.', 'warning');
        if (initialPayment > total) return this.showNotification('Abono inicial no puede ser mayor al total.', 'warning');

        const dueDate = new Date(firstPaymentDate + "T00:00:00");
        if (termType === 'days') dueDate.setDate(dueDate.getDate() + termValue);
        else dueDate.setMonth(dueDate.getMonth() + termValue);

        const productsInSale = [];
        for (const card of selectedCards) {
            const product = this.products.find(p => p.id === card.dataset.productId);
            const quantity = parseInt(card.querySelector('.credit-product-quantity').value);
            if (product && quantity > 0) {
                if (quantity > product.stock) return this.showNotification(`Stock insuficiente para ${product.nombre}.`, 'error');
                productsInSale.push({ id: product.id, nombre: product.nombre, precio: product.precio, quantity });
            }
        }
        if (productsInSale.length === 0) return this.showNotification('No se procesaron productos.', 'error');

        const saleData = {
            cliente_id: customerId,
            productos: JSON.stringify(productsInSale),
            total, abono_inicial: initialPayment,
            saldo_pendiente: total - initialPayment,
            fecha_inicio: new Date().toISOString().split('T')[0],
            fecha_limite: dueDate.toISOString().split('T')[0],
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
                        <p>Total: $${(sale.total || 0).toFixed(2)} | Pagado: $${pagado.toFixed(2)} | Pendiente: $${(sale.saldo_pendiente || 0).toFixed(2)}</p>
                    </div>
                    <div class="credit-sale-actions">
                        ${sale.estado !== 'pagada' ? `<button class="btn-primary small-btn" onclick="app.openPaymentModal('${sale.id}')"><i class="fas fa-hand-holding-usd"></i> Registrar Abono</button>` : ''}
                    </div>
                </div>`;
        }).join('');
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
            <p>Total: $${(sale.total||0).toFixed(2)} | Pendiente: $${(sale.saldo_pendiente||0).toFixed(2)}</p>
            <p>Límite: ${new Date(sale.fecha_limite+"T00:00:00").toLocaleDateString()}</p>`;
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
            container.innerHTML = "<p class='empty-message'>No hay deudas pendientes.</p>"; return;
        }
        container.innerHTML = pending.map(sale => {
            const customer = sale.clientes;
            const payments = this.payments.filter(p => p.venta_id === sale.id);
            const today = new Date(); today.setHours(0,0,0,0);
            const dueDate = new Date(sale.fecha_limite+"T00:00:00");
            const isOverdue = today > dueDate;
            const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            const isDueSoon = diffDays >= 0 && diffDays <= 3;
            let statusClass = isOverdue ? 'overdue' : (isDueSoon ? 'due-soon' : 'active');
            let statusText = isOverdue ? 'VENCIDA' : (isDueSoon ? `VENCE EN ${diffDays} DÍA(S)` : 'ACTIVA');

            return `
                <div class="debt-card ${statusClass}">
                    <div class="debt-header">
                        <span class="debt-customer">${customer?.nombre || 'Cliente Desc.'}</span>
                        <span class="debt-status-tag">${statusText}</span>
                    </div>
                    <p>Total: $${(sale.total||0).toFixed(2)} | Pendiente: $${(sale.saldo_pendiente||0).toFixed(2)} | Límite: ${dueDate.toLocaleDateString()}</p>
                    <button class="btn-primary" onclick="app.openPaymentModal('${sale.id}')"><i class="fas fa-money-bill"></i> Registrar Abono</button>
                    ${payments.length > 0 ? `
                        <div class="payment-history">
                            <h5>Historial:</h5>
                            ${payments.map(p => `<div>${new Date(p.fecha_abono+"T00:00:00").toLocaleDateString()}: $${(p.monto||0).toFixed(2)}</div>`).join('')}
                        </div>` 
                    : '<p class="no-payments">Sin abonos aún.</p>'}
                </div>`;
        }).join('');
    }
    renderActiveDebts() { 
        const container = document.getElementById('active-debts');
        if (!container) return;
        const active = this.creditSales.filter(s => s.estado !== 'pagada');
        if (active.length === 0) {
            container.innerHTML = "<p class='empty-message'>No hay deudas activas.</p>"; return;
        }
        container.innerHTML = active.map(sale => `
            <div class="debt-card simple status-${sale.estado}">
                <span class="debt-customer">${sale.clientes?.nombre || 'Cliente Desc.'}</span>
                <span class="debt-status-tag">${sale.estado?.toUpperCase()}</span>
                <p>Pendiente: $${(sale.saldo_pendiente||0).toFixed(2)} (Límite: ${new Date(sale.fecha_limite+"T00:00:00").toLocaleDateString()})</p>
            </div>`).join('');
    }
    updateTrackingSummary() {
        const totalCredit = this.creditSales.reduce((sum, s) => sum + (s.total || 0), 0);
        const totalPending = this.creditSales.reduce((sum, s) => sum + (s.saldo_pendiente || 0), 0);
        document.getElementById('total-credit').textContent = `$${totalCredit.toFixed(2)}`;
        document.getElementById('total-collected').textContent = `$${(totalCredit - totalPending).toFixed(2)}`;
        document.getElementById('total-pending').textContent = `$${totalPending.toFixed(2)}`;
    }
    
} // Fin de la clase MariSportApp

document.addEventListener('DOMContentLoaded', () => {
    window.app = new MariSportApp();
});
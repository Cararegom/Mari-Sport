class DatabaseManager {
    constructor(supabase) {
        this.supabase = supabase;
    }

    // Products
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

    async saveProduct(productData, isEdit = false, productId = null) {
        try {
            if (isEdit && productId) {
                const { error } = await this.supabase
                    .from('productos')
                    .update(productData)
                    .eq('id', productId);

                if (error) throw error;
                return { ...productData, id: productId };
            } else {
                const { data, error } = await this.supabase
                    .from('productos')
                    .insert([productData])
                    .select()
                    .single();

                if (error) throw error;
                return data;
            }
        } catch (error) {
            console.error('Error saving product:', error);
            throw error;
        }
    }

    async deleteProduct(productId) {
        try {
            const { error } = await this.supabase
                .from('productos')
                .delete()
                .eq('id', productId);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    }

    // Customers
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

    async saveCustomer(customerData, isEdit = false, customerId = null) {
        try {
            if (isEdit && customerId) {
                const { error } = await this.supabase
                    .from('clientes')
                    .update(customerData)
                    .eq('id', customerId);

                if (error) throw error;
                return { ...customerData, id: customerId };
            } else {
                const { data, error } = await this.supabase
                    .from('clientes')
                    .insert([customerData])
                    .select()
                    .single();

                if (error) throw error;
                return data;
            }
        } catch (error) {
            console.error('Error saving customer:', error);
            throw error;
        }
    }

    async deleteCustomer(customerId) {
        try {
            const { error } = await this.supabase
                .from('clientes')
                .delete()
                .eq('id', customerId);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting customer:', error);
            throw error;
        }
    }

    // Credit Sales
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

    async saveCreditSale(creditSaleData, isEdit = false, creditSaleId = null) {
        try {
            if (isEdit && creditSaleId) {
                const { error } = await this.supabase
                    .from('ventas_fiadas')
                    .update(creditSaleData)
                    .eq('id', creditSaleId);

                if (error) throw error;
                return { ...creditSaleData, id: creditSaleId };
            } else {
                const { data, error } = await this.supabase
                    .from('ventas_fiadas')
                    .insert([creditSaleData])
                    .select()
                    .single();

                if (error) throw error;
                return data;
            }
        } catch (error) {
            console.error('Error saving credit sale:', error);
            throw error;
        }
    }

    async deleteCreditSale(creditSaleId) {
        try {
            const { error } = await this.supabase
                .from('ventas_fiadas')
                .delete()
                .eq('id', creditSaleId);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting credit sale:', error);
            throw error;
        }
    }

    // Payments
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

    async savePayment(paymentData, isEdit = false, paymentId = null) {
        try {
            if (isEdit && paymentId) {
                const { error } = await this.supabase
                    .from('abonos')
                    .update(paymentData)
                    .eq('id', paymentId);

                if (error) throw error;
                return { ...paymentData, id: paymentId };
            } else {
                const { data, error } = await this.supabase
                    .from('abonos')
                    .insert([paymentData])
                    .select()
                    .single();

                if (error) throw error;
                return data;
            }
        } catch (error) {
            console.error('Error saving payment:', error);
            throw error;
        }
    }

    async deletePayment(paymentId) {
        try {
            const { error } = await this.supabase
                .from('abonos')
                .delete()
                .eq('id', paymentId);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting payment:', error);
            throw error;
        }
    }

    // Image upload
    async uploadImage(file, bucket = 'ropa-deportiva') {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            
            const { data, error } = await this.supabase.storage
                .from(bucket)
                .upload(fileName, file);

            if (error) throw error;

            const { data: { publicUrl } } = this.supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }
}
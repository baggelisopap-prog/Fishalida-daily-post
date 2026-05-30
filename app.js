/**
 * Fishαλίδα Manager - Core Application Logic
 * Συνδέει το UI (Alpine.js) με το Backend (Supabase)
 */

const supabaseUrl = window.APP_CONFIG.SUPABASE_URL;
const supabaseKey = window.APP_CONFIG.SUPABASE_ANON_KEY;
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

window.fishalidaApp = function() {
    return {
        // ==========================================
        // APPLICATION STATE
        // ==========================================
        splashVisible: true,
        isLoading: true,
        isAuthLoading: false,
        session: null,
        userRole: null, 
        loginEmail: '',
        magicLinkSent: false,
        currentTab: 'daily', 
        
        dailyData: [],
        promoLogs: [],
        adminCategories: [],
        adminFishGrouped: [],
        
        isDarkMode: localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches),
        toasts: [],
        activeModal: null,
        errorMessage: '',
        
        categoryForm: { id: null, name: '', display_order: 1 },
        fishForm: { id: null, name: '', category_id: '', display_order: 1, active: true },
        confirmDeleteData: null, 

        // ==========================================
        // INITIALIZATION
        // ==========================================
        async initApp() {
            this.setupTheme();
            this.registerServiceWorker();
            
            // Κλείσιμο Splash Screen μετά από 1.5 δευτερόλεπτο
            setTimeout(() => {
                this.splashVisible = false;
            }, 1500);

            supabaseClient.auth.onAuthStateChange((event, session) => {
                this.session = session;
                this.userRole = session?.user?.app_metadata?.role || null;
                
                if (session) {
                    this.loadDataForTab(this.currentTab);
                }
                this.isLoading = false;
            });
            
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            if (error) {
                console.error("Auth error during init:", error);
            }
            this.session = session;
            this.userRole = session?.user?.app_metadata?.role || null;
            
            if(session) {
                this.loadDataForTab(this.currentTab);
            }
            this.isLoading = false;
        },

        // ==========================================
        // SORTABLE JS INITIALIZATION (Drag & Drop)
        // ==========================================
        initSortable(el, categoryId) {
            new Sortable(el, {
                animation: 150,
                handle: '.drag-handle',
                ghostClass: 'opacity-50',
                onEnd: async (evt) => {
                    if (evt.oldIndex === evt.newIndex) return;
                    
                    // Ανάκτηση της νέας σειράς από το DOM (χρησιμοποιώντας το data-id)
                    const itemEls = Array.from(el.children);
                    const newOrderIds = itemEls.map(element => element.getAttribute('data-id'));
                    
                    await this.saveNewFishOrder(categoryId, newOrderIds);
                }
            });
        },

        async saveNewFishOrder(categoryId, newOrderIds) {
            try {
                const category = this.dailyData.find(c => c.id === categoryId);
                if (!category) return;

                // Ενημέρωση του memory array βάσει της νέας σειράς
                category.fish.sort((a, b) => {
                    return newOrderIds.indexOf(a.id) - newOrderIds.indexOf(b.id);
                });

                // Bulk update στο Supabase
                const promises = category.fish.map((fish, index) => {
                    fish.display_order = index + 1;
                    return supabaseClient.from('fish')
                        .update({ display_order: fish.display_order })
                        .eq('id', fish.id);
                });

                await Promise.all(promises);
                this.addToast("Η σειρά αποθηκεύτηκε", "success");
            } catch (error) {
                console.error("Σφάλμα κατά την αλλαγή σειράς:", error);
                this.addToast("Σφάλμα κατά την αποθήκευση της σειράς", "error");
            }
        },

        // ==========================================
        // AUTHENTICATION
        // ==========================================
        async handleLogin() {
            this.isAuthLoading = true;
            this.magicLinkSent = false;
            
            const { error } = await supabaseClient.auth.signInWithOtp({ 
                email: this.loginEmail,
                options: { shouldCreateUser: false }
            });
            
            this.isAuthLoading = false;
            if (error) {
                this.addToast(error.message === 'Signups not allowed for this instance' ? 'Το email δεν βρέθηκε στο σύστημα.' : 'Σφάλμα κατά την αποστολή. Δοκίμασε ξανά.', 'error');
            } else {
                this.magicLinkSent = true;
                this.addToast('Ο σύνδεσμος στάλθηκε στο email σου!', 'success');
            }
        },

        async handleLogout() {
            const { error } = await supabaseClient.auth.signOut();
            if (error) {
                this.addToast('Σφάλμα κατά την αποσύνδεση', 'error');
            } else {
                this.currentTab = 'daily';
            }
        },

        // ==========================================
        // NAVIGATION & TABS
        // ==========================================
        setTab(tab) {
            if (tab === 'admin' && this.userRole !== 'admin') {
                this.addToast('Δεν έχεις δικαιώματα διαχειριστή.', 'error');
                return;
            }
            this.currentTab = tab;
            this.loadDataForTab(tab);
        },

        loadDataForTab(tab) {
            if (tab === 'daily') this.loadDailyData();
            else if (tab === 'promo') this.loadPromoLogs();
            else if (tab === 'admin') this.loadAdminData();
        },

        // ==========================================
        // DATE UTILITIES
        // ==========================================
        get todayISO() {
            const d = new Date();
            const offset = d.getTimezoneOffset();
            const localDate = new Date(d.getTime() - (offset * 60 * 1000));
            return localDate.toISOString().split('T')[0];
        },

        get formattedToday() {
            return new Intl.DateTimeFormat('el-GR', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            }).format(new Date());
        },

        formatDateStr(dateStr) {
            if (!dateStr) return '';
            return new Intl.DateTimeFormat('el-GR', { 
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
            }).format(new Date(dateStr));
        },

        // ==========================================
        // TAB 1: ΚΑΘΗΜΕΡΙΝΟ POST
        // ==========================================
        async loadDailyData() {
            try {
                const today = this.todayISO;
                
                const { data: fishes, error: fishError } = await supabaseClient
                    .from('fish')
                    .select(`
                        id, name, display_order, category_id,
                        category:categories(id, name, display_order)
                    `)
                    .eq('active', true)
                    .order('display_order');

                if (fishError) throw fishError;

                const { data: statuses, error: statusError } = await supabaseClient
                    .from('daily_status')
                    .select('fish_id, price, available')
                    .eq('date', today);

                if (statusError) throw statusError;

                const categoryMap = new Map();
                
                fishes.forEach(f => {
                    if (!f.category) return;
                    const status = statuses.find(s => s.fish_id === f.id) || { price: null, available: false };
                    
                    const catId = f.category.id;
                    if (!categoryMap.has(catId)) {
                        categoryMap.set(catId, {
                            id: catId,
                            name: f.category.name,
                            display_order: f.category.display_order,
                            fish: []
                        });
                    }
                    
                    categoryMap.get(catId).fish.push({
                        id: f.id,
                        name: f.name,
                        price: status.price,
                        available: status.available,
                        display_order: f.display_order,
                        saveStatus: '' 
                    });
                });

                const sortedCategories = Array.from(categoryMap.values()).sort((a, b) => a.display_order - b.display_order);
                sortedCategories.forEach(cat => {
                    cat.fish.sort((a, b) => a.display_order - b.display_order);
                });

                this.dailyData = sortedCategories;

            } catch (error) {
                console.error("Σφάλμα φόρτωσης Daily Data:", error);
                this.addToast("Αποτυχία φόρτωσης δεδομένων.", "error");
            }
        },

        async updateDailyStatus(fish) {
            fish.saveStatus = 'saving';
            try {
                const today = this.todayISO;
                
                const { error } = await supabaseClient
                    .from('daily_status')
                    .upsert({ 
                        fish_id: fish.id, 
                        price: fish.price === "" ? null : parseFloat(fish.price), 
                        available: fish.available, 
                        date: today 
                    }, { onConflict: 'fish_id,date' });
                
                if (error) throw error;
                
                fish.saveStatus = 'saved';
                setTimeout(() => { if (fish.saveStatus === 'saved') fish.saveStatus = ''; }, 2000);
            } catch (error) {
                console.error("Σφάλμα Upsert Daily Status:", error);
                fish.saveStatus = 'error';
                this.addToast("Σφάλμα κατά την αποθήκευση.", "error");
            }
        },

        // ==========================================
        // TAB 2: PROMO POSTS
        // ==========================================
        async loadPromoLogs() {
            try {
                const { data, error } = await supabaseClient
                    .from('post_log')
                    .select('*')
                    .eq('post_type', 'promo')
                    .order('posted_at', { ascending: false })
                    .limit(10);
                
                if (error) throw error;
                this.promoLogs = data || [];
            } catch (error) {
                console.error("Σφάλμα Promo Logs:", error);
                this.addToast("Αποτυχία φόρτωσης promo posts.", "error");
            }
        },

        // ==========================================
        // TAB 3: ADMIN (ΔΙΑΧΕΙΡΙΣΗ)
        // ==========================================
        async loadAdminData() {
            try {
                const { data: cats, error: catError } = await supabaseClient
                    .from('categories')
                    .select('id, name, display_order')
                    .order('display_order');
                if (catError) throw catError;

                const { data: fishes, error: fishError } = await supabaseClient
                    .from('fish')
                    .select('id, name, display_order, active, category_id')
                    .order('display_order');
                if (fishError) throw fishError;

                this.adminCategories = cats.map(c => ({
                    ...c,
                    fish_count: fishes.filter(f => f.category_id === c.id).length
                }));

                this.adminFishGrouped = cats.map(c => ({
                    categoryId: c.id,
                    categoryName: c.name,
                    fishes: fishes.filter(f => f.category_id === c.id)
                }));

            } catch (error) {
                console.error("Σφάλμα Admin Data:", error);
                this.addToast("Αποτυχία φόρτωσης δεδομένων διαχείρισης.", "error");
            }
        },

        async saveCategory() {
            try {
                const payload = {
                    name: this.categoryForm.name,
                    display_order: parseInt(this.categoryForm.display_order) || 0
                };

                let error;
                if (this.categoryForm.id) {
                    const res = await supabaseClient.from('categories').update(payload).eq('id', this.categoryForm.id);
                    error = res.error;
                } else {
                    const res = await supabaseClient.from('categories').insert([payload]);
                    error = res.error;
                }

                if (error) throw error;
                
                this.addToast("Η κατηγορία αποθηκεύτηκε.", "success");
                this.closeModal();
                this.loadAdminData(); 
            } catch (error) {
                console.error(error);
                this.addToast("Αποτυχία αποθήκευσης κατηγορίας.", "error");
            }
        },

        async saveFish() {
            try {
                const payload = {
                    name: this.fishForm.name,
                    category_id: this.fishForm.category_id,
                    display_order: parseInt(this.fishForm.display_order) || 0,
                    active: this.fishForm.active
                };

                let error;
                if (this.fishForm.id) {
                    const res = await supabaseClient.from('fish').update(payload).eq('id', this.fishForm.id);
                    error = res.error;
                } else {
                    const res = await supabaseClient.from('fish').insert([payload]);
                    error = res.error;
                }

                if (error) throw error;
                
                this.addToast("Το ψάρι αποθηκεύτηκε.", "success");
                this.closeModal();
                this.loadAdminData();
            } catch (error) {
                console.error(error);
                this.addToast("Αποτυχία αποθήκευσης ψαριού.", "error");
            }
        },

        async toggleFishActive(fish) {
            try {
                const newStatus = !fish.active;
                const { error } = await supabaseClient.from('fish').update({ active: newStatus }).eq('id', fish.id);
                if (error) throw error;
                
                fish.active = newStatus;
                this.addToast(newStatus ? "Το ψάρι ενεργοποιήθηκε." : "Το ψάρι απενεργοποιήθηκε.", "success");
            } catch (error) {
                console.error(error);
                this.addToast("Αποτυχία αλλαγής κατάστασης.", "error");
            }
        },

        confirmDelete(type, item) {
            if (type === 'category') {
                if (item.fish_count > 0) {
                    this.errorMessage = `Δεν μπορείς να διαγράψεις την κατηγορία "${item.name}" γιατί περιέχει ${item.fish_count} ψάρια. Διαγραφή ή μεταφορά των ψαριών απαιτείται πρώτα.`;
                    this.activeModal = 'errorModal';
                    return;
                }
                this.confirmDeleteData = { type, id: item.id, message: `Είσαι σίγουρος ότι θέλεις να διαγράψεις την κατηγορία "${item.name}"; Η ενέργεια είναι μόνιμη.` };
            } else if (type === 'fish') {
                this.confirmDeleteData = { type, id: item.id, message: `Είσαι σίγουρος ότι θέλεις να διαγράψεις το ψάρι "${item.name}"; Η ενέργεια είναι μόνιμη.` };
            }
            this.activeModal = 'confirmDeleteModal';
        },

        async executeDelete() {
            if (!this.confirmDeleteData) return;
            try {
                const { type, id } = this.confirmDeleteData;
                const table = type === 'category' ? 'categories' : 'fish';
                
                const { error } = await supabaseClient.from(table).delete().eq('id', id);
                if (error) throw error;

                this.addToast("Η διαγραφή ολοκληρώθηκε.", "success");
                this.closeModal();
                this.loadAdminData();
            } catch (error) {
                console.error(error);
                this.addToast("Σφάλμα κατά τη διαγραφή.", "error");
            }
        },

        // ==========================================
        // MODALS MANAGEMENT
        // ==========================================
        openModal(modalName) {
            if (modalName === 'categoryModal' && !this.categoryForm.id) {
                const nextOrder = this.adminCategories.length > 0 
                    ? Math.max(...this.adminCategories.map(c => c.display_order)) + 1 
                    : 1;
                this.categoryForm = { id: null, name: '', display_order: nextOrder };
            }
            
            if (modalName === 'fishModal' && !this.fishForm.id) {
                const nextOrder = 1; 
                this.fishForm = { id: null, name: '', category_id: '', display_order: nextOrder, active: true };
            }
            
            this.activeModal = modalName;
        },

        closeModal() {
            this.activeModal = null;
            setTimeout(() => {
                this.errorMessage = '';
                this.categoryForm = { id: null, name: '', display_order: 1 };
                this.fishForm = { id: null, name: '', category_id: '', display_order: 1, active: true };
                this.confirmDeleteData = null;
            }, 300);
        },

        editCategory(cat) {
            this.categoryForm = { ...cat };
            this.openModal('categoryModal');
        },

        editFish(fish) {
            this.fishForm = { ...fish };
            this.openModal('fishModal');
        },

        // ==========================================
        // UI & SYSTEM
        // ==========================================
        addToast(message, type = 'info') {
            const id = Date.now();
            this.toasts.push({ id, message, type, visible: true });
            
            setTimeout(() => {
                const toast = this.toasts.find(t => t.id === id);
                if (toast) {
                    toast.visible = false;
                    setTimeout(() => {
                        this.toasts = this.toasts.filter(t => t.id !== id);
                    }, 300);
                }
            }, 3000);
        },

        toggleTheme() {
            this.isDarkMode = !this.isDarkMode;
            localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
            this.applyTheme();
        },

        setupTheme() {
            this.applyTheme();
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (!('theme' in localStorage)) {
                    this.isDarkMode = e.matches;
                    this.applyTheme();
                }
            });
        },

        applyTheme() {
            if (this.isDarkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        },

        registerServiceWorker() {
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('./service-worker.js')
                        .then(registration => {
                            console.log('SW registered: ', registration);
                        })
                        .catch(registrationError => {
                            console.log('SW registration failed: ', registrationError);
                        });
                });
            }
        }
    }
}

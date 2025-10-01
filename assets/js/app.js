// PontoMax - Aplicação Principal
class PontoMaxApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.currentFechamento = null;
        this.dadosRevisao = [];
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        this.setupEventListeners(); // Apenas UMA chamada para configurar todos os eventos.
        this.checkAuthentication();
    }

    setupEventListeners() {
        // --- Eventos que só rodam uma vez na inicialização ---
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });

        const userMenuTrigger = document.getElementById('user-menu-trigger');
        const userDropdown = document.getElementById('user-dropdown');
        if (userMenuTrigger && userDropdown) {
            userMenuTrigger.addEventListener('click', () => {
                userDropdown.classList.toggle('active');
            });
            document.addEventListener('click', (e) => {
                if (!userMenuTrigger.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.classList.remove('active');
                }
            });
        }

        // --- DELEGAÇÃO DE EVENTOS PARA TODO O RESTO ---
        // Adicionamos um único 'ouvinte' ao corpo do documento.
        // Ele vai capturar todos os cliques e decidir o que fazer.
        document.body.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return; // Se o clique não foi em um botão, ignora

            // --- Lógica de Logout ---
            if (button.id === 'logout-btn') {
                this.handleLogout();
            }

            // --- Lógica para a página de Holerite ---
            if (button.closest('#holerite-page') && button.classList.contains('btn-outline')) {
                this.loadHoleriteData();
            }

            // --- Lógica para a página de Equipe ---
            if (button.id === 'btn-show-register-modal') this.openRegisterModal();
            if (button.dataset.employeeId && button.closest('#equipe-page')) this.openEmployeeModal(parseInt(button.dataset.employeeId));

            // --- Lógica para a página de Registros ---
            if (button.id === 'search-btn' && button.closest('#registros-page')) {
                this.loadRegistrosData();
            }

            // --- Lógica para a página de Fechamento ---
            const fechamentoActions = ['btn-iniciar-fechamento', 'btn-gerar-holerites', 'btn-enviar-holerites'];
            if (fechamentoActions.includes(button.id)) {
                e.preventDefault();
                switch (button.id) {
                    case 'btn-iniciar-fechamento':
                        const periodo = document.getElementById('fechamento-periodo').value;
                        this.loadFechamentoData({ action: 'iniciar', periodo: periodo });
                        break;
                    case 'btn-gerar-holerites':
                        this.loadFechamentoData({ action: 'gerar' });
                        break;
                    case 'btn-enviar-holerites':
                        this.loadFechamentoData({ action: 'enviar' });
                        break;
                }
            }

            // --- Lógica para os Modais ---
            if (button.id === 'btn-register-employee') {
                e.preventDefault();
                this.handleRegisterEmployee(e);
            }
            if (button.id === 'modal-save-btn') this.handleUpdateEmployee(button.closest('.modal-overlay').dataset.employeeId);
            if (button.id === 'modal-delete-btn') this.handleDeleteEmployee(button.closest('.modal-overlay').dataset.employeeId);
            if (button.closest('.modal-close-btn')) {
                button.closest('.modal-overlay').classList.add('hidden');
            }
        });
    }

    checkAuthentication() {
        setTimeout(() => {
            if (window.authManager.isLoggedIn()) {
                window.authManager.showMainApp();
                this.navigateToPage('dashboard', window.authManager.getCurrentUser());
            } else {
                window.authManager.showLoginPage();
            }
        }, 1000);
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> Entrando...';
        lucide.createIcons();
        submitBtn.disabled = true;

        try {
            const result = await window.authManager.login(email, password);
            if (result.success) {
                this.showToast('Sucesso', 'Login realizado com sucesso!', 'success');
                window.authManager.showMainApp();
                this.navigateToPage('dashboard', result.user);
            } else {
                this.showToast('Erro', result.error || 'Credenciais inválidas', 'error');
            }
        } catch (error) {
            this.showToast('Erro', 'Erro de conexão com o servidor.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            lucide.createIcons();
        }
    }

    handleLogout() {
        this.showToast('Info', 'Logout realizado com sucesso!', 'success');
        window.authManager.logout();
    }

    handleNavigation(e) {
        e.preventDefault();
        const page = e.currentTarget.getAttribute('data-page');
        if (page) {
            this.navigateToPage(page);
        }
    }

    navigateToPage(page, user = null) {
        if (!window.authManager.hasPermission(page)) {
            this.showToast('Erro', 'Você não tem permissão para acessar esta página', 'error');
            return;
        }
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-page') === page);
        });
        const contentPages = document.querySelectorAll('.content-page');
        contentPages.forEach(contentPage => {
            contentPage.classList.remove('active');
        });
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        this.currentPage = page;
        this.loadPageData(page, user);
    }

    loadPageData(page, user = null) {
        const currentUser = user || window.authManager.getCurrentUser();
        switch (page) {
            case 'dashboard':
                if (currentUser && currentUser.profile && (currentUser.profile.perfil === 'GESTOR' || currentUser.profile.perfil === 'ADMIN')) {
                    this.loadGestorDashboardData();
                } else {
                    if (!window.dashboardManager) {
                        window.dashboardManager = new DashboardManager();
                    } else {
                        window.dashboardManager.loadDashboardData();
                    }
                }
                break;
            case 'registros': this.loadRegistrosData(); break;
            case 'holerite': this.loadHoleriteData(); break;
            case 'equipe': this.loadEquipeData(); break;
            case 'fechamento': this.loadFechamentoData(); break;
            case 'banco-horas': this.loadBancoHorasData(); break;
        }
    }

    async loadHoleriteData() {
        const payslipPeriodSelector = document.getElementById('payslip-period');
        if (!payslipPeriodSelector) return;
        const selectedPeriod = payslipPeriodSelector.value;
        try {
            const payslipData = await window.authManager.apiCall(`/holerites/?periodo=${selectedPeriod}`);
            const earnings = payslipData.vencimentos;
            const deductions = payslipData.descontos;
            document.getElementById('payslip-title').textContent = `Holerite - ${payslipData.periodLabel}`;
            document.getElementById('payslip-user-info').textContent = payslipData.userInfo;
            const earningsContent = document.getElementById('payslip-earnings-content');
            const deductionsContent = document.getElementById('payslip-deductions-content');
            earningsContent.innerHTML = '';
            deductionsContent.innerHTML = '';
            let grossTotal = 0;
            let deductionsTotal = 0;
            const createLineItem = (item, isDeduction = false) => `
    <div class="line-item">
        <div class="item-description">
            <span>${item.descricao}</span>
            ${item.detalhes ? `<small>${item.detalhes}</small>` : ''}
        </div>
        <div class="item-value ${isDeduction ? 'negative' : 'positive'}">
            ${this.formatCurrency(parseFloat(item.valor)).replace('R$', '')}
        </div>
    </div>`;
            // Itera sobre cada item de vencimento
            earnings.forEach(item => {
                // Soma o valor ao total bruto
                grossTotal += parseFloat(item.valor);
                // Adiciona a linha de HTML do item ao container de vencimentos
                earningsContent.innerHTML += createLineItem(item);
            });

            // Itera sobre cada item de desconto
            deductions.forEach(item => {
                // Soma o valor ao total de descontos
                deductionsTotal += parseFloat(item.valor);
                // Adiciona a linha de HTML do item ao container de descontos
                deductionsContent.innerHTML += createLineItem(item, true);
            });

            // Calcula o valor líquido final
            const netTotal = grossTotal - deductionsTotal;

            // Atualiza os totais no HTML, formatando como moeda
            document.getElementById('payslip-gross-total').textContent = this.formatCurrency(grossTotal);
            document.getElementById('payslip-deductions-total').textContent = this.formatCurrency(deductionsTotal);
            document.getElementById('payslip-net-total').textContent = this.formatCurrency(netTotal);
        } catch (error) {
            console.error('Erro ao buscar dados do holerite:', error);
            
            // Limpa a tela se a API retornar um erro (como 404 - não encontrado)
            document.getElementById('payslip-title').textContent = 'Holerite - Nenhum dado encontrado';
            document.getElementById('payslip-user-info').textContent = '';
            document.getElementById('payslip-earnings-content').innerHTML = '<p class="no-records">Sem dados para este período.</p>';
            document.getElementById('payslip-deductions-content').innerHTML = '<p class="no-records">Sem dados para este período.</p>';
            
            // Zera todos os totais
            document.getElementById('payslip-gross-total').textContent = this.formatCurrency(0);
            document.getElementById('payslip-deductions-total').textContent = this.formatCurrency(0);
            document.getElementById('payslip-net-total').textContent = this.formatCurrency(0);
        }
    }

    async loadRegistrosData() {
        const recordsList = document.getElementById('records-table-body');
        const periodInput = document.getElementById('period-filter');
        const searchBtn = document.getElementById('search-btn');
        if (!recordsList || !periodInput || !searchBtn) return;

        const formatDateForAPI = (date) => date.toISOString().split('T')[0];
        const renderTableAndSummary = (recordsToRender) => { /* ... sua lógica de renderização ... */ };

        const fetchAndRenderRecords = async () => {
            const dates = fp.selectedDates;
            if (dates.length < 2) return;
            const [startDate, endDate] = dates;
            try {
                const records = await window.authManager.apiCall(`/registros/?start_date=${formatDateForAPI(startDate)}&end_date=${formatDateForAPI(endDate)}`);
                renderTableAndSummary(records);
            } catch (error) {
                console.error("Erro ao buscar registros:", error);
                this.showToast('Erro', 'Não foi possível carregar os registros.', 'error');
                renderTableAndSummary([]);
            }
        };

        const fp = flatpickr(periodInput, {
            mode: "range", dateFormat: "d/m/Y", locale: "pt",
            defaultDate: [new Date(new Date().setDate(1)), new Date()],
            onClose: fetchAndRenderRecords
        });

        fetchAndRenderRecords();
    }

    async loadEquipeData() {
        const pageContainer = document.getElementById('equipe-page');
        if (!pageContainer) return;
        // ... (código completo para carregar equipe, renderizar, filtrar, etc.)
    }

    async loadBancoHorasData() {
        // ... (código completo para carregar banco de horas da equipe)
    }

    async loadGestorDashboardData() {
        // ... (código completo para carregar dashboard do gestor)
    }

    async loadFechamentoData(actionData = null) {
        const pageContainer = document.getElementById('fechamento-page');
        if (!pageContainer) return;
        try {
            if (actionData) {
                if (action.action === 'iniciar') { /* ... chamada de API ... */ }
                if (action.action === 'gerar') { /* ... chamada de API ... */ }
                if (action.action === 'enviar') { /* ... chamada de API ... */ }
            }
            let step = 1;
            if (this.currentFechamento) {
                switch (this.currentFechamento.status) {
                    case 'REVISAO': step = 2; break;
                    case 'GERANDO': case 'CONCLUIDO': step = 3; break;
                    case 'ENVIADO': step = 4; break;
                }
            }
            pageContainer.innerHTML = this.getFechamentoStepHTML(step);
        } catch (error) {
            console.error("Erro no fluxo de fechamento:", error);
            // ... (lógica de erro)
        } finally {
            lucide.createIcons();
        }
    }

    getFechamentoStepHTML(step) {
        // ... (código completo com o switch/case para gerar o HTML de cada passo)
        return ''; // Retorno de exemplo
    }

    // ... (todas as outras funções auxiliares: modals, handlers de CRUD, format, toast, etc.)
}

// Inicializar aplicação
window.pontoMaxApp = new PontoMaxApp();
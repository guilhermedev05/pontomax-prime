// PontoMax - Aplicação Principal
class PontoMaxApp {
    constructor() {
        this.currentPage = 'dashboard';

        // ADICIONE ESTE BLOCO DE DADOS SIMULADOS
        this.mockPayslips = {
            '2025-08': {
                periodLabel: "Agosto/2025",
                userInfo: "Juan Rufino • PontoMax Tecnologia LTDA",
                earnings: [
                    { desc: "Salário Base", details: null, value: 5000.00 },
                    { desc: "Horas Extra", details: "5h 15m", value: 250.00 }
                ],
                deductions: [
                    { desc: "INSS", details: "8%", value: 420.00 },
                    { desc: "IRRF", details: "15%", value: 787.50 },
                    { desc: "FGTS", details: "8%", value: 420.00 },
                    { desc: "Vale Transporte", details: null, value: 132.00 },
                    { desc: "Faltas Banco", details: "2h 30m", value: 62.50 }
                ]
            },
            '2025-07': {
                periodLabel: "Julho/2025",
                userInfo: "Juan Rufino • PontoMax Tecnologia LTDA",
                earnings: [
                    { desc: "Salário Base", details: null, value: 5000.00 },
                ],
                deductions: [
                    { desc: "INSS", details: "8%", value: 420.00 },
                    { desc: "IRRF", details: "15%", value: 787.50 },
                    { desc: "FGTS", details: "8%", value: 420.00 },
                    { desc: "Vale Transporte", details: null, value: 132.00 },
                ]
            },
            '2025-06': {
                periodLabel: "Junho/2025",
                userInfo: "Juan Rufino • PontoMax Tecnologia LTDA",
                earnings: [
                    { desc: "Salário Base", details: null, value: 5000.00 },
                    { desc: "Horas Extra", details: "10h 00m", value: 480.77 }
                ],
                deductions: [
                    { desc: "INSS", details: "8%", value: 420.00 },
                    { desc: "IRRF", details: "15%", value: 787.50 },
                    { desc: "FGTS", details: "8%", value: 420.00 },
                    { desc: "Vale Transporte", details: null, value: 132.00 },
                ]
            }
        };
        this.fechamentoCurrentStep = 1;
        this.init();
    }

    init() {
        // Aguardar carregamento do DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Inicializar ícones Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Configurar eventos
        this.setupEventListeners();

        // Verificar autenticação
        this.checkAuthentication();
    }

    setupEventListeners() {
        // Formulário de login
        const registerForm = document.querySelector('#register-employee-modal form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegisterEmployee(e));
        }

        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Navegação
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Menu do usuário
        const userMenuTrigger = document.getElementById('user-menu-trigger');
        const userDropdown = document.getElementById('user-dropdown');

        if (userMenuTrigger && userDropdown) {
            userMenuTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('show');
            });

            // Fechar dropdown ao clicar fora
            document.addEventListener('click', () => {
                userDropdown.classList.remove('show');
            });

            userDropdown.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // Botão de logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Botão de registrar ponto
        const punchBtn = document.getElementById('punch-btn');
        if (punchBtn) {
            punchBtn.addEventListener('click', () => this.handlePunchClock());
        }

        const payslipPeriodSelector = document.getElementById('payslip-period');
        if (payslipPeriodSelector) {
            payslipPeriodSelector.addEventListener('change', () => this.loadHoleriteData());
        }

        // Botão "Visualizar" do Holerite
        const viewPayslipBtn = document.querySelector('.filters-card .btn-outline'); // Seletor mais específico
        if (viewPayslipBtn) {
            viewPayslipBtn.addEventListener('click', () => this.loadHoleriteData());
        }

        const modalOverlay = document.getElementById('employee-modal');
        const modalCloseBtn = document.getElementById('modal-close-btn');

        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) { // Fecha só se clicar no fundo
                    this.closeEmployeeModal();
                }
            });
        }
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', () => this.closeEmployeeModal());
        }
        const registerModalOverlay = document.getElementById('register-employee-modal');
        const registerModalCloseBtn = document.getElementById('register-modal-close-btn');

        if (registerModalOverlay) {
            registerModalOverlay.addEventListener('click', (e) => {
                if (e.target === registerModalOverlay) {
                    this.closeRegisterModal();
                }
            });
        }
        if (registerModalCloseBtn) {
            registerModalCloseBtn.addEventListener('click', () => this.closeRegisterModal());
        }

        const fechamentoPage = document.getElementById('fechamento-page');
        if (fechamentoPage) {
            fechamentoPage.addEventListener('click', (e) => {
                const targetButton = e.target.closest('button');
                if (!targetButton) return;

                if (targetButton.id === 'btn-avancar-passo1') {
                    this.fechamentoCurrentStep = 2;
                    this.loadFechamentoData();
                }

                if (targetButton.id === 'btn-gerar-holerites') {
                    this.fechamentoCurrentStep = 3;
                    this.loadFechamentoData();
                }

                // ADICIONE ESTA VERIFICAÇÃO para o botão do Passo 3
                if (targetButton.id === 'btn-enviar-holerites') {
                    this.fechamentoCurrentStep = 4;
                    this.loadFechamentoData();
                }
            });
        }

        const employeeModal = document.getElementById('employee-modal');
        if (employeeModal) {
            employeeModal.addEventListener('click', (e) => {
                const employeeId = employeeModal.dataset.employeeId;
                if (e.target.id === 'modal-save-btn') {
                    this.handleUpdateEmployee(employeeId);
                }
                if (e.target.id === 'modal-delete-btn') {
                    this.handleDeleteEmployee(employeeId);
                }
            });
        }
    }

    checkAuthentication() {
        // Simular carregamento inicial
        setTimeout(() => {
            if (window.authManager.isLoggedIn()) {
                window.authManager.showMainApp();
                this.navigateToPage('dashboard');
            } else {
                window.authManager.showLoginPage();
            }
        }, 1500);
    }

    async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');

        // Mostrar loading
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> Entrando...';
        submitBtn.disabled = true;

        try {
            const result = await window.authManager.login(email, password);

            if (result.success) {
                this.showToast('Sucesso', 'Login realizado com sucesso!', 'success');
                window.authManager.showMainApp();
                this.navigateToPage('dashboard');
            } else {
                this.showToast('Erro', result.error || 'Credenciais inválidas', 'error');
            }
        } catch (error) {
            this.showToast('Erro', 'Erro interno do servidor', 'error');
        } finally {
            // Restaurar botão
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;

            // Recriar ícones
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
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

    // No seu arquivo assets/js/app.js, substitua esta função:
    navigateToPage(page) {
        // 1. VERIFICA PERMISSÃO (JÁ EXISTENTE)
        if (!window.authManager.hasPermission(page)) {
            this.showToast('Erro', 'Você não tem permissão para acessar esta página', 'error');
            return;
        }

        // 2. ATUALIZA O ESTADO 'ATIVO' NOS LINKS DO MENU DE NAVEGAÇÃO
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.getAttribute('data-page') === page) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // 3. AQUI ESTÁ A CORREÇÃO PRINCIPAL:
        // ESCONDE TODAS AS PÁGINAS DE CONTEÚDO...
        const contentPages = document.querySelectorAll('.content-page');
        contentPages.forEach(contentPage => {
            contentPage.classList.remove('active');
        });

        // ...E MOSTRA APENAS A PÁGINA DE DESTINO
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // 4. ATUALIZA O ESTADO E CARREGA OS DADOS DA PÁGINA (JÁ EXISTENTE)
        this.currentPage = page;
        this.loadPageData(page);
    }

    loadPageData(page) {
        switch (page) {
            case 'dashboard':
                // AQUI ESTÁ A LÓGICA PRINCIPAL QUE PRECISA SER CORRIGIDA
                const currentUser = window.authManager.getCurrentUser();
                if (currentUser && (currentUser.perfil === 'GESTOR' || currentUser.perfil === 'ADMIN')) {
                    this.loadGestorDashboardData(); // Carrega o painel do GESTOR
                } else {
                    if (!window.dashboardManager) {
                        window.dashboardManager = new DashboardManager();
                    } else {
                        // Se já existir, apenas atualiza os dados
                        window.dashboardManager.loadDashboardData();
                    }
                }
                break;
            case 'registros':
                this.loadRegistrosData();
                break;
            case 'holerite':
                // this.loadHoleriteData();
                break;
            case 'equipe':
                this.loadEquipeData();
                break;
            case 'fechamento': // <-- ADICIONE ESTE CASE
                this.loadFechamentoData();
                break;
            case 'banco-horas': // <-- ADICIONE ESTE CASE
                this.loadBancoHorasData();
                break;
            default:
                // Não faz nada se a página não for encontrada
                break;
        }
    }

    loadDashboardData() {
        // Atualizar relógio
        this.updateClock();

        // Carregar dados do dashboard
        // Em produção, fazer chamadas para API Django
        console.log('Carregando dados do dashboard...');
    }

    async loadRegistrosData() {
        const recordsList = document.getElementById('records-table-body');
        const periodInput = document.getElementById('period-filter');
        const searchBtn = document.getElementById('search-btn');

        if (!recordsList || !periodInput || !searchBtn) return;

        // Helper para formatar a data para o formato YYYY-MM-DD
        const formatDateForAPI = (date) => date.toISOString().split('T')[0];

        // Função que renderiza a tabela (permanece a mesma)
        const renderTableAndSummary = (recordsToRender) => {
            // ... (toda a sua lógica de renderização existente, sem alterações)
            recordsList.innerHTML = '';
            let totalWorked = 0, totalOvertime = 0, totalDebit = 0;

            if (recordsToRender.length === 0) {
                recordsList.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">Nenhum registro encontrado para este período.</td></tr>';
            } else {
                recordsToRender.forEach(record => {
                    const date = new Date(record.date + 'T03:00:00');
                    totalWorked += record.worked;
                    totalOvertime += record.overtime;
                    totalDebit += record.debit;

                    const row = document.createElement('tr');
                    row.innerHTML = `
                    <td>
                        <div class="date-cell">
                            <span class="day-of-week">${date.toLocaleDateString('pt-BR', { weekday: 'long' }).replace("-feira", "")}</span>
                            <span class="full-date">${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                        </div>
                    </td>
                    <td>${this.formatHours(record.worked)}</td>
                    <td class="positive">${this.formatHours(record.overtime)}</td>
                    <td class="negative">${this.formatHours(record.debit)}</td>
                    <td><span class="status-badge status-${record.status.toLowerCase()}">${record.status}</span></td>
                `;
                    recordsList.appendChild(row);
                });
            }

            document.getElementById('summary-total-worked').textContent = this.formatHours(totalWorked, true);
            document.getElementById('summary-overtime').textContent = `+${this.formatHours(totalOvertime, true)}`;
            document.getElementById('summary-debit').textContent = `-${this.formatHours(totalDebit, true)}`;
        };

        // MUDANÇA PRINCIPAL: Função que busca os dados da API
        const fetchAndRenderRecords = async () => {
            const dates = fp.selectedDates;
            if (dates.length < 2) {
                this.showToast('Aviso', 'Por favor, selecione um intervalo de datas completo.', 'warning');
                renderTableAndSummary([]); // Limpa a tabela
                return;
            }

            const [startDate, endDate] = dates;
            const startDateStr = formatDateForAPI(startDate);
            const endDateStr = formatDateForAPI(endDate);

            try {
                const records = await window.authManager.apiCall(`/registros/?start_date=${startDateStr}&end_date=${endDateStr}`);
                renderTableAndSummary(records);
            } catch (error) {
                console.error("Erro ao buscar registros:", error);
                this.showToast('Erro', 'Não foi possível carregar os registros.', 'error');
                renderTableAndSummary([]); // Limpa a tabela em caso de erro
            }
        };

        // Inicializa o Flatpickr (calendário)
        const fp = flatpickr(periodInput, {
            mode: "range",
            dateFormat: "d/m/Y",
            locale: "pt",
            // Define uma data padrão para a primeira carga
            defaultDate: [new Date(new Date().setDate(1)), new Date()],
            // Chama a busca assim que o calendário é fechado com uma nova data
            onClose: fetchAndRenderRecords
        });

        // Adiciona o evento de clique ao botão de busca
        searchBtn.addEventListener('click', fetchAndRenderRecords);

        // Carga inicial dos dados
        fetchAndRenderRecords();
    }

    async loadBancoHorasData() {
        const pageContainer = document.getElementById('banco-horas-page');
        if (!pageContainer) return;

        // HTML principal da página (permanece o mesmo)
        pageContainer.innerHTML = `
        <div class="page-header">
            <h1>Gestão do Banco de Horas</h1>
            <p>Acompanhe saldos e movimentações</p>
        </div>
        <div class="main-card">
            <div class="card-header-flex">
                <div><h2><i data-lucide="bar-chart-3"></i> Banco de Horas</h2><p>Filtre os saldos por status</p></div>
            </div>
            <div class="card-content">
                <div class="filter-btn-group">
                    <button class="btn-filter active" data-filter="todos">Todos</button>
                    <button class="btn-filter" data-filter="positivos">Positivos</button>
                    <button class="btn-filter" data-filter="negativos">Negativos</button>
                    <button class="btn-filter" data-filter="zerados">Zerados</button>
                </div>
                <div class="table-wrapper"><table class="data-table">
                    <thead><tr><th>Funcionário</th><th>Saldo Atual</th><th>Créditos Mês</th><th>Débitos Mês</th></tr></thead>
                    <tbody id="bank-hours-table-body"></tbody>
                </table></div>
            </div>
        </div>`;

        const tableBody = document.getElementById('bank-hours-table-body');
        const filterButtons = pageContainer.querySelectorAll('.btn-filter');

        try {
            // MUDANÇA: Busca os dados da API
            const bankHoursData = await window.authManager.apiCall('/banco-horas/equipe/');

            // Função para renderizar a tabela (lógica existente, mas agora dentro do try/catch)
            const renderTable = (filter) => {
                tableBody.innerHTML = '';
                let filteredData = bankHoursData;

                if (filter === 'positivos') filteredData = bankHoursData.filter(m => m.balance > 0);
                else if (filter === 'negativos') filteredData = bankHoursData.filter(m => m.balance < 0);
                else if (filter === 'zerados') filteredData = bankHoursData.filter(m => m.balance === 0);

                if (filteredData.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="4" class="empty-state">Nenhum registro encontrado para este filtro.</td></tr>';
                    return;
                }

                filteredData.forEach(member => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                    <td>${member.name}</td>
                    <td class="${member.balance === 0 ? '' : (member.balance > 0 ? 'positive' : 'negative')}">
                        ${member.balance === 0 ? '' : (member.balance > 0 ? '+' : '-')} ${this.formatHours(Math.abs(member.balance), true)}
                    </td>
                    <td class="positive">+ ${this.formatHours(member.credits, true)}</td>
                    <td class="negative">- ${this.formatHours(member.debits, true)}</td>
                `;
                    tableBody.appendChild(row);
                });
            };

            // Adiciona evento de clique aos botões de filtro
            filterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    renderTable(button.dataset.filter);
                });
            });

            renderTable('todos'); // Renderização inicial
        } catch (error) {
            console.error("Erro ao carregar dados do banco de horas:", error);
            pageContainer.innerHTML = `<div class="page-header"><h1>Erro</h1><p>Não foi possível carregar os dados.</p></div>`;
        } finally {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    // Adicione ou modifique este método de formatação de horas na classe PontoMaxApp
    formatHours(hoursDecimal, useSuffix = false) {
        if (hoursDecimal === 0 && !useSuffix) return '00:00';

        const totalMinutes = Math.floor(hoursDecimal * 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;

        if (useSuffix) {
            return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
        }
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    // Substitua a função existente em app.js
    // Substitua completamente a sua função loadHoleriteData por esta versão dinâmica
    // Substitua completamente a sua função loadHoleriteData por esta versão
    async loadHoleriteData() {
        const payslipPeriodSelector = document.getElementById('payslip-period');
        if (!payslipPeriodSelector) return;

        const selectedPeriod = payslipPeriodSelector.value;

        try {
            // A ÚNICA chamada necessária, usando nosso helper que já envia o token
            const payslipData = await window.authManager.apiCall(`/holerites/?periodo=${selectedPeriod}`);

            // Se a chamada acima for bem-sucedida, o código continua e popula a tela.
            // A sua lógica para preencher o HTML a partir daqui já está perfeita.

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

            earnings.forEach(item => {
                grossTotal += parseFloat(item.valor);
                earningsContent.innerHTML += createLineItem(item);
            });

            deductions.forEach(item => {
                deductionsTotal += parseFloat(item.valor);
                deductionsContent.innerHTML += createLineItem(item, true);
            });

            const netTotal = grossTotal - deductionsTotal;

            document.getElementById('payslip-gross-total').textContent = this.formatCurrency(grossTotal);
            document.getElementById('payslip-deductions-total').textContent = this.formatCurrency(deductionsTotal);
            document.getElementById('payslip-net-total').textContent = this.formatCurrency(netTotal);

        } catch (error) {
            console.error('Erro ao buscar dados do holerite:', error);
            // Limpa a tela se a API retornar um erro (como 404 - não encontrado)
            document.getElementById('payslip-title').textContent = 'Holerite - Nenhum dado encontrado';
            document.getElementById('payslip-user-info').textContent = '';
            document.getElementById('payslip-earnings-content').innerHTML = '<p class="no-records">Sem dados para este período.</p>';
            document.getElementById('payslip-deductions-content').innerHTML = '';
            document.getElementById('payslip-gross-total').textContent = this.formatCurrency(0);
            document.getElementById('payslip-deductions-total').textContent = this.formatCurrency(0);
            document.getElementById('payslip-net-total').textContent = this.formatCurrency(0);
        }
    }

    loadGestorDashboardData() {
        const pageContainer = document.getElementById('dashboard-page');
        if (!pageContainer) return;

        const currentUser = window.authManager.getCurrentUser();
        if (!currentUser || (currentUser.perfil !== 'GESTOR' && currentUser.perfil !== 'ADMIN')) {
            // Se não for gestor, mostra o dashboard de colaborador (ou uma mensagem)
            // A lógica do dashboard de colaborador já está em dashboard.js
            return;
        }

        // Mock data para o painel do gestor
        const gestorData = {
            gestorName: currentUser.nome.split(' ')[0],
            stats: { pendentes: 2, aniversariantes: 1, ativos: 12, ausentes: 3 },
            teamStatus: [
                { initials: 'JR', name: 'Jean Rufino', status: 'Trabalhando', lastPunch: '08:00', hoursToday: '05:30' },
                { initials: 'AC', name: 'Anna Claudia', status: 'Em pausa', lastPunch: '12:00', hoursToday: '01:30' },
                { initials: 'EF', name: 'Eduarda Fachola', status: 'Trabalhando', lastPunch: '12:05', hoursToday: '01:25' },
                { initials: 'GS', name: 'Guilherme Sales', status: 'Ausente', lastPunch: null, hoursToday: '00:00' },
                { initials: 'HS', name: 'Heitor Sales', status: 'Finalizado', lastPunch: '06:00', hoursToday: '06:00' }
            ],
            weeklySummary: { workedHours: '342h 30m', avgPerEmployee: '7h 45m', presenceRate: '94.2%', extraHours: '15h 20m' }
        };

        // HTML completo do Painel de Controle
        pageContainer.innerHTML = `
        <div class="page-header">
            <h1>Painel de Controle</h1>
            <p>Olá, ${gestorData.gestorName}! Aqui está o resumo da sua equipe</p>
        </div>
        <div class="summary-cards-grid">
            <div class="summary-card">
                <div class="card-content">
                    <div class="value warning">${gestorData.stats.pendentes}</div>
                    <div class="label">Ajustes pendentes</div>
                    <div class="sub-label">Solicitações para revisar</div>
                </div>
                <i data-lucide="alert-triangle" class="card-icon warning"></i>
            </div>
            <div class="summary-card">
                <div class="card-content">
                    <div class="value">${gestorData.stats.aniversariantes}</div>
                    <div class="label">Aniversariantes</div>
                    <div class="sub-label">Esta semana</div>
                </div>
                <i data-lucide="calendar" class="card-icon"></i>
            </div>
            <div class="summary-card">
                <div class="card-content">
                    <div class="value success">${gestorData.stats.ativos}</div>
                    <div class="label">Ativos hoje</div>
                    <div class="sub-label">Colaboradores trabalhando</div>
                </div>
                <i data-lucide="user-check" class="card-icon success"></i>
            </div>
            <div class="summary-card">
                <div class="card-content">
                    <div class="value danger">${gestorData.stats.ausentes}</div>
                    <div class="label">Ausentes</div>
                    <div class="sub-label">Não registraram ponto</div>
                </div>
                <i data-lucide="user-x" class="card-icon danger"></i>
            </div>
        </div>
        <div class="main-card">
            <div class="card-header-flex">
                <div>
                    <h2>Status da Equipe em Tempo Real</h2>
                    <p>Acompanhe o status atual de todos os colaboradores</p>
                </div>
            </div>
            <div class="team-status-table-wrapper">
                <table class="team-status-table">
                    <thead>
                        <tr>
                            <th>Funcionário</th>
                            <th>Status</th>
                            <th>Último Registro</th>
                            <th>Horas Hoje</th>
                        </tr>
                    </thead>
                    <tbody id="team-status-body"></tbody>
                </table>
            </div>
            <div class="card-footer">
                <!-- BOTÃO MODIFICADO COM UM ID -->
                <button id="view-team-details-btn" class="btn-primary">Ver Detalhes da Equipe</button>
            </div>
        </div>
        <div class="bottom-section-grid">
            <!-- ... (código das ações rápidas e resumo semanal) ... -->
        </div>
    `;

        // Popula a tabela de status da equipe (código existente)
        const teamStatusBody = document.getElementById('team-status-body');
        teamStatusBody.innerHTML = '';
        const statusClasses = { 'Trabalhando': 'working', 'Em pausa': 'paused', 'Ausente': 'absent', 'Finalizado': 'finished' };
        const statusIcons = { 'Trabalhando': 'circle', 'Em pausa': 'pause-circle', 'Ausente': 'user-x', 'Finalizado': 'check-circle' };

        gestorData.teamStatus.forEach(member => {
            const row = document.createElement('tr');
            row.innerHTML = `
            <td><div class="employee-cell"><div class="employee-initials">${member.initials}</div><span>${member.name}</span></div></td>
            <td><div class="status-badge ${statusClasses[member.status] || ''}"><i data-lucide="${statusIcons[member.status] || 'circle'}"></i><span>${member.status}</span></div></td>
            <td>${member.lastPunch || '--:--'}</td>
            <td>${member.hoursToday}</td>
        `;
            teamStatusBody.appendChild(row);
        });

        // =========================================================================
        // NOVA LÓGICA ADICIONADA AQUI
        // =========================================================================
        // 1. Encontra o botão que acabamos de criar
        const viewTeamBtn = document.getElementById('view-team-details-btn');

        // 2. Adiciona o "ouvinte" de clique
        if (viewTeamBtn) {
            viewTeamBtn.addEventListener('click', () => {
                // 3. Chama a função de navegação para a página 'equipe'
                // (Assumindo que esta função está dentro da classe PontoMaxApp)
                if (window.pontoMaxApp) {
                    window.pontoMaxApp.navigateToPage('equipe');
                }
            });
        }

        // Recria todos os ícones da Lucide na página
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    async loadEquipeData() {
        const pageContainer = document.getElementById('equipe-page');
        if (!pageContainer) return;

        // A verificação de permissão continua a mesma
        const currentUser = window.authManager.getCurrentUser();
        if (!currentUser || (currentUser.profile.perfil !== 'GESTOR' && currentUser.profile.perfil !== 'ADMIN')) {
            pageContainer.innerHTML = `<div class="page-header"><h1>Acesso Negado</h1><p>Você não tem permissão para visualizar esta página.</p></div>`;
            return;
        }

        try {
            // 1. BUSCA OS DADOS DA API EM VEZ DE USAR O ARRAY ESTÁTICO
            const teamData = await window.authManager.apiCall('/equipe/');

            // 2. O RESTO DO CÓDIGO PARA CONSTRUIR E RENDERIZAR A PÁGINA CONTINUA O MESMO
            pageContainer.innerHTML = `
            <div class="page-header">
                <h1>Equipe / Funcionários</h1>
                <p>Pesquise e acompanhe sua equipe em tempo real</p>
            </div>
            <div class="main-card">
                <div class="card-header-flex">
                    <div>
                        <h2><i data-lucide="users"></i> Funcionários</h2>
                        <p>Lista de colaboradores gerenciados</p>
                    </div>
                </div>
                <div class="card-content">
                    <div class="search-bar">
                        <input type="text" id="team-search-input" class="form-input" placeholder="Buscar por nome">
                        <button id="team-search-btn" class="btn-primary"><i data-lucide="search"></i><span>Buscar</span></button>
                    </div>
                    <div class="table-wrapper">
                        <table class="team-list-table">
                            <thead><tr><th>Nome</th><th>Cargo</th><th>Meta diária</th><th>Ações</th></tr></thead>
                            <tbody id="team-list-body"></tbody>
                        </table>
                    </div>
                </div>
                <div class="card-footer">
                    <button id="btn-show-register-modal" class="btn-primary"><i data-lucide="plus"></i><span>Cadastrar Funcionário</span></button>
                </div>
            </div>`;

            const tableBody = document.getElementById('team-list-body');
            const searchInput = document.getElementById('team-search-input');
            const searchBtn = document.getElementById('team-search-btn');
            const btnShowRegister = document.getElementById('btn-show-register-modal');

            const renderTeamTable = (employeesToRender) => {
                tableBody.innerHTML = '';
                if (employeesToRender.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">Nenhum funcionário encontrado.</td></tr>';
                    return;
                }
                employeesToRender.forEach(member => {
                    // Adicionamos valores padrão para os campos que não vêm da API ainda
                    const workedHours = member.workedHours || 6;
                    const dailyGoal = member.dailyGoal || 8;

                    const isGoalMet = workedHours >= dailyGoal;
                    const progressClass = isGoalMet ? 'success' : 'warning';
                    const row = document.createElement('tr');
                    if (member.profile) {
                        row.innerHTML = `
                            <td>${member.nome}</td> <td>${member.profile.perfil}</td> <td>
                                <div class="daily-goal-cell ${progressClass}">
                                    <i data-lucide="clock"></i>
                                    <span>${workedHours}h / ${dailyGoal}h</span>
                                </div>
                            </td>
                            <td><button class="btn-outline" data-employee-id="${member.id}">Ver</button></td>`;
                        tableBody.appendChild(row);
                    }

                });
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            };

            const filterAndRender = () => {
                const searchTerm = searchInput.value.toLowerCase().trim();
                if (!searchTerm) {
                    renderTeamTable(teamData);
                    return;
                }
                const filteredEmployees = teamData.filter(member => member.name.toLowerCase().includes(searchTerm));
                renderTeamTable(filteredEmployees);
            };

            searchBtn.addEventListener('click', filterAndRender);
            searchInput.addEventListener('keyup', filterAndRender);

            tableBody.addEventListener('click', (e) => {
                if (e.target && e.target.classList.contains('btn-outline')) {
                    const employeeId = parseInt(e.target.dataset.employeeId);
                    // Nota: a função openEmployeeModal ainda usa dados estáticos.
                    // Teremos que migrá-la também no futuro.
                    this.openEmployeeModal(employeeId);
                }
            });

            if (btnShowRegister) {
                btnShowRegister.addEventListener('click', () => this.openRegisterModal());
            }

            renderTeamTable(teamData);

        } catch (error) {
            console.error("Erro ao carregar dados da equipe:", error);
            pageContainer.innerHTML = `<div class="page-header"><h1>Erro</h1><p>Não foi possível carregar os dados da equipe.</p></div>`;
        }
    }

    updateClock() {
        const clockElement = document.getElementById('current-time');
        if (!clockElement) return;

        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            clockElement.textContent = timeString;
        };

        updateTime();
        setInterval(updateTime, 1000);
    }

    handlePunchClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        this.showToast('Ponto Registrado', `Ponto registrado às ${timeString}`, 'success');

        // Em produção, enviar para API Django
        console.log('Registrando ponto:', timeString);
    }

    showToast(title, message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const iconMap = {
            success: 'check-circle',
            error: 'x-circle',
            warning: 'alert-triangle',
            info: 'info'
        };

        toast.innerHTML = `
            <i data-lucide="${iconMap[type] || 'info'}"></i>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i data-lucide="x"></i>
            </button>
        `;

        // Adicionar evento de fechar
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.remove();
        });

        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);

        toastContainer.appendChild(toast);

        // Recriar ícones
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // Método para fazer chamadas para API Django
    async callAPI(endpoint, options = {}) {
        try {
            return await window.authManager.apiCall(`/api${endpoint}`, options);
        } catch (error) {
            this.showToast('Erro', 'Erro de comunicação com o servidor', 'error');
            throw error;
        }
    }

    // Adicione este método à classe PontoMaxApp em app.js
    formatCurrency(value) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // Em app.js, adicione estas duas novas funções à classe PontoMaxApp
    async openEmployeeModal(employeeId) {
        const modal = document.getElementById('employee-modal');
        // Guardamos o ID no próprio elemento do modal para fácil acesso
        modal.dataset.employeeId = employeeId;
        try {
            const employee = await window.authManager.apiCall(`/equipe/${employeeId}/`);
            if (!employee) return;

            // Popula o modal com os dados vindos do backend
            document.getElementById('modal-fullname').value = employee.nome;
            document.getElementById('modal-email').value = employee.email;
            // MUDANÇA: Acessando o perfil dentro do objeto 'profile'
            document.getElementById('modal-role').value = employee.profile.perfil;
            document.getElementById('modal-initials').textContent = employee.nome.split(' ').map(n => n[0]).join('');

            // MUDANÇA: Acessando os campos dentro do objeto 'profile'
            document.getElementById('modal-salary').value =
                parseFloat(employee.profile.salario_base || 0).toFixed(2).replace('.', ',');

            document.getElementById('modal-monthly-hours').value =
                employee.profile.horas_mensais || 0;

            // O valor da hora já está no nível principal, então continua igual
            document.getElementById('modal-hourly-rate').value =
                parseFloat(employee.valor_hora || 0).toFixed(2).replace('.', ',');
            modal.classList.remove('hidden');
        } catch (error) {
            console.error("Erro ao buscar detalhes do funcionário:", error);
            window.pontoMaxApp.showToast('Erro', 'Não foi possível carregar os dados do funcionário.', 'error');
        }
    }

    closeEmployeeModal() {
        document.getElementById('employee-modal').classList.add('hidden');
    }

    openRegisterModal() {
        // Limpa os campos antes de abrir
        const form = document.querySelector('#register-employee-modal .modal-form');
        if (form) form.reset();

        // Mostra o modal
        document.getElementById('register-employee-modal').classList.remove('hidden');
    }

    closeRegisterModal() {
        document.getElementById('register-employee-modal').classList.add('hidden');
    }

    // Em app.js, adicione esta nova função à classe PontoMaxApp
    loadFechamentoData() {
        const pageContainer = document.getElementById('fechamento-page');
        if (!pageContainer) return;

        let contentHTML = '';

        // Switch para decidir qual passo renderizar
        switch (this.fechamentoCurrentStep) {
            case 1:
                // ... código do Passo 1 ...
                contentHTML = `
                <div class="step-card">
                    <div class="step-header">
                        <i data-lucide="calendar-days"></i>
                        <div><h2>Passo 1</h2><p>Selecione o mês/ano de referência.</p></div>
                    </div>
                    <div class="step-content">
                        <div class="form-group"><label for="fechamento-periodo">Mês/Ano</label><select id="fechamento-periodo" class="form-select"><option value="2025-08">Agosto/2025</option><option value="2025-07">Julho/2025</option><option value="2025-06">Junho/2025</option></select></div>
                        <button id="btn-avancar-passo1" class="btn-primary"><i data-lucide="settings-2"></i><span>Avançar</span></button>
                    </div>
                </div>`;
                break;

            case 2:
                // ... código do Passo 2 ...
                const teamBalanceData = [
                    { name: 'Jean Rufino', balance: 5.5, selected: true }, { name: 'Anna Claudia', balance: 3.33, selected: false },
                    { name: 'Eduarda Fachola', balance: 5.5, selected: false }, { name: 'Guilherme Sales', balance: 5.5, selected: false },
                    { name: 'Heitor Sales', balance: -1.5, selected: false }
                ];
                contentHTML = `
                <div class="step-card">
                    <div class="step-header">
                        <i data-lucide="users"></i>
                        <div><h2>Passo 2</h2><p>Revise os saldos do banco de horas e selecione funcionários.</p></div>
                    </div>
                    <div class="table-wrapper">
                        <table class="closing-table">
                            <thead><tr><th>Funcionário</th><th>Saldo Atual</th><th>Selecionado</th></tr></thead>
                            <tbody>${teamBalanceData.map(member => `<tr><td>${member.name}</td><td class="${member.balance >= 0 ? 'positive' : 'negative'}">${member.balance >= 0 ? '+' : '-'} ${this.formatHours(Math.abs(member.balance), true)}</td><td><input type="checkbox" class="form-checkbox" ${member.selected ? 'checked' : ''}></td></tr>`).join('')}</tbody>
                        </table>
                    </div>
                    <div class="card-footer single-button"><button id="btn-gerar-holerites" class="btn-primary"><i data-lucide="file-text"></i><span>Gerar holerites</span></button></div>
                </div>`;
                break;

            case 3:
                // ... código do Passo 3 ...
                contentHTML = `
                <div class="step-card">
                    <div class="step-header">
                        <i data-lucide="send"></i>
                        <div><h2>Passo 3</h2><p>Envie os holerites selecionados.</p></div>
                    </div>
                    <div class="step-content column">
                        <p id="progress-status-text">Iniciando geração...</p>
                        <div class="progress-bar"><div id="progress-bar-inner" class="progress-bar-inner"></div></div>
                        <button id="btn-enviar-holerites" class="btn-primary" disabled><i data-lucide="send"></i><span>Enviar holerites</span></button>
                    </div>
                </div>`;
                setTimeout(() => this.animateProgressBar(), 100);
                break;

            // NOVO CÓDIGO PARA O PASSO FINAL (SUCESSO)
            case 4:
                contentHTML = `
                <div class="success-message-container">
                    <i data-lucide="check-circle"></i>
                    <h2>Holerites enviados com sucesso!</h2>
                </div>
            `;
                // Reinicia o fluxo para o Passo 1 após 5 segundos
                setTimeout(() => {
                    // Apenas reinicia se o usuário ainda estiver na página de fechamento
                    if (this.currentPage === 'fechamento') {
                        this.fechamentoCurrentStep = 1;
                        this.loadFechamentoData();
                    }
                }, 5000);
                break;
        }

        pageContainer.innerHTML = `
        <div class="page-header">
            <h1>Fechamento e Holerites</h1>
            <p>Fluxo passo a passo para gerar e enviar holerites</p>
        </div>
        ${contentHTML}
    `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // ADICIONE ESTA NOVA FUNÇÃO à sua classe PontoMaxApp
    animateProgressBar() {
        const progressBar = document.getElementById('progress-bar-inner');
        const statusText = document.getElementById('progress-status-text');
        const sendButton = document.getElementById('btn-enviar-holerites');

        if (!progressBar || !statusText || !sendButton) return;

        // Estado inicial (a animação começa aqui)
        statusText.textContent = 'Gerando holerites... Status: Em progresso';
        progressBar.style.width = '100%'; // Anima até 80%

        // Simula o fim do processo após 2 segundos
        setTimeout(() => {
            statusText.textContent = 'Holerites gerados: 5 • Status: Gerado';
            sendButton.disabled = false; // Habilita o botão de envio
        }, 2000); // 2 segundos, igual à duração da transição do CSS
    }

    async handleRegisterEmployee(e) {
        e.preventDefault();

        // 1. Lemos os valores dos campos
        const salarioStr = document.getElementById('register-salary').value.replace(',', '.');
        const horasStr = document.getElementById('register-monthly-hours').value;

        // 2. Montamos o payload, tratando campos vazios e convertendo para números
        const payload = {
            first_name: document.getElementById('register-fullname').value.split(' ')[0] || '',
            last_name: document.getElementById('register-fullname').value.split(' ').slice(1).join(' '),
            email: document.getElementById('register-email').value,
            password: document.getElementById('register-password').value,
            profile: {
                perfil: document.getElementById('register-role').value,
                // Lógica igual à da função de ATUALIZAR:
                salario_base: salarioStr ? parseFloat(salarioStr) : null,
                horas_mensais: horasStr ? parseInt(horasStr) : null
            }
        };

        // 3. O bloco try/catch para enviar para a API (com melhor log de erro)
        try {
            await window.authManager.apiCall('/equipe/', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            this.showToast('Sucesso', 'Funcionário cadastrado com sucesso!', 'success');
            this.closeRegisterModal();
            this.loadEquipeData(); // Recarrega a lista da equipe
        } catch (error) {
            // Tenta mostrar um erro mais específico (ex: "email já existe")
            const errorMessage = error?.email?.[0] || 'Não foi possível cadastrar o funcionário.';
            this.showToast('Erro', errorMessage, 'error');
            console.error("Erro ao cadastrar funcionário:", error);
        }
    }

    async handleUpdateEmployee(employeeId) {
        // 1. Lemos e limpamos os dados dos campos
        const fullname = document.getElementById('modal-fullname').value.trim();
        const email = document.getElementById('modal-email').value.trim();
        const perfil = document.getElementById('modal-role').value.trim(); // 'perfil' é o cargo
        const salarioStr = document.getElementById('modal-salary').value.replace(',', '.');
        const horasStr = document.getElementById('modal-monthly-hours').value;

        // 2. VALIDAÇÃO: Verificamos se os campos obrigatórios não estão vazios
        if (!fullname || !email || !perfil) {
            this.showToast('Erro de Validação', 'Nome, e-mail e cargo são obrigatórios.', 'error');
            return; // Impede o envio da requisição
        }

        // 3. Montamos o payload para enviar
        const payload = {
            first_name: fullname.split(' ')[0] || '',
            last_name: fullname.split(' ').slice(1).join(' '),
            email: email,
            profile: {
                perfil: perfil,
                salario_base: salarioStr ? parseFloat(salarioStr) : null,
                horas_mensais: horasStr ? parseInt(horasStr) : null
            }
        };

        // 4. O bloco try/catch para enviar para a API continua o mesmo
        try {
            await window.authManager.apiCall(`/equipe/${employeeId}/`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            this.showToast('Sucesso', 'Alterações salvas com sucesso!', 'success');
            this.closeEmployeeModal();
            this.loadEquipeData();
        } catch (error) {
            const errorMessage = error?.email?.[0] || 'Não foi possível salvar as alterações.';
            this.showToast('Erro', errorMessage, 'error');
            console.error("Erro ao atualizar funcionário:", error);
        }
    }

    async handleDeleteEmployee(employeeId) {
        if (!confirm('Tem certeza que deseja remover este funcionário? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            await window.authManager.apiCall(`/equipe/${employeeId}/`, {
                method: 'DELETE'
            });
            this.showToast('Sucesso', 'Funcionário removido com sucesso!', 'success');
            this.closeEmployeeModal();
            this.loadEquipeData(); // Recarrega a lista
        } catch (error) {
            this.showToast('Erro', 'Não foi possível remover o funcionário.', 'error');
        }
    }

}

// Inicializar aplicação
window.pontoMaxApp = new PontoMaxApp();


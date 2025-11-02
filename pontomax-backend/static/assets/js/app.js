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
        this.setupNotificationSystem();
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

        const mainApp = document.getElementById('main-app');
        if (mainApp) {
            mainApp.addEventListener('click', (e) => {
                const navItem = e.target.closest('.nav-item[data-page]');
                if (navItem) {
                    this.handleNavigation(e, navItem);
                }
            });
        }

        const userMenuTrigger = document.getElementById('user-menu-trigger');
        const userDropdown = document.getElementById('user-dropdown');
        const notificationBell = document.getElementById('notification-bell');
        const notificationDropdown = document.getElementById('notification-dropdown');

        const closeAllDropdowns = () => {
            if (userDropdown) userDropdown.classList.remove('show');
            if (notificationDropdown) notificationDropdown.classList.remove('show');
        };

        document.addEventListener('click', closeAllDropdowns);

        // Lógica para o menu de usuário
        if (userMenuTrigger && userDropdown) {
            userMenuTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const isShowing = userDropdown.classList.contains('show');
                closeAllDropdowns();
                if (!isShowing) {
                    userDropdown.classList.add('show');
                }
            });

            // --- CORREÇÃO PRINCIPAL AQUI ---
            userDropdown.addEventListener('click', e => {
                // Verifica se o clique foi em um link de navegação dentro do dropdown
                const navItem = e.target.closest('.nav-item[data-page]');

                // Se NÃO FOI em um link de navegação, impede a propagação para não fechar o menu.
                // Se FOI em um link, DEIXA o evento se propagar para ser capturado pelo listener de navegação.
                if (!navItem) {
                    e.stopPropagation();
                }
            });
        }

        // Lógica para o menu de notificações (com a mesma correção)
        if (notificationBell && notificationDropdown) {
            notificationBell.addEventListener('click', (e) => {
                e.stopPropagation();
                const isShowing = notificationDropdown.classList.contains('show');
                closeAllDropdowns();
                if (!isShowing) {
                    notificationDropdown.classList.add('show');
                }
            });

            notificationDropdown.addEventListener('click', e => {
                const navItem = e.target.closest('.nav-item[data-page]');
                if (!navItem) {
                    e.stopPropagation();
                }
            });
        }
        // --- FIM DA LÓGICA UNIFICADA ---

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

        const hamburgerBtn = document.getElementById('hamburger-btn');
        const sidebarMenu = document.getElementById('sidebar-menu');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        const sidebarCloseBtn = document.getElementById('sidebar-close-btn');

        const openSidebar = () => {
            sidebarMenu.classList.add('is-open');
            sidebarOverlay.classList.add('is-open');
        };

        const closeSidebar = () => {
            sidebarMenu.classList.remove('is-open');
            sidebarOverlay.classList.remove('is-open');
        };

        if (hamburgerBtn) hamburgerBtn.addEventListener('click', openSidebar);
        if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeSidebar);
        if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

        // Adicionamos o listener ao container, pois os links serão criados dinamicamente
        const sidebarNav = document.getElementById('sidebar-nav-links');
        if (sidebarNav) {
            sidebarNav.addEventListener('click', (e) => {
                if (e.target.closest('.nav-item')) {
                    closeSidebar();
                }
            });
        }

        const editRegistroModal = document.getElementById('edit-registro-modal');
        const editRegistroCloseBtn = document.getElementById('edit-registro-close-btn');

        if (editRegistroModal) {
            editRegistroModal.addEventListener('click', e => {
                if (e.target === editRegistroModal) editRegistroModal.classList.add('hidden');
            });
        }
        if (editRegistroCloseBtn) {
            editRegistroCloseBtn.addEventListener('click', () => editRegistroModal.classList.add('hidden'));
        }

        const justificativaModal = document.getElementById('justificativa-modal');
        const justificativaCloseBtn = document.getElementById('justificativa-close-btn');

        if (justificativaModal) {
            justificativaModal.addEventListener('click', e => {
                if (e.target === justificativaModal) this.closeJustificativaModal();
            });
        }
        if (justificativaCloseBtn) {
            justificativaCloseBtn.addEventListener('click', () => this.closeJustificativaModal());
        }
        const viewJustificativaModal = document.getElementById('view-justificativa-modal');
        const viewJustificativaCloseBtn = document.getElementById('view-justificativa-close-btn');

        if (viewJustificativaModal) {
            viewJustificativaModal.addEventListener('click', e => {
                if (e.target === viewJustificativaModal) this.closeViewJustificativaModal();
            });
        }
        if (viewJustificativaCloseBtn) {
            viewJustificativaCloseBtn.addEventListener('click', () => this.closeViewJustificativaModal());
        }
    }

    resetFechamento() {
        // Limpa os dados do fechamento que estava em andamento
        this.currentFechamento = null;
        this.dadosRevisao = null;
        // Recarrega a página de fechamento, que voltará ao Passo 1 por não ter dados
        this.loadFechamentoData();
    }

    checkAuthentication() {
        setTimeout(() => {
            if (window.authManager.isLoggedIn()) {
                window.authManager.showMainApp();
                const user = window.authManager.getCurrentUser();

                // --- LÓGICA DE DIRECIONAMENTO ATUALIZADA ---
                if (user && user.profile.must_change_password) {
                    this.navigateToPage('perfil');
                    this.showToast('Aviso de Segurança', 'Por favor, altere sua senha provisória.', 'warning');
                } else if (user && user.profile.perfil === 'ADMIN') {
                    this.navigateToPage('admin');
                } else {
                    this.navigateToPage('dashboard');
                }
                // --- FIM DA LÓGICA ---

            } else {
                window.authManager.showLoginPage();
            }
        }, 1500); // O delay continua o mesmo
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
                // DEPOIS:
                const user = window.authManager.getCurrentUser();
                if (user && user.profile.must_change_password) {
                    this.navigateToPage('perfil');
                    this.showToast('Aviso de Segurança', 'Por favor, altere sua senha provisória.', 'warning');
                } else if (user && user.profile.perfil === 'ADMIN') {
                    this.navigateToPage('admin');
                } else {
                    this.navigateToPage('dashboard');
                }
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

    handleNavigation(e, navItem) {
        e.preventDefault();
        const page = navItem.getAttribute('data-page');
        const subPage = navItem.getAttribute('data-subpage'); // <-- Pega a sub-página
        if (page) {
            // Passa a sub-página como um objeto de opções
            this.navigateToPage(page, { subPage: subPage });
        }
    }

    // No seu arquivo assets/js/app.js, substitua esta função:
    navigateToPage(page, options = {}) {
        // --- ADICIONE ESTA LINHA DE DEPURAÇÃO ---
        console.log('--- NAVEGANDO PARA A PÁGINA:', page, '---');
        // -----------------------------------------
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
        this.loadPageData(page, options);
    }

    async loadJustificativasPage() {
        const pageContainer = document.getElementById('justificativas-page');
        if (!pageContainer) return;

        // 1. Define o layout inicial da página, incluindo o estado de carregamento
        pageContainer.innerHTML = `
        <div class="page-header">
            <h1>Ajustes Pendentes</h1>
            <p>Analise e resolva as justificativas enviadas pela sua equipe.</p>
        </div>
        <div class="loading-placeholder">
            <div class="spinner"></div>
            <p>Carregando justificativas...</p>
        </div>
    `;
        lucide.createIcons(); // Garante que ícones (se houver) sejam renderizados

        try {
            const justificativas = await window.authManager.apiCall('/justificativas/');
            const justificativasPendentes = justificativas.filter(j => j.status === 'PENDENTE');

            if (justificativasPendentes.length === 0) {
                // Se não houver pendentes, mostra a mensagem de "tudo em ordem"
                pageContainer.querySelector('.loading-placeholder').outerHTML = `
                <div class="empty-state-card">
                    <i data-lucide="check-check"></i>
                    <h2>Tudo em ordem!</h2>
                    <p>Você não possui nenhuma justificativa pendente para analisar no momento.</p>
                </div>
            `;
                lucide.createIcons();
                return;
            }

            // Se houver pendentes, substitui o loading pela tabela
            const tableHTML = `
            <div class="main-card">
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead><tr><th>Funcionário</th><th>Data da Ocorrência</th><th>Motivo</th><th>Ações</th></tr></thead>
                        <tbody>
                            ${justificativasPendentes.map(j => `
                                <tr>
                                    <td>${j.user_name}</td>
                                    <td>${new Date(j.data_ocorrencia + 'T03:00:00').toLocaleDateString('pt-BR')}</td>
                                    <td><p class="motivo-cell">${j.motivo}</p></td>
                                    <td>
                                        <button class="btn-success" onclick="window.pontoMaxApp.handleResolverJustificativa(${j.id}, 'APROVADO')">Aprovar</button>
                                        <button class="btn-danger" onclick="window.pontoMaxApp.handleResolverJustificativa(${j.id}, 'REJEITADO')">Rejeitar</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
            pageContainer.querySelector('.loading-placeholder').outerHTML = tableHTML;
            lucide.createIcons();

        } catch (error) {
            console.error("ERRO CRÍTICO em loadJustificativasPage:", error);
            pageContainer.innerHTML = '<h2>Erro ao carregar justificativas.</h2>';
        }
    }

    async handleResolverJustificativa(id, novoStatus) {
        const acao = novoStatus === 'APROVADO' ? 'aprovar' : 'rejeitar';
        if (!confirm(`Tem certeza que deseja ${acao} esta justificativa?`)) {
            return;
        }

        try {
            await window.authManager.apiCall(`/justificativas/${id}/resolver/`, {
                method: 'POST',
                body: JSON.stringify({ status: novoStatus })
            });
            this.showToast('Sucesso', `Justificativa marcada como ${novoStatus.toLowerCase()}.`, 'success');
            // Recarrega a lista para remover o item que foi processado
            this.loadJustificativasPage();
        } catch (error) {
            this.showToast('Erro', 'Não foi possível processar a solicitação.', 'error');
        }
    }

    loadPageData(page, options = {}) {
        switch (page) {
            case 'dashboard':
                // AQUI ESTÁ A LÓGICA PRINCIPAL QUE PRECISA SER CORRIGIDA
                const currentUser = window.authManager.getCurrentUser();
                console.log("Verificando perfil do usuário no Dashboard:", currentUser);

                if (currentUser && (currentUser.profile.perfil === 'GESTOR' || currentUser.profile.perfil === 'ADMIN')) {
                    console.log(`Perfil: ${currentUser.profile.perfil}`)
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
                this.setupHoleritePage();
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
            case 'admin':
                // Passa a sub-página para a função que carrega o painel de admin
                this.loadAdminPage(options.subPage);
                break;
            case 'justificativas':
                this.loadJustificativasPage();
                break;
            case 'perfil':
                this.loadProfilePage();
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
        const periodInput = document.getElementById('period-filter');
        const searchBtn = document.getElementById('search-btn');
        const downloadBtn = document.getElementById('btn-download-pdf');
        const recordsList = document.getElementById('records-table-body');

        
        const formatDateForAPI = (date) => date.toISOString().split('T')[0];

        if (!periodInput || !searchBtn) return;

        const renderTableAndSummary = (recordsToRender) => {
            recordsList.innerHTML = '';
            let totalWorked = 0, totalOvertime = 0, totalDebit = 0;

            const tableHeader = recordsList.parentElement.querySelector('thead tr');
            if (tableHeader) {
                tableHeader.innerHTML = `
                    <th>Data</th>
                    <th>Total Trabalhado</th>
                    <th>Horas Extras</th>
                    <th>Débito</th>
                    <th>Status</th>
                    <th>Ações</th>
                `;
            }

            if (!recordsToRender || recordsToRender.length === 0) {
                recordsList.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">Nenhum registro encontrado para este período.</td></tr>';
            } else {
                recordsToRender.forEach(record => {
                    const date = new Date(record.date + 'T03:00:00'); // Ajuste de fuso horário local
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
                        <td>${this.formatHours(record.worked, true)}</td>
                        <td class="positive">${this.formatHours(record.overtime, true)}</td>
                        <td class="negative">${this.formatHours(record.debit, true)}</td>
                        <td><span class="status-badge status-${record.status.toLowerCase()}">${record.status}</span></td>
                        <td>
                            ${record.justificativa_status ?
                                `<button class="btn-secondary" onclick="window.pontoMaxApp.openViewJustificativaModal('${record.justificativa_status}', '${record.justificativa_motivo.replace(/'/g, "\\'").replace(/"/g, '\\"')}','${record.date}')">Visualizar</button>` :
                            (record.debit > 0 ? 
                                `<button class="btn-outline" onclick="window.pontoMaxApp.openJustificativaModal('${record.date}')">Justificar</button>`
                                : '')
                            }
                        </td>
                    `;
                    recordsList.appendChild(row);
                });
            }
            document.getElementById('summary-total-worked').textContent = this.formatHours(totalWorked, true);
            document.getElementById('summary-overtime').textContent = `+${this.formatHours(totalOvertime, true)}`;
            document.getElementById('summary-debit').textContent = `-${this.formatHours(totalDebit, true)}`;
        };

        // Inicializa o calendário e guarda a instância em 'this' para ser acessível por outras funções
        this.registrosFlatpickr = flatpickr(periodInput, {
            mode: "range",
            dateFormat: "d/m/Y",
            locale: "pt",
            defaultDate: [new Date(new Date().setDate(1)), new Date()],
            onClose: () => this.fetchRegistrosData() // Ao fechar, chama a nova função de busca
        });

        searchBtn.addEventListener('click', () => this.fetchRegistrosData());

        

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
        const fp = flatpickr(periodInput, {
            mode: "range",
            dateFormat: "d/m/Y",
            locale: "pt",
            defaultDate: [new Date(new Date().setDate(1)), new Date()],
            onClose: fetchAndRenderRecords
        });

        if (downloadBtn) {
            downloadBtn.addEventListener('click', async () => { // 1. Tornamos a função 'async'
                try {
                    const dates = fp.selectedDates;
                    if (dates.length < 2) {
                        this.showToast('Aviso', 'Selecione um intervalo de datas para gerar o relatório.', 'warning');
                        return;
                    }

                    this.showToast('Aguarde', 'Gerando seu relatório em PDF...', 'info');

                    const formatDateForAPI = (date) => date.toISOString().split('T')[0];
                    const startDateStr = formatDateForAPI(dates[0]);
                    const endDateStr = formatDateForAPI(dates[1]);
                    const urlPath = `/registros/exportar_pdf/?start_date=${startDateStr}&end_date=${endDateStr}`;

                    // 2. Usamos nossa função 'apiCall' para fazer a requisição autenticada
                    const response = await window.authManager.apiCall(urlPath);

                    if (!response.ok) {
                        throw new Error('Falha ao gerar o relatório no servidor.');
                    }

                    // 3. Pegamos os dados do arquivo (Blob) e o nome do arquivo do cabeçalho
                    const blob = await response.blob();
                    const disposition = response.headers.get('content-disposition');
                    let filename = `relatorio_ponto_${startDateStr}.pdf`; // Nome padrão
                    if (disposition && disposition.includes('attachment')) {
                        const filenameMatch = disposition.match(/filename="(.+)"/);
                        if (filenameMatch.length > 1) {
                            filename = filenameMatch[1];
                        }
                    }

                    // 4. Criamos um link temporário na memória e clicamos nele para iniciar o download
                    const downloadUrl = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = downloadUrl;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();

                    // 5. Limpamos o link da memória
                    window.URL.revokeObjectURL(downloadUrl);
                    a.remove();

                } catch (error) {
                    console.error("Erro ao baixar PDF:", error);
                    this.showToast('Erro', 'Não foi possível baixar o relatório.', 'error');
                }
            });
        }

        // Faz a busca de dados inicial
        this.fetchRegistrosData();
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
        const contentWrapper = document.getElementById('payslip-content-wrapper');
        const emptyState = document.getElementById('payslip-empty-state');

        if (!payslipPeriodSelector || !contentWrapper || !emptyState) return;

        // Esconde ambos os containers antes de fazer a chamada
        contentWrapper.classList.add('hidden');
        emptyState.classList.add('hidden');

        const selectedPeriod = payslipPeriodSelector.value;

        try {
            // Mostra um estado de "carregando" (opcional, mas bom para UX)
            // (Aqui você poderia adicionar um spinner)

            const payslipData = await window.authManager.apiCall(`/holerites/?periodo=${selectedPeriod}`);

            // Preenche os dados como antes...
            document.getElementById('payslip-title').textContent = `Holerite - ${payslipData.periodLabel}`;
            document.getElementById('payslip-user-info').textContent = payslipData.userInfo;

            const earningsContent = document.getElementById('payslip-earnings-content');
            const deductionsContent = document.getElementById('payslip-deductions-content');
            earningsContent.innerHTML = '';
            deductionsContent.innerHTML = '';

            // ... (resto da lógica de preenchimento que você já tinha)
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

            payslipData.vencimentos.forEach(item => {
                grossTotal += parseFloat(item.valor);
                earningsContent.innerHTML += createLineItem(item);
            });

            payslipData.descontos.forEach(item => {
                deductionsTotal += parseFloat(item.valor);
                deductionsContent.innerHTML += createLineItem(item, true);
            });

            const netTotal = grossTotal - deductionsTotal;

            document.getElementById('payslip-gross-total').textContent = this.formatCurrency(grossTotal);
            document.getElementById('payslip-deductions-total').textContent = this.formatCurrency(deductionsTotal);
            document.getElementById('payslip-net-total').textContent = this.formatCurrency(netTotal);

            // Finalmente, MOSTRA o card do holerite
            contentWrapper.classList.remove('hidden');

        } catch (error) {
            console.error('Erro ao buscar dados do holerite:', error);
            // Em caso de erro (incluindo 404), MOSTRA a mensagem de estado vazio
            emptyState.classList.remove('hidden');
        }
    }

    async loadGestorDashboardData() {
        const pageContainer = document.getElementById('dashboard-page');
        if (!pageContainer) return;

        try {
            // MUDANÇA: Busca os dados da API em vez de usar o mock
            const gestorData = await window.authManager.apiCall('/dashboard-gestor/');


            // --- ADICIONE ESTA LINHA PARA DEPURAR ---
            console.log("Dados recebidos do dashboard do gestor:", gestorData);
            // -----------------------------------------
            // O RESTO DO CÓDIGO PARA RENDERIZAR O HTML CONTINUA EXATAMENTE O MESMO
            // A API foi desenhada para retornar os dados no formato que esta função já espera.

            pageContainer.innerHTML = `
            <div class="page-header">
                <h1>Painel de Controle</h1>
                <p>Olá, ${gestorData.gestorName}! Aqui está o resumo da sua equipe</p>
            </div>
            <div class="summary-cards-grid">
                <a href="#justificativas" class="summary-card-link nav-item" data-page="justificativas">
                    <div class="summary-card">
                        <div class="card-content"><div class="value warning">${gestorData.stats.pendentes}</div><div class="label">Ajustes pendentes</div></div>
                        <i data-lucide="alert-triangle" class="card-icon warning"></i>
                    </div>
                </a>
                <div class="summary-card">
                    <div class="card-content"><div class="value success">${gestorData.stats.ativos}</div><div class="label">Ativos hoje</div></div>
                    <i data-lucide="user-check" class="card-icon success"></i>
                </div>
                <div class="summary-card">
                    <div class="card-content"><div class="value danger">${gestorData.stats.ausentes}</div><div class="label">Ausentes</div></div>
                    <i data-lucide="user-x" class="card-icon danger"></i>
                </div>
            </div>
            <div class="main-card">
                <div class="card-header-flex"><div><h2>Status da Equipe em Tempo Real</h2><p>Acompanhe o status atual de todos os colaboradores</p></div></div>
                <div class="team-status-table-wrapper"><table class="team-status-table">
                    <thead><tr><th>Funcionário</th><th>Status</th><th>Último Registro</th><th>Horas Hoje</th></tr></thead>
                    <tbody id="team-status-body"></tbody>
                </table></div>
                <div class="card-footer"><button id="view-team-details-btn" class="btn-primary">Ver Detalhes da Equipe</button></div>
            </div>`;

            const teamStatusBody = document.getElementById('team-status-body');
            teamStatusBody.innerHTML = '';
            const statusClasses = { 'Trabalhando': 'working', 'Em pausa': 'paused', 'Ausente': 'absent', 'Finalizado': 'finished' };
            const statusIcons = { 'Trabalhando': 'circle', 'Em pausa': 'pause-circle', 'Ausente': 'user-x', 'Finalizado': 'check-circle' };

            gestorData.teamStatus.forEach(member => {
                const row = document.createElement('tr');
                row.innerHTML = `
                <td><div class="employee-cell"><div class="employee-initials">${member.initials}</div><span>${member.name}</span></div></td>
                <td><div class="status-badge ${statusClasses[member.status] || ''}"><i data-lucide="${statusIcons[member.status] || 'circle'}"></i><span>${member.status}</span></div></td>
                <td>${member.lastPunch}</td>
                <td>${member.hoursToday}</td>`;
                teamStatusBody.appendChild(row);
            });

            const viewTeamBtn = document.getElementById('view-team-details-btn');
            if (viewTeamBtn) {
                viewTeamBtn.addEventListener('click', () => {
                    if (window.pontoMaxApp) {
                        window.pontoMaxApp.navigateToPage('equipe');
                    }
                });
            }

        } catch (error) {
            console.error("Erro ao carregar dados do dashboard do gestor:", error);
            pageContainer.innerHTML = `<div class="page-header"><h1>Erro</h1><p>Não foi possível carregar os dados do painel de controle.</p></div>`;
        } finally {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
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
            const btnShowRegister = document.getElementById('btn-show-register-modal');

            const renderTeamTable = (employeesToRender) => {
                tableBody.innerHTML = '';
                if (employeesToRender.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">Nenhum funcionário encontrado.</td></tr>';
                    return;
                }
                employeesToRender.forEach(member => {
                    if (member.profile) {
                        // ANTES:
                        // const workedHours = member.workedHours || 6;
                        // const dailyGoal = member.dailyGoal || 8;

                        // DEPOIS (versão dinâmica):
                        const workedHours = member.horas_trabalhadas_hoje;
                        const dailyGoal = member.profile.jornada_diaria;

                        const isGoalMet = workedHours >= dailyGoal;
                        const progressClass = isGoalMet ? 'success' : 'warning';
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${member.nome}</td>
                            <td>${member.profile.perfil}</td>
                            <td>
                                <div class="daily-goal-cell ${progressClass}">
                                    <i data-lucide="clock"></i>
                                    <span>${workedHours.toFixed(1)}h / ${dailyGoal}h</span>
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
                const filteredEmployees = teamData.filter(member => member.nome.toLowerCase().includes(searchTerm));
                renderTeamTable(filteredEmployees);
            };

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

    showToast(title, message, type = 'info', onclose = null) {
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

        const closeAction = () => {
            if (toast.parentNode) {
                toast.remove();
            }
            // Se uma função 'onclose' foi passada, execute-a.
            if (onclose) {
                onclose();
            }
        };

        // Adicionar evento de fechar
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', closeAction);

        // Auto-remover após 5 segundos
        setTimeout(closeAction, 5000);

        toastContainer.appendChild(toast);
        lucide.createIcons();
    }

    formatDate(dateString) {
        // Adiciona uma verificação: se a data for nula ou inválida, retorna um placeholder.
        if (!dateString) {
            return '--';
        }

        const date = new Date(dateString);

        // Adiciona uma segunda verificação para o caso de o formato ser inválido
        if (isNaN(date)) {
            return '--';
        }

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
    async openEmployeeModal(employeeId, isAdmin = false) {
        const modal = document.getElementById('employee-modal');
        modal.dataset.employeeId = employeeId;
        modal.dataset.isAdmin = isAdmin; // <-- 1. Guarda o status de admin no modal

        // 2. Busca o container dos campos financeiros
        const financialInfo = document.getElementById('edit-financial-info');

        try {
            const employee = await window.authManager.apiCall(`/equipe/${employeeId}/`);
            if (!employee) return;

            // Popula os campos básicos
            document.getElementById('modal-fullname').value = employee.nome;
            document.getElementById('modal-email').value = employee.email;
            document.getElementById('modal-initials').textContent = employee.nome.split(' ').map(n => n[0]).join('');

            const roleFieldContainer = document.getElementById('modal-role').parentElement;

            if (isAdmin) {
                // Se for ADMIN
                financialInfo.classList.add('hidden'); // <-- 3. ESCONDE os campos financeiros

                // Admin pode editar o cargo
                roleFieldContainer.innerHTML = `
                <label for="modal-role">Cargo</label>
                <select id="modal-role" class="form-select">
                    <option value="COLABORADOR">Colaborador</option>
                    <option value="GESTOR">Gestor</option>
                    <option value="ADMIN">Admin</option>
                </select>
            `;
                document.getElementById('modal-role').value = employee.profile.perfil;
            } else {
                // Se for GESTOR
                financialInfo.classList.remove('hidden'); // <-- 4. MOSTRA os campos financeiros

                // Gestor não pode editar o cargo (apenas visualizar)
                roleFieldContainer.innerHTML = `
                <label for="modal-role">Cargo</label>
                <input type="text" id="modal-role" class="form-input" readonly />
            `;
                document.getElementById('modal-role').value = employee.profile.perfil;

                // Popula os campos financeiros
                document.getElementById('modal-salary').value = parseFloat(employee.profile.salario_base || 0).toFixed(2).replace('.', ',');
                document.getElementById('modal-monthly-hours').value = employee.profile.horas_mensais || 0;
                document.getElementById('modal-hourly-rate').value = parseFloat(employee.valor_hora || 0).toFixed(2).replace('.', ',');
            }

            modal.classList.remove('hidden');
        } catch (error) {
            console.error("Erro ao buscar detalhes do funcionário:", error);
            window.pontoMaxApp.showToast('Erro', 'Não foi possível carregar os dados do funcionário.', 'error');
        }
    }

    closeEmployeeModal() {
        document.getElementById('employee-modal').classList.add('hidden');
    }

    openRegisterModal(isAdmin = false) {
        const form = document.querySelector('#register-employee-modal .modal-form');
        if (form) form.reset();

        const roleInput = document.getElementById('register-role');
        const financialInfo = document.getElementById('register-financial-info'); // 1. Busque o div

        if (isAdmin) {
            // Admin pode selecionar o cargo
            const parent = roleInput.parentElement;
            parent.innerHTML = `
            <label for="register-role">Cargo</label>
            <select id="register-role" class="form-select" required>
                <option value="COLABORADOR">Colaborador</option>
                <option value="GESTOR">Gestor</option>
                <option value="ADMIN">Admin</option>
            </select>
        `;
            financialInfo.classList.add('hidden'); // 2. Esconde os campos financeiros
        } else {
            // Gestor só cadastra Colaborador
            roleInput.value = 'COLABORADOR';
            roleInput.readOnly = true;
            financialInfo.classList.remove('hidden'); // 3. Mostra os campos financeiros
        }

        document.getElementById('register-employee-modal').classList.remove('hidden');
    }

    closeRegisterModal() {
        document.getElementById('register-employee-modal').classList.add('hidden');
    }

    // Em app.js, adicione esta nova função à classe PontoMaxApp
    async loadFechamentoData(actionData = null) {
        console.log("1. 'loadFechamentoData' foi chamada com a ação:", actionData?.action);
        const pageContainer = document.getElementById('fechamento-page');
        if (!pageContainer) return;

        try {
            if (actionData) {
                if (actionData.action === 'iniciar') {
                    console.log("2. Fazendo a chamada para a API '/fechamentos/iniciar/'...");
                    const response = await window.authManager.apiCall('/fechamentos/iniciar/', {
                        method: 'POST', body: JSON.stringify({ periodo: actionData.periodo })
                    });

                    console.log("4. A API respondeu com sucesso. Resposta:", response);
                    this.currentFechamento = response.fechamento;
                    this.dadosRevisao = response.dados_revisao;
                    console.log("5. Estado interno atualizado.");
                }
                if (actionData.action === 'gerar') {
                    // ... (lógica para gerar, por enquanto não vamos mexer aqui)
                    const response = await window.authManager.apiCall(`/fechamentos/${this.currentFechamento.id}/gerar-holerites/`, { method: 'POST' });
                    this.currentFechamento = response;
                }
                if (actionData.action === 'enviar') {
                    // ... (lógica para enviar)
                    await window.authManager.apiCall(`/fechamentos/${this.currentFechamento.id}/enviar-holerites/`, { method: 'POST' });
                    this.currentFechamento.status = 'ENVIADO';
                }
            }

            console.log("6. Decidindo qual passo renderizar...");
            let step = 1;
            if (this.currentFechamento) {
                switch (this.currentFechamento.status) {
                    case 'REVISAO': step = 2; break;
                    case 'GERANDO': step = 3; break;
                    case 'CONCLUIDO': step = 3; break;
                    case 'ENVIADO': step = 4; break;
                    default: step = 1;
                }
            }

            console.log("7. Renderizando o HTML para o passo:", step);
            pageContainer.innerHTML = this.getFechamentoStepHTML(step);
            const fechamentoPeriodoSelector = document.getElementById('fechamento-periodo');
            if (fechamentoPeriodoSelector) {
                const today = new Date();
                today.setDate(1); // Garante que estamos no início do mês

                for (let i = 1; i < 13; i++) {
                    const date = new Date(today);
                    date.setMonth(today.getMonth() - i);

                    const year = date.getFullYear();
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const value = `${year}-${month}`;

                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());

                    // Define o mês anterior (i=1) como o padrão
                    if (i === 1) {
                        option.selected = true;
                    }

                    fechamentoPeriodoSelector.appendChild(option);
                }
            }
            console.log("8. Renderização completa.");

        } catch (error) {
            console.error("ERRO CRÍTICO no fluxo de fechamento:", error);
            this.showToast('Erro', 'Ocorreu um erro no processo de fechamento.', 'error');
            this.currentFechamento = null;
            pageContainer.innerHTML = this.getFechamentoStepHTML(1);
        } finally {
            lucide.createIcons();
        }
    }

    // 2. A FUNÇÃO QUE GERA O HTML (TEMPLATE)
    getFechamentoStepHTML(step) {
        const headerHTML = `<div class="page-header"><h1>Fechamento e Holerites</h1><p>Fluxo passo a passo para gerar e enviar holerites</p></div>`;
        let contentHTML = '';

        switch (step) {
            case 1:
                contentHTML = `
        <div class="step-card">
            <div class="step-header"><i data-lucide="calendar-days"></i><div><h2>Passo 1</h2><p>Selecione o mês/ano de referência.</p></div></div>
            <div class="step-content">
                <div class="form-group"><label for="fechamento-periodo">Mês/Ano</label><select id="fechamento-periodo" class="form-select"></select></div>
                <div type="button" id="btn-iniciar-fechamento" onclick="window.pontoMaxApp.handleFechamentoAction('iniciar')" class="btn-primary"><i data-lucide="settings-2"></i><span>Avançar</span></div>
            </div>
        </div>`;
                break;
            case 2:
                contentHTML = `
            <div class="step-card">
                <div class="step-header"><i data-lucide="users"></i><div><h2>Passo 2</h2><p>Revise os saldos do banco de horas e selecione funcionários.</p></div></div>
                <div class="table-wrapper">
                    <table class="closing-table"><thead><tr><th>Funcionário</th><th>Saldo Mês</th><th>Selecionado</th></tr></thead>
                    <tbody>
                        ${this.dadosRevisao.map(member => `
                            <tr class="${member.enviado ? 'sent-row' : ''}">
                                <td>${member.name}</td>
                                <td class="${member.balance >= 0 ? 'positive' : 'negative'}">
                                    ${member.balance >= 0 ? '+' : '-'} ${this.formatHours(Math.abs(member.balance), true)}
                                </td>
                                <td>
                                    <input 
                                        type="checkbox" 
                                        class="form-checkbox" 
                                        ${member.enviado ? 'disabled checked' : 'checked'}
                                    >
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                    </table>
                </div>
                <div class="card-footer">
                        <button type="button" onclick="window.pontoMaxApp.resetFechamento()" class="btn-outline">
                            <i data-lucide="arrow-left"></i>
                            <span>Voltar</span>
                        </button>
                        <div id="btn-gerar-holerites" onclick="window.pontoMaxApp.handleFechamentoAction('gerar')" class="btn-primary" style="cursor: pointer; user-select: none;">
                            <i data-lucide="file-text"></i>
                            <span>Gerar holerites</span>
                        </div>
                    </div>
            </div>`;
                break;
            case 3:
                contentHTML = `
            <div class="step-card">
                <div class="step-header"><i data-lucide="send"></i><div><h2>Passo 3</h2><p>Envie os holerites selecionados.</p></div></div>
                <div class="step-content column">
                    
                    <div class="progress-bar-container">
                        <div id="progress-bar-inner" class="progress-bar-inner"></div>
                    </div>
                    <p id="progress-status-text">Holerites gerados com sucesso e prontos para envio.</p>
                    <button type="button" id="btn-enviar-holerites" onclick="window.pontoMaxApp.handleFechamentoAction('enviar')" class="btn-primary"><i data-lucide="send"></i><span>Enviar holerites para funcionários</span></button>
                </div>
            </div>`;
                break;
            case 4:
                setTimeout(() => { if (this.currentPage === 'fechamento') { this.currentFechamento = null; this.loadFechamentoData(); } }, 5000);
                contentHTML = `
                <div class="success-message-container">
                    <i data-lucide="check-circle"></i>
                    <h2>Holerites enviados com sucesso!</h2>
                    <p>Esta tela será reiniciada automaticamente.</p>
                    <div class="countdown-bar-container">
                        <div class="countdown-bar"></div>
                    </div>
                </div>`;
                break;
        }
        return headerHTML + contentHTML;
    }

    // 3. A FUNÇÃO QUE ADICIONA OS EVENTOS
    async handleFechamentoAction(action) {
        if (action === 'iniciar') {
            const periodo = document.getElementById('fechamento-periodo').value;
            await this.loadFechamentoData({ action: 'iniciar', periodo: periodo });

        } else if (action === 'gerar') {
            // --- NOVA LÓGICA DE VERIFICAÇÃO ADICIONADA AQUI ---
            // Verifica se a lista de revisão de dados existe e se todos os membros já tiveram o holerite enviado.
            const allSent = this.dadosRevisao && this.dadosRevisao.every(member => member.enviado);

            if (allSent) {
                // Se todos já foram enviados, mostra um aviso e interrompe a função.
                this.showToast(
                    'Aviso',
                    'Todos os holerites para este período já foram processados.',
                    'warning',
                    // ADICIONADO AQUI: Passa a função de reset como callback.
                    () => this.resetFechamento()
                );
                return; // Impede que o resto do código seja executado
            }
            // --- FIM DA NOVA LÓGICA ---

            // Se a verificação passar, a ação normal de gerar holerites continua.
            await this.loadFechamentoData({ action: action });

        } else {
            // Ação 'enviar' e outras futuras continuam funcionando normalmente.
            await this.loadFechamentoData({ action: action });
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
            if (this.currentPage === 'admin') {
                this.loadAdminSubPage('users'); // Atualiza a tabela do painel de admin
            } else {
                this.loadEquipeData(); // Comportamento original para a página "Equipe" do gestor
            }
        } catch (error) {
            // Tenta mostrar um erro mais específico (ex: "email já existe")
            const errorMessage = error?.email?.[0] || 'Não foi possível cadastrar o funcionário.';
            this.showToast('Erro', errorMessage, 'error');
            console.error("Erro ao cadastrar funcionário:", error);
        }
    }

    async handleUpdateEmployee(employeeId) {
        // 1. Lê o status que guardamos no modal
        const modal = document.getElementById('employee-modal');
        const isAdmin = modal.dataset.isAdmin === 'true';

        // 2. Lê os campos básicos
        const fullname = document.getElementById('modal-fullname').value.trim();
        const email = document.getElementById('modal-email').value.trim();
        const perfil = document.getElementById('modal-role').value.trim();

        if (!fullname || !email || !perfil) {
            this.showToast('Erro de Validação', 'Nome, e-mail e cargo são obrigatórios.', 'error');
            return;
        }

        // 3. Monta o payload inicial
        const payload = {
            first_name: fullname.split(' ')[0] || '',
            last_name: fullname.split(' ').slice(1).join(' '),
            email: email,
            profile: {
                perfil: perfil
            }
        };

        // 4. Só adiciona os dados financeiros se NÃO FOR ADMIN
        if (!isAdmin) {
            const salarioStr = document.getElementById('modal-salary').value.replace(',', '.');
            const horasStr = document.getElementById('modal-monthly-hours').value;
            payload.profile.salario_base = salarioStr ? parseFloat(salarioStr) : null;
            payload.profile.horas_mensais = horasStr ? parseInt(horasStr) : null;
        }

        try {
            await window.authManager.apiCall(`/equipe/${employeeId}/`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            this.showToast('Sucesso', 'Alterações salvas com sucesso!', 'success');
            this.closeEmployeeModal();

            // Lógica de atualização da tabela correta
            if (this.currentPage === 'admin') {
                this.loadAdminSubPage('users');
            } else {
                this.loadEquipeData();
            }
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
            if (this.currentPage === 'admin') {
                this.loadAdminSubPage('users'); // Atualiza a tabela do admin
            } else {
                this.loadEquipeData(); // Atualiza a tabela do gestor
            }
        } catch (error) {
            this.showToast('Erro', 'Não foi possível remover o funcionário.', 'error');
        }
    }

    setupHoleritePage() {
        const periodSelector = document.getElementById('payslip-period');
        const viewButton = document.getElementById('btn-view-payslip');
        const downloadButton = document.getElementById('btn-download-payslip');

        if (!periodSelector || !viewButton || !downloadButton) return;
        console.log("Populou")

        // Popula o seletor de datas (esta parte continua a mesma)
        if (periodSelector.options.length <= 1) { // Preenche apenas se estiver vazio
            const today = new Date();
            today.setDate(1);
            for (let i = 1; i < 13; i++) {
                const date = new Date(today);
                date.setMonth(today.getMonth() - i);
                const year = date.getFullYear();
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const value = `${year}-${month}`;
                const option = document.createElement('option');
                option.value = value;
                option.textContent = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
                if (i === 1) option.selected = true;
                periodSelector.appendChild(option);
            }
        }

        // Configura o botão de visualizar
        viewButton.onclick = () => this.loadHoleriteData();

        // --- CORREÇÃO APLICADA AQUI ---
        // Trocamos addEventListener por .onclick para evitar a duplicação de eventos
        downloadButton.onclick = async () => {
            try {
                const selectedPeriod = periodSelector.value;
                if (!selectedPeriod) {
                    this.showToast('Aviso', 'Selecione um período para gerar o PDF.', 'warning');
                    return;
                }
                this.showToast('Aguarde', 'Gerando seu holerite em PDF...', 'info');
                const urlPath = `/holerites/exportar_pdf/?periodo=${selectedPeriod}`;
                const response = await window.authManager.apiCall(urlPath);
                if (!response.ok) throw new Error('Falha ao gerar o PDF.');
                const blob = await response.blob();
                const disposition = response.headers.get('content-disposition');
                let filename = `holerite_${selectedPeriod}.pdf`;
                if (disposition && disposition.includes('attachment')) {
                    const filenameMatch = disposition.match(/filename="(.+)"/);
                    if (filenameMatch && filenameMatch.length > 1) filename = filenameMatch[1];
                }
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = downloadUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(downloadUrl);
                a.remove();
            } catch (error) {
                console.error("Erro ao baixar PDF do holerite:", error);
                this.showToast('Erro', 'Não foi possível baixar o holerite. Verifique se ele já foi visualizado na tela.', 'error');
            }
        };
        // --- FIM DA CORREÇÃO ---

        // Garante que o estado inicial da página está limpo
        document.getElementById('payslip-content-wrapper').classList.add('hidden');
        document.getElementById('payslip-empty-state').classList.add('hidden');
    }

    loadAdminPage(defaultSubPage = 'dashboard') { // <-- Aceita a sub-página padrão
        const pageContainer = document.getElementById('admin-page');
        if (!pageContainer) return;

        pageContainer.innerHTML = `
        <div class="page-header">
            <h1>Painel Administrativo</h1>
            <p>Gerenciamento completo do sistema PontoMax.</p>
        </div>
        <div class="admin-layout">
            <aside class="admin-sidebar">
                <nav class="admin-nav">
                    <a href="#admin/dashboard" class="admin-nav-item" data-admin-page="dashboard">
                        <i data-lucide="bar-chart-3"></i>
                        <span>Dashboard</span>
                    </a>
                    <a href="#admin/users" class="admin-nav-item" data-admin-page="users">
                        <i data-lucide="users"></i>
                        <span>Usuários</span>
                    </a>
                    <a href="#admin/logs" class="admin-nav-item" data-admin-page="logs">
                        <i data-lucide="shield"></i>
                        <span>Logs de Atividade</span>
                    </a>
                </nav>
            </aside>
            <main id="admin-main-content" class="admin-main-content"></main>
        </div>
    `;

        // Marca o link correto como ativo
        const activeLink = pageContainer.querySelector(`.admin-nav-item[data-admin-page="${defaultSubPage}"]`);
        if (activeLink) {
            pageContainer.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
            activeLink.classList.add('active');
        }

        lucide.createIcons();

        // Carrega a sub-página correta (seja a padrão 'dashboard' ou a que veio do link, ex: 'logs')
        this.loadAdminSubPage(defaultSubPage);

        // Adiciona eventos de clique para a navegação interna do admin
        pageContainer.querySelectorAll('.admin-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                pageContainer.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.loadAdminSubPage(item.dataset.adminPage);
            });
        });
    }

    loadAdminSubPage(subPage = 'dashboard', id = null) {
        const contentContainer = document.getElementById('admin-main-content');
        if (!contentContainer) return;

        switch (subPage) {
            case 'users':
                // (Aqui podemos adicionar uma lógica de detalhe/lista para usuários no futuro)
                this.renderAdminUserTable(contentContainer);
                break;

            case 'fechamentos':
                if (id) {
                    // Se um ID for passado, renderiza a tela de detalhes
                    this.renderFechamentoDetailView(contentContainer, id);
                } else {
                    // Senão, renderiza a lista principal
                    this.renderAdminFechamentoTable(contentContainer);
                }
                break;

            case 'registros':
                // (Aqui podemos adicionar uma lógica de detalhe/lista para registros no futuro)
                this.renderAdminRegistrosTable(contentContainer);
                break;
            case 'dashboard':
                this.renderAdminDashboard(contentContainer);
                break;
            case 'logs': // <-- Adicione este case
                this.renderAdminLogsPage(contentContainer);
                break;
            default:
                contentContainer.innerHTML = '<h2>Página não encontrada</h2>';
        }
    }

    async renderAdminUserTable(container) {
        try {
            const users = await window.authManager.apiCall('/admin/users/');

            let tableHTML = `
            <div class="main-card">
                <div class="card-header-flex">
                    <h2>Todos os Usuários</h2>
                    <button class="btn-primary" id="admin-add-user-btn"><i data-lucide="plus"></i> Adicionar Usuário</button>
                </div>

                <div class="bulk-action-bar hidden" id="bulk-action-bar">
                    <span id="bulk-action-count">0 selecionados</span>
                    <div class="bulk-actions">
                        <select id="bulk-action-role-select" class="form-select">
                            <option value="COLABORADOR">Colaborador</option>
                            <option value="GESTOR">Gestor</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                        <button class="btn-secondary" id="bulk-action-change-role">Alterar Cargo</button>
                        <button class="btn-danger" id="bulk-action-delete">Deletar Selecionados</button>
                    </div>
                </div>

                <div class="table-wrapper">
                    <table class="team-list-table">
                        <thead>
                            <tr>
                                <th><input type="checkbox" id="select-all-users"></th>
                                <th>Nome</th>
                                <th>E-mail</th>
                                <th>Cargo</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(user => `
                                <tr>
                                    <td><input type="checkbox" class="user-checkbox" data-user-id="${user.id}"></td>
                                    <td>${user.nome}</td>
                                    <td>${user.email}</td>
                                    <td><span class="user-role">${user.profile.perfil}</span></td>
                                    <td><button class="btn-outline" data-employee-id="${user.id}">Editar</button></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
            container.innerHTML = tableHTML;
            lucide.createIcons();

            // Chamamos uma nova função para configurar os eventos da tabela
            this.setupAdminUserTableEvents(container);

        } catch (error) {
            container.innerHTML = '<h2>Erro ao carregar usuários.</h2>';
        }
    }

    async renderAdminFechamentoTable(container) {
        try {
            // 1. Busca os dados do endpoint de admin que já criamos
            const fechamentos = await window.authManager.apiCall('/admin/fechamentos/');

            // 2. Cria o HTML da tabela para exibir os fechamentos
            let tableHTML = `
            <div class="main-card">
                <div class="card-header-flex">
                    <h2>Gerenciamento de Fechamentos</h2>
                    </div>
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Período</th>
                                <th>Status</th>
                                <th>Data de Criação</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${fechamentos.map(fechamento => `
                                <tr>
                                    <td>${fechamento.periodo}</td>
                                    <td><span class="status-badge">${fechamento.status}</span></td>
                                    <td>${this.formatDate(fechamento.data_criacao)}</td>
                                    <td>
                                        <button class="btn-outline" data-fechamento-id="${fechamento.id}">
                                            <i data-lucide="eye"></i> Detalhes
                                        </button>
                                        <button class="btn-danger" data-fechamento-id="${fechamento.id}">
                                            <i data-lucide="trash-2"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
            container.innerHTML = tableHTML;
            lucide.createIcons();

            // 3. Adiciona o evento de clique para os botões de deletar
            container.querySelectorAll('button[data-fechamento-id]').forEach(button => {
                button.addEventListener('click', (e) => {
                    const fechamentoId = e.currentTarget.dataset.fechamentoId;
                    if (e.currentTarget.classList.contains('btn-danger')) {
                        this.handleDeleteFechamento(fechamentoId);
                    } else {
                        // Chama a nova função de navegação para a página de detalhes
                        this.loadAdminSubPage('fechamentos', fechamentoId);
                    }
                });
            });

        } catch (error) {
            container.innerHTML = '<h2>Erro ao carregar os fechamentos.</h2>';
        }
    }

    async handleDeleteFechamento(fechamentoId) {
        if (!confirm('Tem certeza que deseja remover este registro de fechamento? Todos os holerites gerados associados a ele também serão removidos.')) {
            return;
        }

        try {
            // Usa o endpoint de admin para deletar
            await window.authManager.apiCall(`/admin/fechamentos/${fechamentoId}/`, {
                method: 'DELETE'
            });
            this.showToast('Sucesso', 'Registro de fechamento removido com sucesso!', 'success');
            // Recarrega a tabela para mostrar o resultado
            this.loadAdminSubPage('fechamentos');
        } catch (error) {
            this.showToast('Erro', 'Não foi possível remover o registro.', 'error');
        }
    }

    async renderAdminRegistrosTable(container) {
        try {
            const registros = await window.authManager.apiCall('/admin/registros-ponto/');

            let tableHTML = `
            <div class="main-card">
                <div class="card-header-flex"><h2>Todos os Registros de Ponto</h2></div>
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead><tr><th>Funcionário</th><th>Data e Hora</th><th>Tipo</th><th>Ações</th></tr></thead>
                        <tbody>
                            ${registros.map(reg => `
                                <tr>
                                    <td>${reg.user_name}</td>
                                    <td>${new Date(reg.timestamp).toLocaleString('pt-BR')}</td>
                                    <td>${reg.tipo}</td>
                                    <td>
                                        <button class="btn-outline" data-registro-id="${reg.id}">
                                            <i data-lucide="edit"></i>
                                        </button>
                                        <button class="btn-danger" data-registro-id="${reg.id}">
                                            <i data-lucide="trash-2"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
            container.innerHTML = tableHTML;
            lucide.createIcons();

            container.querySelectorAll('button[data-registro-id]').forEach(button => {
                button.addEventListener('click', (e) => {
                    const registroId = e.currentTarget.dataset.registroId;
                    if (e.currentTarget.classList.contains('btn-danger')) {
                        this.handleDeleteRegistroPonto(registroId);
                    } else {
                        this.openEditRegistroModal(registroId);
                    }
                });
            });

        } catch (error) {
            container.innerHTML = '<h2>Erro ao carregar registros de ponto.</h2>';
        }
    }

    async handleDeleteRegistroPonto(registroId) {
        if (!confirm('Tem certeza que deseja remover este registro de ponto? Esta ação é irreversível.')) {
            return;
        }
        try {
            await window.authManager.apiCall(`/admin/registros-ponto/${registroId}/`, {
                method: 'DELETE'
            });
            this.showToast('Sucesso', 'Registro de ponto removido!', 'success');
            this.loadAdminSubPage('registros'); // Recarrega a tabela
        } catch (error) {
            this.showToast('Erro', 'Não foi possível remover o registro.', 'error');
        }
    }

    async openEditRegistroModal(registroId) {
        const modal = document.getElementById('edit-registro-modal');
        if (!modal) return;

        try {
            // 1. Busca os dados atuais do registro na API
            const registro = await window.authManager.apiCall(`/admin/registros-ponto/${registroId}/`);

            // 2. Preenche os campos do formulário
            modal.querySelector('#edit-registro-user').value = registro.user_name;
            modal.querySelector('#edit-registro-tipo').value = registro.tipo;

            // 3. Inicializa o seletor de data/hora (Flatpickr)
            const timestampInput = modal.querySelector('#edit-registro-timestamp');
            flatpickr(timestampInput, {
                enableTime: true,
                dateFormat: "Y-m-d H:i",
                defaultDate: registro.timestamp,
                locale: "pt",
            });

            // 4. Configura o botão Salvar e abre o modal
            modal.querySelector('#edit-registro-save-btn').onclick = () => this.handleUpdateRegistroPonto(registroId);
            modal.classList.remove('hidden');

        } catch (error) {
            this.showToast('Erro', 'Não foi possível carregar os dados do registro.', 'error');
        }
    }

    async handleUpdateRegistroPonto(registroId) {
        const modal = document.getElementById('edit-registro-modal');
        const payload = {
            timestamp: modal.querySelector('#edit-registro-timestamp').value,
            tipo: modal.querySelector('#edit-registro-tipo').value
        };

        try {
            await window.authManager.apiCall(`/admin/registros-ponto/${registroId}/`, {
                method: 'PATCH', // PATCH é melhor para atualizações parciais
                body: JSON.stringify(payload)
            });

            this.showToast('Sucesso', 'Registro atualizado com sucesso!', 'success');
            modal.classList.add('hidden');
            this.loadAdminSubPage('registros'); // Recarrega a tabela
        } catch (error) {
            this.showToast('Erro', 'Não foi possível atualizar o registro.', 'error');
        }
    }

    async renderFechamentoDetailView(container, fechamentoId) {
        try {
            const fechamento = await window.authManager.apiCall(`/admin/fechamentos/${fechamentoId}/`);

            let detailHTML = `
            <div class="main-card">
                <div class="card-header-flex">
                    <div>
                        <h2>Detalhes do Fechamento: ${fechamento.periodo}</h2>
                        <p>Status: ${fechamento.status}</p>
                    </div>
                    <button class="btn-outline" id="back-to-fechamentos-list">
                        <i data-lucide="arrow-left"></i> Voltar para a lista
                    </button>
                </div>
                <div class="card-content">
                    <h3>Holerites Gerados neste Período</h3>
                    <div class="table-wrapper">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Funcionário</th>
                                    <th>Salário Bruto</th>
                                    <th>Total Descontos</th>
                                    <th>Salário Líquido</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${fechamento.holerites_gerados.map(holerite => `
                                    <tr>
                                        <td>${holerite.userName}</td>
                                        <td>${this.formatCurrency(parseFloat(holerite.salario_bruto))}</td>
                                        <td>${this.formatCurrency(parseFloat(holerite.total_descontos))}</td>
                                        <td><strong>${this.formatCurrency(parseFloat(holerite.salario_liquido))}</strong></td>
                                        <td>${holerite.enviado ? 'Enviado' : 'Não Enviado'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;
            container.innerHTML = detailHTML;
            lucide.createIcons();

            // Adiciona evento ao botão "Voltar"
            container.querySelector('#back-to-fechamentos-list').addEventListener('click', () => {
                this.loadAdminSubPage('fechamentos');
            });

        } catch (error) {
            container.innerHTML = '<h2>Erro ao carregar detalhes do fechamento.</h2>';
        }
    }

    openJustificativaModal(date) {
        const modal = document.getElementById('justificativa-modal');
        const title = document.getElementById('justificativa-modal-title');
        const saveBtn = document.getElementById('justificativa-save-btn');

        // Formata a data para um formato amigável e a exibe no título do modal
        const displayDate = new Date(date + 'T03:00:00').toLocaleDateString('pt-BR');
        title.textContent = `Justificar Ocorrência - ${displayDate}`;

        document.getElementById('justificativa-motivo').value = ''; // Limpa o campo de texto

        // Configura o botão de salvar para chamar a função de envio, passando a data
        saveBtn.onclick = () => this.handleSubmeterJustificativa(date);

        modal.classList.remove('hidden');
    }

    closeJustificativaModal() {
        document.getElementById('justificativa-modal').classList.add('hidden');
    }

    async handleSubmeterJustificativa(date) {
        const motivo = document.getElementById('justificativa-motivo').value.trim();
        if (!motivo) {
            this.showToast('Erro de Validação', 'O campo de motivo é obrigatório.', 'error');
            return;
        }

        const payload = {
            data_ocorrencia: date,
            motivo: motivo
        };

        try {
            await window.authManager.apiCall('/justificativas/', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            this.showToast('Sucesso', 'Justificativa enviada para análise do seu gestor.', 'success');
            this.closeJustificativaModal();
            // Futuramente, podemos recarregar a tabela para esconder o botão "Justificar" após o envio

            await this.fetchRegistrosData();
        } catch (error) {
            // O backend nos impede de criar justificativas duplicadas para o mesmo dia
            const errorMessage = error.unique_together ? error.unique_together[0] : (error.detail || 'Não foi possível enviar a justificativa.');
            this.showToast('Erro', errorMessage, 'error');
        }
    }

    openViewJustificativaModal(status, motivo, date) {
        const modal = document.getElementById('view-justificativa-modal');

        document.getElementById('view-justificativa-data').textContent = new Date(date + 'T03:00:00').toLocaleDateString('pt-BR');
        document.getElementById('view-justificativa-motivo').textContent = motivo;

        const statusElement = document.getElementById('view-justificativa-status');
        statusElement.innerHTML = `<span class="status-badge-lg status-${status.toLowerCase()}">${status}</span>`;

        modal.classList.remove('hidden');
    }

    closeViewJustificativaModal() {
        document.getElementById('view-justificativa-modal').classList.add('hidden');
    }

    renderRegistrosTable(recordsToRender) {
        const recordsList = document.getElementById('records-table-body');
        if (!recordsList) return;

        recordsList.innerHTML = '';
        let totalWorked = 0, totalOvertime = 0, totalDebit = 0;

        const tableHeader = recordsList.parentElement.querySelector('thead tr');
        if (tableHeader) {
            tableHeader.innerHTML = `
                <th>Data</th>
                <th>Total Trabalhado</th>
                <th>Horas Extras</th>
                <th>Débito</th>
                <th>Status</th>
                <th>Ações</th>
            `;
        }

        if (!recordsToRender || recordsToRender.length === 0) {
            recordsList.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">Nenhum registro encontrado para este período.</td></tr>';
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
                    <td>
                        ${record.justificativa_status ?
                        `<button class="btn-secondary" onclick="window.pontoMaxApp.openViewJustificativaModal('${record.justificativa_status}', '${record.justificativa_motivo.replace(/'/g, "\\'").replace(/"/g, '\\"')}','${record.date}')">Visualizar</button>` :
                        (record.debit > 0 ?
                            `<button class="btn-outline" onclick="window.pontoMaxApp.openJustificativaModal('${record.date}')">Justificar</button>`
                            : '')
                    }
                    </td>
                `;
                recordsList.appendChild(row);
            });
        }

        document.getElementById('summary-total-worked').textContent = this.formatHours(totalWorked, true);
        document.getElementById('summary-overtime').textContent = `+${this.formatHours(totalOvertime, true)}`;
        document.getElementById('summary-debit').textContent = `-${this.formatHours(totalDebit, true)}`;
    }

    async fetchRegistrosData() {
        // 'this.registrosFlatpickr' é a instância do calendário que vamos salvar no próximo passo
        if (!this.registrosFlatpickr) return;

        const dates = this.registrosFlatpickr.selectedDates;
        if (dates.length < 2) {
            this.renderRegistrosTable([]); // Renderiza a tabela vazia se não houver data
            return;
        }

        const formatDateForAPI = (date) => date.toISOString().split('T')[0];
        const [startDate, endDate] = dates;
        const startDateStr = formatDateForAPI(startDate);
        const endDateStr = formatDateForAPI(endDate);

        try {
            const records = await window.authManager.apiCall(`/registros/?start_date=${startDateStr}&end_date=${endDateStr}`);
            this.renderRegistrosTable(records); // Chama a função de renderização com os novos dados
        } catch (error) {
            this.showToast('Erro', 'Não foi possível carregar os registros.', 'error');
            this.renderRegistrosTable([]); // Renderiza a tabela vazia em caso de erro
        }
    }

    setupNotificationSystem() {
        // A lógica de clique foi movida para setupEventListeners.
        // A única responsabilidade desta função agora é iniciar a busca por notificações.
        this.fetchNotifications(); // Verifica ao carregar
        setInterval(() => this.fetchNotifications(), 1000); // Verifica a cada 60 segundos
    }

    async fetchNotifications() {
        if (!window.authManager.isLoggedIn()) return;

        try {
            const notifications = await window.authManager.apiCall('/notificacoes/');
            this.renderNotifications(notifications);
        } catch (error) {
            console.error("Erro ao buscar notificações:", error);
        }
    }

    renderNotifications(notifications) {
        const badge = document.getElementById('notification-badge');
        const list = document.getElementById('notification-list');

        if (notifications.length > 0) {
            badge.classList.remove('hidden');
            // badge.textContent = notifications.length > 9 ? '9+' : notifications.length;
            list.innerHTML = notifications.map(n => `
                <a href="${n.link || '#'}" class="notification-item" data-page="${n.link?.substring(1)}" data-notification-id="${n.id}">
                    ${n.mensagem}
                </a>
            `).join('');
        } else {
            badge.classList.add('hidden');
            list.innerHTML = '<p class="no-notifications">Nenhuma nova notificação</p>';
        }

        // Adiciona evento de clique para marcar como lida e navegar
        list.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const notificationId = item.dataset.notificationId;
                const page = item.dataset.page;
                this.handleNotificationClick(notificationId, page);
            });
        });
    }

    async handleNotificationClick(id, page) {
        try {
            await window.authManager.apiCall(`/notificacoes/${id}/marcar_como_lida/`, { method: 'POST' });
            if (page) {
                this.navigateToPage(page);
            }
            this.fetchNotifications(); // Atualiza a lista
        } catch (error) {
            console.error('Erro ao marcar notificação como lida:', error);
        }
    }

    async renderAdminDashboard(container) {
        container.innerHTML = `<div class="loading-placeholder"><div class="spinner"></div><p>Carregando dashboard...</p></div>`;

        try {
            const data = await window.authManager.apiCall('/admin/dashboard/');

            const dashboardHTML = `
    <div class="summary-cards-grid">
            <div class="summary-card">
                <div class="card-content"><div class="value">${data.total_users}</div><div class="label">Total de Usuários</div></div>
                <i data-lucide="users" class="card-icon"></i>
            </div>
            <div class="summary-card">
                <div class="card-content"><div class="value">${data.punches_today}</div><div class="label">Pontos Batidos Hoje</div></div>
                <i data-lucide="mouse-pointer-click" class="card-icon"></i>
            </div>
            <div class="summary-card">
                <div class="card-content"><div class="value warning">${data.pending_justifications}</div><div class="label">Justificativas Pendentes</div></div>
                <i data-lucide="alert-triangle" class="card-icon warning"></i>
            </div>
        </div>
    <div class="admin-dashboard-grid">
        <div class="main-card">
            <div class="card-header-flex"><h2>Novos Usuários por Mês</h2></div>
            <div class="card-content"><canvas id="new-users-chart"></canvas></div>
        </div>
        <div class="main-card">
            <div class="card-header-flex"><h2>Atividade Recente</h2></div>
            <div class="card-content">
                <ul class="recent-logs-list">
                    ${data.recent_logs.map(log => `
                        <li>
                            <strong>${log.action_type}</strong> por ${log.user_name}
                            <small>${new Date(log.timestamp).toLocaleString('pt-BR')}</small>
                        </li>
                    `).join('')}
                </ul>
                <div class="card-footer">
                    <a href="#admin/logs" class="btn-outline nav-item" data-page="admin" data-subpage="logs">Ver todos os logs...</a>
                </div>
            </div>
        </div>
    </div>
    `;
            container.innerHTML = dashboardHTML;
            lucide.createIcons();

            // Lógica para renderizar o gráfico
            const chartCanvas = document.getElementById('new-users-chart');
            if (chartCanvas) {
                const labels = data.new_users_chart.map(item => new Date(item.month).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }));
                const chartData = data.new_users_chart.map(item => item.count);

                new Chart(chartCanvas, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Novos Usuários',
                            data: chartData,
                            backgroundColor: 'hsl(217, 91%, 60%, 0.6)',
                            borderColor: 'hsl(217, 91%, 60%)',
                            borderWidth: 1
                        }]
                    },
                    options: { scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
                });
            }

        } catch (error) {
            container.innerHTML = '<h2>Erro ao carregar o dashboard.</h2>';
        }
    }

    async renderAdminLogsPage(container) {
        container.innerHTML = `<div class="loading-placeholder">...</div>`;
        try {
            const logs = await window.authManager.apiCall('/admin/logs/');
            let tableHTML = `
        <div class="main-card">
            <div class="card-header-flex"><h2>Logs de Atividade do Sistema</h2></div>
            <div class="table-wrapper">
                <table class="data-table">
                    <thead><tr><th>Data/Hora</th><th>Usuário</th><th>Ação</th><th>Detalhes</th></tr></thead>
                    <tbody>
                        ${logs.map(log => `
                            <tr>
                                <td>${new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                                <td>${log.user_name}</td>
                                <td>${log.action_type}</td>
                                <td>${log.details}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
            container.innerHTML = tableHTML;
        } catch (error) {
            container.innerHTML = `<h2>Erro ao carregar logs.</h2>`;
        }
    }

    setupAdminUserTableEvents(container) {
        const selectedUserIds = new Set();
        const selectAllCheckbox = container.querySelector('#select-all-users');
        const userCheckboxes = container.querySelectorAll('.user-checkbox');
        const actionBar = container.querySelector('#bulk-action-bar');
        const actionCount = container.querySelector('#bulk-action-count');
        const changeRoleBtn = container.querySelector('#bulk-action-change-role');
        const deleteBtn = container.querySelector('#bulk-action-delete');

        const updateActionBar = () => {
            if (selectedUserIds.size > 0) {
                actionBar.classList.remove('hidden');
                actionCount.textContent = `${selectedUserIds.size} selecionado(s)`;
            } else {
                actionBar.classList.add('hidden');
            }
        };

        selectAllCheckbox.addEventListener('change', (e) => {
            userCheckboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
                const userId = parseInt(checkbox.dataset.userId);
                e.target.checked ? selectedUserIds.add(userId) : selectedUserIds.delete(userId);
            });
            updateActionBar();
        });

        userCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const userId = parseInt(e.target.dataset.userId);
                e.target.checked ? selectedUserIds.add(userId) : selectedUserIds.delete(userId);
                updateActionBar();
            });
        });

        changeRoleBtn.addEventListener('click', () => {
            const newRole = container.querySelector('#bulk-action-role-select').value;
            this.handleBulkAction({
                action_type: 'change_role_selected',
                user_ids: Array.from(selectedUserIds),
                new_role: newRole
            });
        });

        deleteBtn.addEventListener('click', () => {
            if (confirm(`Tem certeza que deseja deletar ${selectedUserIds.size} usuário(s)?`)) {
                this.handleBulkAction({
                    action_type: 'delete_selected',
                    user_ids: Array.from(selectedUserIds)
                });
            }
        });

        // Eventos de abrir modais (código que já tínhamos)
        container.querySelector('#admin-add-user-btn').addEventListener('click', () => this.openRegisterModal(true));
        container.querySelectorAll('.btn-outline').forEach(button => {
            button.addEventListener('click', (e) => this.openEmployeeModal(e.currentTarget.dataset.employeeId, true));
        });
    }

    async handleBulkAction(payload) {
        try {
            await window.authManager.apiCall('/admin/users/bulk-action/', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            this.showToast('Sucesso', 'Ação em massa executada com sucesso!', 'success');
            this.loadAdminSubPage('users'); // Recarrega a tabela
        } catch (error) {
            this.showToast('Erro', 'Não foi possível executar a ação em massa.', 'error');
        }
    }

    loadProfilePage() {
        const pageContainer = document.getElementById('perfil-page');
        if (!pageContainer) return;

        const user = window.authManager.getCurrentUser();

        pageContainer.innerHTML = `
        <div class="page-header">
            <h1>Meu Perfil</h1>
            <p>Gerencie suas informações pessoais e de segurança.</p>
        </div>
        <div class="profile-layout">
            <div class="main-card">
                <div class="card-header-flex"><h2>Informações</h2></div>
                <div class="card-content">
                    <p><strong>Nome:</strong> ${user.nome}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Cargo:</strong> ${user.profile.perfil}</p>
                </div>
            </div>
            <div class="main-card">
                <div class="card-header-flex"><h2>Alterar Senha</h2></div>
                <form id="change-password-form" class="card-content">
                    <div class="form-group">
                        <label for="old_password">Senha Atual</label>
                        <input type="password" id="old_password" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="new_password">Nova Senha</label>
                        <input type="password" id="new_password" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="new_password2">Confirmar Nova Senha</label>
                        <input type="password" id="new_password2" class="form-input" required>
                    </div>
                    <div class="card-footer">
                        <button type="submit" class="btn-primary">Salvar Alterações</button>
                    </div>
                </form>
            </div>
        </div>
    `;

        const form = document.getElementById('change-password-form');
        form.addEventListener('submit', (e) => this.handleChangePassword(e));
    }

    async handleChangePassword(e) {
        e.preventDefault();
        const old_password = document.getElementById('old_password').value;
        const new_password = document.getElementById('new_password').value;
        const new_password2 = document.getElementById('new_password2').value;

        if (new_password !== new_password2) {
            this.showToast('Erro', 'A nova senha e a confirmação não conferem.', 'error');
            return;
        }

        const payload = { old_password, new_password, new_password2 };

        try {
            const response = await window.authManager.apiCall('/change-password/', {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            this.showToast('Sucesso', response.detail, 'success');
            // Por segurança, fazemos o logout para que o usuário entre com a nova senha
            setTimeout(() => this.handleLogout(), 2000);
        } catch (error) {
            // Pega a mensagem de erro específica da API
            const errorMessage = error.old_password?.[0] || error.new_password?.[0] || 'Não foi possível alterar a senha.';
            this.showToast('Erro', errorMessage, 'error');
        }
    }
}

// Inicializar aplicação
window.pontoMaxApp = new PontoMaxApp();
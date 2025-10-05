// PontoMax - Sistema de Autenticação
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        // Verificar se há usuário logado no localStorage
        const savedUser = localStorage.getItem('pontomax_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.isAuthenticated = true;
            } catch (error) {
                console.error('Erro ao carregar usuário salvo:', error);
                localStorage.removeItem('pontomax_user');
            }
        }
    }

    async login(email, password) {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/token/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: email, password }),
            });

            const data = await response.json();
            if (!response.ok) {
                return { success: false, error: 'Credenciais inválidas' };
            }

            // 1. Guardamos os tokens
            localStorage.setItem('pontomax_access_token', data.access);
            localStorage.setItem('pontomax_refresh_token', data.refresh);
            this.isAuthenticated = true;

            // 2. AGORA USAMOS O TOKEN PARA BUSCAR OS DADOS DO USUÁRIO
            const userProfile = await this.apiCall('/user/');
            this.currentUser = userProfile;

            // 3. Guardamos o usuário também, para recarregar a página
            localStorage.setItem('pontomax_user', JSON.stringify(userProfile));

            return { success: true, user: userProfile };

        } catch (error) {
            console.error('Erro no login:', error);
            return { success: false, error: 'Não foi possível conectar ao servidor' };
        }
    }


    logout() {
        this.currentUser = null;
        this.isAuthenticated = false;
        localStorage.removeItem('pontomax_user');

        // Redirecionar para login
        this.showLoginPage();
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isLoggedIn() {
        return this.isAuthenticated;
    }

    getUserInitials() {
        if (!this.currentUser) return 'U';
        return this.currentUser.nome
            .split(' ')
            .map(name => name[0])
            .join('')
            .toUpperCase();
    }

    hasPermission(permission) {
        if (!this.currentUser) return false;

        const permissions = {
            'COLABORADOR': ['dashboard', 'registros', 'holerite', 'perfil'],
            'GESTOR': ['dashboard', 'perfil', 'equipe', 'banco-horas', 'fechamento'],
            'ADMIN': ['dashboard', 'registros', 'holerite', 'perfil', 'equipe', 'banco-horas', 'fechamento', 'configuracoes', 'organizacao']
        };

        // CORREÇÃO: Acessa o 'perfil' dentro do objeto aninhado 'profile'
        const userPermissions = permissions[this.currentUser.profile.perfil] || [];
        return userPermissions.includes(permission);
    }

    showLoginPage() {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('login-page').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
    }

    showMainApp() {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');

        // Atualizar informações do usuário na interface
        this.updateUserInterface();
    }

    updateUserInterface() {
        if (!this.currentUser) return;

        // Atualizar informações do usuário no header
        const userInitials = document.getElementById('user-initials');
        const userName = document.getElementById('user-name');
        const userEmail = document.getElementById('user-email');
        const userRole = document.getElementById('user-role');

        if (userInitials) userInitials.textContent = this.getUserInitials();
        if (userName) userName.textContent = this.currentUser.nome;
        if (userEmail) userEmail.textContent = this.currentUser.email;
        if (userRole) userRole.textContent = this.currentUser.profile.perfil;

        // Atualizar navegação baseada no perfil
        this.updateNavigation();
    }

    updateNavigation() {
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => {
            const page = item.getAttribute('data-page');
            if (page && !this.hasPermission(page)) {
                item.style.display = 'none';
            } else {
                item.style.display = 'flex';
            }
        });
    }

    // Método para fazer chamadas autenticadas para a API
    async apiCall(endpoint, options = {}) {
        // 1. Pega o token do localStorage
        const token = this.getToken();

        // 2. Define os cabeçalhos padrão, incluindo o token
        const headers = {
            'Content-Type': 'application/json',
            // Só adiciona o cabeçalho de autorização se o token existir
            ...(token && { 'Authorization': `Bearer ${token}` })
        };

        // 3. Monta as opções finais da requisição
        const finalOptions = {
            // Mescla as opções passadas (ex: method, body)
            ...options,
            // Mescla os cabeçalhos padrão com quaisquer cabeçalhos customizados passados em 'options'
            headers: {
                ...headers,
                ...options.headers,
            },
        };

        // 4. Faz a chamada fetch
        const response = await fetch(`http://127.0.0.1:8000/api${endpoint}`, finalOptions);

        // 5. Lida com a resposta (lógica existente)
        if (response.status === 401) {
            this.logout();
            throw new Error('Sessão expirada');
        }

        // Não precisamos mais checar !response.ok aqui, pois a view que chama
        // pode querer tratar diferentes status (como 404) de forma específica.

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            if (response.ok) {
                return response.json();
            }
            // Se a resposta não for OK, mas for JSON (ex: erro de validação), rejeita a promise com os detalhes
            const errorData = await response.json();
            return Promise.reject(errorData);
        }

        return response;
    }

    getToken() {
        return localStorage.getItem('pontomax_access_token');
    }
}

// Instância global do gerenciador de autenticação
window.authManager = new AuthManager();


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
            // Simulação de login - em produção, fazer chamada para API Django
            const mockUsers = [
                {
                    id: 1,
                    nome: 'João Silva',
                    email: 'joao@empresa.com',
                    perfil: 'COLABORADOR',
                    empresa: 'Empresa Demo'
                },
                {
                    id: 2,
                    nome: 'Maria Santos',
                    email: 'maria@empresa.com',
                    perfil: 'GESTOR',
                    empresa: 'Empresa Demo'
                },
                {
                    id: 3,
                    nome: 'Admin Sistema',
                    email: 'admin@empresa.com',
                    perfil: 'ADMIN',
                    empresa: 'Empresa Demo'
                }
            ];

            // Simular delay de rede
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Verificar credenciais (mock)
            const user = mockUsers.find(u => u.email === email);

            if (user && (password === '123456' || password === 'admin')) {
                this.currentUser = user;
                this.isAuthenticated = true;

                // Salvar no localStorage
                localStorage.setItem('pontomax_user', JSON.stringify(user));

                return { success: true, user };
            } else {
                return { success: false, error: 'Credenciais inválidas' };
            }
        } catch (error) {
            console.error('Erro no login:', error);
            return { success: false, error: 'Erro interno do servidor' };
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
            'GESTOR': ['dashboard', 'perfil', 'equipe', 'banco-horas', 'fechamento'], // <-- VERSÃO CORRIGIDA
            'ADMIN': ['dashboard', 'registros', 'holerite', 'perfil', 'equipe', 'banco-horas', 'fechamento', 'configuracoes', 'organizacao']
        };

        const userPermissions = permissions[this.currentUser.perfil] || [];
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
        if (userRole) userRole.textContent = this.currentUser.perfil;

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
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            }
        };

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(endpoint, finalOptions);

            if (response.status === 401) {
                // Token expirado, fazer logout
                this.logout();
                throw new Error('Sessão expirada');
            }

            return response;
        } catch (error) {
            console.error('Erro na chamada da API:', error);
            throw error;
        }
    }

    getToken() {
        // Em produção, retornar o token JWT salvo
        return this.currentUser ? 'mock-jwt-token' : null;
    }
}

// Instância global do gerenciador de autenticação
window.authManager = new AuthManager();


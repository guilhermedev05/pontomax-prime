// PontoMax - Dashboard
class DashboardManager {
    constructor() {
        this.punchRecords = [];
        this.workingHours = { today: 0 };
        this.hoursBank = 0;
        this.estimatedExitTime = null;
        this.userName = '';
        this.init();
    }

    init() {
        this.loadDashboardData();
        this.setupDashboardEvents();
        this.startClock();
    }

    setupDashboardEvents() {
        const punchBtn = document.getElementById('punch-btn');
        if (punchBtn) {
            punchBtn.addEventListener('click', () => this.registerPunch());
        }
    }

    startClock() {
        const clockElement = document.getElementById('current-time');
        if (!clockElement) return;

        const updateTime = () => {
            const now = new Date();
            clockElement.textContent = now.toLocaleTimeString('pt-BR');
        };

        updateTime();
        setInterval(updateTime, 1000);
    }

    async loadDashboardData() {
        try {
            // Em produção, isso viria da API Django
            const user = window.authManager.getCurrentUser();
            this.userName = user ? user.nome.split(' ')[0] : 'Usuário';

            await this.loadMockData(); // Carrega dados de exemplo
            
            this.updateAllUI();

            // Atualiza as horas trabalhadas a cada minuto
            setInterval(() => {
                this.updateWorkingHours();
                this.calculateEstimatedExit();
                this.updateAllUI();
            }, 60000);

        } catch (error) {
            console.error('Erro ao carregar dados do dashboard:', error);
        }
    }

    async loadMockData() {
        // Mock data - simula o que viria da API
        this.punchRecords = [
            {
                id: 1,
                date: new Date().toISOString().split('T')[0],
                entries: [
                    { time: '09:00', type: 'entrada' },
                ]
            }
        ];
        this.hoursBank = 50.25; // 50h 15m
    }

    calculateWorkedHours(entries) {
        let totalMinutes = 0;
        let lastEntryTime = null;

        entries.forEach(entry => {
            const [hours, minutes] = entry.time.split(':').map(Number);
            const entryTimeInMinutes = hours * 60 + minutes;

            if (entry.type.startsWith('entrada')) {
                lastEntryTime = entryTimeInMinutes;
            } else if (entry.type.startsWith('saida') && lastEntryTime !== null) {
                totalMinutes += entryTimeInMinutes - lastEntryTime;
                lastEntryTime = null;
            }
        });

        // Se o usuário ainda está trabalhando (último registro foi uma entrada)
        if (lastEntryTime !== null) {
            const now = new Date();
            const nowInMinutes = now.getHours() * 60 + now.getMinutes();
            totalMinutes += nowInMinutes - lastEntryTime;
        }

        return totalMinutes / 60; // Retorna em horas decimais
    }

    calculateEstimatedExit() {
        const todayRecord = this.getTodayRecord();
        const firstEntry = todayRecord?.entries.find(e => e.type === 'entrada');

        if (firstEntry) {
            const [hours, minutes] = firstEntry.time.split(':').map(Number);
            // Jornada de 8h + 1h de almoço = 9h
            const estimatedExitDate = new Date();
            estimatedExitDate.setHours(hours + 9);
            estimatedExitDate.setMinutes(minutes);
            
            this.estimatedExitTime = estimatedExitDate.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else {
            this.estimatedExitTime = null;
        }
    }

    updateWorkingHours() {
        const todayRecord = this.getTodayRecord();
        if (todayRecord) {
            this.workingHours.today = this.calculateWorkedHours(todayRecord.entries);
        } else {
            this.workingHours.today = 0;
        }
    }

    updateAllUI() {
        this.updateWorkingHours();
        this.calculateEstimatedExit();
        
        // Cabeçalho
        document.getElementById('dashboard-user-name').textContent = this.userName;
        document.getElementById('dashboard-current-date').textContent = this.formatDateHeader(new Date());

        // Cards
        document.getElementById('today-worked-hours').textContent = this.formatHoursSimple(this.workingHours.today);
        document.getElementById('estimated-exit-time').textContent = this.estimatedExitTime || '--:--';
        
        const bankHoursElement = document.getElementById('hours-bank-balance');
        bankHoursElement.textContent = `${this.hoursBank >= 0 ? '+' : '-'}${this.formatHours(Math.abs(this.hoursBank))}`;
        bankHoursElement.className = `stat-value ${this.hoursBank >= 0 ? 'positive' : 'negative'}`;

        // Timeline e Botão
        this.updateTimeline();
        this.updatePunchButton();
    }

    updateTimeline() {
        const timelineContainer = document.getElementById('records-timeline');
        timelineContainer.innerHTML = ''; // Limpa a timeline

        const todayRecord = this.getTodayRecord();
        if (!todayRecord || todayRecord.entries.length === 0) {
            timelineContainer.innerHTML = '<p class="no-records">Nenhum registro hoje.</p>';
            return;
        }

        const typeLabels = {
            'entrada': 'Entrada',
            'saida_almoco': 'Saída Almoço',
            'entrada_almoco': 'Volta Almoço',
            'saida': 'Saída'
        };

        todayRecord.entries.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.innerHTML = `
                <div class="timeline-connector">
                    <div class="timeline-dot"></div>
                    <div class="timeline-line"></div>
                </div>
                <div class="timeline-content">
                    <span class="timeline-label">${typeLabels[entry.type] || 'Registro'}</span>
                    <span class="timeline-time">${entry.time}</span>
                </div>
            `;
            timelineContainer.appendChild(item);
        });
    }

    updatePunchButton() {
        const punchBtn = document.getElementById('punch-btn');
        const btnText = punchBtn.querySelector('span');
        const btnIcon = punchBtn.querySelector('i');
        if (!punchBtn || !btnText) return;

        const todayRecord = this.getTodayRecord();
        let nextAction = 'entrada';
        
        if (todayRecord && todayRecord.entries.length > 0) {
            const lastEntryType = todayRecord.entries[todayRecord.entries.length - 1].type;
            const actionMap = {
                'entrada': 'saida_almoco',
                'saida_almoco': 'entrada_almoco',
                'entrada_almoco': 'saida'
            };
            nextAction = actionMap[lastEntryType] || 'entrada_novo_dia';
        }

        const buttonStates = {
            'entrada': { text: 'Registrar Entrada', icon: 'log-in' },
            'saida_almoco': { text: 'Registrar Saída Almoço', icon: 'coffee' },
            'entrada_almoco': { text: 'Registrar Volta Almoço', icon: 'log-in' },
            'saida': { text: 'Registrar Saída', icon: 'log-out' },
            'entrada_novo_dia': { text: 'Registrar Entrada', icon: 'log-in' }
        };

        const state = buttonStates[nextAction];
        btnText.textContent = state.text;
        btnIcon.setAttribute('data-lucide', state.icon);
        lucide.createIcons(); // Recria o ícone
    }

    async registerPunch() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const todayDate = now.toISOString().split('T')[0];

        let todayRecord = this.getTodayRecord();
        if (!todayRecord) {
            todayRecord = { id: Date.now(), date: todayDate, entries: [] };
            this.punchRecords.push(todayRecord);
        }

        // Determina o tipo do próximo registro
        let punchType = 'entrada';
        if (todayRecord.entries.length > 0) {
            const lastEntryType = todayRecord.entries[todayRecord.entries.length - 1].type;
            const typeMap = {
                'entrada': 'saida_almoco',
                'saida_almoco': 'entrada_almoco',
                'entrada_almoco': 'saida'
            };
            punchType = typeMap[lastEntryType] || 'entrada';
        }

        todayRecord.entries.push({ time: timeString, type: punchType });

        try {
            // Em produção, aqui seria a chamada para a API
            // await this.savePunchRecord(todayRecord);

            this.updateAllUI();

            const typeLabels = { 'entrada': 'Entrada', 'saida_almoco': 'Saída para Almoço', 'entrada_almoco': 'Volta do Almoço', 'saida': 'Saída' };
            window.pontoMaxApp.showToast('Ponto Registrado', `${typeLabels[punchType]} registrada às ${timeString}`, 'success');
        } catch (error) {
            console.error('Erro ao registrar ponto:', error);
            window.pontoMaxApp.showToast('Erro', 'Não foi possível registrar o ponto.', 'error');
        }
    }

    getTodayRecord() {
        const todayDate = new Date().toISOString().split('T')[0];
        return this.punchRecords.find(record => record.date === todayDate);
    }

    // --- MÉTODOS DE FORMATAÇÃO ---
    formatHours(hoursDecimal) {
        const totalMinutes = Math.floor(hoursDecimal * 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${h}h ${m.toString().padStart(2, '0')}m`;
    }
    
    formatHoursSimple(hoursDecimal) {
        const totalMinutes = Math.floor(hoursDecimal * 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    formatDateHeader(date) {
        return date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).replace(/(^|-)(\w)/g, (match, p1, p2) => p2.toUpperCase()); // Capitaliza primeira letra
    }
}

// Inicializar dashboard quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    if (!window.dashboardManager) {
        window.dashboardManager = new DashboardManager();
    }
});
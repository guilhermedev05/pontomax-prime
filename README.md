# PontoMax - Sistema de Controle de Ponto

Sistema completo de controle de ponto eletrônico convertido de React/TypeScript para HTML/CSS/JavaScript puro, preparado para integração com backend Django.

## 📁 Estrutura do Projeto

```
ponto-max-html/
├── index.html              # Página principal da aplicação
├── assets/
│   ├── css/
│   │   ├── styles.css      # Estilos principais
│   │   └── components.css  # Estilos dos componentes
│   ├── js/
│   │   ├── auth.js         # Sistema de autenticação
│   │   ├── app.js          # Aplicação principal
│   │   └── dashboard.js    # Funcionalidades do dashboard
│   └── images/             # Imagens e ícones
├── docs/                   # Documentação
└── README.md              # Este arquivo
```

## 🚀 Funcionalidades

### ✅ Implementadas
- **Sistema de Login**: Autenticação com diferentes perfis de usuário
- **Dashboard**: Visão geral com registros de ponto em tempo real
- **Controle de Ponto**: Registro de entrada, saída e intervalos
- **Navegação**: Sistema de navegação baseado em permissões
- **Notificações**: Sistema de toast para feedback ao usuário
- **Responsivo**: Interface adaptável para desktop e mobile

### 🔄 Em Desenvolvimento
- Página de Registros completa
- Página de Holerite
- Página de Equipe (para gestores)
- Relatórios e exportação
- Configurações avançadas

## 👥 Perfis de Usuário

### COLABORADOR
- Dashboard pessoal
- Registrar ponto
- Visualizar registros próprios
- Consultar holerite

### GESTOR
- Todas as funcionalidades do colaborador
- Gerenciar equipe
- Visualizar banco de horas da equipe
- Aprovar ajustes de ponto
- Relatórios de fechamento

### ADMIN
- Todas as funcionalidades do gestor
- Configurações do sistema
- Gerenciar organização
- Configurações avançadas

## 🔐 Sistema de Autenticação

### Usuários de Teste
```
Colaborador:
- Email: joao@empresa.com
- Senha: 123456

Gestor:
- Email: maria@empresa.com
- Senha: 123456

Admin:
- Email: admin@empresa.com
- Senha: admin
```

## 🎨 Design System

O projeto utiliza um design system baseado no original React, com:

### Cores Principais
- **Primary**: `hsl(217, 91%, 60%)` - Azul principal
- **Accent**: `hsl(262, 83%, 58%)` - Roxo de destaque
- **Success**: `hsl(142, 76%, 36%)` - Verde para sucessos
- **Warning**: `hsl(38, 92%, 50%)` - Amarelo para avisos
- **Danger**: `hsl(0, 84%, 60%)` - Vermelho para erros

### Tipografia
- **Fonte**: Inter (Google Fonts)
- **Pesos**: 300, 400, 500, 600, 700

### Componentes
- Cards responsivos
- Botões com estados
- Formulários estilizados
- Sistema de notificações
- Tabelas responsivas

## 🔧 Integração com Django

### Estrutura Recomendada para Django

```
projeto_django/
├── pontomax/                    # App principal Django
│   ├── models.py               # Modelos (Usuario, RegistroPonto, etc.)
│   ├── views.py                # Views da API
│   ├── serializers.py          # Serializers DRF
│   └── urls.py                 # URLs da API
├── static/                     # Arquivos estáticos
│   └── frontend/               # Copiar conteúdo de ponto-max-html/
│       ├── index.html
│       └── assets/
├── templates/
└── settings.py
```

### APIs Necessárias

#### Autenticação
```
POST /api/auth/login/           # Login
POST /api/auth/logout/          # Logout
GET  /api/auth/user/            # Dados do usuário atual
```

#### Registros de Ponto
```
GET    /api/punch-records/      # Listar registros
POST   /api/punch-records/      # Criar registro
PUT    /api/punch-records/{id}/ # Atualizar registro
DELETE /api/punch-records/{id}/ # Deletar registro
```

#### Dashboard
```
GET /api/dashboard/stats/       # Estatísticas do dashboard
GET /api/dashboard/recent/      # Registros recentes
```

#### Relatórios
```
GET /api/reports/hours/         # Relatório de horas
GET /api/reports/team/          # Relatório da equipe
```

### Modelos Django Sugeridos

```python
# models.py
class Usuario(AbstractUser):
    PERFIL_CHOICES = [
        ('COLABORADOR', 'Colaborador'),
        ('GESTOR', 'Gestor'),
        ('ADMIN', 'Administrador'),
    ]
    perfil = models.CharField(max_length=20, choices=PERFIL_CHOICES)
    empresa = models.CharField(max_length=100)

class RegistroPonto(models.Model):
    TIPO_CHOICES = [
        ('entrada', 'Entrada'),
        ('saida_almoco', 'Saída para Almoço'),
        ('entrada_almoco', 'Volta do Almoço'),
        ('saida', 'Saída'),
    ]
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    data = models.DateField()
    hora = models.TimeField()
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
```

## 📱 Responsividade

O projeto é totalmente responsivo com breakpoints:
- **Desktop**: > 768px
- **Mobile**: ≤ 768px

### Adaptações Mobile
- Menu de navegação colapsado
- Cards em coluna única
- Tabelas simplificadas
- Botões otimizados para touch

## 🛠️ Como Usar

### 1. Desenvolvimento Local
```bash
# Servir arquivos estáticos (Python)
python -m http.server 8000

# Ou usar qualquer servidor web
# Acessar: http://localhost:8000
```

### 2. Integração com Django
```python
# settings.py
STATICFILES_DIRS = [
    BASE_DIR / "static/frontend",
]

# urls.py (projeto principal)
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('pontomax.urls')),
    path('', TemplateView.as_view(template_name='index.html')),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
```

### 3. Configuração da API
```javascript
// Em assets/js/auth.js, alterar:
async apiCall(endpoint, options = {}) {
    const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': this.getCSRFToken(),
            ...options.headers
        }
    });
    return response;
}
```

## 🔄 Próximos Passos

1. **Implementar APIs Django**: Criar endpoints para todas as funcionalidades
2. **Autenticação Real**: Integrar com sistema de autenticação Django
3. **Validações**: Adicionar validações de formulário
4. **Testes**: Implementar testes unitários e de integração
5. **Deploy**: Configurar para produção

## 📞 Suporte

Para dúvidas sobre a implementação ou integração com Django, consulte a documentação do Django REST Framework e as melhores práticas de desenvolvimento web.

## 📄 Licença

Este projeto foi convertido do original React/TypeScript mantendo toda a funcionalidade e design, agora em formato HTML/CSS/JavaScript puro para maior simplicidade e facilidade de manutenção.


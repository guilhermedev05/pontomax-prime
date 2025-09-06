# Guia de Integração com Django

Este documento detalha como integrar o frontend HTML/CSS/JavaScript do PontoMax com um backend Django.

## 📋 Pré-requisitos

- Python 3.8+
- Django 4.0+
- Django REST Framework
- django-cors-headers (para desenvolvimento)

## 🏗️ Estrutura do Projeto Django

### 1. Configuração Inicial

```bash
# Criar projeto Django
django-admin startproject pontomax_backend
cd pontomax_backend

# Criar app principal
python manage.py startapp pontomax

# Instalar dependências
pip install django djangorestframework django-cors-headers python-decouple
```

### 2. Settings.py

```python
import os
from decouple import config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='your-secret-key-here')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'corsheaders',
    
    # Local apps
    'pontomax',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'pontomax_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]
STATIC_ROOT = BASE_DIR / 'staticfiles'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20
}

# CORS settings (apenas para desenvolvimento)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

CORS_ALLOW_CREDENTIALS = True
```

## 📊 Modelos de Dados

### pontomax/models.py

```python
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class Usuario(AbstractUser):
    PERFIL_CHOICES = [
        ('COLABORADOR', 'Colaborador'),
        ('GESTOR', 'Gestor'),
        ('ADMIN', 'Administrador'),
    ]
    
    perfil = models.CharField(
        max_length=20, 
        choices=PERFIL_CHOICES, 
        default='COLABORADOR'
    )
    empresa = models.CharField(max_length=100, blank=True)
    telefone = models.CharField(max_length=20, blank=True)
    data_admissao = models.DateField(null=True, blank=True)
    salario = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    ativo = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.perfil})"

class RegistroPonto(models.Model):
    TIPO_CHOICES = [
        ('entrada', 'Entrada'),
        ('saida_almoco', 'Saída para Almoço'),
        ('entrada_almoco', 'Volta do Almoço'),
        ('saida', 'Saída'),
    ]
    
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='registros')
    data = models.DateField()
    hora = models.TimeField()
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    observacao = models.TextField(blank=True)
    aprovado = models.BooleanField(default=True)
    aprovado_por = models.ForeignKey(
        Usuario, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='aprovacoes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-data', '-hora']
        unique_together = ['usuario', 'data', 'hora', 'tipo']
    
    def __str__(self):
        return f"{self.usuario.username} - {self.data} {self.hora} ({self.tipo})"

class BancoHoras(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='banco_horas')
    mes = models.DateField()  # Primeiro dia do mês
    horas_trabalhadas = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    horas_devidas = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    saldo = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    fechado = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['usuario', 'mes']
        ordering = ['-mes']
    
    def __str__(self):
        return f"{self.usuario.username} - {self.mes.strftime('%m/%Y')} - Saldo: {self.saldo}h"

class AjustePonto(models.Model):
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('aprovado', 'Aprovado'),
        ('rejeitado', 'Rejeitado'),
    ]
    
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='ajustes')
    data = models.DateField()
    hora_original = models.TimeField(null=True, blank=True)
    hora_solicitada = models.TimeField()
    tipo = models.CharField(max_length=20, choices=RegistroPonto.TIPO_CHOICES)
    justificativa = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendente')
    analisado_por = models.ForeignKey(
        Usuario, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='analises_ajuste'
    )
    observacao_analise = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.usuario.username} - {self.data} - {self.status}"
```

## 🔗 Serializers

### pontomax/serializers.py

```python
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Usuario, RegistroPonto, BancoHoras, AjustePonto

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                 'perfil', 'empresa', 'telefone', 'data_admissao', 'ativo']
        read_only_fields = ['id']

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        if email and password:
            user = authenticate(username=email, password=password)
            if user:
                if user.is_active:
                    data['user'] = user
                else:
                    raise serializers.ValidationError('Conta desativada.')
            else:
                raise serializers.ValidationError('Credenciais inválidas.')
        else:
            raise serializers.ValidationError('Email e senha são obrigatórios.')
        
        return data

class RegistroPontoSerializer(serializers.ModelSerializer):
    usuario_nome = serializers.CharField(source='usuario.get_full_name', read_only=True)
    
    class Meta:
        model = RegistroPonto
        fields = ['id', 'usuario', 'usuario_nome', 'data', 'hora', 'tipo', 
                 'observacao', 'aprovado', 'created_at']
        read_only_fields = ['id', 'created_at', 'usuario_nome']

class BancoHorasSerializer(serializers.ModelSerializer):
    usuario_nome = serializers.CharField(source='usuario.get_full_name', read_only=True)
    mes_formatado = serializers.SerializerMethodField()
    
    class Meta:
        model = BancoHoras
        fields = ['id', 'usuario', 'usuario_nome', 'mes', 'mes_formatado',
                 'horas_trabalhadas', 'horas_devidas', 'saldo', 'fechado']
        read_only_fields = ['id', 'usuario_nome', 'mes_formatado']
    
    def get_mes_formatado(self, obj):
        return obj.mes.strftime('%m/%Y')

class AjustePontoSerializer(serializers.ModelSerializer):
    usuario_nome = serializers.CharField(source='usuario.get_full_name', read_only=True)
    analisado_por_nome = serializers.CharField(source='analisado_por.get_full_name', read_only=True)
    
    class Meta:
        model = AjustePonto
        fields = ['id', 'usuario', 'usuario_nome', 'data', 'hora_original', 
                 'hora_solicitada', 'tipo', 'justificativa', 'status',
                 'analisado_por', 'analisado_por_nome', 'observacao_analise',
                 'created_at', 'updated_at']
        read_only_fields = ['id', 'usuario_nome', 'analisado_por_nome', 
                           'created_at', 'updated_at']
```

## 🎯 Views da API

### pontomax/views.py

```python
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout
from django.utils import timezone
from django.db.models import Sum, Q
from datetime import date, datetime, timedelta
from .models import Usuario, RegistroPonto, BancoHoras, AjustePonto
from .serializers import (
    UsuarioSerializer, LoginSerializer, RegistroPontoSerializer,
    BancoHorasSerializer, AjustePontoSerializer
)

# Autenticação
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user': UsuarioSerializer(user).data
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def logout_view(request):
    try:
        request.user.auth_token.delete()
    except:
        pass
    logout(request)
    return Response({'message': 'Logout realizado com sucesso'})

@api_view(['GET'])
def user_profile(request):
    serializer = UsuarioSerializer(request.user)
    return Response(serializer.data)

# Dashboard
@api_view(['GET'])
def dashboard_stats(request):
    user = request.user
    today = date.today()
    
    # Registros de hoje
    registros_hoje = RegistroPonto.objects.filter(
        usuario=user, 
        data=today
    ).order_by('hora')
    
    # Calcular horas trabalhadas hoje
    horas_hoje = calcular_horas_trabalhadas(registros_hoje)
    
    # Banco de horas atual
    try:
        banco_atual = BancoHoras.objects.get(
            usuario=user,
            mes=today.replace(day=1)
        )
        saldo_banco = float(banco_atual.saldo)
    except BancoHoras.DoesNotExist:
        saldo_banco = 0.0
    
    # Registros recentes (últimos 5 dias)
    data_inicio = today - timedelta(days=5)
    registros_recentes = RegistroPonto.objects.filter(
        usuario=user,
        data__gte=data_inicio
    ).order_by('-data', '-hora')[:10]
    
    return Response({
        'horas_hoje': horas_hoje,
        'saldo_banco': saldo_banco,
        'registros_hoje': RegistroPontoSerializer(registros_hoje, many=True).data,
        'registros_recentes': RegistroPontoSerializer(registros_recentes, many=True).data,
        'ultimo_registro': registros_hoje.last().tipo if registros_hoje.exists() else None
    })

def calcular_horas_trabalhadas(registros):
    """Calcula horas trabalhadas baseado nos registros"""
    if not registros:
        return 0.0
    
    total_minutos = 0
    entrada_atual = None
    
    for registro in registros:
        hora_minutos = registro.hora.hour * 60 + registro.hora.minute
        
        if registro.tipo in ['entrada', 'entrada_almoco']:
            entrada_atual = hora_minutos
        elif registro.tipo in ['saida', 'saida_almoco'] and entrada_atual:
            total_minutos += hora_minutos - entrada_atual
            entrada_atual = None
    
    # Se ainda está trabalhando (última entrada sem saída)
    if entrada_atual:
        agora = timezone.now()
        minutos_agora = agora.hour * 60 + agora.minute
        total_minutos += minutos_agora - entrada_atual
    
    return round(total_minutos / 60, 2)

# Registros de Ponto
class RegistroPontoListCreateView(generics.ListCreateAPIView):
    serializer_class = RegistroPontoSerializer
    
    def get_queryset(self):
        queryset = RegistroPonto.objects.filter(usuario=self.request.user)
        
        # Filtros opcionais
        data_inicio = self.request.query_params.get('data_inicio')
        data_fim = self.request.query_params.get('data_fim')
        
        if data_inicio:
            queryset = queryset.filter(data__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(data__lte=data_fim)
            
        return queryset.order_by('-data', '-hora')
    
    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

class RegistroPontoDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RegistroPontoSerializer
    
    def get_queryset(self):
        return RegistroPonto.objects.filter(usuario=self.request.user)

# Banco de Horas
class BancoHorasListView(generics.ListAPIView):
    serializer_class = BancoHorasSerializer
    
    def get_queryset(self):
        return BancoHoras.objects.filter(usuario=self.request.user)

# Ajustes de Ponto
class AjustePontoListCreateView(generics.ListCreateAPIView):
    serializer_class = AjustePontoSerializer
    
    def get_queryset(self):
        return AjustePonto.objects.filter(usuario=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

# Views para Gestores
class EquipeRegistrosView(generics.ListAPIView):
    serializer_class = RegistroPontoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.perfil not in ['GESTOR', 'ADMIN']:
            return RegistroPonto.objects.none()
        
        # Em produção, filtrar por equipe do gestor
        return RegistroPonto.objects.all().order_by('-data', '-hora')

class AjustesPendentesView(generics.ListAPIView):
    serializer_class = AjustePontoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.perfil not in ['GESTOR', 'ADMIN']:
            return AjustePonto.objects.none()
        
        return AjustePonto.objects.filter(status='pendente').order_by('-created_at')

@api_view(['POST'])
def aprovar_ajuste(request, ajuste_id):
    if request.user.perfil not in ['GESTOR', 'ADMIN']:
        return Response(
            {'error': 'Sem permissão'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        ajuste = AjustePonto.objects.get(id=ajuste_id)
        ajuste.status = 'aprovado'
        ajuste.analisado_por = request.user
        ajuste.observacao_analise = request.data.get('observacao', '')
        ajuste.save()
        
        # Criar/atualizar registro de ponto
        RegistroPonto.objects.update_or_create(
            usuario=ajuste.usuario,
            data=ajuste.data,
            tipo=ajuste.tipo,
            defaults={
                'hora': ajuste.hora_solicitada,
                'observacao': f'Ajuste aprovado: {ajuste.justificativa}',
                'aprovado_por': request.user
            }
        )
        
        return Response({'message': 'Ajuste aprovado com sucesso'})
    except AjustePonto.DoesNotExist:
        return Response(
            {'error': 'Ajuste não encontrado'}, 
            status=status.HTTP_404_NOT_FOUND
        )
```

## 🛣️ URLs

### pontomax/urls.py

```python
from django.urls import path
from . import views

urlpatterns = [
    # Autenticação
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/user/', views.user_profile, name='user_profile'),
    
    # Dashboard
    path('dashboard/stats/', views.dashboard_stats, name='dashboard_stats'),
    
    # Registros de Ponto
    path('punch-records/', views.RegistroPontoListCreateView.as_view(), name='punch_records'),
    path('punch-records/<int:pk>/', views.RegistroPontoDetailView.as_view(), name='punch_record_detail'),
    
    # Banco de Horas
    path('hours-bank/', views.BancoHorasListView.as_view(), name='hours_bank'),
    
    # Ajustes de Ponto
    path('adjustments/', views.AjustePontoListCreateView.as_view(), name='adjustments'),
    path('adjustments/<int:ajuste_id>/approve/', views.aprovar_ajuste, name='approve_adjustment'),
    
    # Views para Gestores
    path('team/records/', views.EquipeRegistrosView.as_view(), name='team_records'),
    path('adjustments/pending/', views.AjustesPendentesView.as_view(), name='pending_adjustments'),
]
```

### pontomax_backend/urls.py

```python
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('pontomax.urls')),
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
```

## 📁 Estrutura de Arquivos

```
pontomax_backend/
├── manage.py
├── pontomax_backend/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── pontomax/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   └── migrations/
├── static/
│   └── frontend/          # Copiar arquivos do ponto-max-html aqui
│       ├── index.html
│       └── assets/
├── templates/
│   └── index.html         # Template Django que serve o frontend
└── requirements.txt
```

## 🚀 Deploy e Configuração

### 1. Configurar Frontend no Django

```bash
# Copiar arquivos do frontend
cp -r /caminho/para/ponto-max-html/* static/frontend/
```

### 2. Template Django

```html
<!-- templates/index.html -->
{% load static %}
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PontoMax - Sistema de Controle de Ponto</title>
    <meta name="description" content="Sistema completo de controle de ponto eletrônico para empresas">
    
    <!-- CSRF Token -->
    <meta name="csrf-token" content="{{ csrf_token }}">
    
    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Icons -->
    <link href="https://unpkg.com/lucide@latest/dist/umd/lucide.js" rel="stylesheet">
    
    <!-- CSS -->
    <link rel="stylesheet" href="{% static 'frontend/assets/css/styles.css' %}">
    <link rel="stylesheet" href="{% static 'frontend/assets/css/components.css' %}">
</head>
<body>
    <!-- Conteúdo do index.html original aqui -->
    
    <!-- Scripts -->
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <script src="{% static 'frontend/assets/js/auth.js' %}"></script>
    <script src="{% static 'frontend/assets/js/app.js' %}"></script>
    <script src="{% static 'frontend/assets/js/dashboard.js' %}"></script>
</body>
</html>
```

### 3. Atualizar JavaScript para Django

```javascript
// Em assets/js/auth.js, atualizar métodos de API:

getCSRFToken() {
    const token = document.querySelector('meta[name="csrf-token"]');
    return token ? token.getAttribute('content') : '';
}

async apiCall(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': this.getCSRFToken(),
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
        const response = await fetch(`/api${endpoint}`, finalOptions);
        
        if (response.status === 401) {
            this.logout();
            throw new Error('Sessão expirada');
        }

        return response;
    } catch (error) {
        console.error('Erro na chamada da API:', error);
        throw error;
    }
}
```

## 🔧 Comandos Úteis

```bash
# Criar migrações
python manage.py makemigrations

# Aplicar migrações
python manage.py migrate

# Criar superusuário
python manage.py createsuperuser

# Coletar arquivos estáticos
python manage.py collectstatic

# Executar servidor de desenvolvimento
python manage.py runserver
```

## 📝 Próximos Passos

1. Implementar todas as views da API
2. Adicionar testes unitários
3. Configurar autenticação JWT (opcional)
4. Implementar WebSockets para atualizações em tempo real
5. Adicionar logging e monitoramento
6. Configurar para produção (Gunicorn, Nginx, etc.)

Este guia fornece uma base sólida para integrar o frontend HTML/CSS/JavaScript com Django, mantendo a separação de responsabilidades e facilitando a manutenção do código.


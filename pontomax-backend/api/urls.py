# api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AdminDashboardView, BancoHorasEquipeView, BancoHorasSaldoView, GestorDashboardView, HoleriteView, NotificacaoViewSet, RegistrosView, UserProfileView,
    UserViewSet, RegistroPontoViewSet, FechamentoViewSet,
    AdminUserViewSet, AdminFechamentoViewSet, AdminRegistroPontoViewSet, GerarRelatorioPontoPDF, GerarHoleritePDF, JustificativaViewSet  # Adicione os imports do Admin
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# --- Router Principal ---
router = DefaultRouter()
router.register(r'equipe', UserViewSet, basename='equipe')
router.register(r'registros-ponto', RegistroPontoViewSet, basename='registro-ponto')
router.register(r'fechamentos', FechamentoViewSet, basename='fechamento')
router.register(r'justificativas', JustificativaViewSet, basename='justificativa')
router.register(r'notificacoes', NotificacaoViewSet, basename='notificacao')

# --- Router do Admin ---
admin_router = DefaultRouter()
admin_router.register(r'users', AdminUserViewSet, basename='admin-user')
admin_router.register(r'fechamentos', AdminFechamentoViewSet, basename='admin-fechamento')
admin_router.register(r'registros-ponto', AdminRegistroPontoViewSet, basename='admin-registros-ponto')


# --- LISTA DE URLS COMPLETA E CORRIGIDA ---
urlpatterns = [
    # Rotas originais da aplicação
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user/', UserProfileView.as_view(), name='user_profile'),
    path('holerites/', HoleriteView.as_view(), name='holerites'),
    path('registros/', RegistrosView.as_view(), name='registros'),
    path('banco-horas/saldo/', BancoHorasSaldoView.as_view(), name='banco-horas-saldo'),
    path('banco-horas/equipe/', BancoHorasEquipeView.as_view(), name='banco-horas-equipe'),
    path('dashboard-gestor/', GestorDashboardView.as_view(), name='dashboard-gestor'), # <-- A ROTA QUE ESTAVA FALTANDO
    path('registros/exportar_pdf/', GerarRelatorioPontoPDF.as_view(), name='relatorio_pdf'),
    path('holerites/exportar_pdf/', GerarHoleritePDF.as_view(), name='holerite_pdf'),
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    # Novas rotas do painel de admin
    path('admin/', include(admin_router.urls)),
    
    # Rotas do router principal (deve vir por último para não conflitar)
    path('', include(router.urls)),
]
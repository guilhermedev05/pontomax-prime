# api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BancoHorasEquipeView, GestorDashboardView, HoleriteView, UserProfileView, UserViewSet, RegistroPontoViewSet, RegistrosView, BancoHorasSaldoView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import FechamentoViewSet
from django.views.generic import TemplateView

# Cria um router e registra nosso ViewSet com ele.
router = DefaultRouter()
router.register(r'equipe', UserViewSet, basename='equipe')
router.register(r'registros-ponto', RegistroPontoViewSet, basename='registro-ponto')
router.register(r'fechamentos', FechamentoViewSet, basename='fechamento')
urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user/', UserProfileView.as_view(), name='user_profile'),
    path('holerites/', HoleriteView.as_view(), name='holerites'),
    path('registros/', RegistrosView.as_view(), name='registros'),
    path('banco-horas/saldo/', BancoHorasSaldoView.as_view(), name='banco-horas-saldo'),
    path('banco-horas/equipe/', BancoHorasEquipeView.as_view(), name='banco-horas-equipe'),
    path('dashboard-gestor/', GestorDashboardView.as_view(), name='dashboard-gestor'),
    # Adiciona as URLs geradas pelo router à nossa lista.
    path('', include(router.urls)),
]
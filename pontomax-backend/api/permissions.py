# api/permissions.py
from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """
    Permissão customizada para permitir acesso apenas a usuários com perfil ADMIN.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.profile.perfil == 'ADMIN'
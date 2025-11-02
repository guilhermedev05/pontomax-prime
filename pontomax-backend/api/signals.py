# api/signals.py
from django.contrib.auth.models import User
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import LogAtividade, RegistroPonto
import inspect

# --- Signal de Usuário (post_save) ---
@receiver(post_save, sender=User)
def log_user_change(sender, instance, created, **kwargs):
    # Verifica se a ação foi disparada pela 'bulk_action'
    is_bulk_action = any('bulk_action' in frame.function for frame in inspect.stack())
    
    if not is_bulk_action: # Só cria o log se NÃO for uma ação em massa
        if created:
            action = "CRIOU USUÁRIO"
            details = f"O usuário '{instance.username}' foi criado."
        else:
            action = "ATUALIZOU USUÁRIO"
            details = f"Os dados do usuário '{instance.username}' foram atualizados."
        LogAtividade.objects.create(user=None, action_type=action, details=details) # Força o usuário a ser "Sistema"

# --- Signal de Usuário (post_delete) ---
@receiver(post_delete, sender=User)
def log_user_deletion(sender, instance, **kwargs):
    is_bulk_action = any('bulk_action' in frame.function for frame in inspect.stack())
    
    if not is_bulk_action: # Só cria o log se NÃO for uma ação em massa
        action = "DELETOU USUÁRIO"
        details = f"O usuário '{instance.username}' (ID: {instance.id}) foi removido do sistema."
        LogAtividade.objects.create(user=None, action_type=action, details=details) # Força o usuário a ser "Sistema"
    
# --- Signal de Registro de Ponto (post_save) ---
@receiver(post_save, sender=RegistroPonto)
def log_registroponto_change(sender, instance, created, **kwargs):
    is_bulk_action = any('bulk_action' in frame.function for frame in inspect.stack())
    
    # Só loga se for uma ATUALIZAÇÃO (not created) E NÃO for de uma ação em massa
    if not created and not is_bulk_action:
        action = "ATUALIZOU REGISTRO DE PONTO"
        details = (
            f"O registro de ponto #{instance.id} do funcionário '{instance.user.get_full_name()}' "
            f"foi atualizado. Novo horário: {instance.timestamp.strftime('%d/%m/%Y %H:%M:%S')}, "
            f"Novo tipo: {instance.get_tipo_display()}."
        )
        LogAtividade.objects.create(user=None, action_type=action, details=details)

# --- Signal de Registro de Ponto (post_delete) ---
@receiver(post_delete, sender=RegistroPonto)
def log_registroponto_deletion(sender, instance, **kwargs):
    stack = inspect.stack()
    # Verifica se a deleção foi causada pela 'bulk_action'
    is_bulk_action = any('bulk_action' in frame.function for frame in stack)
    # Verifica se a deleção foi causada pela deleção de um usuário (em cascata)
    is_user_deletion = any('log_user_deletion' in frame.function for frame in stack)
    
    # Só cria o log se NÃO for uma ação em massa E NÃO for uma deleção de usuário
    if not is_bulk_action and not is_user_deletion:
        action = "DELETOU REGISTRO DE PONTO"
        details = (
            f"O registro de ponto #{instance.id} de '{instance.user.get_full_name()}' "
            f"(horário: {instance.timestamp.strftime('%d/%m/%Y %H:%M:%S')}) foi removido."
        )
        LogAtividade.objects.create(user=None, action_type=action, details=details)
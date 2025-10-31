# api/signals.py
from django.contrib.auth.models import User
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import LogAtividade, RegistroPonto

@receiver(post_save, sender=User)
def log_user_change(sender, instance, created, **kwargs):
    # Verifica se a função foi chamada de dentro da nossa 'bulk_action'
    # Esta é uma forma simples de tentar evitar logs duplicados
    is_bulk_action = any('bulk_action' in frame.function for frame in inspect.stack())
    
    if not is_bulk_action: # Só cria o log se NÃO for uma ação em massa
        if created:
            action = "CRIOU USUÁRIO"
            details = f"O usuário '{instance.username}' foi criado."
        else:
            action = "ATUALIZOU USUÁRIO"
            details = f"Os dados do usuário '{instance.username}' foram atualizados."
        LogAtividade.objects.create(action_type=action, details=details)

@receiver(post_delete, sender=User)
def log_user_deletion(sender, instance, **kwargs):
    is_bulk_action = any('bulk_action' in frame.function for frame in inspect.stack())

    if not is_bulk_action: # Só cria o log se NÃO for uma ação em massa
        action = "DELETOU USUÁRIO"
        details = f"O usuário '{instance.username}' (ID: {instance.id}) foi removido."
        LogAtividade.objects.create(action_type=action, details=details)
    
@receiver(post_save, sender=RegistroPonto)
def log_registroponto_change(sender, instance, created, **kwargs):
    # 'created' será True se for um novo registro. Só queremos logar as edições feitas pelo admin.
    if not created:
        action = "ATUALIZOU REGISTRO DE PONTO"
        details = (
            f"O registro de ponto #{instance.id} do funcionário '{instance.user.get_full_name()}' "
            f"foi atualizado. Novo horário: {instance.timestamp.strftime('%d/%m/%Y %H:%M:%S')}, "
            f"Novo tipo: {instance.get_tipo_display()}."
        )
        # Idealmente, teríamos o 'request.user' para saber qual admin fez a ação.
        # Por enquanto, o log registra que a ação aconteceu.
        LogAtividade.objects.create(action_type=action, details=details)

# Este signal é disparado DEPOIS que um RegistroPonto é deletado
@receiver(post_delete, sender=RegistroPonto)
def log_registroponto_deletion(sender, instance, **kwargs):
    action = "DELETOU REGISTRO DE PONTO"
    details = (
        f"O registro de ponto #{instance.id} de '{instance.user.get_full_name()}' "
        f"(horário: {instance.timestamp.strftime('%d/%m/%Y %H:%M:%S')}) foi removido."
    )
    LogAtividade.objects.create(action_type=action, details=details)
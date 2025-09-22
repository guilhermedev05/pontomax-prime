# api/models.py
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Profile(models.Model):
    class UserProfile(models.TextChoices):
        COLABORADOR = 'COLABORADOR', 'Colaborador'
        GESTOR = 'GESTOR', 'Gestor'
        ADMIN = 'ADMIN', 'Admin'

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    perfil = models.CharField(
        max_length=20,
        choices=UserProfile.choices,
        default=UserProfile.COLABORADOR
    )
    salario_base = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    horas_mensais = models.PositiveIntegerField(null=True, blank=True)
    def __str__(self):
        return f"{self.user.username} - {self.perfil}"
    
    @receiver(post_save, sender=User)
    def create_user_profile(sender, instance, created, **kwargs):
        """
        Cria um Profile automaticamente sempre que um novo User é criado.
        """
        if created:
            Profile.objects.create(user=instance)
            
class Holerite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='holerites')
    periodo = models.CharField(max_length=7, help_text="Formato: AAAA-MM") # Ex: "2025-08"
    
    class Meta:
        # Garante que só exista um holerite por usuário por período
        unique_together = ('user', 'periodo')

    def __str__(self):
        return f"Holerite de {self.user.username} para {self.periodo}"
    
class Vencimento(models.Model):
    holerite = models.ForeignKey(Holerite, on_delete=models.CASCADE, related_name='vencimentos')
    descricao = models.CharField(max_length=100)
    detalhes = models.CharField(max_length=50, null=True, blank=True)
    valor = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.descricao} - R$ {self.valor}"
    
class Desconto(models.Model):
    holerite = models.ForeignKey(Holerite, on_delete=models.CASCADE, related_name='descontos')
    descricao = models.CharField(max_length=100)
    detalhes = models.CharField(max_length=50, null=True, blank=True)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return f"{self.descricao} - R$ {self.valor}"
    
class RegistroPonto(models.Model):
    TIPO_CHOICES = [
        ('entrada', 'Entrada'),
        ('saida_almoco', 'Saída Almoço'),
        ('entrada_almoco', 'Volta Almoço'),
        ('saida', 'Saída'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='registros_ponto')
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="Data e Hora do Registro")
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.user.username} - {self.get_tipo_display()} em {self.timestamp.strftime('%d/%m/%Y %H:%M')}"
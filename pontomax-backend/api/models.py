# api/models.py
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

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
    jornada_diaria = models.PositiveIntegerField(default=8, help_text="Jornada diária em horas")
    
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
        ('saida', 'Saída'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='registros_ponto')
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="Data e Hora do Registro")
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.user.username} - {self.get_tipo_display()} em {self.timestamp.strftime('%d/%m/%Y %H:%M')}"
    
class Fechamento(models.Model):
    STATUS_CHOICES = [
        ('INICIADO', 'Iniciado'),
        ('REVISAO', 'Em Revisão'),
        ('GERANDO', 'Gerando Holerites'),
        ('CONCLUIDO', 'Concluído'),
    ]

    periodo = models.CharField(max_length=7, help_text="Formato: AAAA-MM", unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='INICIADO')
    iniciado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='fechamentos_iniciados')
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_conclusao = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Fechamento de {self.periodo} - Status: {self.get_status_display()}"


class HoleriteGerado(models.Model):
    fechamento = models.ForeignKey(Fechamento, on_delete=models.CASCADE, related_name='holerites_gerados')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='holerites_recebidos')
    salario_bruto = models.DecimalField(max_digits=10, decimal_places=2)
    total_descontos = models.DecimalField(max_digits=10, decimal_places=2)
    salario_liquido = models.DecimalField(max_digits=10, decimal_places=2)
    enviado = models.BooleanField(default=False)

    def __str__(self):
        return f"Holerite de {self.user.username} para {self.fechamento.periodo}"

# ADICIONE ESTES NOVOS MODELOS NO FINAL DO ARQUIVO
class VencimentoGerado(models.Model):
    holerite_gerado = models.ForeignKey(HoleriteGerado, on_delete=models.CASCADE, related_name='vencimentos_gerados')
    descricao = models.CharField(max_length=100)
    detalhes = models.CharField(max_length=50, null=True, blank=True)
    valor = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Vencimento: {self.descricao} - R$ {self.valor}"

class DescontoGerado(models.Model):
    holerite_gerado = models.ForeignKey(HoleriteGerado, on_delete=models.CASCADE, related_name='descontos_gerados')
    descricao = models.CharField(max_length=100)
    detalhes = models.CharField(max_length=50, null=True, blank=True)
    valor = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Desconto: {self.descricao} - R$ {self.valor}"
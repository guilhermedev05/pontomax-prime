# api/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Holerite, Vencimento, Desconto, Profile, RegistroPonto, Fechamento, HoleriteGerado, Notificacao
from datetime import date
from django.utils import timezone
from .models import Justificativa

# --- Serializers para o Holerite ---
# (As classes VencimentoSerializer, DescontoSerializer e HoleriteSerializer continuam as mesmas)
class VencimentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vencimento
        fields = ['descricao', 'detalhes', 'valor']

class DescontoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Desconto
        fields = ['descricao', 'detalhes', 'valor']

class HoleriteSerializer(serializers.ModelSerializer):
    vencimentos = VencimentoSerializer(many=True, read_only=True)
    descontos = DescontoSerializer(many=True, read_only=True)
    userInfo = serializers.SerializerMethodField()
    periodLabel = serializers.SerializerMethodField()
    class Meta:
        model = Holerite
        fields = ['periodo', 'userInfo', 'periodLabel', 'vencimentos', 'descontos']
    def get_userInfo(self, obj):
        return f"{obj.user.get_full_name()} • PontoMax Tecnologia LTDA"
    def get_periodLabel(self, obj):
        from datetime import datetime
        import locale
        try: locale.setlocale(locale.LC_TIME, 'pt_BR.UTF-8')
        except locale.Error: locale.setlocale(locale.LC_TIME, 'Portuguese_Brazil.1252')
        date_obj = datetime.strptime(obj.periodo, '%Y-%m')
        return date_obj.strftime('%B/%Y').capitalize()


# --- Serializers para Usuário/Equipe (VERSÃO CORRIGIDA) ---

# 1. CRIAMOS UM SERIALIZER ESPECÍFICO PARA O PERFIL
class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['perfil', 'salario_base', 'horas_mensais', 'jornada_diaria']


# 2. SIMPLIFICAMOS O USERSERIALIZER PARA USAR O PROFILESERIALIZER
class UserSerializer(serializers.ModelSerializer):
    # O objeto 'profile' agora é tratado pelo seu próprio serializer
    profile = ProfileSerializer()
    nome = serializers.CharField(source='get_full_name', read_only=True)
    valor_hora = serializers.SerializerMethodField()
    horas_trabalhadas_hoje = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'password', 'first_name', 'last_name', 'email', 
            'nome', 'profile', 'valor_hora', 'horas_trabalhadas_hoje' 
        ]
        read_only_fields = ['username', 'valor_hora']
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def get_horas_trabalhadas_hoje(self, obj):
        punches_today = RegistroPonto.objects.filter(user=obj, timestamp__date=date.today())
        
        if not punches_today.exists() or punches_today.first().tipo != 'entrada':
            return 0.0

        start_time = punches_today.first().timestamp
        end_time = timezone.now() # Padrão é o momento atual (se o usuário ainda não saiu)
        
        if punches_today.last().tipo == 'saida':
            end_time = punches_today.last().timestamp

        worked_seconds = (end_time - start_time).total_seconds()
        return round(worked_seconds / 3600, 1)
    
    def get_valor_hora(self, obj):
        if hasattr(obj, 'profile'):
            profile = obj.profile
            if profile.salario_base and profile.horas_mensais and profile.horas_mensais > 0:
                return round(profile.salario_base / profile.horas_mensais, 2)
        return 0

    def create(self, validated_data):
        # Retiramos os dados do perfil, mas não os usamos aqui diretamente
        profile_data = validated_data.pop('profile')
        validated_data['username'] = validated_data['email']
        password = validated_data.pop('password')
        
        user = User(**validated_data)
        user.set_password(password)
        user.save()

        # MUDANÇA: Atualizamos o perfil que o signal criou, em vez de criar um novo
        # Isso garante que teremos os dados de salário, horas, etc.
        profile = Profile.objects.get(user=user)
        profile.perfil = profile_data.get('perfil')
        profile.salario_base = profile_data.get('salario_base')
        profile.horas_mensais = profile_data.get('horas_mensais')
        profile.save()

        return user

    def update(self, instance, validated_data):
        # Pega os dados do perfil, se existirem
        profile_data = validated_data.pop('profile', None)

        # Atualiza a senha primeiro, se ela foi enviada
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)

        # ATUALIZAÇÃO SEGURA DO PERFIL:
        # Só entra neste bloco se 'profile_data' foi enviado do frontend
        if profile_data is not None:
            profile = instance.profile
            # Para cada campo, usa o novo valor se ele existir, senão mantém o antigo.
            profile.perfil = profile_data.get('perfil', profile.perfil)
            profile.salario_base = profile_data.get('salario_base', profile.salario_base)
            profile.horas_mensais = profile_data.get('horas_mensais', profile.horas_mensais)
            profile.save()

        # Chama o 'super' para salvar as outras alterações (first_name, email, etc.)
        return super().update(instance, validated_data)
    
    

class RegistroPontoSerializer(serializers.ModelSerializer):
    time = serializers.DateTimeField(source='timestamp', format='%H:%M', read_only=True)

    class Meta:
        model = RegistroPonto
        fields = ['id', 'time', 'tipo']
        read_only_fields = ['tipo']

class RegistroDiarioSerializer(serializers.Serializer):
    """
    Serializer para o resumo de um dia de trabalho, com dados calculados.
    """
    date = serializers.DateField()
    worked = serializers.FloatField()
    overtime = serializers.FloatField()
    debit = serializers.FloatField()
    status = serializers.CharField()

    class Meta:
        fields = ['date', 'worked', 'overtime', 'debit', 'status']
        
class BancoHorasSaldoSerializer(serializers.Serializer):
    """
    Serializer para retornar o saldo calculado do banco de horas.
    """
    saldo_banco_horas = serializers.FloatField()

    class Meta:
        fields = ['saldo_banco_horas']
        
class BancoHorasEquipeSerializer(serializers.Serializer):
    """
    Serializer para a lista de saldos de banco de horas da equipe.
    """
    name = serializers.CharField()
    balance = serializers.FloatField()
    # Adicionamos campos de exemplo para manter a UI consistente
    credits = serializers.FloatField()
    debits = serializers.FloatField()

    class Meta:
        fields = ['name', 'balance', 'credits', 'debits']
        
class DashboardStatsSerializer(serializers.Serializer):
    """ Serializer para os cards de estatísticas rápidas. """
    pendentes = serializers.IntegerField()
    aniversariantes = serializers.IntegerField()
    ativos = serializers.IntegerField()
    ausentes = serializers.IntegerField()

class TeamStatusSerializer(serializers.Serializer):
    """ Serializer para a lista de status da equipe em tempo real. """
    initials = serializers.CharField()
    name = serializers.CharField()
    status = serializers.CharField()
    lastPunch = serializers.CharField()
    hoursToday = serializers.CharField()

class GestorDashboardSerializer(serializers.Serializer):
    """ Serializer principal que junta todas as partes do dashboard. """
    gestorName = serializers.CharField()
    stats = DashboardStatsSerializer()
    teamStatus = TeamStatusSerializer(many=True)

class HoleriteGeradoSerializer(serializers.ModelSerializer):
    userName = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = HoleriteGerado
        fields = ['id', 'userName', 'salario_bruto', 'total_descontos', 'salario_liquido', 'enviado']


class FechamentoSerializer(serializers.ModelSerializer):
    holerites_gerados = HoleriteGeradoSerializer(many=True, read_only=True)
    
    class Meta:
        model = Fechamento
        fields = ['id', 'periodo', 'status', 'data_criacao', 'holerites_gerados']

class AdminRegistroPontoSerializer(serializers.ModelSerializer):
    """
    Serializer detalhado para a visão do admin, incluindo o nome do usuário.
    """
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = RegistroPonto
        # Garantimos que todos os campos necessários estão aqui
        fields = ['id', 'user', 'user_name', 'timestamp', 'tipo']
        # Definimos explicitamente que o 'user' não pode ser alterado via API
        read_only_fields = ['user', 'user_name']

class JustificativaSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = Justificativa
        fields = ['id', 'user', 'user_name', 'data_ocorrencia', 'motivo', 'status', 'data_criacao']
        read_only_fields = ['user', 'status', 'data_criacao'] # O usuário só pode definir a data e o motivo na criação
        
class RegistroDiarioSerializer(serializers.Serializer):
    """
    Serializer para o resumo de um dia de trabalho, com dados calculados.
    """
    date = serializers.DateField()
    worked = serializers.FloatField()
    overtime = serializers.FloatField()
    debit = serializers.FloatField()
    status = serializers.CharField()
    # ADICIONE OS CAMPOS ABAIXO
    justificativa_status = serializers.CharField(allow_null=True)
    justificativa_motivo = serializers.CharField(allow_null=True)

    class Meta:
        # fields = ['date', 'worked', 'overtime', 'debit', 'status'] # Remova ou comente esta linha se ela existir
        # A lista de fields é inferida quando não há um 'Meta' explícito com 'model'.
        pass

class NotificacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacao
        fields = ['id', 'mensagem', 'lida', 'criado_em', 'link']
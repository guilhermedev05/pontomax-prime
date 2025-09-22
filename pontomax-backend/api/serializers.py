# api/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Holerite, Vencimento, Desconto, Profile, RegistroPonto

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
        fields = ['perfil', 'salario_base', 'horas_mensais']


# 2. SIMPLIFICAMOS O USERSERIALIZER PARA USAR O PROFILESERIALIZER
class UserSerializer(serializers.ModelSerializer):
    # O objeto 'profile' agora é tratado pelo seu próprio serializer
    profile = ProfileSerializer()
    nome = serializers.CharField(source='get_full_name', read_only=True)
    valor_hora = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'password', 'first_name', 'last_name', 'email', 
            'nome', 'profile', 'valor_hora'
        ]
        read_only_fields = ['username', 'valor_hora']
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

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
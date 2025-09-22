# api/views.py

# --- Imports ---
# Modelos do Django e do seu app
from django.contrib.auth.models import User
from datetime import date
from .models import Holerite, RegistroPonto
from itertools import groupby
from .serializers import HoleriteSerializer, UserSerializer, RegistroPontoSerializer, RegistroDiarioSerializer, BancoHorasSaldoSerializer, BancoHorasEquipeSerializer
# Ferramentas do Django Rest Framework
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView

def calcular_saldo_banco_horas(user):
    """
    Função reutilizável que calcula o saldo total de horas para um usuário.
    """
    punches = RegistroPonto.objects.filter(user=user).order_by('timestamp')
    total_balance_hours = 0
    jornada_diaria_em_horas = 8.0

    for day, punches_in_day_iter in groupby(punches, key=lambda p: p.timestamp.date()):
        punches_in_day = list(punches_in_day_iter)
        total_seconds_in_day = 0
        
        for i in range(0, len(punches_in_day) - 1, 2):
            start_punch = punches_in_day[i]
            end_punch = punches_in_day[i+1]
            if 'entrada' in start_punch.tipo and 'saida' in end_punch.tipo:
                time_diff = end_punch.timestamp - start_punch.timestamp
                total_seconds_in_day += time_diff.total_seconds()
        
        worked_hours = total_seconds_in_day / 3600
        if worked_hours > 0:
            daily_balance = worked_hours - jornada_diaria_em_horas
            total_balance_hours += daily_balance
            
    return round(total_balance_hours, 2)

def calcular_saldo_mensal(user, ano, mes):
    """
    Calcula os créditos e débitos de um usuário para um mês/ano específico.
    """
    # Filtra os registros de ponto para o usuário, ano e mês fornecidos
    punches = RegistroPonto.objects.filter(
        user=user,
        timestamp__year=ano,
        timestamp__month=mes
    ).order_by('timestamp')

    total_credits_hours = 0
    total_debits_hours = 0
    jornada_diaria_em_horas = 8.0

    # Agrupa os registros por dia
    for day, punches_in_day_iter in groupby(punches, key=lambda p: p.timestamp.date()):
        punches_in_day = list(punches_in_day_iter)
        total_seconds_in_day = 0
        
        # Calcula o total de horas trabalhadas no dia
        for i in range(0, len(punches_in_day) - 1, 2):
            start_punch = punches_in_day[i]
            end_punch = punches_in_day[i+1]
            if 'entrada' in start_punch.tipo and 'saida' in end_punch.tipo:
                time_diff = end_punch.timestamp - start_punch.timestamp
                total_seconds_in_day += time_diff.total_seconds()
        
        worked_hours = total_seconds_in_day / 3600

        # Calcula o saldo do dia e separa em crédito ou débito
        if worked_hours > 0:
            daily_balance = worked_hours - jornada_diaria_em_horas
            if daily_balance > 0:
                total_credits_hours += daily_balance
            else:
                total_debits_hours += abs(daily_balance)
            
    return {
        'credits': round(total_credits_hours, 2),
        'debits': round(total_debits_hours, 2)
    }
# --- Views da API ---

class HoleriteView(APIView):
    """
    View para buscar a lista de holerites de um usuário para um período específico.
    Acessível via GET em /api/holerites/?periodo=AAAA-MM
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        periodo = request.query_params.get('periodo')
        if not periodo:
            return Response({'error': 'O parâmetro "periodo" é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Busca o holerite para o usuário autenticado via token e o período especificado
            holerite = Holerite.objects.get(user=request.user, periodo=periodo)
            serializer = HoleriteSerializer(holerite)
            return Response(serializer.data)
        except Holerite.DoesNotExist:
            return Response({'error': 'Nenhum holerite encontrado para este período.'}, status=status.HTTP_404_NOT_FOUND)

class UserProfileView(APIView):
    """
    View para buscar os detalhes do usuário atualmente logado (autenticado via token).
    Acessível via GET em /api/user/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet completo para as operações CRUD (Criar, Ler, Atualizar, Deletar)
    de funcionários da equipe.
    Acessível via:
    - GET /api/equipe/ (Listar todos)
    - POST /api/equipe/ (Criar novo)
    - GET /api/equipe/<id>/ (Ver detalhes)
    - PUT /api/equipe/<id>/ (Atualizar)
    - DELETE /api/equipe/<id>/ (Deletar)
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Garante que o gestor não se veja na sua própria lista de equipe
        return self.queryset.exclude(pk=self.request.user.pk)
    
class RegistroPontoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para listar e criar registros de ponto para o usuário logado.
    """
    serializer_class = RegistroPontoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Retorna apenas os registros do usuário logado e do dia de hoje
        return RegistroPonto.objects.filter(
            user=self.request.user,
            timestamp__date=date.today()
        )

    def perform_create(self, serializer):
        # Lógica para determinar o próximo tipo de registro
        queryset = self.get_queryset()
        last_punch = queryset.last()
        
        next_type = 'entrada' # Padrão é entrada
        if last_punch:
            type_map = {
                'entrada': 'saida_almoco',
                'saida_almoco': 'entrada_almoco',
                'entrada_almoco': 'saida'
            }
            # Se o último tipo estiver no mapa, pega o próximo. Senão, é uma nova entrada.
            next_type = type_map.get(last_punch.tipo, 'entrada')
        
        # Salva o novo registro com o usuário logado e o tipo calculado
        serializer.save(user=self.request.user, tipo=next_type)

class RegistrosView(ListAPIView):
    """
    View para listar os resumos diários de ponto para um intervalo de datas.
    """
    serializer_class = RegistroDiarioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # 1. Pega as datas da URL (ex: /api/registros/?start_date=...&end_date=...)
        start_date_str = self.request.query_params.get('start_date')
        end_date_str = self.request.query_params.get('end_date')

        if not start_date_str or not end_date_str:
            return [] # Retorna vazio se as datas não forem fornecidas

        start_date = date.fromisoformat(start_date_str)
        end_date = date.fromisoformat(end_date_str)

        # 2. Busca todos os registros de ponto do usuário no intervalo
        punches = RegistroPonto.objects.filter(
            user=self.request.user,
            timestamp__date__range=[start_date, end_date]
        ).order_by('timestamp')

        # 3. Processa os registros para calcular os totais diários
        daily_summaries = []
        # Agrupa os registros por dia
        for day, punches_in_day_iter in groupby(punches, key=lambda p: p.timestamp.date()):
            punches_in_day = list(punches_in_day_iter)
            total_seconds = 0
            
            # Itera sobre os registros do dia em pares (entrada/saída)
            for i in range(0, len(punches_in_day) - 1, 2):
                start_punch = punches_in_day[i]
                end_punch = punches_in_day[i+1]
                
                # Validação simples de pares (ex: entrada -> saida_almoco)
                if 'entrada' in start_punch.tipo and 'saida' in end_punch.tipo:
                    time_diff = end_punch.timestamp - start_punch.timestamp
                    total_seconds += time_diff.total_seconds()
            
            worked_hours = total_seconds / 3600
            
            # Lógica de cálculo de hora extra/débito (assumindo jornada de 8h)
            jornada_diaria = 8.0
            overtime = max(0, worked_hours - jornada_diaria)
            debit = max(0, jornada_diaria - worked_hours) if worked_hours < jornada_diaria else 0

            daily_summaries.append({
                'date': day,
                'worked': round(worked_hours, 2),
                'overtime': round(overtime, 2),
                'debit': round(debit, 2),
                'status': 'Fechado' # Status de exemplo
            })

        return daily_summaries
    
class BancoHorasSaldoView(APIView):
    """
    View que retorna o saldo total do banco de horas para o usuário autenticado.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        saldo = calcular_saldo_banco_horas(request.user)
        
        data = {'saldo_banco_horas': saldo}
        serializer = BancoHorasSaldoSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        
        return Response(serializer.validated_data)

class BancoHorasEquipeView(ListAPIView):
    """
    View que lista o saldo do banco de horas de todos os funcionários da equipe.
    """
    serializer_class = BancoHorasEquipeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        equipe = User.objects.exclude(pk=self.request.user.pk)
        
        # Pega o mês e ano atuais para o cálculo mensal
        hoje = date.today()
        ano_atual = hoje.year
        mes_atual = hoje.month
        
        lista_saldos = []
        for funcionario in equipe:
            # Chama a função de saldo total (que já tínhamos)
            saldo_total = calcular_saldo_banco_horas(funcionario)
            
            # MUDANÇA: Chama a nova função para o saldo do mês
            saldo_mensal = calcular_saldo_mensal(funcionario, ano_atual, mes_atual)
            
            lista_saldos.append({
                'name': funcionario.get_full_name(),
                'balance': saldo_total,
                'credits': saldo_mensal['credits'], # <-- Usa o valor dinâmico
                'debits': saldo_mensal['debits']    # <-- Usa o valor dinâmico
            })
            
        return lista_saldos
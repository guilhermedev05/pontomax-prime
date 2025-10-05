# api/views.py

# --- Imports ---
# Modelos do Django e do seu app
from django.contrib.auth.models import User
from datetime import date
from django.utils import timezone
from .models import (
    Holerite, RegistroPonto, Fechamento, HoleriteGerado,
    Vencimento, Desconto, VencimentoGerado, DescontoGerado
)
from django.db import transaction
from itertools import groupby
from .serializers import GestorDashboardSerializer, HoleriteSerializer, UserSerializer, RegistroPontoSerializer, RegistroDiarioSerializer, BancoHorasSaldoSerializer, BancoHorasEquipeSerializer
# Ferramentas do Django Rest Framework
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from .serializers import FechamentoSerializer
from rest_framework.decorators import action
from decimal import Decimal

def calcular_saldo_banco_horas(user):
    """
    Calcula o saldo total de horas. A jornada diária é a diferença
    entre o primeiro e o último registro do dia.
    """
    punches = RegistroPonto.objects.filter(user=user).order_by('timestamp')
    total_balance_hours = 0
    jornada_diaria_em_horas = 8.0

    for day, punches_in_day_iter in groupby(punches, key=lambda p: p.timestamp.date()):
        punches_in_day = list(punches_in_day_iter)
        
        # Só calcula se houver pelo menos uma entrada e uma saída
        if len(punches_in_day) >= 2:
            first_punch = punches_in_day[0]
            last_punch = punches_in_day[-1]
            
            # Garante que o dia foi fechado com uma saída
            if first_punch.tipo == 'entrada' and last_punch.tipo == 'saida':
                total_seconds_in_day = (last_punch.timestamp - first_punch.timestamp).total_seconds()
                worked_hours = total_seconds_in_day / 3600
                daily_balance = worked_hours - jornada_diaria_em_horas
                total_balance_hours += daily_balance
            
    return round(total_balance_hours, 2)


def calcular_saldo_mensal(user, ano, mes):
    """
    Calcula os créditos e débitos de um usuário para um mês/ano específico.
    """
    punches = RegistroPonto.objects.filter(
        user=user,
        timestamp__year=ano,
        timestamp__month=mes
    ).order_by('timestamp')

    total_credits_hours = 0
    total_debits_hours = 0
    jornada_diaria_em_horas = 8.0

    for day, punches_in_day_iter in groupby(punches, key=lambda p: p.timestamp.date()):
        punches_in_day = list(punches_in_day_iter)
        
        if len(punches_in_day) >= 2:
            first_punch = punches_in_day[0]
            last_punch = punches_in_day[-1]

            if first_punch.tipo == 'entrada' and last_punch.tipo == 'saida':
                total_seconds_in_day = (last_punch.timestamp - first_punch.timestamp).total_seconds()
                worked_hours = total_seconds_in_day / 3600
                
                daily_balance = worked_hours - jornada_diaria_em_horas
                if daily_balance > 0:
                    total_credits_hours += daily_balance
                else:
                    total_debits_hours += abs(daily_balance)
            
    return {
        'credits': round(total_credits_hours, 2),
        'debits': round(total_debits_hours, 2)
    }# --- Views da API ---

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
        if last_punch and last_punch.tipo == 'entrada':
            next_type = 'saida'
        else:
            next_type = 'entrada'
        
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

class GestorDashboardView(APIView):
    """
    View que compila todos os dados necessários para o dashboard do gestor.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        equipe = User.objects.exclude(pk=request.user.pk).exclude(is_staff=True)
        hoje = date.today()
        
        # --- Cálculo do Status da Equipe ---
        team_status_list = []
        usuarios_ativos_hoje = 0
        
        for funcionario in equipe:
            # Pega os registros de hoje
            punches_today = RegistroPonto.objects.filter(user=funcionario, timestamp__date=hoje)
            last_punch = punches_today.last()
            
            punches_list = list(punches_today)
            worked_seconds_today = 0
            if len(punches_list) >= 1 and punches_list[0].tipo == 'entrada':
                 # Se o último registro foi uma saída, calcula o período fechado.
                 # Se foi uma entrada, calcula até o momento atual.
                end_time = punches_list[-1].timestamp if punches_list[-1].tipo == 'saida' else timezone.now()
                worked_seconds_today = (end_time - punches_list[0].timestamp).total_seconds()

            worked_hours_today = worked_seconds_today / 3600
            
            # Define o status (lógica simplificada)
            status = "Ausente"
            if last_punch:
                usuarios_ativos_hoje += 1
                if last_punch.tipo == 'entrada':
                    status = "Trabalhando"
                elif last_punch.tipo == 'saida':
                    status = "Finalizado"

            team_status_list.append({
                'name': funcionario.get_full_name(),
                'initials': "".join([n[0] for n in funcionario.get_full_name().split()]),
                'status': status,
                'lastPunch': timezone.localtime(last_punch.timestamp).strftime('%H:%M') if last_punch else '--:--',
                'hoursToday': f"{int(worked_hours_today):02d}:{int((worked_hours_today*60)%60):02d}"
            })

        # --- Cálculo dos Cards de Estatísticas ---
        stats_data = {
            'pendentes': 0, # Exemplo, pois não temos a lógica de ajustes
            'aniversariantes': 0, # Exemplo, pois não temos data de nascimento
            'ativos': usuarios_ativos_hoje,
            'ausentes': equipe.count() - usuarios_ativos_hoje
        }

        # --- Monta o objeto final ---
        dashboard_data = {
            'gestorName': request.user.first_name,
            'stats': stats_data,
            'teamStatus': team_status_list
        }

        serializer = GestorDashboardSerializer(instance=dashboard_data)
        return Response(serializer.data)

class FechamentoViewSet(viewsets.ModelViewSet):
    queryset = Fechamento.objects.all().order_by('-periodo')
    serializer_class = FechamentoSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='iniciar')
    def iniciar_fechamento(self, request):
        periodo = request.data.get('periodo')
        if not periodo:
            return Response({'error': 'Período é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)
        
        fechamento, _ = Fechamento.objects.get_or_create(periodo=periodo)
        fechamento.status = 'REVISAO'
        fechamento.iniciado_por = request.user
        fechamento.save()

        equipe = User.objects.exclude(pk=request.user.pk).exclude(is_staff=True)
        ano, mes = map(int, periodo.split('-'))
        
        dados_revisao = []
        for funcionario in equipe:
            saldo_mensal = calcular_saldo_mensal(funcionario, ano, mes)
            dados_revisao.append({
                'name': funcionario.get_full_name(),
                'balance': saldo_mensal['credits'] - saldo_mensal['debits']
            })

        return Response({
            'fechamento': self.get_serializer(fechamento).data,
            'dados_revisao': dados_revisao
        })

    @action(detail=True, methods=['post'], url_path='gerar-holerites')
    def gerar_holerites(self, request, pk=None):
        fechamento = self.get_object()
        fechamento.status = 'GERANDO'
        fechamento.save()

        equipe = User.objects.exclude(is_staff=True)
        for funcionario in equipe:
            if hasattr(funcionario, 'profile') and funcionario.profile.salario_base:
                
                # Cria ou busca o holerite gerado principal
                holerite_gerado, _ = HoleriteGerado.objects.update_or_create(
                    fechamento=fechamento, user=funcionario,
                    defaults={'salario_bruto': 0, 'total_descontos': 0, 'salario_liquido': 0}
                )

                # Limpa itens antigos para não duplicar
                holerite_gerado.vencimentos_gerados.all().delete()
                holerite_gerado.descontos_gerados.all().delete()

                # --- Lógica para criar os itens de Vencimento ---
                salario_base = funcionario.profile.salario_base
                VencimentoGerado.objects.create(
                    holerite_gerado=holerite_gerado,
                    descricao="Salário Base",
                    valor=salario_base
                )
                # (Aqui você poderia adicionar lógica para horas extras, etc.)

                # --- Lógica para criar os itens de Desconto (exemplo) ---
                inss = salario_base * Decimal('0.08') # Exemplo: 8%
                DescontoGerado.objects.create(
                    holerite_gerado=holerite_gerado,
                    descricao="INSS",
                    detalhes="Alíquota 8%",
                    valor=inss
                )
                # (Aqui você poderia adicionar lógica para IRRF, vale transporte, etc.)

                # --- Calcula e salva os totais ---
                total_vencimentos = sum(v.valor for v in holerite_gerado.vencimentos_gerados.all())
                total_descontos = sum(d.valor for d in holerite_gerado.descontos_gerados.all())
                
                holerite_gerado.salario_bruto = total_vencimentos
                holerite_gerado.total_descontos = total_descontos
                holerite_gerado.salario_liquido = total_vencimentos - total_descontos
                holerite_gerado.save()
        
        fechamento.status = 'CONCLUIDO'
        fechamento.save()
        return Response(self.get_serializer(fechamento).data)
    
    @action(detail=True, methods=['post'], url_path='enviar-holerites')
    def enviar_holerites(self, request, pk=None):
        fechamento = self.get_object()

        # Usamos uma transação para garantir que tudo seja salvo com sucesso, ou nada é salvo.
        with transaction.atomic():
            for holerite_gerado in fechamento.holerites_gerados.all():
                # 1. Cria ou atualiza o Holerite principal que o colaborador vê
                holerite_publicado, _ = Holerite.objects.update_or_create(
                    user=holerite_gerado.user,
                    periodo=fechamento.periodo,
                )

                # 2. Limpa os vencimentos e descontos antigos para não duplicar
                holerite_publicado.vencimentos.all().delete()
                holerite_publicado.descontos.all().delete()

                # 3. Copia os Vencimentos Gerados para os Vencimentos publicados
                for venc in holerite_gerado.vencimentos_gerados.all():
                    Vencimento.objects.create(
                        holerite=holerite_publicado,
                        descricao=venc.descricao,
                        detalhes=venc.detalhes,
                        valor=venc.valor
                    )

                # 4. Copia os Descontos Gerados para os Descontos publicados
                for desc in holerite_gerado.descontos_gerados.all():
                    Desconto.objects.create(
                        holerite=holerite_publicado,
                        descricao=desc.descricao,
                        detalhes=desc.detalhes,
                        valor=desc.valor
                    )

                # 5. Marca o holerite gerado como enviado
                holerite_gerado.enviado = True
                holerite_gerado.save()

        return Response({'status': 'Holerites publicados com sucesso para os colaboradores.'})
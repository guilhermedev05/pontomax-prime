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
from .serializers import GestorDashboardSerializer, HoleriteSerializer, UserSerializer, RegistroPontoSerializer, RegistroDiarioSerializer, BancoHorasSaldoSerializer, BancoHorasEquipeSerializer, AdminRegistroPontoSerializer
# Ferramentas do Django Rest Framework
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from .serializers import FechamentoSerializer
from rest_framework.decorators import action
from decimal import Decimal
from .permissions import IsAdminUser
from django.http import HttpResponse
from django.template.loader import render_to_string
from weasyprint import HTML
import base64
from django.conf import settings
import os
from .models import Justificativa
from .serializers import JustificativaSerializer

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

# 2. Crie uma ViewSet específica para a administração de usuários
#    Ela é uma cópia da UserViewSet, mas protegida pela permissão de Admin
#    e não tem os filtros que escondem o admin ou o próprio usuário.
class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('first_name')
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

    # ADICIONE ESTE MÉTODO À CLASSE:
    def get_queryset(self):
        """
        Esta view não deve retornar o próprio usuário que está logado na lista.
        """
        user = self.request.user
        return self.queryset.exclude(pk=user.pk)


# 3. Adicione ViewSets para outros modelos que você queira gerenciar
#    Exemplo para o modelo de Fechamento:
class AdminFechamentoViewSet(viewsets.ModelViewSet):
    queryset = Fechamento.objects.all().order_by('-periodo')
    serializer_class = FechamentoSerializer
    permission_classes = [IsAdminUser]

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
        return self.queryset.exclude(pk=self.request.user.pk).exclude(is_superuser=True)
    
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
        equipe = User.objects.exclude(pk=self.request.user.pk).exclude(is_superuser=True)
        
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
            
            enviado = False
            try:
                holerite_gerado = HoleriteGerado.objects.get(fechamento=fechamento, user=funcionario)
                enviado = holerite_gerado.enviado
            except HoleriteGerado.DoesNotExist:
                pass # Se não foi gerado, obviamente não foi enviado
            
            dados_revisao.append({
                'name': funcionario.get_full_name(),
                'balance': saldo_mensal['credits'] - saldo_mensal['debits'],
                'enviado': enviado # <-- Nova informação enviada para o frontend
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

class AdminRegistroPontoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para administradores gerenciarem todos os registros de ponto.
    """
    queryset = RegistroPonto.objects.all().order_by('-timestamp') # Mais recentes primeiro
    serializer_class = AdminRegistroPontoSerializer
    permission_classes = [IsAdminUser]

class GerarRelatorioPontoPDF(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        if not start_date_str or not end_date_str:
            return Response({'error': 'Datas de início e fim são obrigatórias.'}, status=400)

        start_date = date.fromisoformat(start_date_str)
        end_date = date.fromisoformat(end_date_str)
        
        # Lógica para buscar e processar os dados (similar à RegistrosView)
        punches = RegistroPonto.objects.filter(
            user=request.user,
            timestamp__date__range=[start_date, end_date]
        ).order_by('timestamp')

        daily_summaries = []
        # Agrupa os registros por dia
        for day, punches_in_day_iter in groupby(punches, key=lambda p: p.timestamp.date()):
            # ... (Lógica de cálculo de horas - vamos simplificar para o relatório)
            punches_in_day = list(punches_in_day_iter)
            if len(punches_in_day) < 2: continue

            start_punch = punches_in_day[0]
            end_punch = punches_in_day[-1]
            if start_punch.tipo != 'entrada' or end_punch.tipo != 'saida': continue

            total_seconds = (end_punch.timestamp - start_punch.timestamp).total_seconds()
            worked_hours = total_seconds / 3600
            jornada_diaria = request.user.profile.jornada_diaria if hasattr(request.user, 'profile') else 8.0

            overtime = max(0, worked_hours - jornada_diaria)
            debit = max(0, jornada_diaria - worked_hours) if worked_hours < jornada_diaria else 0

            # Formata as horas para o template
            h_w, m_w = divmod(int(worked_hours * 60), 60)
            h_o, m_o = divmod(int(overtime * 60), 60)
            h_d, m_d = divmod(int(debit * 60), 60)

            daily_summaries.append({
                'date': day,
                'worked_formatted': f'{h_w:02d}h {m_w:02d}m',
                'overtime_formatted': f'+{h_o:02d}h {m_o:02d}m',
                'debit_formatted': f'-{h_d:02d}h {m_d:02d}m',
            })

        # Calcula os totais
        total_worked_mins = sum(int(r['worked_formatted'].split('h')[0])*60 + int(r['worked_formatted'].split('h')[1].replace('m','')) for r in daily_summaries)
        # (Lógica similar para overtime e debit)
        h_tw, m_tw = divmod(total_worked_mins, 60)

        logo_base64 = ''
        try:
            # Constrói o caminho para o arquivo da logo na sua pasta 'static'
            logo_path = os.path.join(settings.STATICFILES_DIRS[0], 'assets/images/logo.svg')
            with open(logo_path, 'rb') as logo_file:
                logo_base64 = base64.b64encode(logo_file.read()).decode('utf-8')
        except (FileNotFoundError, IndexError):
            print("AVISO: Arquivo de logo não encontrado ou STATICFILES_DIRS não configurado.")
            # O PDF será gerado sem a logo se não for encontrada

        context = {
            'user_name': request.user.get_full_name(),
            'periodo': f'{start_date.strftime("%d/%m/%Y")} a {end_date.strftime("%d/%m/%Y")}',
            'registros': daily_summaries,
            'totais': { 'worked': f'{h_tw:02d}h {m_tw:02d}m', 'overtime': '...', 'debit': '...' }, # Simplificado
            'logo_data_uri': f'data:image/svg+xml;base64,{logo_base64}' # <-- Nova variável para o template
        }
        
        # Renderiza o HTML e cria o PDF
        html_string = render_to_string('reports/relatorio_ponto.html', context)
        pdf_file = HTML(string=html_string).write_pdf()

        # Cria a resposta HTTP
        response = HttpResponse(pdf_file, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="relatorio_ponto_{request.user.username}_{start_date_str}.pdf"'
        
        return response

class GerarHoleritePDF(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        periodo = request.query_params.get('periodo')
        if not periodo:
            return Response({'error': 'O parâmetro "periodo" é obrigatório.'}, status=400)

        try:
            # Busca o holerite para o usuário e período especificados
            holerite = Holerite.objects.get(user=request.user, periodo=periodo)
        except Holerite.DoesNotExist:
            return Response({'error': 'Nenhum holerite encontrado para este período.'}, status=404)

        # Usamos o serializer para formatar os dados, assim como na view normal
        serializer = HoleriteSerializer(holerite)
        holerite_data = serializer.data

        # Calcula os totais
        total_bruto = sum(Decimal(v['valor']) for v in holerite_data['vencimentos'])
        total_descontos = sum(Decimal(d['valor']) for d in holerite_data['descontos'])
        total_liquido = total_bruto - total_descontos

        # Lógica para embutir a logo (reaproveitada)
        logo_base64 = ''
        try:
            logo_path = os.path.join(settings.STATICFILES_DIRS[0], 'assets/images/logo.svg')
            with open(logo_path, 'rb') as logo_file:
                logo_base64 = base64.b64encode(logo_file.read()).decode('utf-8')
        except (FileNotFoundError, IndexError):
            print("AVISO: Arquivo de logo não encontrado.")

        context = {
            'holerite': holerite_data,
            'totais': {
                'bruto': f'R$ {total_bruto:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.'),
                'descontos': f'R$ {total_descontos:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.'),
                'liquido': f'R$ {total_liquido:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')
            },
            'logo_data_uri': f'data:image/svg+xml;base64,{logo_base64}'
        }

        # Renderiza o HTML, cria o PDF e retorna a resposta
        html_string = render_to_string('reports/holerite_pdf.html', context)
        pdf_file = HTML(string=html_string, base_url=request.build_absolute_uri()).write_pdf()

        response = HttpResponse(pdf_file, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="holerite_{request.user.username}_{periodo}.pdf"'
        
        return response

class JustificativaViewSet(viewsets.ModelViewSet):
    serializer_class = JustificativaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filtra as justificativas:
        - Colaborador vê apenas as suas.
        - Gestor vê as de sua equipe.
        - Admin vê todas.
        """
        user = self.request.user
        if user.profile.perfil == 'COLABORADOR':
            return Justificativa.objects.filter(user=user)
        elif user.profile.perfil == 'GESTOR':
            # Assumindo que a equipe do gestor são todos os não-gestores/não-admins
            equipe_ids = User.objects.filter(profile__perfil='COLABORADOR').values_list('id', flat=True)
            return Justificativa.objects.filter(user__id__in=equipe_ids)
        
        # Admin vê tudo
        return Justificativa.objects.all()

    def perform_create(self, serializer):
        """ Garante que a justificativa seja criada para o usuário logado. """
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated]) # Adicionar permissão de gestor aqui seria ideal no futuro
    def resolver(self, request, pk=None):
        """ Ação para um gestor aprovar ou rejeitar uma justificativa. """
        justificativa = self.get_object()
        
        # Validação simples de permissão
        if request.user.profile.perfil not in ['GESTOR', 'ADMIN']:
            return Response({'error': 'Apenas gestores ou admins podem resolver justificativas.'}, status=status.HTTP_403_FORBIDDEN)

        novo_status = request.data.get('status')
        if novo_status not in ['APROVADO', 'REJEITADO']:
            return Response({'error': 'Status inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        justificativa.status = novo_status
        justificativa.gestor_responsavel = request.user
        justificativa.data_resolucao = timezone.now()
        justificativa.save()

        # TODO: Futuramente, aqui será o gatilho para enviar uma notificação ao colaborador.

        return Response(self.get_serializer(justificativa).data)
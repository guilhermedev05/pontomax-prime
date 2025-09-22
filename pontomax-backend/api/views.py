# api/views.py

# --- Imports ---
# Modelos do Django e do seu app
from django.contrib.auth.models import User
from datetime import date
from .models import Holerite, RegistroPonto
from .serializers import HoleriteSerializer, UserSerializer, RegistroPontoSerializer
# Ferramentas do Django Rest Framework
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

# Seus Serializers
from .serializers import HoleriteSerializer, UserSerializer


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
from django.contrib import admin
from .models import Profile, Holerite, Vencimento, Desconto, RegistroPonto, Fechamento, HoleriteGerado, Justificativa

class JustificativaAdmin(admin.ModelAdmin):
    list_display = ('user', 'data_ocorrencia', 'status', 'data_criacao')
    list_filter = ('status', 'data_ocorrencia')
    search_fields = ('user__username', 'motivo')
    list_per_page = 20
    
# Register your models here.
admin.site.register(Profile)
admin.site.register(Holerite)
admin.site.register(Vencimento)
admin.site.register(Desconto)
admin.site.register(RegistroPonto)
admin.site.register(Fechamento)
admin.site.register(HoleriteGerado)
admin.site.register(Justificativa, JustificativaAdmin)
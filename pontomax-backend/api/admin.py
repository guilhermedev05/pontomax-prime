from django.contrib import admin
from .models import Profile, Holerite, Vencimento, Desconto, RegistroPonto

# Register your models here.
admin.site.register(Profile)
admin.site.register(Holerite)
admin.site.register(Vencimento)
admin.site.register(Desconto)
admin.site.register(RegistroPonto)
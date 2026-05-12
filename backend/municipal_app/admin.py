from django.contrib import admin
from .models import Admin, Citizen, UrbanPlanner, WasteReport
admin.site.register(Admin); admin.site.register(Citizen); admin.site.register(UrbanPlanner); admin.site.register(WasteReport)

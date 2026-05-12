from rest_framework import serializers
from .models import Admin, Citizen, UrbanPlanner, WasteReport
class AdminSerializer(serializers.ModelSerializer):
    class Meta: model=Admin; fields='__all__'
class CitizenSerializer(serializers.ModelSerializer):
    class Meta: model=Citizen; fields='__all__'
class UrbanPlannerSerializer(serializers.ModelSerializer):
    class Meta: model=UrbanPlanner; fields='__all__'
class WasteReportSerializer(serializers.ModelSerializer):
    citizen_name=serializers.CharField(source='citizen.full_name',read_only=True)
    authority_name=serializers.CharField(source='authority.admin_name',read_only=True)
    class Meta:
        model=WasteReport
        fields=['report_id','citizen','citizen_name','authority','authority_name','description','report_date','status','priority','resolved_date']

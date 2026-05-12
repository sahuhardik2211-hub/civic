from django.db import models
class Admin(models.Model):
    admin_id=models.CharField(max_length=10,primary_key=True)
    admin_name=models.CharField(max_length=100)
    email=models.EmailField(unique=True)
    phone_number=models.CharField(max_length=15)
    role=models.CharField(max_length=50)
    login_username=models.CharField(max_length=50,unique=True)
    def __str__(self): return self.admin_name
    class Meta: db_table='admin'
class Citizen(models.Model):
    citizen_id=models.CharField(max_length=10,primary_key=True)
    full_name=models.CharField(max_length=100)
    email=models.EmailField(unique=True)
    phone_number=models.CharField(max_length=15)
    address=models.CharField(max_length=255)
    area=models.CharField(max_length=100)
    registration_date=models.DateField()
    def __str__(self): return self.full_name
    class Meta: db_table='citizen'
class UrbanPlanner(models.Model):
    planner_id=models.CharField(max_length=10,primary_key=True)
    planner_name=models.CharField(max_length=100)
    email=models.EmailField(unique=True)
    department=models.CharField(max_length=100)
    access_level=models.CharField(max_length=50)
    def __str__(self): return self.planner_name
    class Meta: db_table='urban_planner'
class WasteReport(models.Model):
    report_id=models.CharField(max_length=10,primary_key=True)
    citizen=models.ForeignKey(Citizen,on_delete=models.CASCADE,db_column='citizen_id',related_name='reports')
    authority=models.ForeignKey(Admin,on_delete=models.CASCADE,db_column='authority_id',related_name='assigned_reports')
    description=models.TextField()
    report_date=models.DateTimeField()
    status=models.CharField(max_length=50)
    priority=models.CharField(max_length=20)
    resolved_date=models.DateTimeField(null=True,blank=True)
    def __str__(self): return self.report_id
    class Meta: db_table='waste_report'

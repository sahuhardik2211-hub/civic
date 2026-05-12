from django.core.management.base import BaseCommand
from django.utils import timezone
from municipal_app.models import Admin, Citizen, UrbanPlanner, WasteReport
class Command(BaseCommand):
    def handle(self,*args,**kwargs):
        a,_=Admin.objects.get_or_create(admin_id='A001',defaults={'admin_name':'Rajesh Kumar','email':'rajesh.admin@example.com','phone_number':'9876543210','role':'Sanitation Officer','login_username':'rajesh_admin'})
        c,_=Citizen.objects.get_or_create(citizen_id='C001',defaults={'full_name':'Aarav Sharma','email':'aarav@example.com','phone_number':'9876500001','address':'Ward 5, Main Road','area':'Ward 5','registration_date':timezone.now().date()})
        UrbanPlanner.objects.get_or_create(planner_id='P001',defaults={'planner_name':'Neha Verma','email':'neha.planner@example.com','department':'Urban Planning','access_level':'High'})
        WasteReport.objects.get_or_create(report_id='R001',defaults={'citizen':c,'authority':a,'description':'Garbage not collected for 3 days near main road.','report_date':timezone.now(),'status':'Open','priority':'High'})
        self.stdout.write(self.style.SUCCESS('Sample data inserted successfully.'))

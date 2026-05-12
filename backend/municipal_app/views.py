from django.conf import settings
from django.http import FileResponse, Http404
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Admin, Citizen, UrbanPlanner, WasteReport
from .serializers import AdminSerializer, CitizenSerializer, UrbanPlannerSerializer, WasteReportSerializer


FRONTEND_DIR = settings.BASE_DIR.parent / 'frontend'


def frontend_page(request, filename='index.html'):
    allowed_pages = {'index.html', 'register.html', 'dashboard.html', 'report.html', 'admin.html', 'analytics.html', 'map.html', 'profile.html'}
    if filename not in allowed_pages:
        raise Http404('Frontend page not found')

    page_path = (FRONTEND_DIR / filename).resolve()
    if FRONTEND_DIR.resolve() not in page_path.parents or not page_path.exists():
        raise Http404('Frontend page not found')

    return FileResponse(page_path.open('rb'), content_type='text/html')


def frontend_index(request):
    return frontend_page(request)


def frontend_asset(request, filename):
    allowed_assets = {'app.js': 'application/javascript', 'style.css': 'text/css', 'web.css': 'text/css'}
    if filename not in allowed_assets:
        raise Http404('Frontend asset not found')

    asset_path = (FRONTEND_DIR / filename).resolve()
    if FRONTEND_DIR.resolve() not in asset_path.parents or not asset_path.exists():
        raise Http404('Frontend asset not found')

    return FileResponse(asset_path.open('rb'), content_type=allowed_assets[filename])


@api_view(['POST'])
def create_admin(request):
    s=AdminSerializer(data=request.data)
    if s.is_valid(): s.save(); return Response(s.data,status=201)
    return Response(s.errors,status=400)
@api_view(['GET'])
def get_admins(request): return Response(AdminSerializer(Admin.objects.all(),many=True).data)
@api_view(['GET','PUT','DELETE'])
def admin_detail(request,id):
    try: obj=Admin.objects.get(pk=id)
    except Admin.DoesNotExist: return Response({'error':'Admin not found'},status=404)
    if request.method=='GET': return Response(AdminSerializer(obj).data)
    if request.method=='PUT':
        s=AdminSerializer(obj,data=request.data)
        if s.is_valid(): s.save(); return Response(s.data)
        return Response(s.errors,status=400)
    obj.delete(); return Response({'message':'Admin deleted successfully'},status=204)
def next_id(model, field_name, prefix):
    existing_ids = model.objects.values_list(field_name, flat=True)
    max_number = 0
    for value in existing_ids:
        if isinstance(value, str) and value.startswith(prefix) and value[1:].isdigit():
            max_number = max(max_number, int(value[1:]))
    return f'{prefix}{max_number + 1:03d}'


@api_view(['POST'])
def create_citizen(request):
    try:
        data = request.data.copy()

        data.pop("password", None)
        data.pop("confirm_password", None)
        data.pop("confirmPassword", None)

        if not data.get("citizen_id"):
            data["citizen_id"] = next_id(Citizen, "citizen_id", "C")

        if not data.get("registration_date"):
            data["registration_date"] = timezone.now().date()

        serializer = CitizenSerializer(data=data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)

        return Response(serializer.errors, status=400)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def get_citizens(request):
    citizens = Citizen.objects.all()
    serializer = CitizenSerializer(citizens, many=True)
    return Response(serializer.data)


@api_view(['GET','PUT','DELETE'])
def citizen_detail(request,id):
    try: obj=Citizen.objects.get(pk=id)
    except Citizen.DoesNotExist: return Response({'error':'Citizen not found'},status=404)
    if request.method=='GET': return Response(CitizenSerializer(obj).data)
    if request.method=='PUT':
        s=CitizenSerializer(obj,data=request.data)
        if s.is_valid(): s.save(); return Response(s.data)
        return Response(s.errors,status=400)
    obj.delete(); return Response({'message':'Citizen deleted successfully'},status=204)
@api_view(['POST'])
def create_planner(request):
    s=UrbanPlannerSerializer(data=request.data)
    if s.is_valid(): s.save(); return Response(s.data,status=201)
    return Response(s.errors,status=400)
@api_view(['GET'])
def get_planners(request): return Response(UrbanPlannerSerializer(UrbanPlanner.objects.all(),many=True).data)
@api_view(['GET','PUT','DELETE'])
def planner_detail(request,id):
    try: obj=UrbanPlanner.objects.get(pk=id)
    except UrbanPlanner.DoesNotExist: return Response({'error':'Planner not found'},status=404)
    if request.method=='GET': return Response(UrbanPlannerSerializer(obj).data)
    if request.method=='PUT':
        s=UrbanPlannerSerializer(obj,data=request.data)
        if s.is_valid(): s.save(); return Response(s.data)
        return Response(s.errors,status=400)
    obj.delete(); return Response({'message':'Planner deleted successfully'},status=204)
@api_view(['POST'])
def create_report(request):
    data = request.data.copy()
    if not data.get('report_id'):
        data['report_id'] = next_id(WasteReport, 'report_id', 'R')
    if not data.get('report_date'):
        data['report_date'] = timezone.now()
    if not data.get('status'):
        data['status'] = 'Open'
    if not data.get('priority'):
        data['priority'] = 'Medium'
    s=WasteReportSerializer(data=data)
    if s.is_valid(): s.save(); return Response(s.data,status=201)
    return Response(s.errors,status=400)
@api_view(['GET'])
def get_reports(request): return Response(WasteReportSerializer(WasteReport.objects.all().order_by('-report_date'),many=True).data)
@api_view(['GET','PUT','DELETE'])
def report_detail(request,id):
    try: obj=WasteReport.objects.get(pk=id)
    except WasteReport.DoesNotExist: return Response({'error':'Report not found'},status=404)
    if request.method=='GET': return Response(WasteReportSerializer(obj).data)
    if request.method=='PUT':
        s=WasteReportSerializer(obj,data=request.data,partial=True)
        if s.is_valid(): s.save(); return Response(s.data)
        return Response(s.errors,status=400)
    obj.delete(); return Response({'message':'Report deleted successfully'},status=204)
@api_view(['GET'])
def filter_reports_by_status(request,status_value): return Response(WasteReportSerializer(WasteReport.objects.filter(status__iexact=status_value),many=True).data)
@api_view(['GET'])
def filter_reports_by_priority(request,priority_value): return Response(WasteReportSerializer(WasteReport.objects.filter(priority__iexact=priority_value),many=True).data)
@api_view(['GET'])
def dashboard(request):
    return Response({'total_reports':WasteReport.objects.count(),'resolved':WasteReport.objects.filter(status__iexact='Resolved').count(),'pending':WasteReport.objects.filter(status__iexact='Open').count(),'in_progress':WasteReport.objects.filter(status__iexact='In Progress').count(),'high_priority':WasteReport.objects.filter(priority__iexact='High').count()})
@api_view(['PUT'])
def assign_report(request,report_id,admin_id):
    try:
        report=WasteReport.objects.get(pk=report_id); admin=Admin.objects.get(pk=admin_id)
    except WasteReport.DoesNotExist: return Response({'error':'Report not found'},status=404)
    except Admin.DoesNotExist: return Response({'error':'Admin not found'},status=404)
    report.authority=admin; report.status='In Progress'; report.save()
    return Response({'message':'Report assigned successfully','report':WasteReportSerializer(report).data})

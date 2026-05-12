from django.urls import path
from . import views
urlpatterns=[
path('',views.frontend_index),
path('index.html',views.frontend_page,{'filename':'index.html'}),
path('register.html',views.frontend_page,{'filename':'register.html'}),
path('dashboard.html',views.frontend_page,{'filename':'dashboard.html'}),
path('report.html',views.frontend_page,{'filename':'report.html'}),
path('admin.html',views.frontend_page,{'filename':'admin.html'}),
path('analytics.html',views.frontend_page,{'filename':'analytics.html'}),
path('map.html',views.frontend_page,{'filename':'map.html'}),
path('profile.html',views.frontend_page,{'filename':'profile.html'}),
path('<str:filename>',views.frontend_asset),
path('api/admins',views.get_admins), path('api/admins/create',views.create_admin), path('api/admins/<str:id>',views.admin_detail),
path('api/citizens',views.get_citizens), path('api/citizens/create',views.create_citizen), path('api/citizens/<str:id>',views.citizen_detail),
path('api/planners',views.get_planners), path('api/planners/create',views.create_planner), path('api/planners/<str:id>',views.planner_detail),
path('api/reports',views.get_reports), path('api/reports/create',views.create_report), path('api/reports/<str:id>',views.report_detail),
path('api/reports/status/<str:status_value>',views.filter_reports_by_status), path('api/reports/priority/<str:priority_value>',views.filter_reports_by_priority),
path('api/reports/<str:report_id>/assign/<str:admin_id>',views.assign_report), path('api/dashboard',views.dashboard)]

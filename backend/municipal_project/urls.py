from django.contrib import admin
from django.urls import path, include
from municipal_app import views

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
    path('app.js',views.frontend_asset,{'filename':'app.js'}),
    path('style.css',views.frontend_asset,{'filename':'style.css'}),
    path('web.css',views.frontend_asset,{'filename':'web.css'}),
    path('admin/',admin.site.urls),
    path('',include('municipal_app.urls')),
]

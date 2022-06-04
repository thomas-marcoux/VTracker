from django.urls import path, re_path, include
from . import views

app_name = 'YTAdminConsole'
urlpatterns = [
	path('', views.login_console, name='login_console'),
	path('dashboard', views.dashBoard, name='dashBoard'),
	path('dashStats', views.dashboardStats, name='dashStats'),
    path('stats', views.stats, name='stat-details'),
	path('instantCrawler', views.addToInstantCrawler, name='addToInstantCrawler'),
	path('databaseCrawler', views.addToDatabaseCrawler, name='addToDatabaseCrawler'),
	path('blogCrawler', views.addToBlogCrawler, name='addToBlogCrawler'),
	path('export', views.exportData, name='exportData'),
	path('login_view', views.login_view, name='login_view'),
	path('logout_view', views.logout_view, name='logout_view'),
	path('statsByStatus', views.statsByStatus, name='statsByStatus'),
	path('exportfile', views.export_my_data, name='exportfile'),
	path('updateKeyword', views.update_keyword, name='updateKeyword'),
	path('deleteKeyword', views.delete_keyword, name='deleteKeyword'),
	path('updatePriority', views.update_priority, name='updatePriority'),
	# url(r'^accounts/login/$', auth_views.login)
]
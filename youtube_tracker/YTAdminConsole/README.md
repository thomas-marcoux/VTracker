# YTAdminConsole

Designed to be used as an app inside the youtube-tracker project.

Make sure the file youtube-tracker/urls.py looks like this to be able to access the console:

urlpatterns = [ 
	path('',views.homePage,name='homePage'),
	path('YTAdminConsole/', include('YTAdminConsole.urls')),
	path('results',views.homePage,name='homePageWithSearchResults'),
	...

Also make sure youtube-tracker/settings.py looks like the following:
INSTALLED_APPS = [
    'youtube_tracker',
	'YTAdminConsole.apps.YtadminconsoleConfig',	
	...

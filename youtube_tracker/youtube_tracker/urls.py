"""youtube_tracker URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, re_path, include
from . import views
import debug_toolbar

urlpatterns = [
    path('debug/', include(debug_toolbar.urls)),
    path('', views.getLandingPage, name='getLandingPage'),
    path('home', views.homePage, name='homePage'),

    path('userGuidePage', views.userGuidePage, name='userGuidePage'),
    path('userGuide', views.userGuide, name='userGuide'),

    path('videoCharacterization', views.videoCharacterization, name='videoCharacterization'),
    path('getVideo', views.getVideo, name='getVideo'), 

    # Tracker calls
    path('trackers', views.trackerList, name="trackerList"),
    path('tracker/details/<slug:tracker_id>', views.trackerDetails, name="trackerDetails"),
    path('tracker/getTrackerVideos', views.getTrackerVideos, name="getTrackerVideos"),
    path('tracker/getPaginatedVideos', views.getPaginatedVideos, name="getPaginatedVideos"),
    path('tracker/getSingleVideoBarcode', views.getSingleVideoBarcode, name="getSingleVideoBarcode"),
    path('tracker/queryTrackerRelationship', views.queryTrackerRelationship, name="queryTrackerRelationship"),

    # Events calls
    path('events', views.eventsList, name="eventsList"),

    path('events/details', views.eventsDetails, name="eventsDetails"),
  
    # Analytics Dashboard calls
    path('dashboardAnalytics/<slug:tracker_id>', views.dashboardAnalytics, name='dashboardAnalytics'),
    path('dashboardAnalyticsRibbonStatistics', views.dashboardAnalyticsRibbonStatistics, name='dashboardAnalyticsRibbonStatistics'),
    path('dashboardAnalyticsPostingFrequency', views.dashboardAnalyticsPostingFrequency, name='dashboardAnalyticsPostingFrequency'),
    path('dashboardAnalyticsSmLinks', views.dashboardAnalyticsSmLinks, name='dashboardAnalyticsSmLinks'),
    path('dashboardAnalyticsDailyViews', views.dashboardAnalyticsDailyViews, name='dashboardAnalyticsDailyViews'),
    path('dashboardAnalyticsRelatedVideos', views.dashboardAnalyticsRelatedVideos, name='dashboardAnalyticsRelatedVideos'),

    # networkAnalysis calls
    path('networkAnalysis/<slug:tracker_id>', views.networkAnalysis, name='networkAnalysis'),
    path('networkAnalysisGraph', views.networkAnalysisGraph, name='networkAnalysisGraph'),

    # sentimentAnalysis calls 
    path('sentimentAnalysis/<slug:tracker_id>', views.sentimentAnalysis, name='sentimentAnalysis'),

    #clusterAnalysis calls
    path('clusterAnalysis/<slug:tracker_id>', views.clusterAnalysis, name='clusterAnalysis'),

    #topicAnalysis calls
    path('topicAnalysis/<slug:tracker_id>', views.topicAnalysis, name='topicAnalysis'),

    #narrativeAnalysis calls
    path('narrativeAnalysis/<slug:tracker_id>', views.narrativeAnalysis, name='narrativeAnalysis'),

    # Content Engagement calls
    path('contentEngagement/<slug:tracker_id>', views.contentEngagement, name='contentEngagement'),
    path('contentEngagementAggrVideoStats', views.contentEngagementAggrVideoStats, name='contentEngagementAggrVideoStats'),
    path('contentEngagementCommenters', views.contentEngagementCommenters, name='contentEngagementCommenters'),
    path('contentEngagementSubscriberStats', views.contentEngagementSubscriberStats, name='contentEngagementSubscriberStats'),
    path('contentEngagementVideoDetails', views.contentEngagementVideoDetails, name='contentEngagementVideoDetails'),
    path('contenEngagementVideoList', views.contentEngagementVideoList, name='contentEngagementideoList'), 
    path('contentEngagementViews', views.contentEngagementViews, name='contentEngagementViews'),
    path('contentEngagementLikeStats', views.contentEngagementLikeStats, name='contentEngagementLikeStats'),
    path('contentEngagementDislikeStats', views.contentEngagementDislikeStats, name='contentEngagementDislikeStats'),
    path('contentEngagementCommentStats', views.contentEngagementCommentStats, name='contentEngagementCommentStats'),

    # Content Analysis calls
    path('contentAnalysis/<slug:tracker_id>', views.contentAnalysis, name='contentAnalysis'),
    path('contentAnalysisDescLang', views.contentAnalysisDescLang, name='contentAnalysisDescLang'),
    path('contentAnalysisCategory', views.contentAnalysisCategory, name='contentAnalysisCategory'),
    path('contentAnalysisOpinionBar',  views.contentAnalysisOpinionBar, name='contentAnalysisOpinionBar'),
    path('contentAnalysisKeyword', views.contentAnalysisKeyword, name='contentAnalysisKeyword'),
    path('contentAnalysisEmoDist', views.contentAnalysisEmoDist, name='contentAnalysisEmoDist'),
    path('contentAnalysisVideoList', views.contentAnalysisVideoList, name='contentAnalysisVideoList'), 
    path('contentAnalysisPaginatedComments', views.contentAnalysisPaginatedComments, name='contentAnalysisPaginatedComments'),
    path('contentAnalysisGetCommentReplies', views.contentAnalysisGetCommentReplies, name='contentAnalysisGetCommentReplies'),
    path('contentAnalysisVideoDetails', views.contentAnalysisVideoDetails, name='contentAnalysisVideoDetails'), 

    path('networkAnalysis/<slug:tracker_id>', views.networkAnalysis, name='index.html'),

    # Posting Frequency calls
    path('postingFrequencyAnalytics/<slug:tracker_id>', views.postingFrequencyAnalytics, name='postingFrequencyAnalytics'),
    path('postingFrequencyPostingChart', views.postingFrequencyPostingChart, name='postingFrequencyPostingChart'), 
    path('postingFrequencyRibbonStatistics', views.postingFrequencyRibbonStatistics, name='postingFrequencyRibbonStatistics'), 
    path('postingFrequencyCategoryChart', views.postingFrequencyCategoryChart, name='postingFrequencyCategoryChart'), 
    path('postingFrequencyMapList', views.postingFrequencyMapList, name='postingFrequencyMapList'), 
    path('postingFrequencyMapChart', views.postingFrequencyMapChart, name='postingFrequencyMapChart'), 
    path('postingFrequencyChannelDetails', views.postingFrequencyChannelDetails, name='postingFrequencyChannelDetails'), 
    path('chartData', views.chartData, name='chartData'),

    # Registration page
    path('registration', views.registration, name='registration'),

    # Email verification
    path('registration/send', views.registrationSendEmail, name='registrationSendEmail'),
    re_path(r'^registrationActivate/(?P<uidb64>[0-9A-Za-z_\-]+)/(?P<token>[0-9A-Za-z]{1,13}-[0-9A-Za-z]{1,32})/$',
            views.registrationActivate, name='registrationActivate'),

    # Login and logout views
    path('login/', views.login_view, name='login'),     # need to be above auth.urls to overwrite
    path('logout', views.logout_view, name='logout_view'),
    path('googleLogin', views.googleLogin, name='googleLogin'),
    path('oAuth2Callback', views.oAuth2Callback, name='oAuth2Callback'),

    # Password reset views
    path('forgot', views.forgot, name='forgot'),
    path('', include('django.contrib.auth.urls')),  # includes all auth views - necessary for password reset

    # AJAX requests to query youtube content
    path('getContentCards', views.getContentCards, name='getContentCards'),
    path('getVideoModal', views.getVideoModal, name='getVideoModal'),
    path('getChannelModal', views.getChannelModal, name='getChannelModal'),
    path('getRelatedVideos', views.getRelatedVideos, name='getRelatedVideos'),
    path('getChannelVideos', views.getChannelVideos, name='getChannelVideos'),
    path('getFeaturedChannels', views.getFeaturedChannels, name='getFeaturedChannels'),

    # AJAX requests for tracker actions
    path('tracker/rename', views.trackerRename, name="trackerRename"),
    path('tracker/delete', views.trackerDeleteByName, name="trackerDeleteByName"),
    path('tracker/content/delete', views.trackerContentDelete, name="trackerContentDelete"),
    path('tracker/addTracker', views.addTracker, name="addTracker"),
    path('tracker/clickedOnTracker', views.clickedOnTracker, name="clickedOnTracker"),
    path('tracker/addRelatedVideoToTrackers', views.addRelatedVideoToTrackers, name="addRelatedVideoToTrackers"),

    # AJAX request for Search AutoSuggest
    path('search/autoSuggest', views.autoSuggest, name="autoSuggest"),

    path('admin/', admin.site.urls),
    path('YTAdminConsole/', include('YTAdminConsole.urls')),

    # Go-Daddy SSL Certificate for HTTPS
    path('.well-known/pki-validation/godaddy.html', views.SSL_Certificate),
]
